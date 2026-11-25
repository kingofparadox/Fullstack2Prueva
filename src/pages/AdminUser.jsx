import { useState, useEffect } from 'react'
import { userApi } from '../Data/ConexionUser'
import { useNavigate } from 'react-router-dom'

function AdminUser() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [rolesDisponibles, setRolesDisponibles] = useState([])
  const [seleccionado, setSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    rol: 'usuario',
    correo: '',
    password: ''
  })

  // Divide "Jhonfran Pardo Blas" -> { nombre: "Jhonfran", apellido: "Pardo Blas" }
  const dividirNombreCompleto = (nombreCompleto = '') => {
    const partes = nombreCompleto.trim().split(/\s+/)
    const nombre = partes[0] || ''
    const apellido = partes.slice(1).join(' ') || ''
    return { nombre, apellido }
  }

  const cargarDatos = async () => {
    try {
      const [datosUsuarios, datosRoles] = await Promise.all([
        userApi.getUsers(),
        userApi.getRoles()
      ])
      setUsuarios(datosUsuarios)
      setRolesDisponibles(datosRoles)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleSelectRow = (usuario) => {
    setSeleccionado(usuario)
    const { nombre, apellido } = dividirNombreCompleto(usuario.nombreCompleto)

    setFormData({
      nombre,
      apellido,
      rut: usuario.rut || '',
      rol: usuario.rol || 'usuario',
      correo: usuario.correo || '',
      password: '' // El backend no devuelve la contraseña
    })
  }

  const handleLimpiar = () => {
    setSeleccionado(null)
    setFormData({
      nombre: '',
      apellido: '',
      rut: '',
      rol: rolesDisponibles[0]?.nombre || 'usuario',
      correo: '',
      password: ''
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Al crear la contraseña es obligatoria; al editar es opcional (vacía = se conserva)
    if (!seleccionado && formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (seleccionado && formData.password && formData.password.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    try {
      if (seleccionado) {
        // Correo ACTUAL = el del usuario seleccionado en la tabla.
        // Solo se envían los campos con valor; el resto se conserva en el backend.
        await userApi.updateUserAdmin(seleccionado.correo, formData)
        alert('¡Usuario modificado con éxito!')
      } else {
        await userApi.createUser(formData)
        alert('¡Usuario creado con éxito!')
      }

      await cargarDatos()
      handleLimpiar()
    } catch (error) {
      console.error('Error al guardar el usuario:', error)
      alert(`Ocurrió un error: ${error.message || 'Error en la solicitud'}`)
    }
  }

  const handleEliminar = async () => {
    if (!seleccionado) return

    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar al usuario ${seleccionado.nombreCompleto}?`
    )

    if (confirmar) {
      try {
        // Se usa el correo del seleccionado, no el del formulario (que pudo editarse)
        await userApi.deleteUser({ correo: seleccionado.correo })
        alert('¡Usuario eliminado con éxito!')
        await cargarDatos()
        handleLimpiar()
      } catch (error) {
        console.error('Error al eliminar usuario:', error)
        alert(`No se pudo eliminar el usuario: ${error.message || 'Error de red'}`)
      }
    }
  }

  return (
    <div className="w-100 pb-5 overflow-hidden">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 text-dark fw-bold text-uppercase">Gestión de Usuarios</h2>
        <button
          onClick={() => navigate('/admin')}
          className="btn btn-outline-dark fw-bold shadow-sm"
          style={{ backgroundColor: '#fff', borderColor: '#5d4037', color: '#5d4037' }}
        >
          🏠 Volver al Admin Home
        </button>
      </div>

      <div className="row g-4">
        {/* COLUMNA IZQUIERDA: Tabla de usuarios */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#5d4037' }}>
              <span className="fw-bold text-uppercase">Listado de Usuarios</span>
              <button className="btn btn-sm btn-light text-dark fw-bold" onClick={handleLimpiar}>
                + Nuevo Usuario
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Nombre Completo</th>
                      <th>RUT</th>
                      <th>Correo</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios && usuarios.length > 0 ? (
                      usuarios.map((usu, index) => (
                        <tr
                          key={usu.correo || index}
                          onClick={() => handleSelectRow(usu)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: seleccionado?.correo === usu.correo ? '#fce4ec' : 'transparent'
                          }}
                        >
                          <td className="fw-bold">{usu.nombreCompleto}</td>
                          <td>{usu.rut || '—'}</td>
                          <td className="text-break">{usu.correo}</td>
                          <td>
                            <span className={`badge ${usu.rol?.toLowerCase() === 'administrador' ? 'bg-danger' : 'bg-secondary'}`}>
                              {usu.rol}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">
                          No hay usuarios registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Formulario */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0" style={{ backgroundColor: '#fce4ec' }}>
            <div className="card-header text-white fw-bold py-2 text-uppercase d-flex justify-content-between align-items-center" style={{ backgroundColor: '#5d4037' }}>
              <span>{seleccionado ? `Modificar: ${seleccionado.correo}` : 'Nuevo Usuario'}</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>

                {seleccionado && (
                  <div className="alert alert-info py-2 small">
                    Solo se actualizan los campos que tengan valor. Los vacíos conservan su dato actual.
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">RUT (opcional)</label>
                  <input
                    type="text"
                    name="rut"
                    value={formData.rut}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="12345678-9"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Ingresa el nombre"
                    required={!seleccionado}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Ingresa el apellido"
                    required={!seleccionado}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Rol del Usuario</label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    className="form-select border-secondary w-100"
                    style={{ maxWidth: '100%', boxSizing: 'border-box' }}
                  >
                    {rolesDisponibles.length > 0 ? (
                      rolesDisponibles.map((r, idx) => (
                        <option key={idx} value={r.nombre}>
                          {r.nombre}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="usuario">usuario</option>
                        <option value="administrador">administrador</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Correo Electrónico</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="usuario@correo.com"
                    required={!seleccionado}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    {seleccionado ? 'Nueva contraseña (dejar vacío para no cambiarla)' : 'Contraseña'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={seleccionado ? 'Sin cambios' : 'Mínimo 6 caracteres'}
                    required={!seleccionado}
                  />
                </div>

                <div className="d-grid gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn text-white fw-bold py-2"
                    style={{ backgroundColor: '#5d4037' }}
                  >
                    {seleccionado ? 'Modificar' : 'Agregar'}
                  </button>

                  {seleccionado && (
                    <>
                      <button
                        type="button"
                        className="btn btn-danger fw-bold py-2"
                        onClick={handleEliminar}
                      >
                        Eliminar Perfil
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm mt-1"
                        onClick={handleLimpiar}
                      >
                        Cancelar selección
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUser