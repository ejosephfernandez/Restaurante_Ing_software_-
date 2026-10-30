package com.siar.presentacion.facturacion;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.siar.negocio.facturacion.FacturaDto;
import com.siar.negocio.facturacion.FacturaService;
import com.siar.negocio.facturacion.FacturacionDtos.ComprobanteDto;
import com.siar.negocio.facturacion.FacturacionDtos.ComprobanteResumen;
import com.siar.negocio.facturacion.FacturacionDtos.PagoSolicitado;
import com.siar.negocio.facturacion.FacturacionDtos.Previsualizacion;
import com.siar.negocio.facturacion.FacturacionDtos.ResultadoPago;
import com.siar.negocio.seguridad.JwtService;
import com.siar.persistencia.facturacion.EstadoFactura;
import com.siar.persistencia.usuario.Rol;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/facturas")
public class FacturaController {

    private final FacturaService facturaService;

    public FacturaController(FacturaService facturaService) {
        this.facturaService = facturaService;
    }

    // GET: consultar facturas (filtro opcional por estado)
    @GetMapping
    public ResponseEntity<List<FacturaDto>> buscar(
            @RequestParam(required = false) EstadoFactura estado) {

        return ResponseEntity.ok(
                facturaService.buscar(estado)
        );
    }

    // GET: consultar una factura con su detalle, desglose y pagos
    @GetMapping("/{id}")
    public ResponseEntity<FacturaDto> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(
                facturaService.obtener(id)
        );
    }

    // GET: consultar la factura de un pedido
    @GetMapping("/pedido/{idPedido}")
    public ResponseEntity<FacturaDto> obtenerPorPedido(@PathVariable Long idPedido) {
        return ResponseEntity.ok(
                facturaService.obtenerPorPedido(idPedido)
        );
    }

    // POST: calcular subtotal, descuento, impuesto y total sin generar la factura
    @PostMapping("/previsualizar")
    public ResponseEntity<Previsualizacion> previsualizar(
            @Valid @RequestBody FacturaRequests.GenerarFactura request) {

        return ResponseEntity.ok(
                facturaService.previsualizar(request.idPedido(), request.descuento())
        );
    }

    // POST: generar la factura de un pedido entregado; el cajero es el usuario del token
    @PostMapping
    public ResponseEntity<FacturaDto> generar(
            @Valid @RequestBody FacturaRequests.GenerarFactura request,
            @AuthenticationPrincipal Jwt jwt) {

        FacturaDto factura = facturaService.generar(
                request.idPedido(), request.descuento(), idUsuario(jwt), esAdministrador(jwt));

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(factura);
    }

    // POST: registrar el pago (uno o varios metodos); la factura queda PAGADA
    @PostMapping("/{id}/pagos")
    public ResponseEntity<ResultadoPago> registrarPagos(
            @PathVariable Long id,
            @Valid @RequestBody FacturaRequests.RegistrarPagos request) {

        List<PagoSolicitado> pagos = request.pagos().stream()
                .map(p -> new PagoSolicitado(p.metodo(), p.monto()))
                .toList();

        return ResponseEntity.ok(
                facturaService.registrarPagos(id, pagos)
        );
    }

    // POST: emitir comprobante de una factura pagada
    @PostMapping("/{id}/comprobantes")
    public ResponseEntity<ComprobanteDto> emitirComprobante(
            @PathVariable Long id,
            @RequestBody(required = false) FacturaRequests.EmitirComprobante request) {

        ComprobanteDto comprobante = facturaService.emitirComprobante(
                id, request == null ? null : request.formato());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(comprobante);
    }

    // GET: historico de comprobantes emitidos de una factura
    @GetMapping("/{id}/comprobantes")
    public ResponseEntity<List<ComprobanteResumen>> listarComprobantes(@PathVariable Long id) {
        return ResponseEntity.ok(
                facturaService.listarComprobantes(id)
        );
    }

    private Long idUsuario(Jwt jwt) {
        Number id = jwt.getClaim(JwtService.CLAIM_ID);
        return id.longValue();
    }

    private boolean esAdministrador(Jwt jwt) {
        return Rol.ADMINISTRADOR.equals(jwt.getClaimAsString(JwtService.CLAIM_ROL));
    }
}
