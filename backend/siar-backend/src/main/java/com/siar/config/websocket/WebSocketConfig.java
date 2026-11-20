package com.siar.config.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;


@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    private final JwtStompChannelInterceptor jwtInterceptor;

    @Value("${siar.cors.origen-permitido}")
    private String origenPermitido;

    public WebSocketConfig(
            JwtStompChannelInterceptor jwtInterceptor) {
        this.jwtInterceptor = jwtInterceptor;
    }

    // Endpoint al que se conectará React.
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(origenPermitido);
    }

    // Configuración del broker de mensajes.
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    // Interceptamos los mensajes entrantes para validar JWT.
    @Override
    public void configureClientInboundChannel(
            ChannelRegistration registration) {
        registration.interceptors(jwtInterceptor);
    }
    
}
