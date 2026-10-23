package com.siar.negocio.seguridad;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    public static final String EMISOR = "siar-backend";
    public static final String CLAIM_ID = "id";
    public static final String CLAIM_NOMBRE = "nombre";
    public static final String CLAIM_ROL = "rol";
    public static final String CLAIM_PERMISOS = "permisos";

    private final JwtEncoder jwtEncoder;
    private final long expiracionMinutos;

    public JwtService(JwtEncoder jwtEncoder,
            @Value("${siar.jwt.expiracion-minutos}") long expiracionMinutos) {
        this.jwtEncoder = jwtEncoder;
        this.expiracionMinutos = expiracionMinutos;
    }

    // Genera un token firmado con HS256 que incluye el rol y los permisos del usuario
    public TokenGenerado generar(UsuarioAutenticado usuario) {
        Instant ahora = Instant.now();
        Instant expiraEn = ahora.plus(expiracionMinutos, ChronoUnit.MINUTES);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(EMISOR)
                .issuedAt(ahora)
                .expiresAt(expiraEn)
                .subject(usuario.getUsername())
                .claim(CLAIM_ID, usuario.getIdUsuario())
                .claim(CLAIM_NOMBRE, usuario.getNombre())
                .claim(CLAIM_ROL, usuario.getRol())
                .claim(CLAIM_PERMISOS, usuario.getPermisos())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        return new TokenGenerado(token, expiraEn);
    }

    public record TokenGenerado(String token, Instant expiraEn) {
    }
}
