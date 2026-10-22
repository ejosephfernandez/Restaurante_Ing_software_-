package com.siar.presentacion.seguridad;

import java.util.List;

// Datos del usuario autenticado, leidos del token JWT
public record PerfilResponse(
        Long idUsuario,
        String nombre,
        String usuario,
        String rol,
        List<String> permisos) {
}
