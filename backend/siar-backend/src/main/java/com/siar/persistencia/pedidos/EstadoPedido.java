package com.siar.persistencia.pedidos;

// Estados del pedido (CHECK chk_pedido_estado del DDL).
// Flujo: PENDIENTE -> EN_PREPARACION -> LISTO -> ENTREGADO -> FACTURADO.
// CANCELADO se permite desde cualquier estado antes de FACTURADO.
public enum EstadoPedido {
    PENDIENTE,
    EN_PREPARACION,
    LISTO,
    ENTREGADO,
    FACTURADO,
    CANCELADO
}
