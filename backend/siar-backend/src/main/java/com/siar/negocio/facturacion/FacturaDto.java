package com.siar.negocio.facturacion;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.siar.negocio.pedidos.PedidoDto;
import com.siar.persistencia.facturacion.EstadoFactura;
import com.siar.persistencia.facturacion.Factura;
import com.siar.persistencia.facturacion.MetodoPago;
import com.siar.persistencia.facturacion.Pago;
import com.siar.persistencia.pedidos.Pedido;

// Vista de la factura con el detalle del pedido, el desglose y los pagos (HU24-HU27)
public record FacturaDto(
        Long idFactura,
        Integer numero,
        LocalDateTime fechaHora,
        EstadoFactura estado,
        Long idPedido,
        Integer numeroMesa,
        String mesero,
        Long idCajero,
        String cajero,
        List<PedidoDto.Detalle> detalles,
        BigDecimal subtotal,
        BigDecimal descuento,
        BigDecimal impuesto,
        BigDecimal total,
        List<PagoDto> pagos,
        BigDecimal totalPagado) {

    public record PagoDto(Long idPago, MetodoPago metodo, BigDecimal monto) {
    }

    public static FacturaDto de(Factura factura) {
        Pedido pedido = factura.getPedido();

        List<PagoDto> pagos = factura.getPagos().stream()
                .map(p -> new PagoDto(p.getIdPago(), p.getMetodo(), p.getMonto()))
                .toList();

        BigDecimal totalPagado = factura.getPagos().stream()
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new FacturaDto(
                factura.getIdFactura(),
                factura.getNumero(),
                factura.getFechaHora(),
                factura.getEstado(),
                pedido.getIdPedido(),
                pedido.getMesa().getNumero(),
                pedido.getUsuario().getNombre(),
                factura.getUsuario().getIdUsuario(),
                factura.getUsuario().getNombre(),
                pedido.getDetalles().stream().map(PedidoDto.Detalle::de).toList(),
                factura.getSubtotal(),
                factura.getDescuento(),
                factura.getImpuesto(),
                factura.getTotal(),
                pagos,
                totalPagado);
    }
}
