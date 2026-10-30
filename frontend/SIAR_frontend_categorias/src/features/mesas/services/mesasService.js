import { apiRequest } from "../../../services/api.js";

const BASE = "/mesas";

export const mesasService = {
  listar() {
    return apiRequest(BASE);
  },

  obtenerPorId(id) {
    return apiRequest(`${BASE}/${encodeURIComponent(id)}`);
  },

  crear(mesa) {
    return apiRequest(BASE, {
      method: "POST",
      body: JSON.stringify(mesa),
    });
  },

  actualizar(id, mesa) {
    return apiRequest(`${BASE}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(mesa),
    });
  },

  cambiarEstado(id, nuevoEstado) {
    const estado = encodeURIComponent(nuevoEstado);
    return apiRequest(`${BASE}/${encodeURIComponent(id)}/estado?nuevoEstado=${estado}`, {
      method: "PUT",
    });
  },

  consultarDisponibilidad(id) {
    return apiRequest(`${BASE}/${encodeURIComponent(id)}/disponible`);
  },
};
