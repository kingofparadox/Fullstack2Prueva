import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { userApi } from '../Data/ConexionUser'

function Registro() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        rut: '',
        nombre: '',
        apellido: '',
        correo: '',
        confirmarCorreo: '',
        password: '',
        confirmarPassword: ''
    })

    const [errors, setErrors] = useState({})
    const [mensajeExito, setMensajeExito] = useState(false)
    const [enviando, setEnviando] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const validarFormularioManual = () => {
        const nuevosErrores = {}

        if (!formData.rut.trim()) {
            nuevosErrores.rut = 'El RUT es requerido.'
        } else if (!/^[0-9]{7,8}-[0-9kK]$/.test(formData.rut.trim())) {
            nuevosErrores.rut = 'Ingresa un RUT válido sin puntos y con guión (ej: 12345678-9).'
        }

        if (!formData.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es requerido.'
        } else if (formData.nombre.length > 100) {
            nuevosErrores.nombre = 'El nombre no puede superar los 100 caracteres.'
        }

        if (!formData.apellido.trim()) {
            nuevosErrores.apellido = 'El apellido es requerido.'
        } else if (formData.apellido.length > 100) {
            nuevosErrores.apellido = 'El apellido no puede superar los 100 caracteres.'
        }

        if (!formData.correo.trim()) {
            nuevosErrores.correo = 'El correo es requerido.'
        } else if (formData.correo.length > 100) {
            nuevosErrores.correo = 'El correo no puede superar los 100 caracteres.'
        } else {
            const dominiosValidos = ['@duoc.cl', '@profesor.duoc.cl', '@gmail.com']
            const esValido = dominiosValidos.some((dominio) =>
                formData.correo.trim().toLowerCase().endsWith(dominio)
            )
            if (!esValido) {
                nuevosErrores.correo = 'Solo se permiten correos @duoc.cl, @profesor.duoc.cl y @gmail.com.'
            }
        }

        if (!formData.confirmarCorreo.trim()) {
            nuevosErrores.confirmarCorreo = 'Debe confirmar el correo electrónico.'
        } else if (formData.correo.trim() !== formData.confirmarCorreo.trim()) {
            nuevosErrores.confirmarCorreo = 'Los correos electrónicos no coinciden.'
        }

        if (!formData.password) {
            nuevosErrores.password = 'La contraseña es requerida.'
        } else if (formData.password.length < 4 || formData.password.length > 20) {
            nuevosErrores.password = 'La contraseña debe tener entre 4 y 20 caracteres.'
        }

        if (!formData.confirmarPassword) {
            nuevosErrores.confirmarPassword = 'Debe confirmar la contraseña.'
        } else if (formData.password !== formData.confirmarPassword) {
            nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden.'
        }

        return nuevosErrores
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const nuevosErrores = validarFormularioManual()
        setErrors(nuevosErrores)

        if (Object.keys(nuevosErrores).length === 0) {
            try {
                setEnviando(true)
                setErrors({})

                const datosParaEnviar = {
                    rut: formData.rut.trim(),
                    nombre: formData.nombre.trim(),
                    apellido: formData.apellido.trim(),
                    correo: formData.correo.trim(),
                    password: formData.password,
                    rol: 'cliente'
                }

                const respuesta = await userApi.createUser(datosParaEnviar)

                if (respuesta) {
                    setMensajeExito(true)
                    setTimeout(() => {
                        navigate('/login')
                    }, 1500)
                }
            } catch (error) {
                console.error('Error al registrar usuario:', error)
                setErrors({
                    general: error.message || 'Ocurrió un error al registrar el usuario.'
                })
                setMensajeExito(false)
            } finally {
                setEnviando(false)
            }
        } else {
            setMensajeExito(false)
        }
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            if (!credentialResponse?.credential) {
                throw new Error('Google no devolvió un token válido.')
            }

            const decoded = jwtDecode(credentialResponse.credential)
            if (!decoded?.email || !decoded?.sub) {
                throw new Error('No se pudieron obtener el correo y el ID (sub) desde Google.')
            }

            setEnviando(true)
            setErrors({})

            // No pasa por validarFormularioManual() porque no hay RUT, confirmación ni límite de 20 chars en sub
            const respuesta = await userApi.createUserWithGoogle(decoded)
            if (respuesta) {
                setMensajeExito(true)
                setTimeout(() => {
                    navigate('/login')
                }, 1500)
            }
        } catch (error) {
            console.error('Error en registro con Google:', error)
            setErrors({
                general: error.message || 'No se pudo completar el registro con Google.'
            })
            setMensajeExito(false)
        } finally {
            setEnviando(false)
        }
    }

    const handleGoogleError = () => {
        setErrors({
            general: 'El registro con Google fue cancelado o falló.'
        })
        setMensajeExito(false)
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card shadow-lg border-secondary p-4" style={{ backgroundColor: '#fce4ec' }}>
                        <h2 className="text-center fw-bold mb-4" style={{ color: '#5d4037' }}>Registro de Usuario</h2>

                        {mensajeExito && (
                            <div className="alert alert-success text-center" role="alert">
                                ¡Registro exitoso! Redirigiendo al login...
                            </div>
                        )}

                        {errors.general && (
                            <div className="alert alert-danger text-center" role="alert">
                                {errors.general}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>

                            {/* Campo RUT */}
                            <div className="mb-3">
                                <label className="form-label fw-bold" style={{ color: '#5d4037' }}>RUT</label>
                                <input
                                    type="text"
                                    name="rut"
                                    value={formData.rut}
                                    onChange={handleChange}
                                    className={`form-control border-secondary ${errors.rut ? 'is-invalid' : ''}`}
                                    placeholder="Ej: 12345678-9"
                                />
                                {errors.rut && <div className="invalid-feedback">{errors.rut}</div>}
                            </div>

                            {/* Campo Nombre y Apellido */}
                            <div className="row g-2 mb-3">
                                <div className="col-12 col-md-6">
                                    <label className="form-label fw-bold" style={{ color: '#5d4037' }}>Nombre</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        className={`form-control border-secondary ${errors.nombre ? 'is-invalid' : ''}`}
                                        placeholder="Ingresa tu nombre"
                                    />
                                    {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label fw-bold" style={{ color: '#5d4037' }}>Apellido</label>
                                    <input
                                        type="text"
                                        name="apellido"
                                        value={formData.apellido}
                                        onChange={handleChange}
                                        className={`form-control border-secondary ${errors.apellido ? 'is-invalid' : ''}`}
                                        placeholder="Ingresa tu apellido"
                                    />
                                    {errors.apellido && <div className="invalid-feedback">{errors.apellido}</div>}
                                </div>
                            </div>

                            {/* Campo Correo */}
                            <div className="mb-3">
                                <label className="form-label fw-bold" style={{ color: '#5d4037' }}>Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="correo"
                                    value={formData.correo}
                                    onChange={handleChange}
                                    className={`form-control border-secondary ${errors.correo ? 'is-invalid' : ''}`}
                                    placeholder="usuario@duoc.cl o @gmail.com"
                                />
                                {errors.correo && <div className="invalid-feedback">{errors.correo}</div>}
                            </div>

                            {/* Campo Confirmar Correo */}
                            <div className="mb-3">
                                <label className="form-label fw-bold" style={{ color: '#5d4037' }}>Confirmar Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="confirmarCorreo"
                                    value={formData.confirmarCorreo}
                                    onChange={handleChange}
                                    className={`form-control border-secondary ${errors.confirmarCorreo ? 'is-invalid' : ''}`}
                                    placeholder="Repite tu correo"
                                />
                                {errors.confirmarCorreo && <div className="invalid-feedback">{errors.confirmarCorreo}</div>}
                            </div>

                            {/* Campo Contraseña */}
                            <div className="mb-3">
                                <label className="form-label fw-bold" style={{ color: '#5d4037' }}>Contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`form-control border-secondary ${errors.password ? 'is-invalid' : ''}`}
                                    placeholder="********"
                                />
                                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                            </div>

                            {/* Campo Confirmar Contraseña */}
                            <div className="mb-4">
                                <label className="form-label fw-bold" style={{ color: '#5d4037' }}>Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    name="confirmarPassword"
                                    value={formData.confirmarPassword}
                                    onChange={handleChange}
                                    className={`form-control border-secondary ${errors.confirmarPassword ? 'is-invalid' : ''}`}
                                    placeholder="Repite tu contraseña"
                                />
                                {errors.confirmarPassword && <div className="invalid-feedback">{errors.confirmarPassword}</div>}
                            </div>

                            {/* Botón normal */}
                            <button
                                type="submit"
                                disabled={enviando}
                                className="btn w-100 text-white fw-bold py-2"
                                style={{ backgroundColor: '#5d4037', border: '1px solid #fce4ec' }}
                            >
                                {enviando ? 'Registrando...' : 'Registrar'}
                            </button>

                            <div className="d-flex align-items-center my-3">
                                <hr className="flex-grow-1 my-0" />
                                <span className="px-2 small text-muted fw-semibold">O</span>
                                <hr className="flex-grow-1 my-0" />
                            </div>

                            {/* Botón Google */}
                            <div className="d-flex justify-content-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    theme="outline"
                                    size="large"
                                    text="signup_with"
                                    shape="rectangular"
                                />
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Registro