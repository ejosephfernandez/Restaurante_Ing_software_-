package com.siar.persistencia.pedidos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    // Pedido con mesa, mesero, detalles y productos en una sola consulta
    @Query("""
            select distinct p from Pedido p
            join fetch p.mesa
            join fetch p.usuario
            left join fetch p.detalles d
            left join fetch d.producto
            where p.idPedido = :idPedido
            """)
    Optional<Pedido> buscarCompleto(@Param("idPedido") Long idPedido);

    // HU23: consulta filtrando por mesa, mesero y/o estado (los filtros nulos se ignoran)
    @Query("""
            select distinct p from Pedido p
            join fetch p.mesa m
            join fetch p.usuario u
            left join fetch p.detalles d
            left join fetch d.producto
            where (:idMesa is null or m.idMesa = :idMesa)
              and (:idUsuario is null or u.idUsuario = :idUsuario)
              and (:estado is null or p.estado = :estado)
            order by p.fechaHora desc
            """)
    List<Pedido> buscar(@Param("idMesa") Long idMesa,
            @Param("idUsuario") Long idUsuario,
            @Param("estado") EstadoPedido estado);
}
