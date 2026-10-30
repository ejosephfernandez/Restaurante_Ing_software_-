package com.siar.persistencia.facturacion;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FacturaRepository extends JpaRepository<Factura, Long> {

    boolean existsByPedido_IdPedido(Long idPedido);

    // Ultimo consecutivo emitido (0 si no hay facturas)
    @Query("select coalesce(max(f.numero), 0) from Factura f")
    Integer ultimoNumero();

    // Factura con cajero, pedido, mesa y pagos (el detalle del pedido se carga aparte)
    @Query("""
            select distinct f from Factura f
            join fetch f.usuario
            join fetch f.pedido p
            join fetch p.mesa
            join fetch p.usuario
            left join fetch f.pagos
            where f.idFactura = :idFactura
            """)
    Optional<Factura> buscarCompleta(@Param("idFactura") Long idFactura);

    @Query("select f.idFactura from Factura f where f.pedido.idPedido = :idPedido")
    Optional<Long> buscarIdPorPedido(@Param("idPedido") Long idPedido);

    @Query("""
            select distinct f from Factura f
            join fetch f.usuario
            join fetch f.pedido p
            join fetch p.mesa
            join fetch p.usuario
            left join fetch f.pagos
            where (:estado is null or f.estado = :estado)
            order by f.numero desc
            """)
    List<Factura> buscar(@Param("estado") EstadoFactura estado);
}
