package com.siar.negocio.pedido;

import com.siar.persistencia.pedido.ReservaRepository;
import java.util.List;

import org.springframework.stereotype.Service;

import com.siar.persistencia.pedido.Mesa;
import com.siar.persistencia.pedido.MesaRepository;
import com.siar.persistencia.pedido.Reserva;

import org.springframework.transaction.annotation.Transactional;

@Service
// @Transactional(readOnly = true)
public class MesaService {

    private final ReservaRepository reservaRepository;
    private final MesaRepository mesaRepository;

    public MesaService(MesaRepository mesaRepository, ReservaRepository reservaRepository) {
        this.mesaRepository = mesaRepository;
        this.reservaRepository = reservaRepository;
    }

    @Transactional(readOnly = true)
    public List<Mesa> listaMesas() {
        return mesaRepository.findAll();
    }

    // Consultar las mesas por ID
    @Transactional(readOnly = true)
    public Mesa getMesaPorId(Long id) {
        return mesaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe la mesa con ID: " + id));
    }

    @Transactional
    public Mesa crear(Mesa mesa) {

        // Validaciones básicas
        if (mesa.getNumero() <= 0) {
            throw new IllegalArgumentException("El número de mesa debe ser mayor a cero");
        }
        if (mesa.getCapacidad() <= 0) {
            throw new IllegalArgumentException("La capacidad debe ser mayor a cero");
        }

        // Validar que no exista una mesa con el mismo número
        if (mesaRepository.existsByNumero(mesa.getNumero())) {
            throw new RuntimeException("Ya existe una mesa con el número: " + mesa.getNumero());
        }

        // Regla de negocio: Toda mesa nueva empieza "DISPONIBLE"
        // Ignoramos lo que venga del frontend y forzamos el estado inicial
        mesa.setEstado("DISPONIBLE");

        return mesaRepository.save(mesa);// Guardar en la base de datos
    }

    @Transactional
    public Mesa actualizar(Long id, Mesa mesaActualizada) {

        // Busca la mesa original en la base de datos
        Mesa mesaExistente = mesaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada con el ID: " + id));

        // validaciones básicas
        if (mesaActualizada.getNumero() <= 0) {
            throw new IllegalArgumentException("El número de mesa debe ser mayor a cero");
        }
        if (mesaActualizada.getCapacidad() <= 0) {
            throw new IllegalArgumentException("La capacidad debe ser mayor a cero");
        }

        // Validar que el nuevo número no le pertenezca a OTRA mesa
        // (Si el número es diferente al que ya tenía, verificamos que no esté ocupado)
        if (!mesaExistente.getNumero().equals(mesaActualizada.getNumero())
                && mesaRepository.existsByNumero(mesaActualizada.getNumero())) {
            throw new RuntimeException("Ya existe otra mesa con el número: " + mesaActualizada.getNumero());
        }

        // Actualizamos los campos permitidos
        mesaExistente.setNumero(mesaActualizada.getNumero());
        mesaExistente.setCapacidad(mesaActualizada.getCapacidad());
        mesaExistente.setUbicacion(mesaActualizada.getUbicacion());

        return mesaRepository.save(mesaExistente);
    }

    @Transactional
    public void cambiarEstado(Long idMesa, String nuevoEstado) {
        Mesa mesa = mesaRepository.findById(idMesa)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        mesa.setEstado(nuevoEstado);

        mesaRepository.save(mesa);
    }

    @Transactional(readOnly = true)
    public boolean estaDisponible(Long idMesa) {
        Mesa mesa = mesaRepository.findById(idMesa).orElse(null);

        if (mesa == null) {
            return false;
        }

        return "DISPONIBLE".equalsIgnoreCase(mesa.getEstado());
    }

    @Transactional(readOnly = true)
    public List<Reserva> obtenerReservas(Long idMesa) {
        Mesa mesa = mesaRepository.findById(idMesa)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        return reservaRepository.findByMesa(mesa);
    }

}
