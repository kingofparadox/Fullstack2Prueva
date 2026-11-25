export class DtoProductoPedido {
    /**
     * @param {Object} data
     * @param {string} [data.nameprodcuto]
     * @param {string} [data.nombreProducto]
     * @param {string} [data.producto]
     * @param {string} [data.nombre]
     * @param {number} data.cantidad
     */
    constructor(data = {}) {
        const nombreResuelto =
            data.nameprodcuto ??
            data.nombreProducto ??
            data.producto ??
            data.nombre ??
            '';

        this.nameprodcuto = String(nombreResuelto).trim();
        this.cantidad = Number(data.cantidad) || 0;
    }

    validar() {
        if (!this.nameprodcuto) {
            throw new Error('El nombre del producto es obligatorio en el pedido.');
        }
        if (!Number.isInteger(this.cantidad) || this.cantidad < 1) {
            throw new Error(`La cantidad para "${this.nameprodcuto}" debe ser al menos 1.`);
        }
    }
}

/**
 * Equivalente a DtoDetalleBoleta.java
 * Normaliza las claves que devuelve el backend ("producto", "precio Unitario", "cantidad")
 * manteniendo los nombres estándar del contrato.
 */
export class DtoDetalleBoleta {
    /**
     * @param {Object} data
     * @param {string} [data.nombreProducto]
     * @param {string} [data.producto]
     * @param {string} [data.nameprodcuto]
     * @param {string} [data.nombre]
     * @param {number} [data.cantidad]
     * @param {number} [data.precioUnitario]
     * @param {number} [data['precio Unitario']]
     * @param {number} [data.precio]
     */
    constructor(data = {}) {
        const nombreResuelto =
            data.nombreProducto ??
            data.producto ??
            data.nameprodcuto ??
            data.nombre ??
            '';

        const precioResuelto =
            data.precioUnitario ??
            data['precio Unitario'] ??
            data.precio ??
            0;

        this.nombreProducto = String(nombreResuelto).trim();
        this.cantidad = Number(data.cantidad) || 0;
        this.precioUnitario = Number(precioResuelto) || 0;
    }

    get subtotal() {
        return this.cantidad * this.precioUnitario;
    }
}

/**
 * Equivalente a DtoBoletas.java
 */
export class DtoBoletas {
    /**
     * @param {Object} data
     * @param {Array<Object>} [data.productos]
     * @param {Object|null} [data.usuario]
     * @param {string} [data.fecha]
     * @param {number} [data.total]
     * @param {number|null} [data.id]
     */
    constructor({ productos, usuario, fecha, total, id } = {}) {
        this.id = id ?? null;
        this.usuario = usuario ?? null;
        this.fecha = fecha ?? '';
        this.productos = Array.isArray(productos)
            ? productos.map((item) => new DtoDetalleBoleta(item))
            : [];

        const totalCalculado = this.productos.reduce((acc, p) => acc + p.subtotal, 0);
        this.total = total !== undefined && total !== null ? Number(total) : totalCalculado;
    }

    validar() {
        if (!this.usuario) {
            throw new Error('Debe tener un usuario.');
        }
        if (!this.fecha) {
            throw new Error('Fecha obligatoria.');
        }
        if (this.total < 500) {
            throw new Error('Ningún producto/boleta puede valer menos de 500.');
        }
    }

    get fechaFormateada() {
        if (!this.fecha) return '';
        return new Date(this.fecha).toLocaleString('es-CL');
    }

    get nombreUsuario() {
        if (!this.usuario) return 'Sin usuario';
        return (
            this.usuario.nombre ||
            this.usuario.correo ||
            this.usuario.email ||
            this.usuario.rut ||
            'Usuario'
        );
    }
}

/**
 * Helper para transformar los ítems del carrito de React en List<DtoProductoPedido>
 * listo para enviar al endpoint de creación de boletas.
 *
 * @param {Array<Object>} itemsCarrito
 * @returns {DtoProductoPedido[]}
 */
export function construirPedidoBoleta(itemsCarrito = []) {
    if (!Array.isArray(itemsCarrito) || itemsCarrito.length === 0) {
        throw new Error('El carrito está vacío, no se puede generar la boleta.');
    }

    const totalCarrito = itemsCarrito.reduce(
        (acc, item) => acc + (Number(item.precio) || 0) * (Number(item.cantidad) || 0),
        0
    );

    if (totalCarrito < 500) {
        throw new Error('El monto total de la compra no puede ser menor a $500.');
    }

    return itemsCarrito.map((item) => {
        const pedido = new DtoProductoPedido({
            nameprodcuto: item.nombre || item.nombreProducto || item.producto || item.nameprodcuto,
            cantidad: item.cantidad,
        });
        pedido.validar();
        return pedido;
    });
}