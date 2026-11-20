
package com.siar.config.websocket;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

@Component
public class JwtStompChannelInterceptor implements ChannelInterceptor {

    private static final String TOPIC_DISPONIBILIDAD =
            "/topic/productos/disponibilidad";

    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverter jwtConverter;

    public JwtStompChannelInterceptor(
            JwtDecoder jwtDecoder,
            JwtAuthenticationConverter jwtConverter) {
        this.jwtDecoder = jwtDecoder;
        this.jwtConverter = jwtConverter;
    }

    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        // Autenticación durante la conexión STOMP.
        if (StompCommand.CONNECT.equals(command)) {
            autenticar(accessor);
        }

        // Solo usuarios autenticados pueden suscribirse
        // al canal de disponibilidad.
        else if (StompCommand.SUBSCRIBE.equals(command)) {

            if (accessor.getUser() == null) {
                throw new AccessDeniedException(
                        "Se requiere autenticación para suscribirse."
                );
            }

            if (!TOPIC_DISPONIBILIDAD.equals(
                    accessor.getDestination())) {
                throw new AccessDeniedException(
                        "No tienes permiso para acceder a este canal."
                );
            }
        }

        // Los clientes no pueden publicar directamente
        // mensajes en el broker.
        else if (StompCommand.SEND.equals(command)) {
            throw new AccessDeniedException(
                    "No está permitido enviar mensajes al broker."
            );
        }

        return message;
    }

    private void autenticar(StompHeaderAccessor accessor) {

        String authorization =
                accessor.getFirstNativeHeader("Authorization");

        if (authorization == null
                || !authorization.regionMatches(
                        true, 0, "Bearer ", 0, 7)) {
            throw new AccessDeniedException(
                    "Se requiere un token JWT válido."
            );
        }

        String token = authorization.substring(7).trim();

        try {
            Jwt jwt = jwtDecoder.decode(token);

            AbstractAuthenticationToken authentication =
                    jwtConverter.convert(jwt);

            if (authentication == null
                    || !authentication.isAuthenticated()) {
                throw new AccessDeniedException(
                        "No fue posible autenticar al usuario."
                );
            }

            accessor.setUser(authentication);

        } catch (JwtException exception) {
            throw new AccessDeniedException(
                    "El token JWT es inválido o ha expirado.",
                    exception
            );
        }
    }
}
