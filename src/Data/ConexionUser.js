import { DtoUserEntrada, DtoUserSalida, DtoLogin, DtoRol } from '../ContratosApis/ContratosUser';

const API_URL = 'http://localhost:8080/api/v1/usuarios';

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

function extraerDatosGoogle(googlePayload = {}) {
    const correo = String(googlePayload.correo || googlePayload.email || '').trim().toLowerCase();
    const sub = String(googlePayload.sub || '').trim();
    const nombre = String(
        googlePayload.nombre || googlePayload.given_name || googlePayload.name || 'Usuario'
    ).trim();
    const apellido = String(
        googlePayload.apellido || googlePayload.family_name || 'Google'
    ).trim();

    if (!correo || !sub) {
        throw new Error('No se pudieron obtener el correo y el identificador (sub) desde Google.');
    }

    return { correo, nombre, apellido, sub };
}

export const userApi = {
    // ==================== USUARIOS ====================

    /** @returns {Promise<DtoUserSalida[]>} */
    async getUsers() {
        const data = await handleResponse(await fetch(`${API_URL}`));
        return Array.isArray(data) ? data.map(item => new DtoUserSalida(item)) : [];
    },

    /** @param {Object} rawUserData */
    async createUser(rawUserData) {
        const contratoEntrada = new DtoUserEntrada(rawUserData);
        contratoEntrada.validar();

        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contratoEntrada),
        });
        const data = await handleResponse(response);
        return data && typeof data === 'object' ? new DtoUserSalida(data) : data;
    },

    /** @returns {Promise<DtoUserSalida>} */
    async login(correo, password) {
        const contratoLogin = new DtoLogin(correo, password);

        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contratoLogin),
        });
        const data = await handleResponse(response);
        return new DtoUserSalida(data);
    },

async updateUserAdmin(correoActual, datos) {
    const correoLimpio = String(correoActual || '').trim();
    if (!correoLimpio) {
        throw new Error('El correo actual es obligatorio para actualizar al usuario.');
    }

    const cuerpo = {};
    ['nombre', 'apellido', 'rut', 'correo', 'password', 'rol'].forEach((campo) => {
        const valor = datos?.[campo];
        if (typeof valor === 'string' && valor.trim() !== '') {
            cuerpo[campo] = valor.trim();
        }
    });

    if (Object.keys(cuerpo).length === 0) {
        throw new Error('No hay ningún campo para modificar.');
    }

    const response = await fetch(`${API_URL}/admin/${encodeURIComponent(correoLimpio)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
    });
    const data = await handleResponse(response);
    return new DtoUserSalida(data);
},

    // ==================== GOOGLE AUTH ====================

    /**
     * Inicia sesión con el JWT decodificado de Google usando /login (correo + sub).
     * @returns {Promise<DtoUserSalida>}
     */
    async loginWithGoogle(googlePayload) {
        const { correo, sub } = extraerDatosGoogle(googlePayload);
        return await this.login(correo, sub);
    },

    /**
     * Registra un usuario desde Google usando /register (rut en null, correo, nombre, apellido, sub).
     * @returns {Promise<DtoUserSalida>}
     */
   // En ConexionUser.js -> createUserWithGoogle(googlePayload)
async createUserWithGoogle(googlePayload) {
    const { correo, nombre, apellido, sub } = extraerDatosGoogle(googlePayload);
    const payload = {
        rut: null,
        nombre,
        apellido,
        correo,
        password: sub,
        confirmPassword: sub,
        rol: 'cliente'
    };
    console.log('PAYLOAD GOOGLE A ENVIAR:', payload);

    return await this.createUser(payload);
},


    /**
     * Intenta iniciar sesión con Google; si aún no existe en el backend, lo crea automáticamente.
     * @returns {Promise<DtoUserSalida>}
     */
    async autenticarConGoogle(googlePayload) {
        try {
            return await this.loginWithGoogle(googlePayload);
        } catch {
            return await this.createUserWithGoogle(googlePayload);
        }
    },

    /** @returns {Promise<DtoUserSalida>} */
    async updateUser(correoActual, passwordActual, rawNuevosDatos) {
        const params = new URLSearchParams({
            correo: correoActual,
            password: passwordActual
        });
        const contratoEntrada = new DtoUserEntrada(rawNuevosDatos);

        const response = await fetch(`${API_URL}/update?${params.toString()}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contratoEntrada),
        });
        const data = await handleResponse(response);
        return new DtoUserSalida(data);
    },

    async deleteUser(rawUserData) {
        const payload = rawUserData && typeof rawUserData === 'object'
            ? rawUserData
            : { correo: rawUserData };

        const response = await fetch(`${API_URL}/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    // ==================== ROLES ====================

    /** @returns {Promise<DtoRol[]>} */
    async getRoles() {
        const data = await handleResponse(await fetch(`${API_URL}/roles`));
        return Array.isArray(data)
            ? data.map(item => new DtoRol(item?.nombre || item))
            : [];
    },

    async createRol(nombreRol) {
        const contratoRol = new DtoRol(nombreRol);

        const response = await fetch(`${API_URL}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contratoRol),
        });
        return handleResponse(response);
    },

    async updateRol(nombreRol) {
        const contratoRol = new DtoRol(nombreRol);

        const response = await fetch(`${API_URL}/roles`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contratoRol),
        });
        return handleResponse(response);
    },

    async deleteRol(nombreRol) {
        const contratoRol = new DtoRol(nombreRol);

        const response = await fetch(`${API_URL}/roles`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contratoRol),
        });
        return handleResponse(response);
    }
};