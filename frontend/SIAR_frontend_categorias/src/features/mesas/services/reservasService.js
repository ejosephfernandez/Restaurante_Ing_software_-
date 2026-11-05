import { apiRequest } from "../../../services/api.js";

const BASE = "/mesas";

export const reservasService = {
  listarPorMesa(idMesa) {
    return apiRequest(`${BASE}/${encodeURIComponent(idMesa)}/reservas`);
  },

  crear(idMesa, reserva) {
    return apiRequest(`/reservas`, {
      method: "POST",
      body: JSON.stringify({
        ...reserva, // Pasa fecha, nombre, teléfono, etc.
        mesa: {
          idMesa: idMesa //  Aquí construimos el objeto anidado que espera Java
        }
      }),
    });
  },
};