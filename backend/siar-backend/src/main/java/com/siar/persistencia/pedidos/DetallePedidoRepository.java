package com.siar.persistencia.pedidos;

import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DetallePedidoRepository extends JpaRepository<DetallePedido, Long> {

    // Verifica si un producto está asociado a pedidos
    // que se encuentran en alguno de los estados indicados.
    boolean existsByProducto_IdProductoAndPedido_EstadoIn(
            Long idProducto,
            Collection<EstadoPedido> estados
    );
} 
