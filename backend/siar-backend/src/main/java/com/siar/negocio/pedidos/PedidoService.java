package com.siar.negocio.pedidos;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

@Service
@Transactional(readOnly = true)
public class PedidoService {

    // HU18: solo se toman pedidos en mesas ocupadas o reservadas
    private static final Set<String> ESTADOS_MESA_VALIDOS = Set.of("OCUPADA", "RESERVADA");

    private final PedidoRepository pedidoRepository;
    private final MesaRepository mesaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    public PedidoService(PedidoRepository pedidoRepository,
            MesaRepository mesaRepository,
            ProductoRepository productoRepository,
            UsuarioRepository usuarioRepository) {
        this.pedidoRepository = pedidoRepository;
        this.mesaRepository = mesaRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // HU23: consultar pedidos filtrando por mesa, mesero y/o estado
    public List<PedidoDto> buscar(Long idMesa, Long idMesero, EstadoPedido estado) {
        return pedidoRepository.buscar(idMesa, idMesero, estado).stream()
                .map(PedidoDto::de)
                .toList();
    }

    // HU23: consultar un pedido con su detalle
    public PedidoDto obtener(Long idPedido) {
        return PedidoDto.de(obtenerCompleto(idPedido));
    }

    // HU18: crear pedido asociado a una mesa. Inicia PENDIENTE y registra el mesero.
    @Transactional
    public PedidoDto crear(Long idMesa, Long idMesero) {
        Mesa mesa = mesaRepository.findById(idMesa)
                .orElseThrow(() -> noEncontrado("No existe la mesa con ID: " + idMesa));

        if (mesa.getEstado() == null
                || !ESTADOS_MESA_VALIDOS.contains(mesa.getEstado().toUpperCase())) {
            throw conflicto("La mesa " + mesa.getNumero()
                    + " debe estar OCUPADA o RESERVADA para tomar un pedido (estado actual: "
                    + mesa.getEstado() + ")");
        }

        Usuario mesero = usuarioRepository.findById(idMesero)
                .orElseThrow(() -> noEncontrado("No existe el usuario con ID: " + idMesero));

        Pedido pedido = new Pedido();
        pedido.setMesa(mesa);
        pedido.setUsuario(mesero);
        pedido.setFechaHora(LocalDateTime.now());
        pedido.setEstado(EstadoPedido.PENDIENTE);

        Pedido guardado = pedidoRepository.save(pedido);
        return PedidoDto.de(guardado);
    }

    // HU19: agregar un producto al pedido (solo PENDIENTE o EN_PREPARACION).
    // Si el producto ya esta en el pedido con la misma observacion, se suma la cantidad.
    @Transactional
    public PedidoDto agregarProducto(Long idPedido, Long idProducto, Integer cantidad, String observacion) {
        Pedido pedido = obtenerCompleto(idPedido);
        exigirEstado(pedido, "agregar productos", EstadoPedido.PENDIENTE, EstadoPedido.EN_PREPARACION);
        validarCantidad(cantidad);

        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> noEncontrado("No existe el producto con ID: " + idProducto));

        // HU12: un producto inactivo o agotado no se puede pedir
        if (!Boolean.TRUE.equals(producto.getActivo()) || !Boolean.TRUE.equals(producto.getDisponible())) {
            throw conflicto("El producto '" + producto.getNombre() + "' no esta disponible");
        }

        String nota = normalizar(observacion);

        pedido.getDetalles().stream()
                .filter(d -> d.getProducto().getIdProducto().equals(idProducto)
                        && Objects.equals(d.getObservacion(), nota))
                .findFirst()
                .ifPresentOrElse(
                        existente -> existente.setCantidad(existente.getCantidad() + cantidad),
                        () -> {
                            DetallePedido detalle = new DetallePedido();
                            detalle.setProducto(producto);
                            detalle.setCantidad(cantidad);
                            detalle.setPrecioUnitario(producto.getPrecio());
                            detalle.setObservacion(nota);
                            pedido.agregarDetalle(detalle);
                        });

        pedido.recalcularTotal();
        return guardarYRecargar(pedido);
    }

    // HU20: modificar cantidad y/u observacion de un producto (solo PENDIENTE)
    @Transactional
    public PedidoDto modificarDetalle(Long idPedido, Long idDetalle, Integer cantidad, String observacion) {
        Pedido pedido = obtenerCompleto(idPedido);
        exigirEstado(pedido, "modificar productos", EstadoPedido.PENDIENTE);

        DetallePedido detalle = buscarDetalle(pedido, idDetalle);

        if (cantidad != null) {
            validarCantidad(cantidad);
            detalle.setCantidad(cantidad);
        }
        if (observacion != null) {
            detalle.setObservacion(normalizar(observacion));
        }

        pedido.recalcularTotal();
        return guardarYRecargar(pedido);
    }

    // HU20: quitar un producto del pedido (solo PENDIENTE)
    @Transactional
    public PedidoDto eliminarDetalle(Long idPedido, Long idDetalle) {
        Pedido pedido = obtenerCompleto(idPedido);
        exigirEstado(pedido, "quitar productos", EstadoPedido.PENDIENTE);

        pedido.quitarDetalle(buscarDetalle(pedido, idDetalle));
        return guardarYRecargar(pedido);
    }

    // HU22: enviar a cocina. PENDIENTE -> EN_PREPARACION y registra la hora de envio.
    @Transactional
    public PedidoDto enviarACocina(Long idPedido) {
        Pedido pedido = obtenerCompleto(idPedido);
        exigirEstado(pedido, "enviar a cocina", EstadoPedido.PENDIENTE);

        if (pedido.getDetalles().isEmpty()) {
            throw conflicto("No se puede enviar a cocina un pedido sin productos");
        }

        pedido.setEstado(EstadoPedido.EN_PREPARACION);
        pedido.setHoraEnvioCocina(LocalDateTime.now());
        return guardarYRecargar(pedido);
    }

    // HU23: cocina marca el pedido como LISTO
    @Transactional
    public PedidoDto marcarListo(Long idPedido) {
        return cambiarEstado(idPedido, EstadoPedido.EN_PREPARACION, EstadoPedido.LISTO);
    }

    // HU23: el mesero marca el pedido como ENTREGADO
    @Transactional
    public PedidoDto marcarEntregado(Long idPedido) {
        return cambiarEstado(idPedido, EstadoPedido.LISTO, EstadoPedido.ENTREGADO);
    }

    // HU21: cancelar un pedido que aun no ha sido facturado
    @Transactional
    public PedidoDto cancelar(Long idPedido) {
        Pedido pedido = obtenerCompleto(idPedido);

        if (pedido.getEstado() == EstadoPedido.FACTURADO) {
            throw conflicto("No se puede cancelar un pedido FACTURADO");
        }
        if (pedido.getEstado() == EstadoPedido.CANCELADO) {
            throw conflicto("El pedido ya esta CANCELADO");
        }

        pedido.setEstado(EstadoPedido.CANCELADO);
        return guardarYRecargar(pedido);
    }

    private PedidoDto cambiarEstado(Long idPedido, EstadoPedido desde, EstadoPedido hacia) {
        Pedido pedido = obtenerCompleto(idPedido);
        exigirEstado(pedido, "marcar como " + hacia, desde);
        pedido.setEstado(hacia);
        return guardarYRecargar(pedido);
    }

    private PedidoDto guardarYRecargar(Pedido pedido) {
        pedidoRepository.saveAndFlush(pedido);
        return PedidoDto.de(pedido);
    }

    private Pedido obtenerCompleto(Long idPedido) {
        return pedidoRepository.buscarCompleto(idPedido)
                .orElseThrow(() -> noEncontrado("No existe el pedido con ID: " + idPedido));
    }

    private DetallePedido buscarDetalle(Pedido pedido, Long idDetalle) {
        return pedido.getDetalles().stream()
                .filter(d -> d.getIdDetalle().equals(idDetalle))
                .findFirst()
                .orElseThrow(() -> noEncontrado(
                        "El pedido " + pedido.getIdPedido() + " no tiene el detalle con ID: " + idDetalle));
    }

    private void exigirEstado(Pedido pedido, String accion, EstadoPedido... permitidos) {
        for (EstadoPedido permitido : permitidos) {
            if (pedido.getEstado() == permitido) {
                return;
            }
        }
        throw conflicto("No se puede " + accion + " de un pedido en estado " + pedido.getEstado());
    }

    private void validarCantidad(Integer cantidad) {
        if (cantidad == null || cantidad <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor a cero");
        }
    }

    private String normalizar(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }

    private ResponseStatusException noEncontrado(String mensaje) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, mensaje);
    }

    private ResponseStatusException conflicto(String mensaje) {
        return new ResponseStatusException(HttpStatus.CONFLICT, mensaje);
    }
}
