package com.siar.negocio.usuarios;

import com.siar.persistencia.usuario.Rol;
import com.siar.persistencia.usuario.Usuario;

// Vista del usuario para la gestion de usuarios. Nunca incluye la contrasena.
public record UsuarioDto(
        Long idUsuario,
        String nombre,
        String correo,
        String usuario,
        String rol,
        Boolean activo) {

    public static UsuarioDto de(Usuario usuario) {
        return new UsuarioDto(
                usuario.getIdUsuario(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getUsuario(),
                usuario.getRol().getNombre(),
                usuario.getActivo());
    }

    // Roles disponibles para asignar (HU04)
    public record RolDto(Long idRol, String nombre, String descripcion) {

        public static RolDto de(Rol rol) {
            return new RolDto(rol.getIdRol(), rol.getNombre(), rol.getDescripcion());
        }
    }
}
