package com.siar.persistencia.g_mesas;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    List<Reserva> findByMesa(Mesa mesa);

    List<Reserva> findByNombreCliente(String nombreCliente);

}
