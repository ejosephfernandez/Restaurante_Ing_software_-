-- ============================================================
-- SIAR - Usuarios de prueba (solo para desarrollo)
-- Ejecutar despues de "Script DML roles SIAR.sql" y de haber
-- arrancado el backend una vez (para que exista el usuario admin,
-- ver README seccion 15 "Usuario administrador inicial").
--
-- Crea un usuario por rol operativo: mesero, cajero y cocinero.
-- Reutilizan el hash BCrypt de la contrasena del admin, por lo que
-- inician sesion con LA MISMA CONTRASENA DEL ADMIN.
--
-- Se usan en la coleccion de Postman de pedidos y facturacion.
-- Es seguro ejecutarlo varias veces: no duplica usuarios.
-- ============================================================

INSERT INTO USUARIO (id_rol, nombre, correo, usuario, contrasena, activo)
SELECT r.id_rol, 'Mesero Prueba', 'mesero@siar.local', 'mesero', a.contrasena, TRUE
FROM ROL r
JOIN USUARIO a ON a.usuario = 'admin'
WHERE r.nombre = 'MESERO'
  AND NOT EXISTS (SELECT 1 FROM USUARIO WHERE usuario = 'mesero');

INSERT INTO USUARIO (id_rol, nombre, correo, usuario, contrasena, activo)
SELECT r.id_rol, 'Cajero Prueba', 'cajero@siar.local', 'cajero', a.contrasena, TRUE
FROM ROL r
JOIN USUARIO a ON a.usuario = 'admin'
WHERE r.nombre = 'CAJERO'
  AND NOT EXISTS (SELECT 1 FROM USUARIO WHERE usuario = 'cajero');

INSERT INTO USUARIO (id_rol, nombre, correo, usuario, contrasena, activo)
SELECT r.id_rol, 'Cocinero Prueba', 'cocinero@siar.local', 'cocinero', a.contrasena, TRUE
FROM ROL r
JOIN USUARIO a ON a.usuario = 'admin'
WHERE r.nombre = 'COCINERO'
  AND NOT EXISTS (SELECT 1 FROM USUARIO WHERE usuario = 'cocinero');
