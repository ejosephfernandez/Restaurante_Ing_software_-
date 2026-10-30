package com.siar.config.seguridad;

import static com.siar.persistencia.usuario.Rol.ADMINISTRADOR;
import static com.siar.persistencia.usuario.Rol.CAJERO;
import static com.siar.persistencia.usuario.Rol.COCINERO;
import static com.siar.persistencia.usuario.Rol.MESERO;

import java.nio.charset.StandardCharsets;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.siar.negocio.seguridad.JwtService;
import com.siar.negocio.seguridad.UsuarioAutenticado;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // habilita @PreAuthorize en los servicios/controladores
public class SecurityConfig {

    private static final String[] RUTAS_MENU = {"/api/categorias/**", "/api/productos/**"};

    // Reglas de acceso de la API. Todo lo que no este listado requiere estar autenticado.
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            RespuestaErrorSeguridad respuestaError) throws Exception {
        http
                // API REST sin sesion ni cookies: CSRF no aplica
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(sesion -> sesion
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Menu: consultar cualquier usuario; modificar solo administrador
                        .requestMatchers(HttpMethod.PATCH, "/api/productos/*/disponibilidad")
                                .hasAnyRole(ADMINISTRADOR, COCINERO)
                        .requestMatchers(HttpMethod.POST, RUTAS_MENU).hasRole(ADMINISTRADOR)
                        .requestMatchers(HttpMethod.PUT, RUTAS_MENU).hasRole(ADMINISTRADOR)
                        .requestMatchers(HttpMethod.DELETE, RUTAS_MENU).hasRole(ADMINISTRADOR)

                        // Mesas: crear/editar administrador; cambiar estado tambien el mesero
                        .requestMatchers(HttpMethod.PUT, "/api/mesas/*/estado")
                                .hasAnyRole(ADMINISTRADOR, MESERO)
                        .requestMatchers(HttpMethod.POST, "/api/mesas").hasRole(ADMINISTRADOR)
                        .requestMatchers(HttpMethod.PUT, "/api/mesas/*").hasRole(ADMINISTRADOR)
                        .requestMatchers(HttpMethod.DELETE, "/api/mesas/**").hasRole(ADMINISTRADOR)

                        // Reservas: crear mesero o caja; confirmar, cancelar y editar el mesero;
                        // eliminar solo administrador
                        .requestMatchers(HttpMethod.POST, "/api/reservas")
                                .hasAnyRole(ADMINISTRADOR, MESERO, CAJERO)
                        .requestMatchers(HttpMethod.PUT, "/api/reservas/**")
                                .hasAnyRole(ADMINISTRADOR, MESERO)
                        .requestMatchers(HttpMethod.DELETE, "/api/reservas/**").hasRole(ADMINISTRADOR)

                        // Pedidos: consultar cualquier usuario; cocina marca LISTO;
                        // el resto del flujo lo maneja el mesero
                        .requestMatchers(HttpMethod.PATCH, "/api/pedidos/*/listo")
                                .hasAnyRole(ADMINISTRADOR, COCINERO)
                        .requestMatchers(HttpMethod.POST, "/api/pedidos/**")
                                .hasAnyRole(ADMINISTRADOR, MESERO)
                        .requestMatchers(HttpMethod.PUT, "/api/pedidos/**")
                                .hasAnyRole(ADMINISTRADOR, MESERO)
                        .requestMatchers(HttpMethod.PATCH, "/api/pedidos/**")
                                .hasAnyRole(ADMINISTRADOR, MESERO)
                        .requestMatchers(HttpMethod.DELETE, "/api/pedidos/**")
                                .hasAnyRole(ADMINISTRADOR, MESERO)

                        // Facturacion: solo caja y administrador
                        .requestMatchers("/api/facturas/**").hasAnyRole(ADMINISTRADOR, CAJERO)

                        .anyRequest().authenticated())
                // Valida el header "Authorization: Bearer <token>" en cada peticion
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                        .authenticationEntryPoint(respuestaError)
                        .accessDeniedHandler(respuestaError))
                .exceptionHandling(excepciones -> excepciones
                        .authenticationEntryPoint(respuestaError)
                        .accessDeniedHandler(respuestaError));

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Usado por AuthService para validar usuario y contrasena en el login
    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider proveedor = new DaoAuthenticationProvider(userDetailsService);
        proveedor.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(proveedor);
    }

    @Bean
    public SecretKey jwtSecretKey(@Value("${siar.jwt.secret}") String secreto) {
        if (secreto == null || secreto.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "Configure la variable JWT_SECRET con al menos 32 caracteres");
        }
        return new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    // Convierte los claims "rol" y "permisos" del token en autoridades de Spring Security
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter convertidor = new JwtAuthenticationConverter();
        convertidor.setJwtGrantedAuthoritiesConverter(jwt -> UsuarioAutenticado.autoridades(
                jwt.getClaimAsString(JwtService.CLAIM_ROL),
                jwt.getClaimAsStringList(JwtService.CLAIM_PERMISOS)));
        return convertidor;
    }

    // Permite que el frontend React llame a la API desde otro origen
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${siar.cors.origen-permitido}") String origenPermitido) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(List.of(origenPermitido));
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource fuente = new UrlBasedCorsConfigurationSource();
        fuente.registerCorsConfiguration("/api/**", cors);
        return fuente;
    }
}
