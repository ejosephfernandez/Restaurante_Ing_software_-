const configuredBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const endpoint = `${configuredBase}/api/categorias`;

async function request(path = '', options = {}) {
  let response;
  try {
    response = await fetch(`${endpoint}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Accept: 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'No se pudo conectar con la API. Comprueba que Spring Boot esté ejecutándose en http://localhost:8080.',
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        detail = data.message || data.error || data.detail || '';
      } else {
        detail = (await response.text()).slice(0, 300);
      }
    } catch {
      // Puede que la respuesta de error no tenga un cuerpo legible.
    }

    const messages = {
      400: 'La solicitud no es válida.',
      401: 'La API requiere autenticación.',
      403: 'No tienes permiso para realizar esta operación.',
      404: 'No se encontró el recurso solicitado.',
      409: 'La operación entra en conflicto con los datos existentes.',
      500: 'El backend encontró un error al procesar la solicitud.',
    };
    throw new Error(detail || messages[response.status] || `Error HTTP ${response.status}.`);
  }

  if (response.status === 204) return null;
  if (response.status === 200 || response.status === 201) {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  return null;
}

export const categoriasApi = {
  listar: () => request(),
  listarActivas: () => request('/activas'),
  obtenerPorId: (id) => request(`/${id}`),
  crear: (categoria) => request('', { method: 'POST', body: JSON.stringify(categoria) }),
  actualizar: (id, categoria) => request(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoria),
  }),
  desactivar: (id) => request(`/${id}`, { method: 'DELETE' }),
};
