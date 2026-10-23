package com.siar.presentacion.seguridad;

import jakarta.validation.constraints.NotBlank;

// Cuerpo de POST /api/auth/login. "usuario" acepta el nombre de usuario o el correo.
public record LoginRequest(
        @NotBlank(message = "El usuario es obligatorio") String usuario,
        @NotBlank(message = "La contrasena es obligatoria") String contrasena) {
}
