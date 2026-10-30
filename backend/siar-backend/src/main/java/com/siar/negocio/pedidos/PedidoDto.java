package com.siar.negocio.pedidos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.siar.persistencia.pedidos.DetallePedido;
import com.siar.persistencia.pedidos.EstadoPedido;
import com.siar.persistencia.pedidos.Pedido;

// Vista del pedido que devuelve la API. Se arma dentro de la transaccion
// para no exponer entidades JPA con relaciones perezosas (open-in-view=false).
public record PedidoDto(
        Long idPedido,
        Long idMesa,
        Integer numeroMesa,
        Long idMesero,
        String nombreMesero,
        LocalDateTime fechaHora,
        LocalDateTime horaEnvioCocina,
        EstadoPedido estado,
        BigDecimal total,
        List<Detalle> detalles) {

    public record Detalle(
            Long idDetalle,
            Long idProducto,
            String nombreProducto,
            Integer cantidad,
            BigDecimal precioUnitario,
            BigDecimal subtotal,
            String observacion) {

        public static Detalle de(DetallePedido detalle) {
            return new Detalle(
                    detalle.getIdDetalle(),
                    detalle.getProducto().getIdProducto(),
                    detalle.getProducto().getNombre(),
                    detalle.getCantidad(),
                    detalle.getPrecioUnitario(),
                    detalle.getSubtotal(),
                    detalle.getObservacion());
        }
    }

    public static PedidoDto de(Pedido pedido) {
        return new PedidoDto(
                pedido.getIdPedido(),
                pedido.getMesa().getIdMesa(),
                pedido.getMesa().getNumero(),
                pedido.getUsuario().getIdUsuario(),
                pedido.getUsuario().getNombre(),
                pedido.getFechaHora(),
                pedido.getHoraEnvioCocina(),
                pedido.getEstado(),
                pedido.getTotal(),
                pedido.getDetalles().stream().map(Detalle::de).toList());
    }
}
