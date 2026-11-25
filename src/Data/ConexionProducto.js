import { DtoProducto, Categoria } from '../ContratosApis/ContratoProductos';

const API_URL = 'http://localhost:8080/api/v1';

async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const detalles = data?.errors ? Object.values(data.errors).join(', ') : '';
        const mensaje = data?.message || (typeof data === 'string' ? data : 'Error en la petición');
        throw new Error(detalles ? `${mensaje}: ${detalles}` : mensaje);
    }

    return data;
}

// Normaliza datos antiguos de React (cBarras, imagen string) al formato DtoProductoEntrada
function normalizarProducto(raw) {
    const rutasImagen = Array.isArray(raw.path)
        ? raw.path
        : raw.imagen
            ? [raw.imagen]
            : raw.imagenPath
                ? [raw.imagenPath]
                : [];

    return new DtoProducto({
        nombre: raw.nombre,
        codigoBarras: raw.codigoBarras || raw.cBarras || raw.Cbarras || '',
        precio: raw.precio,
        oferta: raw.oferta ?? 0, // Evita fallo por @Min(500) o nullable=false en BD
        Stok: raw.Stok ?? raw.stock,
        path: rutasImagen,
        Categoria: raw.Categoria || raw.categoria || ''
    });
}

export const productApi = {
    // ==================== ENDPOINTS DE PRODUCTOS ====================

    // 1. Obtener todos los productos -> GET /api/v1/productos
    /** @returns {Promise<DtoProducto[]>} */
    async getProducts() {
        const data = await handleResponse(await fetch(`${API_URL}/productos`));
        return data.map(item => new DtoProducto(item));
    },

    // 2. Obtener productos por categoría -> GET /api/v1/productos/categoria/{categoria}
    /** @returns {Promise<DtoProducto[]>} */
    async getProductsByCategory(categoria) {
        const data = await handleResponse(
            await fetch(`${API_URL}/productos/categoria/${encodeURIComponent(categoria)}`)
        );
        return data.map(item => new DtoProducto(item));
    },

    // 3. Crear Producto -> POST /api/v1/productos
    /** @returns {Promise<DtoProducto>} */
    async createProduct(productData) {
        const contrato = normalizarProducto(productData);
        const response = await fetch(`${API_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contrato),
        });
        const data = await handleResponse(response);
        return new DtoProducto(data);
    },

    // 4. Actualizar Producto -> PUT /api/v1/productos
    /** @returns {Promise<DtoProducto>} */
    async updateProduct(productData) {
        const contrato = normalizarProducto(productData);
        const response = await fetch(`${API_URL}/productos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contrato),
        });
        const data = await handleResponse(response);
        return new DtoProducto(data);
    },

    // 5. Eliminar Producto -> DELETE /api/v1/productos
    async deleteProduct(productData) {
        const contrato = normalizarProducto(productData);
        const response = await fetch(`${API_URL}/productos`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contrato),
        });
        return handleResponse(response); // Devuelve el String de confirmación
    },

    // ==================== ENDPOINTS DE CATEGORÍAS ====================

    // 6. Obtener todas las categorías -> GET /api/v1/categorias
    /** @returns {Promise<Categoria[]>} */
    async getCategories() {
        const data = await handleResponse(await fetch(`${API_URL}/categorias`));
        return data.map(item => new Categoria(typeof item === 'string' ? { nombre: item } : item));
    },

    // 7. Buscar categoría por nombre -> GET /api/v1/categorias/{nombre}
    /** @returns {Promise<Categoria>} */
    async getCategoryByName(nombre) {
        const data = await handleResponse(
            await fetch(`${API_URL}/categorias/${encodeURIComponent(nombre)}`)
        );
        return new Categoria(data);
    },

    // 8. Crear Categoría -> POST /api/v1/categorias
    async createCategory(nombreCategoria) {
        const contrato = new Categoria({ nombre: nombreCategoria });
        const response = await fetch(`${API_URL}/categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contrato),
        });
        return handleResponse(response); // Devuelve String
    },

    // 9. Actualizar Categoría -> PUT /api/v1/categorias/{viejo}
    async updateCategory(nombreAnterior, nuevoNombre) {
        const contrato = new Categoria({ nombre: nuevoNombre });
        const response = await fetch(`${API_URL}/categorias/${encodeURIComponent(nombreAnterior)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contrato),
        });
        return handleResponse(response);
    },

    // 10. Eliminar Categoría -> DELETE /api/v1/categorias/{nombre}
    async deleteCategory(nombreCategoria) {
        const response = await fetch(`${API_URL}/categorias/${encodeURIComponent(nombreCategoria)}`, {
            method: 'DELETE',
        });
        return handleResponse(response); // Devuelve String
    }
}