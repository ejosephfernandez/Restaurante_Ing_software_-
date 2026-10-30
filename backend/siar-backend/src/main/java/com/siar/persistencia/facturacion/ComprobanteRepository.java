package com.siar.persistencia.facturacion;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {

    List<Comprobante> findByFactura_IdFacturaOrderByFechaEmisionDesc(Long idFactura);
}
