package com.siar.negocio.facturacion;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

// Calculo de los valores de una factura (HU25 impuestos, HU26 descuentos).
// Es una clase sin dependencias para poder probarla de forma aislada.
//
//   descuento     = porcentaje del subtotal o monto fijo
//   base gravable = subtotal - descuento
//   impuesto      = base gravable x tasa
//   total         = base gravable + impuesto
public final class CalculadoraFactura {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    private CalculadoraFactura() {
    }

    public enum TipoDescuento {
        PORCENTAJE,
        MONTO
    }

    // Descuento solicitado por el cajero; null equivale a sin descuento
    public record Descuento(TipoDescuento tipo, BigDecimal valor) {
    }

    public record Calculo(
            BigDecimal subtotal,
            BigDecimal descuento,
            BigDecimal porcentajeDescuento,
            BigDecimal baseGravable,
            BigDecimal tasaImpuesto,
            BigDecimal impuesto,
            BigDecimal total) {
    }

    public static Calculo calcular(BigDecimal subtotal, Descuento descuento, BigDecimal tasaImpuesto) {
        BigDecimal sub = dinero(subtotal);
        BigDecimal valorDescuento = calcularDescuento(sub, descuento);
        BigDecimal base = sub.subtract(valorDescuento);
        BigDecimal impuesto = dinero(base.multiply(tasaImpuesto));
        BigDecimal porcentaje = sub.signum() == 0
                ? BigDecimal.ZERO
                : valorDescuento.multiply(CIEN).divide(sub, 2, RoundingMode.HALF_UP);

        return new Calculo(sub, valorDescuento, porcentaje, base, tasaImpuesto, impuesto, base.add(impuesto));
    }

    private static BigDecimal calcularDescuento(BigDecimal subtotal, Descuento descuento) {
        if (descuento == null || descuento.valor() == null || descuento.valor().signum() == 0) {
            return dinero(BigDecimal.ZERO);
        }
        if (descuento.tipo() == null) {
            throw invalido("Indique el tipo de descuento: PORCENTAJE o MONTO");
        }
        if (descuento.valor().signum() < 0) {
            throw invalido("El descuento no puede ser negativo");
        }

        BigDecimal valor = switch (descuento.tipo()) {
            case PORCENTAJE -> {
                if (descuento.valor().compareTo(CIEN) > 0) {
                    throw invalido("El porcentaje de descuento no puede superar 100");
                }
                yield subtotal.multiply(descuento.valor()).divide(CIEN);
            }
            case MONTO -> descuento.valor();
        };

        if (valor.compareTo(subtotal) > 0) {
            throw invalido("El descuento no puede ser mayor al subtotal del pedido");
        }
        return dinero(valor);
    }

    private static BigDecimal dinero(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private static ResponseStatusException invalido(String mensaje) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje);
    }
}
