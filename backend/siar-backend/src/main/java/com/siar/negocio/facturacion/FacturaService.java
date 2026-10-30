package com.siar.negocio.facturacion;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.siar.negocio.facturacion.FacturacionDtos.ComprobanteDto;
import com.siar.negocio.facturacion.FacturacionDtos.ComprobanteResumen;
import com.siar.negocio.facturacion.FacturacionDtos.Negocio;
import com.siar.negocio.facturacion.FacturacionDtos.PagoSolicitado;
import com.siar.negocio.facturacion.FacturacionDtos.Previsualizacion;
import com.siar.negocio.facturacion.FacturacionDtos.ResultadoPago;
import com.siar.negocio.pedidos.PedidoDto;
import com.siar.persistencia.facturacion.Comprobante;
import com.siar.persistencia.facturacion.ComprobanteRepository;
import com.siar.persistencia.facturacion.EstadoFactura;
import com.siar.persistencia.facturacion.Factura;
import com.siar.persistencia.facturacion.FacturaRepository;
import com.siar.persistencia.facturacion.FormatoComprobante;
import com.siar.persistencia.facturacion.MetodoPago;
import com.siar.persistencia.facturacion.Pago;
import com.siar.persistencia.pedidos.EstadoPedido;
import com.siar.persistencia.pedidos.Pedido;
import com.siar.persistencia.pedidos.PedidoRepository;
import com.siar.persistencia.usuario.Usuario;
import com.siar.persistencia.usuario.UsuarioRepository;

@Service
@Transactional(readOnly = true)
public class FacturaService {

    private final FacturaRepository facturaRepository;
    private final ComprobanteRepository comprobanteRepository;
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final BigDecimal tasaImpuesto;
    private final BigDecimal descuentoMaximoSinAutorizacion;
    private final Negocio negocio;

    public FacturaService(FacturaRepository facturaRepository,
            ComprobanteRepository comprobanteRepository,
            PedidoRepository pedidoRepository,
            UsuarioRepository usuarioRepository,
            @Value("${siar.facturacion.tasa-impuesto}") BigDecimal tasaImpuesto,
            @Value("${siar.facturacion.descuento-maximo-sin-autorizacion}") BigDecimal descuentoMaximoSinAutorizacion,
            @Value("${siar.negocio.nombre}") String nombreNegocio,
            @Value("${siar.negocio.nit}") String nit,
            @Value("${siar.negocio.direccion}") String direccion,
            @Value("${siar.negocio.telefono}") String telefono) {
        this.facturaRepository = facturaRepository;
        this.comprobanteRepository = comprobanteRepository;
        this.pedidoRepository = pedidoRepository;
        this.usuarioRepository = usuarioRepository;
        this.tasaImpuesto = tasaImpuesto;
        this.descuentoMaximoSinAutorizacion = descuentoMaximoSinAutorizacion;
        this.negocio = new Negocio(nombreNegocio, nit, direccion, telefono);
    }

    public List<FacturaDto> buscar(EstadoFactura estado) {
        return facturaRepository.buscar(estado).stream()
                .map(factura -> FacturaDto.de(conDetalle(factura)))
                .toList();
    }

    public FacturaDto obtener(Long idFactura) {
        return FacturaDto.de(obtenerCompleta(idFactura));
    }

    public FacturaDto obtenerPorPedido(Long idPedido) {
        Long idFactura = facturaRepository.buscarIdPorPedido(idPedido)
                .orElseThrow(() -> noEncontrado("El pedido " + idPedido + " no tiene factura"));
        return obtener(idFactura);
    }

    // HU25/HU26: calcula subtotal, descuento, impuesto y total sin guardar nada
    public Previsualizacion previsualizar(Long idPedido, CalculadoraFactura.Descuento descuento) {
        Pedido pedido = obtenerPedidoFacturable(idPedido);
        CalculadoraFactura.Calculo calculo = CalculadoraFactura.calcular(pedido.getTotal(), descuento, tasaImpuesto);

        return new Previsualizacion(
                idPedido,
                pedido.getDetalles().stream().map(PedidoDto.Detalle::de).toList(),
                calculo,
                requiereAutorizacion(calculo));
    }

    // HU24: genera la factura de un pedido ENTREGADO con numero consecutivo
    // y deja el pedido en estado FACTURADO.
    @Transactional
    public FacturaDto generar(Long idPedido, CalculadoraFactura.Descuento descuento,
            Long idCajero, boolean esAdministrador) {

        Pedido pedido = obtenerPedidoFacturable(idPedido);
        CalculadoraFactura.Calculo calculo = CalculadoraFactura.calcular(pedido.getTotal(), descuento, tasaImpuesto);

        // HU26: descuentos por encima del limite solo los autoriza un administrador
        if (requiereAutorizacion(calculo) && !esAdministrador) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Un descuento mayor al " + descuentoMaximoSinAutorizacion
                            + "% requiere autorizacion de un ADMINISTRADOR");
        }

        Usuario cajero = usuarioRepository.findById(idCajero)
                .orElseThrow(() -> noEncontrado("No existe el usuario con ID: " + idCajero));

        Factura factura = new Factura();
        factura.setPedido(pedido);
        factura.setUsuario(cajero);
        factura.setNumero(facturaRepository.ultimoNumero() + 1);
        factura.setFechaHora(LocalDateTime.now());
        factura.setSubtotal(calculo.subtotal());
        factura.setDescuento(calculo.descuento());
        factura.setImpuesto(calculo.impuesto());
        factura.setTotal(calculo.total());
        factura.setEstado(EstadoFactura.EMITIDA);

        pedido.setEstado(EstadoPedido.FACTURADO);

        facturaRepository.saveAndFlush(factura);
        return FacturaDto.de(factura);
    }

    // HU27: registra el pago (simple o mixto). Los pagos deben cubrir el total;
    // solo el EFECTIVO puede excederlo y la diferencia se devuelve como cambio.
    @Transactional
    public ResultadoPago registrarPagos(Long idFactura, List<PagoSolicitado> pagos) {
        Factura factura = obtenerCompleta(idFactura);

        if (factura.getEstado() != EstadoFactura.EMITIDA) {
            throw conflicto("La factura " + factura.getNumero() + " esta " + factura.getEstado()
                    + "; solo se registran pagos en facturas EMITIDAS");
        }
        if (pagos == null || pagos.isEmpty()) {
            throw invalido("Debe registrar al menos un pago");
        }

        BigDecimal efectivo = BigDecimal.ZERO;
        BigDecimal otrosMedios = BigDecimal.ZERO;

        for (PagoSolicitado pago : pagos) {
            if (pago.metodo() == null) {
                throw invalido("Cada pago debe indicar el metodo: EFECTIVO, TARJETA o TRANSFERENCIA");
            }
            if (pago.monto() == null || pago.monto().signum() <= 0) {
                throw invalido("El monto de cada pago debe ser mayor a cero");
            }
            if (pago.metodo() == MetodoPago.EFECTIVO) {
                efectivo = efectivo.add(pago.monto());
            } else {
                otrosMedios = otrosMedios.add(pago.monto());
            }
        }

        BigDecimal total = factura.getTotal();
        BigDecimal recibido = efectivo.add(otrosMedios);

        if (otrosMedios.compareTo(total) > 0) {
            throw invalido("Los pagos con tarjeta o transferencia no pueden superar el total de la factura ("
                    + total + ")");
        }
        if (recibido.compareTo(total) < 0) {
            throw invalido("El monto pagado (" + recibido + ") no cubre el total de la factura ("
                    + total + "). Faltan " + total.subtract(recibido));
        }

        BigDecimal cambio = recibido.subtract(total);

        // Cada pago con tarjeta/transferencia se guarda tal cual
        for (PagoSolicitado pago : pagos) {
            if (pago.metodo() != MetodoPago.EFECTIVO) {
                factura.agregarPago(new Pago(pago.metodo(), pago.monto()));
            }
        }
        // El efectivo se guarda por lo que realmente se aplica (sin el cambio),
        // asi la suma de PAGO.monto coincide con FACTURA.total.
        BigDecimal efectivoAplicado = efectivo.subtract(cambio);
        if (efectivoAplicado.signum() > 0) {
            factura.agregarPago(new Pago(MetodoPago.EFECTIVO, efectivoAplicado));
        }

        factura.setEstado(EstadoFactura.PAGADA);
        facturaRepository.saveAndFlush(factura);

        return new ResultadoPago(FacturaDto.de(factura), recibido, cambio);
    }

    // HU28: emite un comprobante de una factura PAGADA y lo guarda como historico
    @Transactional
    public ComprobanteDto emitirComprobante(Long idFactura, FormatoComprobante formato) {
        Factura factura = obtenerCompleta(idFactura);

        if (factura.getEstado() != EstadoFactura.PAGADA) {
            throw conflicto("Solo se emite comprobante de facturas PAGADAS (la factura "
                    + factura.getNumero() + " esta " + factura.getEstado() + ")");
        }

        Comprobante comprobante = new Comprobante();
        comprobante.setFactura(factura);
        comprobante.setFechaEmision(LocalDateTime.now());
        comprobante.setFormato(formato == null ? FormatoComprobante.IMPRESO : formato);
        comprobanteRepository.save(comprobante);

        return new ComprobanteDto(
                comprobante.getIdComprobante(),
                comprobante.getFechaEmision(),
                comprobante.getFormato(),
                negocio,
                FacturaDto.de(factura));
    }

    public List<ComprobanteResumen> listarComprobantes(Long idFactura) {
        if (!facturaRepository.existsById(idFactura)) {
            throw noEncontrado("No existe la factura con ID: " + idFactura);
        }
        return comprobanteRepository.findByFactura_IdFacturaOrderByFechaEmisionDesc(idFactura).stream()
                .map(c -> new ComprobanteResumen(c.getIdComprobante(), c.getFechaEmision(), c.getFormato()))
                .toList();
    }

    private boolean requiereAutorizacion(CalculadoraFactura.Calculo calculo) {
        return calculo.porcentajeDescuento().compareTo(descuentoMaximoSinAutorizacion) > 0;
    }

    private Pedido obtenerPedidoFacturable(Long idPedido) {
        Pedido pedido = pedidoRepository.buscarCompleto(idPedido)
                .orElseThrow(() -> noEncontrado("No existe el pedido con ID: " + idPedido));

        if (facturaRepository.existsByPedido_IdPedido(idPedido)) {
            throw conflicto("El pedido " + idPedido + " ya tiene factura");
        }
        if (pedido.getEstado() != EstadoPedido.ENTREGADO) {
            throw conflicto("Solo se factura un pedido ENTREGADO (estado actual: " + pedido.getEstado() + ")");
        }
        return pedido;
    }

    private Factura obtenerCompleta(Long idFactura) {
        Factura factura = facturaRepository.buscarCompleta(idFactura)
                .orElseThrow(() -> noEncontrado("No existe la factura con ID: " + idFactura));
        return conDetalle(factura);
    }

    // Carga el detalle del pedido (productos) en la misma sesion de JPA
    private Factura conDetalle(Factura factura) {
        pedidoRepository.buscarCompleto(factura.getPedido().getIdPedido());
        return factura;
    }

    private ResponseStatusException noEncontrado(String mensaje) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, mensaje);
    }

    private ResponseStatusException conflicto(String mensaje) {
        return new ResponseStatusException(HttpStatus.CONFLICT, mensaje);
    }

    private ResponseStatusException invalido(String mensaje) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje);
    }
}
