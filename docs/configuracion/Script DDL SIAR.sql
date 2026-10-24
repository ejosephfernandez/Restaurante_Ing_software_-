-- ============================================================
-- SIAR - Sistema Integral de Administracion para Restaurantes
-- Script inicial de creacion de tablas
-- MySQL / InnoDB / utf8mb4
--
-- Basado en el modelo entidad-relacion acordado.
--
-- Decisiones incluidas:
-- * Cada usuario tiene exactamente un rol: USUARIO.id_rol NOT NULL.
-- * Los permisos se asignan a roles mediante ROL_PERMISO.
-- * USUARIO_PERMISO se omite en esta version: no se manejaran
--   permisos extraordinarios individuales por usuario.
-- * INSUMO se omite porque inventario esta fuera del alcance actual.
-- * Un pedido puede tener como maximo una factura.
-- * Una factura puede recibir varios pagos (pagos mixtos).
-- * Cada metodo de pago utilizado se guarda en una fila PAGO.
-- * COMPROBANTE admite multiples registros por factura.
--
-- ADVERTENCIA:
-- Este script crea las tablas si no existen. No borra ni modifica
-- tablas preexistentes. Si ya tienes tablas con estos nombres,
-- revisa su estructura antes de ejecutarlo.

-- ============================================================
-- 1. USUARIOS, ROLES Y PERMISOS
-- ============================================================

CREATE TABLE IF NOT EXISTS ROL (
    id_rol INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(150) NULL,
    PRIMARY KEY (id_rol),
    CONSTRAINT uq_rol_nombre UNIQUE (nombre)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS PERMISO (
    id_permiso INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    PRIMARY KEY (id_permiso),
    CONSTRAINT uq_permiso_nombre UNIQUE (nombre)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS USUARIO (
    id_usuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_rol INT UNSIGNED NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    contrasena VARCHAR(255) NOT NULL
        COMMENT 'Almacenar hash BCrypt o Argon2, nunca texto plano',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_correo UNIQUE (correo),
    CONSTRAINT uq_usuario_login UNIQUE (usuario),
    INDEX idx_usuario_rol (id_rol),
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES ROL (id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ROL_PERMISO (
    id_rol INT UNSIGNED NOT NULL,
    id_permiso INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    INDEX idx_rol_permiso_permiso (id_permiso),
    CONSTRAINT fk_rol_permiso_rol
        FOREIGN KEY (id_rol)
        REFERENCES ROL (id_rol)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_rol_permiso_permiso
        FOREIGN KEY (id_permiso)
        REFERENCES PERMISO (id_permiso)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. MENU: CATEGORIA Y PRODUCTO
-- ============================================================

CREATE TABLE IF NOT EXISTS CATEGORIA (
    id_categoria INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_categoria),
    CONSTRAINT uq_categoria_nombre UNIQUE (nombre)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS PRODUCTO (
    id_producto INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_categoria INT UNSIGNED NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    precio DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(255) NULL,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_producto),
    INDEX idx_producto_categoria (id_categoria),
    CONSTRAINT chk_producto_precio CHECK (precio >= 0),
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES CATEGORIA (id_categoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. MESAS Y RESERVAS
-- ============================================================

CREATE TABLE IF NOT EXISTS MESA (
    id_mesa INT UNSIGNED NOT NULL AUTO_INCREMENT,
    numero INT UNSIGNED NOT NULL,
    capacidad INT UNSIGNED NOT NULL,
    ubicacion VARCHAR(100) NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    PRIMARY KEY (id_mesa),
    CONSTRAINT uq_mesa_numero UNIQUE (numero),
    CONSTRAINT chk_mesa_capacidad CHECK (capacidad > 0),
    CONSTRAINT chk_mesa_estado
        CHECK (estado IN ('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'INACTIVA'))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS RESERVA (
    id_reserva INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_mesa INT UNSIGNED NOT NULL,
    fecha_hora DATETIME NOT NULL,
    nombre_cliente VARCHAR(100) NOT NULL,
    telefono VARCHAR(25) NULL,
    num_personas INT UNSIGNED NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    PRIMARY KEY (id_reserva),
    INDEX idx_reserva_mesa_fecha (id_mesa, fecha_hora),
    CONSTRAINT chk_reserva_num_personas CHECK (num_personas > 0),
    CONSTRAINT fk_reserva_mesa
        FOREIGN KEY (id_mesa)
        REFERENCES MESA (id_mesa)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. PEDIDOS Y DETALLE DEL PEDIDO
-- ============================================================

CREATE TABLE IF NOT EXISTS PEDIDO (
    id_pedido INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_mesa INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hora_envio_cocina DATETIME NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id_pedido),
    INDEX idx_pedido_mesa (id_mesa),
    INDEX idx_pedido_usuario (id_usuario),
    INDEX idx_pedido_estado_fecha (estado, fecha_hora),
    CONSTRAINT chk_pedido_total CHECK (total >= 0),
    CONSTRAINT chk_pedido_estado
        CHECK (estado IN (
            'PENDIENTE',
            'EN_PREPARACION',
            'LISTO',
            'ENTREGADO',
            'FACTURADO',
            'CANCELADO'
        )),
    CONSTRAINT fk_pedido_mesa
        FOREIGN KEY (id_mesa)
        REFERENCES MESA (id_mesa)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIO (id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS DETALLE_PEDIDO (
    id_detalle INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_pedido INT UNSIGNED NOT NULL,
    id_producto INT UNSIGNED NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    observacion VARCHAR(255) NULL,
    PRIMARY KEY (id_detalle),
    INDEX idx_detalle_pedido (id_pedido),
    INDEX idx_detalle_producto (id_producto),
    CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_precio CHECK (precio_unitario >= 0),
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES PEDIDO (id_pedido)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto)
        REFERENCES PRODUCTO (id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. FACTURACION, PAGOS Y COMPROBANTES
-- ============================================================

CREATE TABLE IF NOT EXISTS FACTURA (
    id_factura INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_pedido INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL
        COMMENT 'Usuario/cajero que emite la factura',
    numero INT UNSIGNED NOT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    impuesto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'EMITIDA',
    PRIMARY KEY (id_factura),
    CONSTRAINT uq_factura_pedido UNIQUE (id_pedido),
    CONSTRAINT uq_factura_numero UNIQUE (numero),
    INDEX idx_factura_usuario (id_usuario),
    CONSTRAINT chk_factura_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_factura_descuento CHECK (descuento >= 0),
    CONSTRAINT chk_factura_impuesto CHECK (impuesto >= 0),
    CONSTRAINT chk_factura_total CHECK (total >= 0),
    CONSTRAINT chk_factura_estado
        CHECK (estado IN ('EMITIDA', 'PAGADA', 'ANULADA')),
    CONSTRAINT fk_factura_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES PEDIDO (id_pedido)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_factura_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIO (id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS PAGO (
    id_pago INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_factura INT UNSIGNED NOT NULL,
    metodo VARCHAR(30) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_pago),
    INDEX idx_pago_factura (id_factura),
    CONSTRAINT chk_pago_monto CHECK (monto > 0),
    CONSTRAINT chk_pago_metodo
        CHECK (metodo IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA')),
    CONSTRAINT fk_pago_factura
        FOREIGN KEY (id_factura)
        REFERENCES FACTURA (id_factura)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS COMPROBANTE (
    id_comprobante INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_factura INT UNSIGNED NOT NULL,
    fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    formato VARCHAR(30) NOT NULL,
    PRIMARY KEY (id_comprobante),
    INDEX idx_comprobante_factura (id_factura),
    CONSTRAINT chk_comprobante_formato
        CHECK (formato IN ('PDF', 'IMPRESO', 'ELECTRONICO')),
    CONSTRAINT fk_comprobante_factura
        FOREIGN KEY (id_factura)
        REFERENCES FACTURA (id_factura)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLAS CREADAS (13):
-- ROL, PERMISO, USUARIO, ROL_PERMISO, CATEGORIA, PRODUCTO,
-- MESA, RESERVA, PEDIDO, DETALLE_PEDIDO, FACTURA, PAGO,
-- COMPROBANTE.
--
-- IMPORTANTE:
-- * Antes de registrar usuarios, debe existir el rol referenciado.
-- * Los importes de pagos deben validarse en el servicio de negocio:
--   la suma de PAGO.monto debe igualar FACTURA.total al completar el pago.
-- * El solapamiento de reservas y las transiciones de estados se validan
--   en la capa de negocio.
-- * La tabla INSUMO se incorporara cuando el inventario entre al alcance.
-- ============================================================
