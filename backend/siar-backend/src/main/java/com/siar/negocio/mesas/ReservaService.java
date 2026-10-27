package com.siar.negocio.mesas;

import com.siar.persistencia.pedido.Reserva;
import com.siar.persistencia.pedido.ReservaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;

    public ReservaService(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    // --- MÉTODOS CRUD BÁSICOS ---
    @Transactional(readOnly = true)
    public List<Reserva> listarTodas() {
        return reservaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Reserva obtenerPorId(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
    }

    @Transactional
    public Reserva crear(Reserva reserva) {
        reserva.setEstado("PENDIENTE");
        return reservaRepository.save(reserva);
    }

    @Transactional
    public void eliminar(Long id) {
        reservaRepository.deleteById(id);
    }

    // --- MÉTODOS DEL DIAGRAMA DE CLASES ---

    @Transactional
    public void confirmar(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        reserva.setEstado("CONFIRMADA");
        reservaRepository.save(reserva);
    }

    @Transactional
    public void cancelar(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        reserva.setEstado("CANCELADA");
        reservaRepository.save(reserva);
    }

    @Transactional
    public Reserva actualizarDatos(Long id, Reserva reservaActualizada) {
        Reserva reservaExistente = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        reservaExistente.setNombreCliente(reservaActualizada.getNombreCliente());
        reservaExistente.setTelefono(reservaActualizada.getTelefono());
        reservaExistente.setNumPersonas(reservaActualizada.getNumPersonas());
        reservaExistente.setFechaHora(reservaActualizada.getFechaHora());

        return reservaRepository.save(reservaExistente);
    }
}