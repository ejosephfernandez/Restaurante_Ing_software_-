package com.siar.presentacion.pedidos;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.siar.negocio.pedidos.PedidoDto;
import com.siar.negocio.pedidos.PedidoService;
import com.siar.negocio.seguridad.JwtService;
import com.siar.persistencia.pedidos.EstadoPedido;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    // GET: consultar pedidos (filtros opcionales: idMesa, idMesero, estado)
    @GetMapping
    public ResponseEntity<List<PedidoDto>> buscar(
            @RequestParam(required = false) Long idMesa,
            @RequestParam(required = false) Long idMesero,
            @RequestParam(required = false) EstadoPedido estado) {

        return ResponseEntity.ok(
                pedidoService.buscar(idMesa, idMesero, estado)
        );
    }

    // GET: consultar un pedido con su detalle y estado
    @GetMapping("/{id}")
    public ResponseEntity<PedidoDto> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(
                pedidoService.obtener(id)
        );
    }

    // POST: crear pedido para una mesa; el mesero es el usuario del token
    @PostMapping
    public ResponseEntity<PedidoDto> crear(
            @Valid @RequestBody PedidoRequests.CrearPedido request,
            @AuthenticationPrincipal Jwt jwt) {

        PedidoDto creado = pedidoService.crear(request.idMesa(), idUsuario(jwt));

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creado);
    }

    // POST: agregar un producto al pedido
    @PostMapping("/{id}/detalles")
    public ResponseEntity<PedidoDto> agregarProducto(
            @PathVariable Long id,
            @Valid @RequestBody PedidoRequests.AgregarProducto request) {

        return ResponseEntity.ok(
                pedidoService.agregarProducto(
                        id, request.idProducto(), request.cantidad(), request.observacion())
        );
    }

    // PUT: modificar cantidad u observacion de un producto del pedido
    @PutMapping("/{id}/detalles/{idDetalle}")
    public ResponseEntity<PedidoDto> modificarDetalle(
            @PathVariable Long id,
            @PathVariable Long idDetalle,
            @Valid @RequestBody PedidoRequests.ModificarDetalle request) {

        return ResponseEntity.ok(
                pedidoService.modificarDetalle(id, idDetalle, request.cantidad(), request.observacion())
        );
    }

    // DELETE: quitar un producto del pedido
    @DeleteMapping("/{id}/detalles/{idDetalle}")
    public ResponseEntity<PedidoDto> eliminarDetalle(
            @PathVariable Long id,
            @PathVariable Long idDetalle) {

        return ResponseEntity.ok(
                pedidoService.eliminarDetalle(id, idDetalle)
        );
    }

    // PATCH: enviar a cocina (PENDIENTE -> EN_PREPARACION)
    @PatchMapping("/{id}/enviar-cocina")
    public ResponseEntity<PedidoDto> enviarACocina(@PathVariable Long id) {
        return ResponseEntity.ok(
                pedidoService.enviarACocina(id)
        );
    }

    // PATCH: cocina marca el pedido como listo (EN_PREPARACION -> LISTO)
    @PatchMapping("/{id}/listo")
    public ResponseEntity<PedidoDto> marcarListo(@PathVariable Long id) {
        return ResponseEntity.ok(
                pedidoService.marcarListo(id)
        );
    }

    // PATCH: el mesero marca el pedido como entregado (LISTO -> ENTREGADO)
    @PatchMapping("/{id}/entregado")
    public ResponseEntity<PedidoDto> marcarEntregado(@PathVariable Long id) {
        return ResponseEntity.ok(
                pedidoService.marcarEntregado(id)
        );
    }

    // PATCH: cancelar el pedido (si no esta facturado)
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<PedidoDto> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(
                pedidoService.cancelar(id)
        );
    }

    private Long idUsuario(Jwt jwt) {
        Number id = jwt.getClaim(JwtService.CLAIM_ID);
        return id.longValue();
    }
}
