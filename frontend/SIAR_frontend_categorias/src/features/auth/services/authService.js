import { apiRequest } from "../../../services/api.js";

export const authService = {
    // POST: Iniciar sesión. "usuario" acepta el nombre de usuario o el correo.
    // Respuesta: { token, tipo, expiraEn, idUsuario, nombre, usuario, rol, permisos }
    login: (usuario, contrasena) =>
        apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ usuario, contrasena }),
            autenticado: false
        }),

    // GET: Datos del usuario dueño del token
    perfil: () =>
        apiRequest("/auth/me")
};
