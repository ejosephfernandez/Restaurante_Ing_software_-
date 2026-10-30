package com.siar.presentacion.pedidos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

// Cuerpos de las peticiones del modulo de pedidos
public final class PedidoRequests {

    private PedidoRequests() {
    }

    // POST /api/pedidos
    public record CrearPedido(
            @NotNull(message = "La mesa es obligatoria") Long idMesa) {
    }

    // POST /api/pedidos/{id}/detalles
    public record AgregarProducto(
            @NotNull(message = "El producto es obligatorio") Long idProducto,
            @NotNull(message = "La cantidad es obligatoria")
            @Positive(message = "La cantidad debe ser mayor a cero") Integer cantidad,
            @Size(max = 255, message = "La observacion admite maximo 255 caracteres") String observacion) {
    }

    // PUT /api/pedidos/{id}/detalles/{idDetalle}: los campos nulos no se modifican
    public record ModificarDetalle(
            @Positive(message = "La cantidad debe ser mayor a cero") Integer cantidad,
            @Size(max = 255, message = "La observacion admite maximo 255 caracteres") String observacion) {
    }
}
