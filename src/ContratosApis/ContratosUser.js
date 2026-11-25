/**
 * Equivalente a DtoUserEntrada.java
 */
export class DtoUserEntrada {
    /**
     * @param {Object} data
     * @param {string} data.nombre
     * @param {string} data.apellido
     * @param {string|null} [data.rut]
     * @param {string} data.correo
     * @param {string} data.password
     * @param {string} [data.rol]
     */
    constructor({ nombre, apellido, rut = null, correo, password, rol = 'cliente' }) {
        this.nombre = nombre?.trim() || '';
        this.apellido = apellido?.trim() || '';
        this.rut = rut && String(rut).trim() !== '' ? String(rut).trim() : null;
        this.correo = correo?.trim() || '';
        this.password = password || '';
        this.rol = rol?.trim() || 'cliente';
    }

    // Validación rápida en frontend antes de gastar una petición HTTP (rut es opcional para Google)
    validar() {
        if (!this.nombre || !this.apellido || !this.correo || !this.password) {
            throw new Error('Todos los campos obligatorios (nombre, apellido, correo, password) deben estar completos.');
        }
    }
}

/**
 * Equivalente a DtoUserSalida.java
 */
export class DtoUserSalida {
    /**
     * @param {Object} data
     * @param {string} data.nombreCompleto
     * @param {string|null} [data.rut]
     * @param {string} data.correo
     * @param {string} data.rol
     */
    constructor({ nombreCompleto, rut = null, correo, rol }) {
        this.nombreCompleto = nombreCompleto;
        this.rut = rut ?? null;
        this.correo = correo;
        this.rol = rol;
    }
}

/**
 * Equivalente a DtoLogin.java
 */
export class DtoLogin {
    constructor(correo, password) {
        this.correo = correo?.trim() || '';
        this.password = password || '';
    }
}

/**
 * Equivalente a DtoRol.java
 */
export class DtoRol {
    constructor(nombre) {
        this.nombre = nombre?.trim() || '';
    }
}