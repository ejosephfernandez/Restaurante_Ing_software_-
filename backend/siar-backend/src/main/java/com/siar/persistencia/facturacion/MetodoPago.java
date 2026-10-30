package com.siar.persistencia.facturacion;

// Metodos de pago (CHECK chk_pago_metodo del DDL).
// Un pago mixto se guarda como varias filas PAGO de la misma factura.
public enum MetodoPago {
    EFECTIVO,
    TARJETA,
    TRANSFERENCIA
}
