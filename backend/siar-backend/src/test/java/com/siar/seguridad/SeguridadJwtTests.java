package com.siar.seguridad;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.siar.config.seguridad.RespuestaErrorSeguridad;
import com.siar.config.seguridad.SecurityConfig;
import com.siar.negocio.menu.CategoriaService;
import com.siar.negocio.seguridad.AuthService;
import com.siar.negocio.seguridad.JwtService;
import com.siar.negocio.seguridad.UsuarioAutenticado;
import com.siar.negocio.seguridad.UsuarioDetailsService;
import com.siar.persistencia.menu.Categoria;
import com.siar.persistencia.usuario.Permiso;
import com.siar.persistencia.usuario.Rol;
import com.siar.persistencia.usuario.Usuario;
import com.siar.presentacion.menu.CategoriaController;
import com.siar.presentacion.seguridad.AuthController;

@WebMvcTest(
        controllers = {AuthController.class, CategoriaController.class},
        properties = {
                "siar.jwt.secret=clave-de-pruebas-con-mas-de-32-caracteres",
                "siar.jwt.expiracion-minutos=60",
                "siar.cors.origen-permitido=http://localhost:5173"
        })
@Import({SecurityConfig.class, RespuestaErrorSeguridad.class, AuthService.class, JwtService.class})
class SeguridadJwtTests {

    private static final String CLAVE = "clave123";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UsuarioDetailsService usuarioDetailsService;

    @MockitoBean
    private CategoriaService categoriaService;

    @BeforeEach
    void configurarUsuarios() {
        doThrow(new UsernameNotFoundException("no existe"))
                .when(usuarioDetailsService).loadUserByUsername(anyString());
        doReturn(usuario("admin", Rol.ADMINISTRADOR, true))
                .when(usuarioDetailsService).loadUserByUsername("admin");
        doReturn(usuario("mesero", Rol.MESERO, true))
                .when(usuarioDetailsService).loadUserByUsername("mesero");
        doReturn(usuario("inactivo", Rol.MESERO, false))
                .when(usuarioDetailsService).loadUserByUsername("inactivo");

        when(categoriaService.listarTodas()).thenReturn(List.of(new Categoria("Bebidas")));
        when(categoriaService.crear(any())).thenReturn(new Categoria("Postres"));
    }

    @Test
    void loginCorrectoDevuelveTokenYPermiteConsultar() throws Exception {
        String token = login("admin", CLAVE);

        mockMvc.perform(get("/api/categorias").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Bebidas"));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario").value("admin"))
                .andExpect(jsonPath("$.rol").value(Rol.ADMINISTRADOR))
                .andExpect(jsonPath("$.permisos[0]").value("MENU_GESTIONAR"));
    }

    @Test
    void loginConContrasenaIncorrectaDevuelve401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credenciales("admin", "otra")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Usuario o contrasena incorrectos"));
    }

    @Test
    void loginDeUsuarioInexistenteDevuelve401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credenciales("nadie", CLAVE)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginDeUsuarioInactivoDevuelve401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credenciales("inactivo", CLAVE)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("El usuario esta inactivo"));
    }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mockMvc.perform(get("/api/categorias"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.estado").value(401));
    }

    @Test
    void tokenInvalidoDevuelve401() throws Exception {
        mockMvc.perform(get("/api/categorias").header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meseroNoPuedeCrearCategorias() throws Exception {
        String token = login("mesero", CLAVE);

        mockMvc.perform(post("/api/categorias")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Postres\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.estado").value(403));
    }

    @Test
    void administradorPuedeCrearCategorias() throws Exception {
        String token = login("admin", CLAVE);

        mockMvc.perform(post("/api/categorias")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Postres\"}"))
                .andExpect(status().isCreated());
    }

    private String login(String usuario, String contrasena) throws Exception {
        String respuesta = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credenciales(usuario, contrasena)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andReturn().getResponse().getContentAsString();

        return JsonPath.read(respuesta, "$.token");
    }

    private static String credenciales(String usuario, String contrasena) {
        return "{\"usuario\":\"" + usuario + "\",\"contrasena\":\"" + contrasena + "\"}";
    }

    private static UsuarioAutenticado usuario(String login, String nombreRol, boolean activo) {
        Permiso permiso = new Permiso();
        permiso.setNombre("MENU_GESTIONAR");

        Rol rol = new Rol(nombreRol, null);
        rol.setPermisos(Set.of(permiso));

        Usuario usuario = new Usuario();
        usuario.setIdUsuario(1L);
        usuario.setNombre("Usuario " + login);
        usuario.setUsuario(login);
        usuario.setContrasena(new BCryptPasswordEncoder().encode(CLAVE));
        usuario.setActivo(activo);
        usuario.setRol(rol);

        return new UsuarioAutenticado(usuario);
    }
}
