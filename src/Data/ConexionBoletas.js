import { DtoBoletas, construirPedidoBoleta } from '../ContratosApis/ContratoBoleta';

const API_URL = 'http://localhost:8080/api/v1/boletas';

async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const detalles = data?.errors ? Object.values(data.errors).join(', ') : '';
        const mensaje = data?.message || (typeof data === 'string' ? data : 'Error en la petición de boletas');
        throw new Error(detalles ? `${mensaje}: ${detalles}` : mensaje);
    }

    return data;
}

export const boletaApi = {
    /**
     * Crea una boleta para el usuario indicado por correo a partir de los ítems del carrito.
     * POST /api/v1/boletas/{correo}
     */
    async createBoleta(correo, itemsCarrito) {
        const correoLimpio = String(correo || '').trim();
        if (!correoLimpio) {
            throw new Error('El correo del usuario es obligatorio para generar la boleta.');
        }

        const pedidoNormalizado = construirPedidoBoleta(itemsCarrito);

        const response = await fetch(`${API_URL}/${encodeURIComponent(correoLimpio)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoNormalizado),
        });

        const data = await handleResponse(response);
        return new DtoBoletas(data);
    },

    /**
     * Lista todas las boletas registradas.
     * GET /api/v1/boletas
     */
    async getBoletas() {
        const data = await handleResponse(await fetch(`${API_URL}`));
        return Array.isArray(data) ? data.map((item) => new DtoBoletas(item)) : [];
    },

    /**
     * Lista las boletas asociadas al correo de un usuario.
     * GET /api/v1/boletas/usuario/{correo}
     */
    async getBoletasByUsuario(correo) {
        const correoLimpio = String(correo || '').trim();
        if (!correoLimpio) {
            throw new Error('El correo es obligatorio para consultar las boletas del usuario.');
        }

        const data = await handleResponse(
            await fetch(`${API_URL}/usuario/${encodeURIComponent(correoLimpio)}`)
        );
        return Array.isArray(data) ? data.map((item) => new DtoBoletas(item)) : [];
    },

    /**
     * Elimina una boleta por su ID.
     * DELETE /api/v1/boletas/{id}
     */
    async deleteBoleta(id) {
        if (id === undefined || id === null || id === '') {
            throw new Error('El ID de la boleta es obligatorio para eliminarla.');
        }

        const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });

        return handleResponse(response);
    },
};