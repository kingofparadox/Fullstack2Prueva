import { useState } from 'react'
import { productApi } from '../Data/ConexionProducto'
import { validarCategoria } from '../validaciones/validacionesProductos'

function GestionCategoriasTab({ categorias, onRecargar }) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [nombreCategoria, setNombreCategoria] = useState('')
  const [nombreAnterior, setNombreAnterior] = useState('')

  const handleSelectCategoriaRow = (cat) => {
    setCategoriaSeleccionada(cat)
    const nombreReal = cat.cnombre || cat.nombre || ''
    setNombreCategoria(nombreReal)
    setNombreAnterior(nombreReal)
  }

  const limpiarFormCategoria = () => {
    setCategoriaSeleccionada(null)
    setNombreCategoria('')
    setNombreAnterior('')
  }

  const handleSubmitCategoria = async (e) => {
    e.preventDefault()
    const error = validarCategoria(nombreCategoria)
    if (error) {
      alert(error)
      return
    }

    try {
      if (categoriaSeleccionada) {
        await productApi.updateCategory(nombreAnterior, nombreCategoria)
        alert('¡Categoría modificada con éxito!')
      } else {
        await productApi.createCategory(nombreCategoria)
        alert('¡Categoría creada con éxito!')
      }

      await onRecargar()
      limpiarFormCategoria()
    } catch (err) {
      console.error('Error al guardar categoría:', err)
      alert(`Ocurrió un error: ${err.message || 'Error en la solicitud'}`)
    }
  }

  const handleEliminarCategoria = async () => {
    if (!categoriaSeleccionada) return
    const nombreActual = categoriaSeleccionada.cnombre || categoriaSeleccionada.nombre

    if (window.confirm(`¿Estás seguro de eliminar la categoría "${nombreActual}"?`)) {
      try {
        await productApi.deleteCategory(nombreActual)
        alert('¡Categoría eliminada con éxito!')
        await onRecargar()
        limpiarFormCategoria()
      } catch (err) {
        console.error('Error al eliminar categoría:', err)
        alert(`No se pudo eliminar: ${err.message || 'Error de red'}`)
      }
    }
  }

  return (
    <div className="row g-4">
      <div className="col-12 col-lg-7">
        <div className="card shadow-sm border-0">
          <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#5d4037' }}>
            <span className="fw-bold text-uppercase">Listado de Categorías</span>
            <button className="btn btn-sm btn-light text-dark fw-bold" onClick={limpiarFormCategoria}>
              + Nueva Categoría
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre de la Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.length > 0 ? (
                    categorias.map((cat, index) => {
                      const nombreCat = cat.cnombre || cat.nombre || ''
                      const isSelected = (categoriaSeleccionada?.cnombre || categoriaSeleccionada?.nombre) === nombreCat
                      return (
                        <tr 
                          key={cat.id || index} 
                          onClick={() => handleSelectCategoriaRow(cat)}
                          style={{ 
                            cursor: 'pointer', 
                            backgroundColor: isSelected ? '#fce4ec' : 'transparent' 
                          }}
                        >
                          <td className="fw-bold">{cat.id || index + 1}</td>
                          <td>{nombreCat}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center py-4 text-muted">
                        No hay categorías registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-5">
        <div className="card shadow-sm border-0" style={{ backgroundColor: '#fce4ec' }}>
          <div className="card-header text-white fw-bold py-2 text-uppercase" style={{ backgroundColor: '#5d4037' }}>
            {categoriaSeleccionada ? 'Modificar Categoría' : 'Nueva Categoría'}
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmitCategoria}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-dark">Nombre de la Categoría</label>
                <input 
                  type="text" 
                  value={nombreCategoria}
                  onChange={(e) => setNombreCategoria(e.target.value)}
                  className="form-control border-secondary"
                  placeholder="Ej: Anime, Ropa, etc."
                  required
                />
              </div>

              <div className="d-grid gap-2 mt-4">
                <button 
                  type="submit" 
                  className="btn text-white fw-bold py-2"
                  style={{ backgroundColor: '#5d4037' }}
                >
                  {categoriaSeleccionada ? 'Modificar Categoría' : 'Guardar Categoría'}
                </button>

                {categoriaSeleccionada && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-danger fw-bold py-2"
                      onClick={handleEliminarCategoria}
                    >
                      Eliminar Categoría
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary btn-sm mt-1"
                      onClick={limpiarFormCategoria}
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
  )
}

export default GestionCategoriasTab