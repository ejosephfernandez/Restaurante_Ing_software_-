import { apiRequest } from "../../../services/api.js";

const BASE = "/mesas";

/**
 * Reservas asociadas a una mesa.
 *
 * La consulta GET /mesas/{idMesa}/reservas está identificada en el backend
 * actual. La creación usa el mismo recurso anidado (POST); confirma que tu
 * MesaController tenga ese @PostMapping y que reciba los campos del payload.
 */
export const reservasService = {
  listarPorMesa(idMesa) {
    return apiRequest(`${BASE}/${encodeURIComponent(idMesa)}/reservas`);
  },

  crear(idMesa, reserva) {
    return apiRequest(`${BASE}/${encodeURIComponent(idMesa)}/reservas`, {
      method: "POST",
      body: JSON.stringify(reserva),
    });
  },
};
