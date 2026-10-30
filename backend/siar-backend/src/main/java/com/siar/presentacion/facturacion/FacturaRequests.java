package com.siar.presentacion.facturacion;

import java.math.BigDecimal;
import java.util.List;

import com.siar.negocio.facturacion.CalculadoraFactura;
import com.siar.persistencia.facturacion.FormatoComprobante;
import com.siar.persistencia.facturacion.MetodoPago;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

// Cuerpos de las peticiones del modulo de facturacion
public final class FacturaRequests {

    private FacturaRequests() {
    }

    // POST /api/facturas y /api/facturas/previsualizar. descuento es opcional.
    public record GenerarFactura(
            @NotNull(message = "El pedido es obligatorio") Long idPedido,
            CalculadoraFactura.Descuento descuento) {
    }

    // POST /api/facturas/{id}/pagos: uno o varios pagos (pago mixto)
    public record RegistrarPagos(
            @NotEmpty(message = "Debe registrar al menos un pago") List<@Valid Pago> pagos) {
    }

    public record Pago(
            @NotNull(message = "El metodo de pago es obligatorio") MetodoPago metodo,
            @NotNull(message = "El monto es obligatorio")
            @Positive(message = "El monto debe ser mayor a cero") BigDecimal monto) {
    }

    // POST /api/facturas/{id}/comprobantes. Si no se envia formato se usa IMPRESO.
    public record EmitirComprobante(FormatoComprobante formato) {
    }
}
