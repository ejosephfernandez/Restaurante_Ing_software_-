package com.siar.presentacion.usuarios;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siar.negocio.seguridad.JwtService;
import com.siar.negocio.usuarios.UsuarioDto;
import com.siar.negocio.usuarios.UsuarioDto.RolDto;
import com.siar.negocio.usuarios.UsuarioService;

import jakarta.validation.Valid;

// Gestion de usuarios (HU01-HU04). Solo el administrador (ver SecurityConfig).
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // GET: listar usuarios (filtros opcionales: rol, activo, buscar)
    @GetMapping
    public ResponseEntity<List<UsuarioDto>> listar(
            @RequestParam(required = false) String rol,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) String buscar) {

        return ResponseEntity.ok(usuarioService.listar(rol, activo, buscar));
    }

    // GET: roles que se pueden asignar
    @GetMapping("/roles")
    public ResponseEntity<List<RolDto>> listarRoles() {
        return ResponseEntity.ok(usuarioService.listarRoles());
    }

    // GET: consultar un usuario
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDto> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtener(id));
    }

    // POST: registrar usuario (HU01)
    @PostMapping
    public ResponseEntity<UsuarioDto> crear(@Valid @RequestBody UsuarioRequests.CrearUsuario request) {
        UsuarioDto usuario = usuarioService.crear(request.datos(), request.contrasena(), request.rol());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(usuario);
    }

    // PUT: editar nombre, correo y nombre de usuario (HU02)
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDto> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequests.ActualizarUsuario request) {

        return ResponseEntity.ok(usuarioService.actualizar(id, request.datos()));
    }

    // PATCH: asignar rol (HU04)
    @PatchMapping("/{id}/rol")
    public ResponseEntity<UsuarioDto> cambiarRol(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequests.CambiarRol request,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(usuarioService.cambiarRol(id, request.rol(), idUsuario(jwt)));
    }

    // PATCH: activar o desactivar (HU03)
    @PatchMapping("/{id}/estado")
    public ResponseEntity<UsuarioDto> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequests.CambiarEstado request,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(usuarioService.cambiarEstado(id, request.activo(), idUsuario(jwt)));
    }

    // PATCH: asignar una contrasena nueva
    @PatchMapping("/{id}/contrasena")
    public ResponseEntity<Void> restablecerContrasena(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequests.RestablecerContrasena request) {

        usuarioService.restablecerContrasena(id, request.contrasena());
        return ResponseEntity.noContent().build();
    }

    private Long idUsuario(Jwt jwt) {
        Number id = jwt.getClaim(JwtService.CLAIM_ID);
        return id.longValue();
    }
}
