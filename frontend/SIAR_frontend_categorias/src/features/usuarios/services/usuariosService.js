import { apiRequest } from "../../../services/api.js";

// Gestión de usuarios (HU01-HU04). Todos los endpoints son solo de administrador.
const BASE = "/usuarios";

const ruta = (id, sufijo = "") => `${BASE}/${encodeURIComponent(id)}${sufijo}`;

export const usuariosService = {
    listar() {
        return apiRequest(BASE);
    },

    listarRoles() {
        return apiRequest(`${BASE}/roles`);
    },

    // { nombre, correo, usuario, contrasena, rol }
    crear(usuario) {
        return apiRequest(BASE, {
            method: "POST",
            body: JSON.stringify(usuario)
        });
    },

    // { nombre, correo, usuario }
    actualizar(id, datos) {
        return apiRequest(ruta(id), {
            method: "PUT",
            body: JSON.stringify(datos)
        });
    },

    cambiarRol(id, rol) {
        return apiRequest(ruta(id, "/rol"), {
            method: "PATCH",
            body: JSON.stringify({ rol })
        });
    },

    cambiarEstado(id, activo) {
        return apiRequest(ruta(id, "/estado"), {
            method: "PATCH",
            body: JSON.stringify({ activo })
        });
    },

    restablecerContrasena(id, contrasena) {
        return apiRequest(ruta(id, "/contrasena"), {
            method: "PATCH",
            body: JSON.stringify({ contrasena })
        });
    }
};
