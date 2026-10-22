package com.siar.persistencia.pedido;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "RESERVA")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reserva")
    private Long idReserva;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_mesa", nullable = false)
    private Mesa mesa;

    @CreationTimestamp // hace que Hibernate ponga la fecha y hora actual automáticamente al insertar
                       // el registro
    @Column(name = "fechaHora", nullable = false, updatable = false)
    private LocalDateTime fechaHora;

    @Column(name = "nombreCliente", length = 100)
    private String nombreCliente;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "numPersonas", nullable = false)
    private int numPersonas;

    // NUEVO CAMPO PARA EL ESTADO
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "PENDIENTE"; // (Valor por defecto)

    public Reserva() {
    }

    public Reserva(Long idReserva, Mesa mesa, LocalDateTime fechaHora, String nombreCliente, String telefono,
            int numPersonas, String estado) {
        this.idReserva = idReserva;
        this.mesa = mesa;
        this.fechaHora = fechaHora;
        this.nombreCliente = nombreCliente;
        this.telefono = telefono;
        this.numPersonas = numPersonas;
        this.estado = estado;
    }

    public Long getIdReserva() {
        return idReserva;
    }

    public void setIdReserva(Long idReserva) {
        this.idReserva = idReserva;
    }

    public Mesa getMesa() {
        return mesa;
    }

    public void setMesa(Mesa mesa) {
        this.mesa = mesa;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public int getNumPersonas() {
        return numPersonas;
    }

    public void setNumPersonas(int numPersonas) {
        this.numPersonas = numPersonas;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

}