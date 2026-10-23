package com.siar.config.seguridad;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Respuestas JSON para peticiones sin token / token invalido (401)
// y para usuarios sin el rol requerido (403).
@Component
public class RespuestaErrorSeguridad implements AuthenticationEntryPoint, AccessDeniedHandler {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException ex) throws IOException {
        escribir(response, HttpStatus.UNAUTHORIZED, "No autorizado",
                "Token ausente, invalido o expirado");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException ex) throws IOException {
        escribir(response, HttpStatus.FORBIDDEN, "Acceso denegado",
                "No tiene permisos para realizar esta operacion");
    }

    private void escribir(HttpServletResponse response, HttpStatus estado,
            String error, String mensaje) throws IOException {
        response.setStatus(estado.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(
                "{\"estado\":" + estado.value()
                        + ",\"error\":\"" + error
                        + "\",\"mensaje\":\"" + mensaje + "\"}");
    }
}
