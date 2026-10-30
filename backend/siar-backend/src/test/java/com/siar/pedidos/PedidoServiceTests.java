package com.siar.pedidos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.siar.negocio.pedidos.PedidoDto;
import com.siar.negocio.pedidos.PedidoService;
import com.siar.persistencia.menu.Producto;
import com.siar.persistencia.menu.ProductoRepository;
import com.siar.persistencia.mesas.Mesa;
import com.siar.persistencia.mesas.MesaRepository;
import com.siar.persistencia.pedidos.DetallePedido;
import com.siar.persistencia.pedidos.EstadoPedido;
import com.siar.persistencia.pedidos.Pedido;
import com.siar.persistencia.pedidos.PedidoRepository;
import com.siar.persistencia.usuario.Usuario;
import com.siar.persistencia.usuario.UsuarioRepository;

class PedidoServiceTests {

    private PedidoRepository pedidoRepository;
    private MesaRepository mesaRepository;
    private ProductoRepository productoRepository;
    private UsuarioRepository usuarioRepository;
    private PedidoService pedidoService;

    @BeforeEach
    void configurar() {
        pedidoRepository = mock(PedidoRepository.class);
        mesaRepository = mock(MesaRepository.class);
        productoRepository = mock(ProductoRepository.class);
        usuarioRepository = mock(UsuarioRepository.class);
        pedidoService = new PedidoService(pedidoRepository, mesaRepository, productoRepository, usuarioRepository);

        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(mesero()));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(i -> i.getArgument(0));
        when(pedidoRepository.saveAndFlush(any(Pedido.class))).thenAnswer(i -> i.getArgument(0));
    }

    // ---------- HU18 crear pedido ----------

    @Test
    void creaPedidoPendienteEnMesaOcupada() {
        when(mesaRepository.findById(3L)).thenReturn(Optional.of(mesa("OCUPADA")));

        PedidoDto pedido = pedidoService.crear(3L, 2L);

        assertThat(pedido.estado()).isEqualTo(EstadoPedido.PENDIENTE);
        assertThat(pedido.nombreMesero()).isEqualTo("Mesero Prueba");
        assertThat(pedido.fechaHora()).isNotNull();
        assertThat(pedido.total()).isEqualByComparingTo("0");
    }

    @Test
    void noCreaPedidoEnMesaDisponible() {
        when(mesaRepository.findById(3L)).thenReturn(Optional.of(mesa("DISPONIBLE")));

        assertThatThrownBy(() -> pedidoService.crear(3L, 2L))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT))
                .hasMessageContaining("OCUPADA o RESERVADA");
    }

    // ---------- HU19 agregar productos ----------

    @Test
    void agregarProductoRecalculaTotalYSumaCantidadSiSeRepite() {
        Pedido pedido = pedido(EstadoPedido.PENDIENTE);
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto(true, "12000")));

        pedidoService.agregarProducto(1L, 1L, 2, "sin cebolla");
        PedidoDto resultado = pedidoService.agregarProducto(1L, 1L, 1, "sin cebolla");

        assertThat(resultado.detalles()).singleElement()
                .satisfies(d -> assertThat(d.cantidad()).isEqualTo(3));
        assertThat(resultado.total()).isEqualByComparingTo("36000");
        assertThat(pedido.getTotal()).isEqualByComparingTo("36000");
    }

    @Test
    void noAgregaProductoAgotado() {
        pedido(EstadoPedido.PENDIENTE);
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto(false, "12000")));

        assertThatThrownBy(() -> pedidoService.agregarProducto(1L, 1L, 1, null))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT))
                .hasMessageContaining("no esta disponible");
    }

    @Test
    void noAgregaProductosAUnPedidoEntregado() {
        pedido(EstadoPedido.ENTREGADO);

        assertThatThrownBy(() -> pedidoService.agregarProducto(1L, 1L, 1, null))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT));
    }

    // ---------- HU20 modificar pedido ----------

    @Test
    void noModificaDetalleDespuesDeEnviarACocina() {
        Pedido pedido = pedido(EstadoPedido.EN_PREPARACION);
        pedido.agregarDetalle(detalle(10L, "12000", 1));

        assertThatThrownBy(() -> pedidoService.modificarDetalle(1L, 10L, 5, null))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT))
                .hasMessageContaining("EN_PREPARACION");
    }

    @Test
    void modificarYQuitarDetalleRecalculanTotal() {
        Pedido pedido = pedido(EstadoPedido.PENDIENTE);
        pedido.agregarDetalle(detalle(10L, "12000", 1));
        pedido.agregarDetalle(detalle(11L, "5000", 2));

        pedidoService.modificarDetalle(1L, 10L, 3, null);
        assertThat(pedido.getTotal()).isEqualByComparingTo("46000");

        pedidoService.eliminarDetalle(1L, 11L);
        assertThat(pedido.getTotal()).isEqualByComparingTo("36000");
    }

    // ---------- HU22 / HU23 flujo de estados ----------

    @Test
    void flujoCompletoHastaEntregado() {
        Pedido pedido = pedido(EstadoPedido.PENDIENTE);
        pedido.agregarDetalle(detalle(10L, "12000", 1));

        pedidoService.enviarACocina(1L);
        assertThat(pedido.getEstado()).isEqualTo(EstadoPedido.EN_PREPARACION);
        assertThat(pedido.getHoraEnvioCocina()).isNotNull();

        pedidoService.marcarListo(1L);
        assertThat(pedido.getEstado()).isEqualTo(EstadoPedido.LISTO);

        pedidoService.marcarEntregado(1L);
        assertThat(pedido.getEstado()).isEqualTo(EstadoPedido.ENTREGADO);
    }

    @Test
    void noEnviaACocinaUnPedidoVacio() {
        pedido(EstadoPedido.PENDIENTE);

        assertThatThrownBy(() -> pedidoService.enviarACocina(1L))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT))
                .hasMessageContaining("sin productos");
    }

    @Test
    void noSaltaEstados() {
        pedido(EstadoPedido.PENDIENTE);

        assertThatThrownBy(() -> pedidoService.marcarEntregado(1L))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT));
    }

    // ---------- HU21 cancelar ----------

    @Test
    void cancelaPedidoNoFacturado() {
        Pedido pedido = pedido(EstadoPedido.EN_PREPARACION);

        pedidoService.cancelar(1L);

        assertThat(pedido.getEstado()).isEqualTo(EstadoPedido.CANCELADO);
    }

    @Test
    void noCancelaPedidoFacturado() {
        pedido(EstadoPedido.FACTURADO);

        assertThatThrownBy(() -> pedidoService.cancelar(1L))
                .satisfies(ex -> assertEstado(ex, HttpStatus.CONFLICT))
                .hasMessageContaining("FACTURADO");
    }

    // ---------- utilidades ----------

    private Pedido pedido(EstadoPedido estado) {
        Pedido pedido = new Pedido();
        pedido.setIdPedido(1L);
        pedido.setMesa(mesa("OCUPADA"));
        pedido.setUsuario(mesero());
        pedido.setEstado(estado);
        when(pedidoRepository.buscarCompleto(1L)).thenReturn(Optional.of(pedido));
        return pedido;
    }

    private static DetallePedido detalle(Long id, String precio, int cantidad) {
        DetallePedido detalle = new DetallePedido();
        detalle.setIdDetalle(id);
        detalle.setProducto(producto(true, precio));
        detalle.setCantidad(cantidad);
        detalle.setPrecioUnitario(new BigDecimal(precio));
        return detalle;
    }

    private static Producto producto(boolean disponible, String precio) {
        Producto producto = new Producto();
        producto.setIdProducto(1L);
        producto.setNombre("Limonada");
        producto.setPrecio(new BigDecimal(precio));
        producto.setActivo(true);
        producto.setDisponible(disponible);
        return producto;
    }

    private static Mesa mesa(String estado) {
        return new Mesa(3L, 3, 4, "Salon", estado);
    }

    private static Usuario mesero() {
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(2L);
        usuario.setNombre("Mesero Prueba");
        return usuario;
    }

    private static void assertEstado(Throwable ex, HttpStatus esperado) {
        assertThat(ex).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(esperado);
    }
}
