import { DtoUserSalida } from './ContratosUser.js';

export class DtoContenido {
    /**
     * @param {Object} data
     * @param {string} data.tipo
     * @param {string} data.contenido
     */
    constructor({ tipo, contenido } = {}) {
        this.tipo = tipo?.trim() ?? '';
        this.contenido = contenido ?? '';
    }
}

export class DtoBlogEntrada {
    /**
     * @param {Object} data
     * @param {string} data.titulo
     * @param {string} data.fecha
     */
    constructor({ titulo, fecha } = {}) {
        this.titulo = titulo?.trim() ?? '';
        this.fecha = fecha ?? '';
    }
}

export class BlogRequest {
    /**
     * @param {Object} data
     * @param {DtoBlogEntrada|Object} data.blog
     * @param {Array<DtoContenido|Object>} data.contenido
     */
    constructor({ blog, contenido } = {}) {
        this.blog = new DtoBlogEntrada(blog);
        this.contenido = Array.isArray(contenido)
            ? contenido.map((item) => new DtoContenido(item))
            : [];
    }
}

export class DtoBlogSalida {
    /**
     * @param {Object} data
     * @param {string} data.titulo
     * @param {DtoUserSalida|Object|null} data.autor
     * @param {string} data.fecha
     * @param {Array<DtoContenido|Object>} data.contenidoJson
     */
    constructor({ titulo, autor, fecha, contenidoJson, contenido } = {}) {
        this.titulo = titulo ?? '';
        this.autor = autor ? new DtoUserSalida(autor) : null;
        this.fecha = fecha ?? '';

        const rawBloques = Array.isArray(contenidoJson)
            ? contenidoJson
            : Array.isArray(contenido)
                ? contenido
                : [];

        this.contenidoJson = rawBloques.map((bloque) => new DtoContenido(bloque));
    }

    // Extrae automáticamente la URL de portada para la tarjeta
    get portada() {
        const bloque = this.contenidoJson.find(b => b.tipo.toLowerCase() === 'portada');
        return bloque ? bloque.contenido : '/img/placeholder-blog.jpg';
    }

    // Extrae el texto de resumen para la tarjeta
    get resumen() {
        const bloque = this.contenidoJson.find(b => b.tipo.toLowerCase() === 'resumen');
        return bloque ? bloque.contenido : '';
    }

}