package com.siar.negocio.g_mesas;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siar.persistencia.g_mesas.Mesa;
import com.siar.persistencia.g_mesas.MesaRepository;
import com.siar.persistencia.g_mesas.Reserva;
import com.siar.persistencia.g_mesas.ReservaRepository;

@Service
@Transactional(readOnly = true)
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final MesaRepository mesaRepository;

    public ReservaService(ReservaRepository reservaRepository, MesaRepository mesaRepository) {
        this.reservaRepository = reservaRepository;
        this.mesaRepository = mesaRepository;
    }

    public List<Reserva> listaReservas() {
        return reservaRepository.findAll();
    }

    public Reserva getReservaById(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
    }

    @Transactional
    public Reserva crearReserva(Reserva reserva) {
        return reservaRepository.save(reserva);
    }

    @Transactional
    public Reserva actulizar(Long id, Reserva reservaActualizada) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        // Actualizar campos
        reserva.setFechaHora(reservaActualizada.getFechaHora());
        reserva.setNombreCliente(reservaActualizada.getNombreCliente());
        reserva.setTelefono(reservaActualizada.getTelefono());
        reserva.setNumPersonas(reservaActualizada.getNumPersonas());

        return reservaRepository.save(reserva);
    }

    @Transactional
    public void confirmar(Long idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if ("CANCELADA".equalsIgnoreCase(reserva.getEstado())) {
            throw new RuntimeException("No se puede confirmar una reserva cancelada");
        }

        reserva.setEstado("CONFIRMADA");
        reservaRepository.save(reserva);
    }

    @Transactional
    public void cancelar(Long idReserva) {
        Reserva reserva = reservaRepository.findById(idReserva)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        reserva.setEstado("CANCELADA");
        reservaRepository.save(reserva);

        // Liberar la mesa despues de cancelar
        Mesa mesa = reserva.getMesa();
        mesa.setEstado("LIBRE");
        mesaRepository.save(mesa);
    }

    @Transactional
    public Reserva actualizarDatos(Long idReserva, Reserva datosNuevos) {
        return actulizar(idReserva, datosNuevos);
    }

}
