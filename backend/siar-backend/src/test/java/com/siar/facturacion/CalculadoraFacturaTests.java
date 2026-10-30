package com.siar.facturacion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.siar.negocio.facturacion.CalculadoraFactura;
import com.siar.negocio.facturacion.CalculadoraFactura.Calculo;
import com.siar.negocio.facturacion.CalculadoraFactura.Descuento;
import com.siar.negocio.facturacion.CalculadoraFactura.TipoDescuento;

class CalculadoraFacturaTests {

    private static final BigDecimal TASA = new BigDecimal("0.08");

    @Test
    void sinDescuentoAplicaImpuestoSobreElSubtotal() {
        Calculo calculo = CalculadoraFactura.calcular(new BigDecimal("100000"), null, TASA);

        assertThat(calculo.descuento()).isEqualByComparingTo("0");
        assertThat(calculo.baseGravable()).isEqualByComparingTo("100000");
        assertThat(calculo.impuesto()).isEqualByComparingTo("8000");
        assertThat(calculo.total()).isEqualByComparingTo("108000");
    }

    @Test
    void descuentoPorcentualSeRestaAntesDelImpuesto() {
        Calculo calculo = CalculadoraFactura.calcular(new BigDecimal("100000"),
                new Descuento(TipoDescuento.PORCENTAJE, new BigDecimal("10")), TASA);

        assertThat(calculo.descuento()).isEqualByComparingTo("10000");
        assertThat(calculo.porcentajeDescuento()).isEqualByComparingTo("10");
        assertThat(calculo.baseGravable()).isEqualByComparingTo("90000");
        assertThat(calculo.impuesto()).isEqualByComparingTo("7200");
        assertThat(calculo.total()).isEqualByComparingTo("97200");
    }

    @Test
    void descuentoPorMontoFijoCalculaSuPorcentajeEquivalente() {
        Calculo calculo = CalculadoraFactura.calcular(new BigDecimal("80000"),
                new Descuento(TipoDescuento.MONTO, new BigDecimal("20000")), TASA);

        assertThat(calculo.descuento()).isEqualByComparingTo("20000");
        assertThat(calculo.porcentajeDescuento()).isEqualByComparingTo("25");
        assertThat(calculo.impuesto()).isEqualByComparingTo("4800");
        assertThat(calculo.total()).isEqualByComparingTo("64800");
    }

    @Test
    void redondeaADosDecimales() {
        Calculo calculo = CalculadoraFactura.calcular(new BigDecimal("12345.67"), null, TASA);

        assertThat(calculo.impuesto()).isEqualByComparingTo("987.65");
        assertThat(calculo.total()).isEqualByComparingTo("13333.32");
    }

    @Test
    void rechazaDescuentoMayorAlSubtotal() {
        assertThatThrownBy(() -> CalculadoraFactura.calcular(new BigDecimal("50000"),
                new Descuento(TipoDescuento.MONTO, new BigDecimal("60000")), TASA))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("mayor al subtotal");
    }

    @Test
    void rechazaPorcentajeMayorACien() {
        assertThatThrownBy(() -> CalculadoraFactura.calcular(new BigDecimal("50000"),
                new Descuento(TipoDescuento.PORCENTAJE, new BigDecimal("150")), TASA))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("superar 100");
    }

    @Test
    void rechazaDescuentoNegativo() {
        assertThatThrownBy(() -> CalculadoraFactura.calcular(new BigDecimal("50000"),
                new Descuento(TipoDescuento.MONTO, new BigDecimal("-1")), TASA))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("negativo");
    }

    @Test
    void rechazaDescuentoSinTipo() {
        assertThatThrownBy(() -> CalculadoraFactura.calcular(new BigDecimal("50000"),
                new Descuento(null, new BigDecimal("10")), TASA))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("tipo de descuento");
    }
}
