package com.siar.negocio.seguridad;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    // Valida usuario y contrasena (BCrypt) y genera el token JWT.
    // Si las credenciales no son validas lanza AuthenticationException.
    public SesionIniciada login(String usuarioOCorreo, String contrasena) {
        Authentication autenticacion = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        usuarioOCorreo.trim(), contrasena));

        UsuarioAutenticado usuario = (UsuarioAutenticado) autenticacion.getPrincipal();

        return new SesionIniciada(usuario, jwtService.generar(usuario));
    }

    public record SesionIniciada(UsuarioAutenticado usuario, JwtService.TokenGenerado token) {
    }
}
