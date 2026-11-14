package com.siar.persistencia.mesas;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    List<Reserva> findByMesa(Mesa mesa);

    List<Reserva> findByNombreCliente(String nombreCliente);

    /*
     * HU16 (a): indica si la mesa ya tiene otra reserva activa dentro de una
     * franja horaria. Se excluyen las reservas CANCELADAS porque ya no ocupan
     * la mesa.
     */
    boolean existsByMesaAndEstadoNotAndFechaHoraBetween(
            Mesa mesa,
            String estado,
            LocalDateTime desde,
            LocalDateTime hasta);

    /*
     * Igual que la consulta anterior, pero excluyendo la reserva que se esta
     * editando (para no chocar consigo misma al actualizar sus datos).
     */
    boolean existsByMesaAndEstadoNotAndFechaHoraBetweenAndIdReservaNot(
            Mesa mesa,
            String estado,
            LocalDateTime desde,
            LocalDateTime hasta,
            Long idReserva);

}
