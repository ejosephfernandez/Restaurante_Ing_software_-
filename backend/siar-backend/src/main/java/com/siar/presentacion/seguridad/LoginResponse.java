package com.siar.presentacion.seguridad;

import java.time.Instant;
import java.util.List;

public record LoginResponse(
        String token,
        String tipo,
        Instant expiraEn,
        Long idUsuario,
        String nombre,
        String usuario,
        String rol,
        List<String> permisos) {
}
