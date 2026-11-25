export class Categoria {
    /**
     * @param {Object} data
     * @param {string} data.nombre
     */
    constructor({ nombre } = {}) {
        this.nombre = nombre?.trim() || '';
    }
}

export class DtoProducto {
    /**
     * @param {Object} data
     * @param {string} data.nombre
     * @param {string} data.codigoBarras
     * @param {number} data.precio
     * @param {number} data.oferta
     * @param {number} [data.Stok]
     * @param {number} [data.stock]
     * @param {string[]} data.path
     * @param {string} [data.Categoria]
     * @param {string} [data.categoria]
     */
    constructor({ Categoria, categoria, nombre, codigoBarras, precio, oferta, Stok, stock, path } = {}) {
        this.nombre = nombre?.trim() ?? "";
        this.codigoBarras = codigoBarras?.trim() ?? "";
        this.precio = Number(precio) || 0;
        this.oferta = Number(oferta) || 0;
        // Acepta ambos en JS, pero lo serializa exactamente como lo espera Java (Stok y Categoria)
        this.Stok = Number(Stok ?? stock) || 0;
        this.path = Array.isArray(path) ? path : [];
        this.Categoria = (Categoria ?? categoria)?.trim() ?? "";
    }
}

export class DtoPedido {
    /**
     * @param {Object} data
     * @param {string} data.nameprodcuto
     * @param {number} data.cantidad
     */
    constructor({ nameprodcuto, nameproducto, cantidad } = {}) {
        // Mantiene compatibilidad con el typo 'nameprodcuto' de tu BoletasService
        this.nameprodcuto = (nameprodcuto ?? nameproducto)?.trim() || "";
        this.cantidad = Number(cantidad) || 1;
    }
}