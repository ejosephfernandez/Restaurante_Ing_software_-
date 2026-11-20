package com.siar.presentacion.usuarios;

import com.siar.negocio.usuarios.UsuarioService;
import com.siar.negocio.usuarios.UsuarioService.DatosUsuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Cuerpos de las peticiones de la gestion de usuarios
public final class UsuarioRequests {

    private UsuarioRequests() {
    }

    // POST /api/usuarios
    public record CrearUsuario(
            @NotBlank(message = "El nombre es obligatorio")
            @Size(max = 100, message = "El nombre no puede superar 100 caracteres") String nombre,
            @NotBlank(message = "El correo es obligatorio")
            @Email(message = "El correo no es valido")
            @Size(max = 150, message = "El correo no puede superar 150 caracteres") String correo,
            @NotBlank(message = "El nombre de usuario es obligatorio")
            @Size(max = 50, message = "El nombre de usuario no puede superar 50 caracteres") String usuario,
            @NotBlank(message = "La contrasena es obligatoria")
            @Size(min = UsuarioService.MIN_CONTRASENA, max = 72,
                    message = "La contrasena debe tener entre 8 y 72 caracteres") String contrasena,
            @NotBlank(message = "El rol es obligatorio") String rol) {

        public DatosUsuario datos() {
            return new DatosUsuario(nombre, correo, usuario);
        }
    }

    // PUT /api/usuarios/{id}: datos basicos (el rol y el estado tienen su propio endpoint)
    public record ActualizarUsuario(
            @NotBlank(message = "El nombre es obligatorio")
            @Size(max = 100, message = "El nombre no puede superar 100 caracteres") String nombre,
            @NotBlank(message = "El correo es obligatorio")
            @Email(message = "El correo no es valido")
            @Size(max = 150, message = "El correo no puede superar 150 caracteres") String correo,
            @NotBlank(message = "El nombre de usuario es obligatorio")
            @Size(max = 50, message = "El nombre de usuario no puede superar 50 caracteres") String usuario) {

        public DatosUsuario datos() {
            return new DatosUsuario(nombre, correo, usuario);
        }
    }

    // PATCH /api/usuarios/{id}/rol
    public record CambiarRol(@NotBlank(message = "El rol es obligatorio") String rol) {
    }

    // PATCH /api/usuarios/{id}/estado
    public record CambiarEstado(@NotNull(message = "El estado es obligatorio") Boolean activo) {
    }

    // PATCH /api/usuarios/{id}/contrasena (BCrypt solo usa los primeros 72 bytes)
    public record RestablecerContrasena(
            @NotBlank(message = "La contrasena es obligatoria")
            @Size(min = UsuarioService.MIN_CONTRASENA, max = 72,
                    message = "La contrasena debe tener entre 8 y 72 caracteres") String contrasena) {
    }
}
