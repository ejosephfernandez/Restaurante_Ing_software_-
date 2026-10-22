package com.siar.presentacion.seguridad;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.siar.negocio.seguridad.AuthService;
import com.siar.negocio.seguridad.JwtService;
import com.siar.negocio.seguridad.UsuarioAutenticado;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST: iniciar sesion y obtener el token JWT (publico)
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        AuthService.SesionIniciada sesion =
                authService.login(request.usuario(), request.contrasena());
        UsuarioAutenticado usuario = sesion.usuario();

        return ResponseEntity.ok(
                new LoginResponse(
                        sesion.token().token(),
                        "Bearer",
                        sesion.token().expiraEn(),
                        usuario.getIdUsuario(),
                        usuario.getNombre(),
                        usuario.getUsername(),
                        usuario.getRol(),
                        usuario.getPermisos())
        );
    }

    // GET: datos del usuario dueño del token
    @GetMapping("/me")
    public ResponseEntity<PerfilResponse> perfil(
            @AuthenticationPrincipal Jwt jwt) {

        Number id = jwt.getClaim(JwtService.CLAIM_ID);
        List<String> permisos = jwt.getClaimAsStringList(JwtService.CLAIM_PERMISOS);

        return ResponseEntity.ok(
                new PerfilResponse(
                        id == null ? null : id.longValue(),
                        jwt.getClaimAsString(JwtService.CLAIM_NOMBRE),
                        jwt.getSubject(),
                        jwt.getClaimAsString(JwtService.CLAIM_ROL),
                        permisos == null ? List.of() : permisos)
        );
    }

    // Credenciales invalidas o usuario inactivo: 401 sin revelar cual de los dos datos fallo
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> credencialesInvalidas(
            AuthenticationException ex) {

        String mensaje = ex instanceof DisabledException
                ? "El usuario esta inactivo"
                : "Usuario o contrasena incorrectos";

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "estado", 401,
                        "error", "No autorizado",
                        "mensaje", mensaje));
    }
}
