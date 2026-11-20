package com.siar.usuarios;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.siar.negocio.usuarios.UsuarioDto;
import com.siar.negocio.usuarios.UsuarioService;
import com.siar.negocio.usuarios.UsuarioService.DatosUsuario;
import com.siar.persistencia.usuario.Rol;
import com.siar.persistencia.usuario.RolRepository;
import com.siar.persistencia.usuario.Usuario;
import com.siar.persistencia.usuario.UsuarioRepository;

class UsuarioServiceTests {

    private static final Long ID_ADMIN = 1L;

    private UsuarioRepository usuarioRepository;
    private RolRepository rolRepository;
    private PasswordEncoder passwordEncoder;
    private UsuarioService usuarioService;

    private Rol rolAdmin;
    private Rol rolMesero;
    private Rol rolCajero;

    @BeforeEach
    void configurar() {
        usuarioRepository = mock(UsuarioRepository.class);
        rolRepository = mock(RolRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        usuarioService = new UsuarioService(usuarioRepository, rolRepository, passwordEncoder);

        rolAdmin = rol(1L, Rol.ADMINISTRADOR);
        rolMesero = rol(2L, Rol.MESERO);
        rolCajero = rol(3L, Rol.CAJERO);
        // Igual que la consulta real: busca el rol sin distinguir mayusculas
        List<Rol> roles = List.of(rolAdmin, rolMesero, rolCajero);
        when(rolRepository.findByNombreIgnoreCase(anyString())).thenAnswer(inv -> roles.stream()
                .filter(r -> r.getNombre().equalsIgnoreCase(inv.getArgument(0)))
                .findFirst());

        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            if (u.getIdUsuario() == null) {
                u.setIdUsuario(50L);
            }
            return u;
        });
    }

    // ---------- HU01 registrar ----------

    @Test
    void creaUsuarioConContrasenaCifradaYCorreoEnMinusculas() {
        UsuarioDto creado = usuarioService.crear(
                new DatosUsuario("  Laura Gomez ", "Laura@SIAR.com", "lgomez"), "clave-segura", "mesero");

        assertThat(creado.idUsuario()).isEqualTo(50L);
        assertThat(creado.nombre()).isEqualTo("Laura Gomez");
        assertThat(creado.correo()).isEqualTo("laura@siar.com");
        assertThat(creado.rol()).isEqualTo(Rol.MESERO);
        assertThat(creado.activo()).isTrue();

        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    void laContrasenaSeGuardaConBcryptYNuncaEnTextoPlano() {
        Usuario[] guardado = new Usuario[1];
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            guardado[0] = inv.getArgument(0);
            return guardado[0];
        });

        usuarioService.crear(new DatosUsuario("Laura", "laura@siar.com", "lgomez"), "clave-segura", Rol.MESERO);

        assertThat(guardado[0].getContrasena()).isNotEqualTo("clave-segura");
        assertThat(passwordEncoder.matches("clave-segura", guardado[0].getContrasena())).isTrue();
    }

    @Test
    void noCreaUsuarioConNombreDeUsuarioRepetido() {
        when(usuarioRepository.existsByUsuarioIgnoreCase("lgomez")).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.crear(
                new DatosUsuario("Laura", "laura@siar.com", "lgomez"), "clave-segura", Rol.MESERO))
                .satisfies(e -> assertEstado(e, HttpStatus.CONFLICT));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void noCreaUsuarioConCorreoRepetido() {
        when(usuarioRepository.existsByCorreoIgnoreCase("laura@siar.com")).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.crear(
                new DatosUsuario("Laura", "LAURA@siar.com", "lgomez"), "clave-segura", Rol.MESERO))
                .satisfies(e -> assertEstado(e, HttpStatus.CONFLICT));
    }

    @Test
    void noCreaUsuarioConRolInexistente() {
        assertThatThrownBy(() -> usuarioService.crear(
                new DatosUsuario("Laura", "laura@siar.com", "lgomez"), "clave-segura", "GERENTE"))
                .satisfies(e -> assertEstado(e, HttpStatus.BAD_REQUEST));
    }

    @Test
    void noCreaUsuarioConContrasenaCorta() {
        assertThatThrownBy(() -> usuarioService.crear(
                new DatosUsuario("Laura", "laura@siar.com", "lgomez"), "1234", Rol.MESERO))
                .satisfies(e -> assertEstado(e, HttpStatus.BAD_REQUEST));
    }

    @Test
    void noCreaUsuarioConEspaciosEnElNombreDeUsuario() {
        assertThatThrownBy(() -> usuarioService.crear(
                new DatosUsuario("Laura", "laura@siar.com", "laura gomez"), "clave-segura", Rol.MESERO))
                .satisfies(e -> assertEstado(e, HttpStatus.BAD_REQUEST));
    }

    // ---------- HU02 editar ----------

    @Test
    void editaDatosBasicos() {
        Usuario existente = usuario(7L, "Pedro", rolMesero, true);
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(existente));

        UsuarioDto editado = usuarioService.actualizar(7L,
                new DatosUsuario("Pedro Ruiz", "pedro.ruiz@siar.com", "pruiz"));

        assertThat(editado.nombre()).isEqualTo("Pedro Ruiz");
        assertThat(editado.correo()).isEqualTo("pedro.ruiz@siar.com");
        assertThat(editado.usuario()).isEqualTo("pruiz");
        assertThat(editado.rol()).isEqualTo(Rol.MESERO);
    }

    @Test
    void noEditaConCorreoDeOtroUsuario() {
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario(7L, "Pedro", rolMesero, true)));
        when(usuarioRepository.existsByCorreoIgnoreCaseAndIdUsuarioNot("ana@siar.com", 7L)).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.actualizar(7L,
                new DatosUsuario("Pedro", "ana@siar.com", "pedro")))
                .satisfies(e -> assertEstado(e, HttpStatus.CONFLICT));
    }

    @Test
    void editarUsuarioInexistenteDevuelve404() {
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> usuarioService.actualizar(99L,
                new DatosUsuario("X", "x@siar.com", "x")))
                .satisfies(e -> assertEstado(e, HttpStatus.NOT_FOUND));
    }

    // ---------- HU03 activar / desactivar ----------

    @Test
    void desactivaOtroUsuario() {
        Usuario mesero = usuario(7L, "Pedro", rolMesero, true);
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(mesero));

        UsuarioDto resultado = usuarioService.cambiarEstado(7L, false, ID_ADMIN);

        assertThat(resultado.activo()).isFalse();
        assertThat(mesero.getActivo()).isFalse();
    }

    @Test
    void reactivaUsuario() {
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario(7L, "Pedro", rolMesero, false)));

        assertThat(usuarioService.cambiarEstado(7L, true, ID_ADMIN).activo()).isTrue();
    }

    @Test
    void elAdministradorNoPuedeDesactivarseASiMismo() {
        when(usuarioRepository.findById(ID_ADMIN)).thenReturn(Optional.of(usuario(ID_ADMIN, "Admin", rolAdmin, true)));

        assertThatThrownBy(() -> usuarioService.cambiarEstado(ID_ADMIN, false, ID_ADMIN))
                .satisfies(e -> assertEstado(e, HttpStatus.CONFLICT));
    }

    // ---------- HU04 asignar rol ----------

    @Test
    void cambiaElRolDeOtroUsuario() {
        Usuario mesero = usuario(7L, "Pedro", rolMesero, true);
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(mesero));

        UsuarioDto resultado = usuarioService.cambiarRol(7L, "cajero", ID_ADMIN);

        assertThat(resultado.rol()).isEqualTo(Rol.CAJERO);
    }

    @Test
    void elAdministradorNoPuedeCambiarseSuPropioRol() {
        when(usuarioRepository.findById(ID_ADMIN)).thenReturn(Optional.of(usuario(ID_ADMIN, "Admin", rolAdmin, true)));

        assertThatThrownBy(() -> usuarioService.cambiarRol(ID_ADMIN, Rol.MESERO, ID_ADMIN))
                .satisfies(e -> assertEstado(e, HttpStatus.CONFLICT));
    }

    // ---------- contrasena y listado ----------

    @Test
    void restableceContrasena() {
        Usuario mesero = usuario(7L, "Pedro", rolMesero, true);
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(mesero));

        usuarioService.restablecerContrasena(7L, "nueva-clave-1");

        assertThat(passwordEncoder.matches("nueva-clave-1", mesero.getContrasena())).isTrue();
    }

    @Test
    void listaFiltrandoPorRolEstadoYTexto() {
        when(usuarioRepository.findAllByOrderByNombreAsc()).thenReturn(List.of(
                usuario(1L, "Admin", rolAdmin, true),
                usuario(7L, "Pedro Ruiz", rolMesero, true),
                usuario(8L, "Sofia Diaz", rolMesero, false)));

        assertThat(usuarioService.listar(null, null, null)).hasSize(3);
        assertThat(usuarioService.listar("mesero", null, null)).hasSize(2);
        assertThat(usuarioService.listar(Rol.MESERO, true, null))
                .extracting(UsuarioDto::nombre).containsExactly("Pedro Ruiz");
        assertThat(usuarioService.listar(null, null, "SOFIA"))
                .extracting(UsuarioDto::idUsuario).containsExactly(8L);
    }

    private static void assertEstado(Throwable e, HttpStatus estado) {
        assertThat(e).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(estado);
    }

    private static Rol rol(Long id, String nombre) {
        Rol rol = new Rol(nombre, null);
        rol.setIdRol(id);
        return rol;
    }

    private static Usuario usuario(Long id, String nombre, Rol rol, boolean activo) {
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(id);
        usuario.setNombre(nombre);
        usuario.setCorreo(nombre.toLowerCase().replace(' ', '.') + "@siar.com");
        usuario.setUsuario(nombre.toLowerCase().replace(" ", ""));
        usuario.setContrasena("hash");
        usuario.setRol(rol);
        usuario.setActivo(activo);
        return usuario;
    }
}
