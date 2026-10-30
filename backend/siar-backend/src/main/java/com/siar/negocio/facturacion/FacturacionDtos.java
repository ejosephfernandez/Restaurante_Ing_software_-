package com.siar.negocio.facturacion;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.siar.negocio.pedidos.PedidoDto;
import com.siar.persistencia.facturacion.FormatoComprobante;
import com.siar.persistencia.facturacion.MetodoPago;

// Vistas auxiliares del modulo de facturacion
public final class FacturacionDtos {

    private FacturacionDtos() {
    }

    // HU25/HU26: calculo previo a facturar, para que el cajero revise el desglose
    public record Previsualizacion(
            Long idPedido,
            List<PedidoDto.Detalle> detalles,
            CalculadoraFactura.Calculo calculo,
            boolean requiereAutorizacion) {
    }

    // Pago recibido del cliente. En EFECTIVO puede superar el saldo (se calcula el cambio).
    public record PagoSolicitado(MetodoPago metodo, BigDecimal monto) {
    }

    // HU27: resultado de registrar el pago
    public record ResultadoPago(FacturaDto factura, BigDecimal montoRecibido, BigDecimal cambio) {
    }

    // Datos del restaurante impresos en el comprobante
    public record Negocio(String nombre, String nit, String direccion, String telefono) {
    }

    // HU28: comprobante con todo lo necesario para imprimirlo o enviarlo
    public record ComprobanteDto(
            Long idComprobante,
            LocalDateTime fechaEmision,
            FormatoComprobante formato,
            Negocio negocio,
            FacturaDto factura) {
    }

    // Registro historico de comprobantes de una factura
    public record ComprobanteResumen(Long idComprobante, LocalDateTime fechaEmision, FormatoComprobante formato) {
    }
}
