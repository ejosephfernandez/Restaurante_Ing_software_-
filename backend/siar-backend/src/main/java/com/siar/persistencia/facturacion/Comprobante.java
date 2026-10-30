package com.siar.persistencia.facturacion;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Registro historico de cada comprobante emitido (HU28). Una factura puede
// tener varios: por ejemplo el impreso y luego una copia en PDF.
@Entity
@Table(name = "COMPROBANTE")
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_comprobante")
    private Long idComprobante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_factura", nullable = false)
    private Factura factura;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDateTime fechaEmision;

    @Enumerated(EnumType.STRING)
    @Column(name = "formato", nullable = false, length = 30)
    private FormatoComprobante formato;

    public Comprobante() {
    }

    public Long getIdComprobante() {
        return idComprobante;
    }

    public void setIdComprobante(Long idComprobante) {
        this.idComprobante = idComprobante;
    }

    public Factura getFactura() {
        return factura;
    }

    public void setFactura(Factura factura) {
        this.factura = factura;
    }

    public LocalDateTime getFechaEmision() {
        return fechaEmision;
    }

    public void setFechaEmision(LocalDateTime fechaEmision) {
        this.fechaEmision = fechaEmision;
    }

    public FormatoComprobante getFormato() {
        return formato;
    }

    public void setFormato(FormatoComprobante formato) {
        this.formato = formato;
    }
}
