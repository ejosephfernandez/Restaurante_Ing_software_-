package com.siar.facturacion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.siar.negocio.facturacion.CalculadoraFactura.Descuento;
import com.siar.negocio.facturacion.CalculadoraFactura.TipoDescuento;
import com.siar.negocio.facturacion.FacturaDto;
import com.siar.negocio.facturacion.FacturaService;
import com.siar.negocio.facturacion.FacturacionDtos.PagoSolicitado;
import com.siar.negocio.facturacion.FacturacionDtos.ResultadoPago;
import com.siar.persistencia.facturacion.ComprobanteRepository;
import com.siar.persistencia.facturacion.EstadoFactura;
import com.siar.persistencia.facturacion.Factura;
import com.siar.persistencia.facturacion.FacturaRepository;
import com.siar.persistencia.facturacion.FormatoComprobante;
import com.siar.persistencia.facturacion.MetodoPago;
import com.siar.persistencia.facturacion.Pago;
import com.siar.persistencia.menu.Producto;
import com.siar.persistencia.mesas.Mesa;
import com.siar.persistencia.pedidos.DetallePedido;
import com.siar.persistencia.pedidos.EstadoPedido;
import com.siar.persistencia.pedidos.Pedido;
import com.siar.persistencia.pedidos.PedidoRepository;
import com.siar.persistencia.usuario.Usuario;
import com.siar.persistencia.usuario.UsuarioRepository;

class FacturaServiceTests {

    private FacturaRepository facturaRepository;
    private PedidoRepository pedidoRepository;
    private UsuarioRepository usuarioRepository;
    private FacturaService facturaService;
    private Usuario cajero;

    @BeforeEach
    void configurar() {
        facturaRepository = mock(FacturaRepository.class);
        pedidoRepository = mock(PedidoRepository.class);
        usuarioRepository = mock(UsuarioRepository.class);

        // Impuesto 8%, descuento maximo sin autorizacion 20%
        facturaService = new FacturaService(facturaRepository, mock(ComprobanteRepository.class),
                pedidoRepository, usuarioRepository, new BigDecimal("0.08"), new BigDecimal("20"),
                "Restaurante SIAR", "900000000-0", "Cali", "");

        cajero = usuario(5L, "Cajero Prueba");
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(cajero));
        when(facturaRepository.ultimoNumero()).thenReturn(41);
    }

    // ---------- HU24 generar factura ----------

    @Test
    void generaFacturaConConsecutivoYDejaPedidoFacturado() {
        Pedido pedido = pedido(10L, EstadoPedido.ENTREGADO, "25000", 4); // subtotal 100000

        FacturaDto factura = facturaService.generar(10L, null, 5L, false);

        assertThat(factura.numero()).isEqualTo(42);
        assertThat(factura.subtotal()).isEqualByComparingTo("100000");
        assertThat(factura.impuesto()).isEqualByComparingTo("8000");
        assertThat(factura.total()).isEqualByComparingTo("108000");
        assertThat(factura.estado()).isEqualTo(EstadoFactura.EMITIDA);
        assertThat(factura.cajero()).isEqualTo("Cajero Prueba");
        assertThat(factura.detalles()).hasSize(1);
        assertThat(pedido.getEstado()).isEqualTo(EstadoPedido.FACTURADO);
    }

    @Test
    void noFacturaPedidoQueNoEstaEntregado() {
        pedido(10L, EstadoPedido.LISTO, "25000", 1);

        assertThatThrownBy(() -> facturaService.generar(10L, null, 5L, false))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT))
                .hasMessageContaining("ENTREGADO");
    }

    @Test
    void noFacturaDosVecesElMismoPedido() {
        pedido(10L, EstadoPedido.ENTREGADO, "25000", 1);
        when(facturaRepository.existsByPedido_IdPedido(10L)).thenReturn(true);

        assertThatThrownBy(() -> facturaService.generar(10L, null, 5L, false))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT))
                .hasMessageContaining("ya tiene factura");
    }

    // ---------- HU26 descuentos ----------

    @Test
    void cajeroNoPuedeAplicarDescuentoMayorAlLimite() {
        pedido(10L, EstadoPedido.ENTREGADO, "25000", 4);
        Descuento treintaPorCiento = new Descuento(TipoDescuento.PORCENTAJE, new BigDecimal("30"));

        assertThatThrownBy(() -> facturaService.generar(10L, treintaPorCiento, 5L, false))
                .satisfies(ex -> assertEstado(ex, HttpStatus.FORBIDDEN))
                .hasMessageContaining("ADMINISTRADOR");
    }

    @Test
    void administradorSiPuedeAutorizarDescuentoMayorAlLimite() {
        pedido(10L, EstadoPedido.ENTREGADO, "25000", 4);
        Descuento treintaPorCiento = new Descuento(TipoDescuento.PORCENTAJE, new BigDecimal("30"));

        FacturaDto factura = facturaService.generar(10L, treintaPorCiento, 5L, true);

        assertThat(factura.descuento()).isEqualByComparingTo("30000");
        assertThat(factura.impuesto()).isEqualByComparingTo("5600");
        assertThat(factura.total()).isEqualByComparingTo("75600");
    }

    // ---------- HU27 pagos ----------

    @Test
    void pagoMixtoExactoDejaFacturaPagada() {
        Factura factura = factura(7L, "108000");

        ResultadoPago resultado = facturaService.registrarPagos(7L, List.of(
                new PagoSolicitado(MetodoPago.TARJETA, new BigDecimal("60000")),
                new PagoSolicitado(MetodoPago.EFECTIVO, new BigDecimal("48000"))));

        assertThat(resultado.cambio()).isEqualByComparingTo("0");
        assertThat(factura.getEstado()).isEqualTo(EstadoFactura.PAGADA);
        assertThat(factura.getPagos()).extracting(Pago::getMetodo)
                .containsExactly(MetodoPago.TARJETA, MetodoPago.EFECTIVO);
        assertThat(resultado.factura().totalPagado()).isEqualByComparingTo("108000");
    }

    @Test
    void efectivoMayorAlTotalCalculaCambioYGuardaSoloLoAplicado() {
        Factura factura = factura(7L, "108000");

        ResultadoPago resultado = facturaService.registrarPagos(7L, List.of(
                new PagoSolicitado(MetodoPago.EFECTIVO, new BigDecimal("110000"))));

        assertThat(resultado.montoRecibido()).isEqualByComparingTo("110000");
        assertThat(resultado.cambio()).isEqualByComparingTo("2000");
        assertThat(factura.getPagos()).singleElement()
                .satisfies(p -> assertThat(p.getMonto()).isEqualByComparingTo("108000"));
    }

    @Test
    void rechazaPagoInsuficiente() {
        Factura factura = factura(7L, "108000");

        assertThatThrownBy(() -> facturaService.registrarPagos(7L, List.of(
                new PagoSolicitado(MetodoPago.TARJETA, new BigDecimal("100000")))))
                .satisfies(ex -> assertEstado(ex, HttpStatus.BAD_REQUEST))
                .hasMessageContaining("Faltan 8000");
        assertThat(factura.getEstado()).isEqualTo(EstadoFactura.EMITIDA);
    }

    @Test
    void rechazaTarjetaQueSuperaElTotal() {
        factura(7L, "108000");

        assertThatThrownBy(() -> facturaService.registrarPagos(7L, List.of(
                new PagoSolicitado(MetodoPago.TARJETA, new BigDecimal("120000")))))
                .satisfies(ex -> assertEstado(ex, HttpStatus.BAD_REQUEST))
                .hasMessageContaining("no pueden superar el total");
    }

    @Test
    void noRegistraPagosEnFacturaYaPagada() {
        Factura factura = factura(7L, "108000");
        factura.setEstado(EstadoFactura.PAGADA);

        assertThatThrownBy(() -> facturaService.registrarPagos(7L, List.of(
                new PagoSolicitado(MetodoPago.EFECTIVO, new BigDecimal("108000")))))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT));
    }

    // ---------- HU28 comprobante ----------

    @Test
    void noEmiteComprobanteDeFacturaSinPagar() {
        factura(7L, "108000");

        assertThatThrownBy(() -> facturaService.emitirComprobante(7L, FormatoComprobante.PDF))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT))
                .hasMessageContaining("PAGADAS");
    }

    // ---------- utilidades ----------

    private Pedido pedido(Long id, EstadoPedido estado, String precio, int cantidad) {
        Producto producto = new Producto();
        producto.setIdProducto(1L);
        producto.setNombre("Bandeja paisa");
        producto.setPrecio(new BigDecimal(precio));

        DetallePedido detalle = new DetallePedido();
        detalle.setIdDetalle(1L);
        detalle.setProducto(producto);
        detalle.setCantidad(cantidad);
        detalle.setPrecioUnitario(new BigDecimal(precio));

        Mesa mesa = new Mesa(3L, 3, 4, "Salon", "OCUPADA");

        Pedido pedido = new Pedido();
        pedido.setIdPedido(id);
        pedido.setMesa(mesa);
        pedido.setUsuario(usuario(2L, "Mesero Prueba"));
        pedido.setEstado(estado);
        pedido.agregarDetalle(detalle);

        when(pedidoRepository.buscarCompleto(id)).thenReturn(Optional.of(pedido));
        return pedido;
    }

    private Factura factura(Long id, String total) {
        Pedido pedido = pedido(10L, EstadoPedido.FACTURADO, "25000", 4);

        Factura factura = new Factura();
        factura.setIdFactura(id);
        factura.setNumero(1);
        factura.setPedido(pedido);
        factura.setUsuario(cajero);
        factura.setSubtotal(new BigDecimal("100000"));
        factura.setImpuesto(new BigDecimal("8000"));
        factura.setTotal(new BigDecimal(total));
        factura.setEstado(EstadoFactura.EMITIDA);

        when(facturaRepository.buscarCompleta(id)).thenReturn(Optional.of(factura));
        when(facturaRepository.saveAndFlush(any(Factura.class))).thenAnswer(i -> i.getArgument(0));
        return factura;
    }

    private static Usuario usuario(Long id, String nombre) {
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(id);
        usuario.setNombre(nombre);
        return usuario;
    }

    private static void assertEstado(Throwable ex, HttpStatus esperado) {
        assertThat(ex).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(esperado);
    }
}
