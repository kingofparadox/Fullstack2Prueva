import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { boletaApi } from '../Data/ConexionBoletas'
import { DtoBoletas, DtoDetalleBoleta } from '../ContratosApis/ContratoBoleta.js'

const formatearCLP = (valor) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(Number(valor) || 0)
}

function obtenerNombreCliente(usuario) {
  if (!usuario) return 'Sin cliente'
  const nombreCompleto = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ').trim()
  return nombreCompleto || usuario.correo || usuario.email || usuario.rut || 'Cliente'
}

function BoletasAdmind() {
  const navigate = useNavigate()
  const [boletas, setBoletas] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [boletaSeleccionada, setBoletaSeleccionada] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)

  const cargarBoletas = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const data = await boletaApi.getBoletas()
      const normalizadas = Array.isArray(data)
        ? data.map((item) => (item instanceof DtoBoletas ? item : new DtoBoletas(item)))
        : []
      setBoletas(normalizadas)
    } catch (error) {
      console.error('Error al cargar boletas:', error)
      setErrorMsg(error.message || 'No se pudieron cargar las boletas desde el servidor.')
      setBoletas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarBoletas()
  }, [])

  const handleEliminarBoleta = async (e, boleta) => {
    e.stopPropagation()
    if (!boleta?.id) return

    const confirmar = window.confirm(`¿Seguro que deseas eliminar la Boleta N° ${boleta.id}?`)
    if (!confirmar) return

    try {
      setEliminandoId(boleta.id)
      await boletaApi.deleteBoleta(boleta.id)
      setBoletas((prev) => prev.filter((b) => b.id !== boleta.id))
      if (boletaSeleccionada?.id === boleta.id) {
        setBoletaSeleccionada(null)
      }
    } catch (error) {
      console.error('Error al eliminar boleta:', error)
      alert(`No se pudo eliminar la boleta: ${error.message || 'Error en el servidor'}`)
    } finally {
      setEliminandoId(null)
    }
  }

  const detallesSeleccionada = Array.isArray(boletaSeleccionada?.productos)
    ? boletaSeleccionada.productos.map((p) => (p instanceof DtoDetalleBoleta ? p : new DtoDetalleBoleta(p)))
    : []

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">📄 Gestión de Boletas</h1>
          <p className="text-muted mb-0">Vista general de boletas registradas en el sistema.</p>
        </div>

        <button
          onClick={() => navigate('/admin')}
          className="btn btn-outline-dark fw-bold shadow-sm"
          style={{ backgroundColor: '#fff', borderColor: '#5d4037', color: '#5d4037' }}
        >
          🏠 Volver al Admin Home
        </button>
      </div>

      {errorMsg && (
        <div className="alert alert-danger fw-semibold" role="alert">
          {errorMsg}
        </div>
      )}

      <div className="row">
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-secondary p-3" style={{ backgroundColor: '#fce4ec' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold mb-0" style={{ color: '#5d4037' }}>Lista de Boletas</h4>
              <button
                type="button"
                onClick={cargarBoletas}
                className="btn btn-sm btn-outline-dark fw-bold"
                disabled={loading}
              >
                🔄 Actualizar
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-dark" role="status" />
              </div>
            ) : boletas.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0">No hay boletas registradas en el sistema.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle bg-white rounded overflow-hidden mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>N° Boleta</th>
                      <th>Cliente / Contacto</th>
                      <th>Fecha</th>
                      <th className="text-end">Total</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boletas.map((boleta, index) => {
                      const docId = boleta.id ?? index
                      const esSeleccionada = boletaSeleccionada?.id === boleta.id
                      const contacto = boleta.usuario?.correo || boleta.usuario?.rut

                      return (
                        <tr
                          key={docId}
                          style={{ cursor: 'pointer' }}
                          className={esSeleccionada ? 'table-active' : ''}
                          onClick={() => setBoletaSeleccionada(boleta)}
                        >
                          <td className="fw-bold small">#{boleta.id ?? index + 1}</td>
                          <td>
                            <div className="fw-semibold small">{obtenerNombreCliente(boleta.usuario)}</div>
                            {contacto && (
                              <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                {boleta.usuario?.correo
                                  ? `Correo: ${boleta.usuario.correo}`
                                  : `RUT: ${boleta.usuario.rut}`}
                              </div>
                            )}
                          </td>
                          <td className="small">
                            {boleta.fechaFormateada ||
                              (boleta.fecha ? new Date(boleta.fecha).toLocaleDateString('es-CL') : 'Sin fecha')}
                          </td>
                          <td className="text-end fw-bold small">{formatearCLP(boleta.total)}</td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary fw-bold"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setBoletaSeleccionada(boleta)
                                }}
                              >
                                Ver
                              </button>
                              {boleta.id != null && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger fw-bold"
                                  disabled={eliminandoId === boleta.id}
                                  onClick={(e) => handleEliminarBoleta(e, boleta)}
                                >
                                  {eliminandoId === boleta.id ? '...' : 'Eliminar'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-5 mt-4 mt-lg-0">
          <div className="card shadow-sm border-secondary p-4 bg-white">
            <h4 className="fw-bold mb-3" style={{ color: '#5d4037' }}>Detalle Completo</h4>

            {boletaSeleccionada ? (
              <div>
                <div className="mb-3 border-bottom pb-2">
                  <span className="badge bg-dark mb-2">BOLETA #{boletaSeleccionada.id}</span>
                  <p className="small mb-1">
                    <strong>Fecha:</strong>{' '}
                    {boletaSeleccionada.fechaFormateada ||
                      (boletaSeleccionada.fecha ? new Date(boletaSeleccionada.fecha).toLocaleString('es-CL') : 'N/A')}
                  </p>
                  <p className="small mb-1">
                    <strong>Cliente:</strong> {obtenerNombreCliente(boletaSeleccionada.usuario)}
                  </p>
                  {boletaSeleccionada.usuario?.rut && (
                    <p className="small mb-1">
                      <strong>RUT:</strong> {boletaSeleccionada.usuario.rut}
                    </p>
                  )}
                  {boletaSeleccionada.usuario?.correo && (
                    <p className="small mb-0">
                      <strong>Correo:</strong> {boletaSeleccionada.usuario.correo}
                    </p>
                  )}
                </div>

                <h6 className="fw-bold mb-2">Productos Comprados:</h6>
                {detallesSeleccionada.length > 0 ? (
                  <ul className="list-group list-group-flush mb-3 small">
                    {detallesSeleccionada.map((prod, idx) => (
                      <li
                        key={idx}
                        className="list-group-item d-flex justify-content-between align-items-center px-0"
                      >
                        <div>
                          <strong>{prod.nombreProducto || 'Producto'}</strong>
                          <span className="text-muted"> (Cant: {prod.cantidad})</span>
                          <br />
                          <small className="text-muted">
                            Precio unit.: {formatearCLP(prod.precioUnitario)}
                          </small>
                        </div>
                        <span className="fw-bold">{formatearCLP(prod.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="small text-muted">No hay detalle de productos en esta boleta.</p>
                )}

                <h4 className="fw-bold text-end mt-3" style={{ color: '#5d4037' }}>
                  Total: {formatearCLP(boletaSeleccionada.total)}
                </h4>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <p className="mb-0">👈 Selecciona una boleta de la tabla para ver todos sus datos completos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoletasAdmind