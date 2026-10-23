package com.siar.config.seguridad;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.siar.persistencia.usuario.Rol;
import com.siar.persistencia.usuario.RolRepository;
import com.siar.persistencia.usuario.Usuario;
import com.siar.persistencia.usuario.UsuarioRepository;

// Crea el primer usuario administrador al iniciar la aplicacion, para poder
// hacer login sin insertar hashes BCrypt a mano. Solo actua si la tabla USUARIO
// esta vacia y se definio la variable SIAR_ADMIN_PASSWORD.
@Component
public class AdminInicial implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInicial.class);

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final String usuario;
    private final String correo;
    private final String contrasena;

    public AdminInicial(UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder,
            @Value("${siar.admin.usuario}") String usuario,
            @Value("${siar.admin.correo}") String correo,
            @Value("${siar.admin.contrasena}") String contrasena) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuario = usuario;
        this.correo = correo;
        this.contrasena = contrasena;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (contrasena == null || contrasena.isBlank() || usuarioRepository.count() > 0) {
            return;
        }

        Rol rolAdmin = rolRepository.findByNombreIgnoreCase(Rol.ADMINISTRADOR)
                .orElseGet(() -> rolRepository.save(
                        new Rol(Rol.ADMINISTRADOR, "Acceso total al sistema")));

        Usuario admin = new Usuario();
        admin.setRol(rolAdmin);
        admin.setNombre("Administrador");
        admin.setUsuario(usuario);
        admin.setCorreo(correo);
        admin.setContrasena(passwordEncoder.encode(contrasena));
        admin.setActivo(true);
        usuarioRepository.save(admin);

        log.info("Usuario administrador inicial '{}' creado", usuario);
    }
}
