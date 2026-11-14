package com.siar.negocio.mesas;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.siar.persistencia.mesas.Mesa;
import com.siar.persistencia.mesas.MesaRepository;
import com.siar.persistencia.mesas.Reserva;
import com.siar.persistencia.mesas.ReservaRepository;

@Service
// Todas las consultas son de solo lectura salvo donde se indica @Transactional.
@Transactional(readOnly = true)
public class ReservaService {

    // Estados de la reserva (columna estado de RESERVA).
    private static final String ESTADO_PENDIENTE = "PENDIENTE";
    private static final String ESTADO_CONFIRMADA = "CONFIRMADA";
    private static final String ESTADO_CANCELADA = "CANCELADA";

    // Estados de la mesa (CHECK chk_mesa_estado del DDL).
    private static final String MESA_DISPONIBLE = "DISPONIBLE";
    private static final String MESA_RESERVADA = "RESERVADA";
    private static final String MESA_INACTIVA = "INACTIVA";

    // HU16: dos reservas de la misma mesa deben estar separadas al menos por
    // esta franja. Con 60 minutos, una reserva a las 20:00 bloquea 19:00-21:00.
    private static final long MINUTOS_ENTRE_RESERVAS = 60;

    private static final DateTimeFormatter FORMATO_FECHA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final ReservaRepository reservaRepository;
    private final MesaRepository mesaRepository;

    // Inyección de dependencias por constructor.
    public ReservaService(ReservaRepository reservaRepository, MesaRepository mesaRepository) {
        this.reservaRepository = reservaRepository;
        this.mesaRepository = mesaRepository;
    }

    // --- MÉTODOS CRUD BÁSICOS ---

    public List<Reserva> listarTodas() {
        return reservaRepository.findAll();
    }

    public Reserva obtenerPorId(Long id) {
        return buscarReserva(id);
    }

    // HU16 (a y b): valida el choque de horario y deja la mesa en RESERVADA.
    @Transactional
    public Reserva crear(Reserva reserva) {
        if (reserva.getMesa() == null || reserva.getMesa().getIdMesa() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La reserva debe indicar una mesa");
        }

        Mesa mesa = mesaRepository.findById(reserva.getMesa().getIdMesa())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe la mesa con ID: " + reserva.getMesa().getIdMesa()));

        if (MESA_INACTIVA.equalsIgnoreCase(mesa.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La mesa " + mesa.getNumero() + " está INACTIVA y no admite reservas");
        }

        // Se trabaja siempre con la mesa administrada por JPA, no con la del JSON.
        reserva.setMesa(mesa);

        if (reserva.getFechaHora() == null) {
            reserva.setFechaHora(LocalDateTime.now());
        }

        // HU16 (a): no permitir dos reservas en la misma franja horaria.
        validarChoqueHorario(mesa, reserva.getFechaHora(), null);

        // El estado inicial lo define el servicio, no el cliente.
        reserva.setEstado(ESTADO_PENDIENTE);

        Reserva guardada = reservaRepository.save(reserva);

        // HU16 (b): la mesa queda reservada.
        marcarMesaReservada(mesa);

        return guardada;
    }

    @Transactional
    public void eliminar(Long id) {
        Reserva reserva = buscarReserva(id);
        reservaRepository.delete(reserva);
    }

    // --- MÉTODOS DEL DIAGRAMA DE CLASES ---

    // HU16 (b): al confirmar también se asegura el estado RESERVADA de la mesa.
    @Transactional
    public void confirmar(Long id) {
        Reserva reserva = buscarReserva(id);

        if (ESTADO_CANCELADA.equalsIgnoreCase(reserva.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La reserva " + id + " está CANCELADA y no se puede confirmar");
        }

        if (ESTADO_CONFIRMADA.equalsIgnoreCase(reserva.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La reserva " + id + " ya está CONFIRMADA");
        }

        // Pudo crearse como PENDIENTE y que otra reserva ocupara la franja.
        validarChoqueHorario(reserva.getMesa(), reserva.getFechaHora(), reserva.getIdReserva());

        reserva.setEstado(ESTADO_CONFIRMADA);
        reservaRepository.save(reserva);

        marcarMesaReservada(reserva.getMesa());
    }

    // Al cancelar se libera la mesa si estaba reservada por esta reserva.
    @Transactional
    public void cancelar(Long id) {
        Reserva reserva = buscarReserva(id);

        if (ESTADO_CANCELADA.equalsIgnoreCase(reserva.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La reserva " + id + " ya está CANCELADA");
        }

        reserva.setEstado(ESTADO_CANCELADA);
        reservaRepository.save(reserva);

        liberarMesa(reserva.getMesa());
    }

    @Transactional
    public Reserva actualizarDatos(Long id, Reserva reservaActualizada) {
        Reserva reservaExistente = buscarReserva(id);

        // Si no envían fecha se conserva la actual; si la cambian, se revalida
        // el choque excluyendo esta misma reserva.
        LocalDateTime nuevaFecha = reservaActualizada.getFechaHora() != null
                ? reservaActualizada.getFechaHora()
                : reservaExistente.getFechaHora();

        if (reservaActualizada.getFechaHora() != null) {
            validarChoqueHorario(reservaExistente.getMesa(), nuevaFecha, reservaExistente.getIdReserva());
        }

        reservaExistente.setNombreCliente(reservaActualizada.getNombreCliente());
        reservaExistente.setTelefono(reservaActualizada.getTelefono());
        reservaExistente.setNumPersonas(reservaActualizada.getNumPersonas());
        reservaExistente.setFechaHora(nuevaFecha);

        return reservaRepository.save(reservaExistente);
    }

    // --- MÉTODOS DE APOYO ---

    private Reserva buscarReserva(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe la reserva con ID: " + id));
    }

    /*
     * HU16 (a): busca otra reserva no cancelada de la misma mesa dentro de
     * ±MINUTOS_ENTRE_RESERVAS. Si idReservaExcluir no es null, esa reserva no
     * cuenta (para poder editar sus propios datos).
     */
    private void validarChoqueHorario(Mesa mesa, LocalDateTime fechaHora, Long idReservaExcluir) {
        if (mesa == null || fechaHora == null) {
            return;
        }

        LocalDateTime desde = fechaHora.minusMinutes(MINUTOS_ENTRE_RESERVAS);
        LocalDateTime hasta = fechaHora.plusMinutes(MINUTOS_ENTRE_RESERVAS);

        boolean ocupada = idReservaExcluir == null
                ? reservaRepository.existsByMesaAndEstadoNotAndFechaHoraBetween(
                        mesa, ESTADO_CANCELADA, desde, hasta)
                : reservaRepository.existsByMesaAndEstadoNotAndFechaHoraBetweenAndIdReservaNot(
                        mesa, ESTADO_CANCELADA, desde, hasta, idReservaExcluir);

        if (ocupada) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La mesa " + mesa.getNumero() + " ya tiene una reserva entre "
                            + desde.format(FORMATO_FECHA) + " y " + hasta.format(FORMATO_FECHA)
                            + ". Deja al menos " + MINUTOS_ENTRE_RESERVAS
                            + " minutos entre reservas.");
        }
    }

    // HU16 (b): pasa la mesa a RESERVADA sin revivir una mesa INACTIVA.
    private void marcarMesaReservada(Mesa mesa) {
        if (mesa == null
                || MESA_RESERVADA.equalsIgnoreCase(mesa.getEstado())
                || MESA_INACTIVA.equalsIgnoreCase(mesa.getEstado())) {
            return;
        }

        mesa.setEstado(MESA_RESERVADA);
        mesaRepository.save(mesa);
    }

    // Solo libera la mesa si el estado actual es RESERVADA; no pisa OCUPADA
    // (un pedido en curso) ni INACTIVA.
    private void liberarMesa(Mesa mesa) {
        if (mesa == null || !MESA_RESERVADA.equalsIgnoreCase(mesa.getEstado())) {
            return;
        }

        mesa.setEstado(MESA_DISPONIBLE);
        mesaRepository.save(mesa);
    }
}
