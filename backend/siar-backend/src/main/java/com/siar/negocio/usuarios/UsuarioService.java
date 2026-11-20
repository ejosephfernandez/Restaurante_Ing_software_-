package com.siar.negocio.usuarios;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.siar.negocio.usuarios.UsuarioDto.RolDto;
import com.siar.persistencia.usuario.Rol;
import com.siar.persistencia.usuario.RolRepository;
import com.siar.persistencia.usuario.Usuario;
import com.siar.persistencia.usuario.UsuarioRepository;

// Gestion de usuarios por el administrador (HU01-HU04).
// No hay borrado fisico: pedidos y facturas referencian al usuario, asi que
// "eliminar" es desactivar (un usuario inactivo no puede iniciar sesion).
@Service
@Transactional(readOnly = true)
public class UsuarioService {

    public static final int MIN_CONTRASENA = 8;

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Datos de entrada para crear y editar
    public record DatosUsuario(String nombre, String correo, String usuario) {
    }

    // Listado con filtros opcionales: rol, activo y texto (nombre, usuario o correo)
    public List<UsuarioDto> listar(String rol, Boolean activo, String buscar) {
        String termino = buscar == null ? "" : buscar.trim().toLowerCase(Locale.ROOT);

        return usuarioRepository.findAllByOrderByNombreAsc().stream()
                .filter(u -> rol == null || rol.isBlank() || u.getRol().getNombre().equalsIgnoreCase(rol.trim()))
                .filter(u -> activo == null || activo.equals(u.getActivo()))
                .filter(u -> termino.isEmpty()
                        || contiene(u.getNombre(), termino)
                        || contiene(u.getUsuario(), termino)
                        || contiene(u.getCorreo(), termino))
                .map(UsuarioDto::de)
                .toList();
    }

    public UsuarioDto obtener(Long id) {
        return UsuarioDto.de(buscar(id));
    }

    public List<RolDto> listarRoles() {
        return rolRepository.findAll().stream()
                .map(RolDto::de)
                .toList();
    }

    // HU01: registrar usuario con su rol; la contrasena se guarda con BCrypt
    @Transactional
    public UsuarioDto crear(DatosUsuario datos, String contrasena, String nombreRol) {
        DatosUsuario limpios = limpiar(datos);
        validarContrasena(contrasena);

        if (usuarioRepository.existsByUsuarioIgnoreCase(limpios.usuario())) {
            throw conflicto("Ya existe un usuario con el nombre de usuario '" + limpios.usuario() + "'");
        }
        if (usuarioRepository.existsByCorreoIgnoreCase(limpios.correo())) {
            throw conflicto("Ya existe un usuario con el correo '" + limpios.correo() + "'");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(limpios.nombre());
        usuario.setCorreo(limpios.correo());
        usuario.setUsuario(limpios.usuario());
        usuario.setContrasena(passwordEncoder.encode(contrasena));
        usuario.setRol(buscarRol(nombreRol));
        usuario.setActivo(true);

        return UsuarioDto.de(usuarioRepository.save(usuario));
    }

    // HU02: editar nombre, correo y nombre de usuario
    @Transactional
    public UsuarioDto actualizar(Long id, DatosUsuario datos) {
        Usuario usuario = buscar(id);
        DatosUsuario limpios = limpiar(datos);

        if (usuarioRepository.existsByUsuarioIgnoreCaseAndIdUsuarioNot(limpios.usuario(), id)) {
            throw conflicto("Ya existe un usuario con el nombre de usuario '" + limpios.usuario() + "'");
        }
        if (usuarioRepository.existsByCorreoIgnoreCaseAndIdUsuarioNot(limpios.correo(), id)) {
            throw conflicto("Ya existe un usuario con el correo '" + limpios.correo() + "'");
        }

        usuario.setNombre(limpios.nombre());
        usuario.setCorreo(limpios.correo());
        usuario.setUsuario(limpios.usuario());

        return UsuarioDto.de(usuarioRepository.save(usuario));
    }

    // HU04: asignar rol. El administrador no puede cambiarse su propio rol,
    // asi el sistema nunca se queda sin quien gestione usuarios.
    @Transactional
    public UsuarioDto cambiarRol(Long id, String nombreRol, Long idAdministrador) {
        Usuario usuario = buscar(id);
        Rol rol = buscarRol(nombreRol);

        if (id.equals(idAdministrador) && !rol.getNombre().equals(usuario.getRol().getNombre())) {
            throw conflicto("No puede cambiar su propio rol");
        }

        usuario.setRol(rol);
        return UsuarioDto.de(usuarioRepository.save(usuario));
    }

    // HU03: activar o desactivar. El administrador no puede desactivarse a si mismo.
    @Transactional
    public UsuarioDto cambiarEstado(Long id, boolean activo, Long idAdministrador) {
        Usuario usuario = buscar(id);

        if (!activo && id.equals(idAdministrador)) {
            throw conflicto("No puede desactivar su propio usuario");
        }

        usuario.setActivo(activo);
        return UsuarioDto.de(usuarioRepository.save(usuario));
    }

    // El administrador asigna una contrasena nueva (no hay recuperacion por correo)
    @Transactional
    public void restablecerContrasena(Long id, String contrasena) {
        Usuario usuario = buscar(id);
        validarContrasena(contrasena);

        usuario.setContrasena(passwordEncoder.encode(contrasena));
        usuarioRepository.save(usuario);
    }

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado con id " + id));
    }

    private Rol buscarRol(String nombreRol) {
        if (nombreRol == null || nombreRol.isBlank()) {
            throw invalido("El rol es obligatorio");
        }
        return rolRepository.findByNombreIgnoreCase(nombreRol.trim())
                .orElseThrow(() -> invalido("El rol '" + nombreRol.trim() + "' no existe"));
    }

    // Quita espacios y guarda el correo en minusculas; valida obligatorios
    private DatosUsuario limpiar(DatosUsuario datos) {
        if (datos == null) {
            throw invalido("Los datos del usuario son obligatorios");
        }
        String nombre = texto(datos.nombre());
        String correo = texto(datos.correo()).toLowerCase(Locale.ROOT);
        String usuario = texto(datos.usuario());

        if (nombre.isEmpty()) {
            throw invalido("El nombre es obligatorio");
        }
        if (correo.isEmpty()) {
            throw invalido("El correo es obligatorio");
        }
        if (usuario.isEmpty()) {
            throw invalido("El nombre de usuario es obligatorio");
        }
        if (usuario.contains(" ")) {
            throw invalido("El nombre de usuario no puede tener espacios");
        }
        return new DatosUsuario(nombre, correo, usuario);
    }

    private void validarContrasena(String contrasena) {
        if (contrasena == null || contrasena.length() < MIN_CONTRASENA) {
            throw invalido("La contrasena debe tener al menos " + MIN_CONTRASENA + " caracteres");
        }
    }

    private static String texto(String valor) {
        return valor == null ? "" : valor.trim();
    }

    private static boolean contiene(String valor, String termino) {
        return valor != null && valor.toLowerCase(Locale.ROOT).contains(termino);
    }

    private ResponseStatusException conflicto(String mensaje) {
        return new ResponseStatusException(HttpStatus.CONFLICT, mensaje);
    }

    private ResponseStatusException invalido(String mensaje) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje);
    }
}
