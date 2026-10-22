package com.siar.negocio.seguridad;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siar.persistencia.usuario.UsuarioRepository;

@Service
@Transactional(readOnly = true)
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    // Permite iniciar sesion con el nombre de usuario o con el correo
    @Override
    public UserDetails loadUserByUsername(String usuarioOCorreo) {
        String valor = usuarioOCorreo == null ? "" : usuarioOCorreo.trim();

        return usuarioRepository.findByUsuarioIgnoreCaseOrCorreoIgnoreCase(valor, valor)
                .map(UsuarioAutenticado::new)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }
}
