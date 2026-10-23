-- ============================================================
-- SIAR - Datos iniciales de roles
-- Ejecutar despues de "Script DDL SIAR.sql".
--
-- Los nombres deben coincidir con las constantes de Rol.java,
-- porque las reglas de SecurityConfig usan hasRole("<NOMBRE>").
--
-- El primer usuario ADMINISTRADOR lo crea el backend al iniciar
-- (clase AdminInicial) si la tabla USUARIO esta vacia y se
-- definio la variable de entorno SIAR_ADMIN_PASSWORD.
-- ============================================================

INSERT IGNORE INTO ROL (nombre, descripcion) VALUES
    ('ADMINISTRADOR', 'Acceso total al sistema'),
    ('CAJERO',        'Facturacion y registro de pagos'),
    ('MESERO',        'Gestion de mesas, reservas y pedidos'),
    ('COCINERO',      'Preparacion de pedidos y disponibilidad de productos');
