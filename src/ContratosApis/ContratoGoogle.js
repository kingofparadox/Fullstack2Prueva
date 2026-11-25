export class DtoGoogleAuth {
    constructor({ correo = '', nombre = '', apellido = '', sub = '' } = {}) {
        this.correo = String(correo || '').trim();
        this.nombre = String(nombre || '').trim();
        this.apellido = String(apellido || '').trim();
        this.sub = String(sub || '').trim();
    }

    static fromGoogleJwt(payload = {}) {
        return new DtoGoogleAuth({
            correo: payload.email || '',
            nombre: payload.given_name || payload.name || 'Usuario',
            apellido: payload.family_name || 'Google',
            sub: payload.sub || ''
        });
    }
}