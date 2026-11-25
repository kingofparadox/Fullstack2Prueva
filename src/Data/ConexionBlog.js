import { DtoBlogSalida, BlogRequest } from '../ContratosApis/ContratoBlog';

const API_URL = 'http://localhost:8080/api/v1/blogs';

async function handleResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const detalles = data?.errors && typeof data.errors === 'object'
            ? Object.values(data.errors).join(', ')
            : '';
        const mensaje = data?.message || (typeof data === 'string' ? data : 'Error en la petición al blog');
        throw new Error(detalles ? `${mensaje}: ${detalles}` : mensaje);
    }

    return data;
}

function formatearFechaLocalDateTime(fecha) {
    if (!fecha) {
        return new Date().toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
    }
    // Si viene como 'YYYY-MM-DD', le agrega hora por defecto para LocalDateTime
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return `${fecha}T00:00:00`;
    }
    return fecha;
}

function construirBlogRequest(payload = {}) {
    const blogData = payload.blog ?? payload;
    const contenidoData = Array.isArray(payload.contenido)
        ? payload.contenido
        : Array.isArray(payload.contenidoJson)
            ? payload.contenidoJson
            : [];

    return new BlogRequest({
        blog: {
            titulo: blogData?.titulo ?? '',
            fecha: formatearFechaLocalDateTime(blogData?.fecha)
        },
        contenido: contenidoData
    });
}

export const blogApi = {
    // 1. Obtener todos los blogs -> GET /api/v1/blogs
    /** @returns {Promise<DtoBlogSalida[]>} */
    async getBlogs() {
        const data = await handleResponse(await fetch(API_URL));
        const lista = Array.isArray(data) ? data : (data?.data || []);
        return lista.map((item) => new DtoBlogSalida(item));
    },

    // 2. Crear un blog -> POST /api/v1/blogs/{correo}
    /** @returns {Promise<DtoBlogSalida>} */
    async createBlog(correo, payload) {
        const identificador = correo?.trim();
        if (!identificador) {
            throw new Error('El correo del autor es obligatorio para crear un blog.');
        }

        const bodyRequest = construirBlogRequest(payload);
        const response = await fetch(`${API_URL}/${encodeURIComponent(identificador)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyRequest)
        });

        const data = await handleResponse(response);
        return new DtoBlogSalida(data);
    },

    // 3. Actualizar un blog -> PUT /api/v1/blogs
    /** @returns {Promise<DtoBlogSalida>} */
    async updateBlog(payload) {
        const bodyRequest = construirBlogRequest(payload);
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyRequest)
        });

        const data = await handleResponse(response);
        return new DtoBlogSalida(data);
    },

    // 4. Eliminar un blog por título -> DELETE /api/v1/blogs/{titulo}
    /** @returns {Promise<string>} */
    async deleteBlog(titulo) {
        if (!titulo) {
            throw new Error('El título del blog es obligatorio para eliminarlo.');
        }

        const response = await fetch(`${API_URL}/${encodeURIComponent(titulo)}`, {
            method: 'DELETE'
        });

        return await handleResponse(response);
    }
};