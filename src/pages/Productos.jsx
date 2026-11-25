import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/cartas'
import { productApi } from '../Data/ConexionProducto'

function obtenerNombreCategoria(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  return item.cnombre || item.Categoria || item.categoria || item.nombre || ''
}

function Productos({ onAgregarAlCarro, carrito = [] }) {
  const [productos, setProductos] = useState([])
  const [categoriasBackend, setCategoriasBackend] = useState([])
  const [loading, setLoading] = useState(true)

  // Estados para los filtros
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const [precioMin, setPrecioMin] = useState('')
  const [precioMax, setPrecioMax] = useState('')
  const [soloDescuentos, setSoloDescuentos] = useState(false)

  // Aviso al agregar al carrito
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        const [datosProductos, datosCategorias] = await Promise.all([
          productApi.getProducts(),
          typeof productApi.getCategories === 'function'
            ? productApi.getCategories().catch(() => [])
            : typeof productApi.getCategorias === 'function'
              ? productApi.getCategorias().catch(() => [])
              : Promise.resolve([])
        ])

        setProductos(datosProductos || [])
        setCategoriasBackend(Array.isArray(datosCategorias) ? datosCategorias : [])
      } catch (error) {
        console.error('Error al obtener productos:', error)
        setProductos([])
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // El aviso desaparece solo a los 2.5 segundos
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 2500)
    return () => clearTimeout(t)
  }, [aviso])

  const handleAgregar = (producto, ...resto) => {
    onAgregarAlCarro(producto, ...resto)
    const nombre = producto?.nombre || 'Producto'
    setAviso(`✅ "${nombre}" se agregó al carrito`)
  }

  const totalItems = carrito.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0)

  // Combinamos categorías del endpoint con las encontradas en productos para no perder ninguna
  const categoriasDesdeProductos = productos
    .map((p) => obtenerNombreCategoria(p))
    .filter(Boolean)

  const categoriasDesdeApi = categoriasBackend
    .map((c) => obtenerNombreCategoria(c))
    .filter(Boolean)

  const categoriasDisponibles = [...new Set([...categoriasDesdeApi, ...categoriasDesdeProductos])]

  // Lógica de filtrado
  const productosFiltrados = productos.filter((producto) => {
    const catProd = obtenerNombreCategoria(producto)
    const cumpleCategoria =
      categoriaSeleccionada === '' ||
      catProd.toLowerCase() === categoriaSeleccionada.toLowerCase()

    // Filtro por precio mínimo y máximo
    const precioProducto = Number(producto.precio) || 0
    const cumpleMin = precioMin === '' || precioProducto >= Number(precioMin)
    const cumpleMax = precioMax === '' || precioProducto <= Number(precioMax)

    // Filtro por productos con descuento (Stock > 10)
    const stockVal = Number(producto.stock ?? producto.Stok) || 0
    const cumpleDescuento = !soloDescuentos || stockVal > 10

    return cumpleCategoria && cumpleMin && cumpleMax && cumpleDescuento
  })

  return (
    <div className="container py-5">
      {aviso && (
        <div
          className="position-fixed top-0 end-0 m-3 alert alert-success shadow fw-bold"
          style={{ zIndex: 1080 }}
          role="alert"
        >
          {aviso}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Catálogo de Productos</h1>
          <p>Explora y añade tus coleccionables favoritos. ꒰ঌ(˶ˆᗜˆ˵)໒꒱ .ᐟ.ᐟ</p>
        </div>
        <Link to="/carrito" className="btn btn-dark fw-bold">
          🛒 Carrito ({totalItems})
        </Link>
      </div>

      <hr className="border-secondary mb-4" />

      {/* SECCIÓN DE FILTROS */}
      <div className="card shadow-sm border-secondary mb-4 p-3" style={{ backgroundColor: '#fce4ec' }}>
        <h5 className="fw-bold mb-3" style={{ color: '#5d4037' }}>🔍 Filtrar Productos</h5>
        <div className="row g-3">
          {/* Filtro por Categoría */}
          <div className="col-md-4">
            <label className="form-label small fw-bold text-uppercase" style={{ color: '#5d4037' }}>Categoría</label>
            <select
              className="form-select border-secondary"
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categoriasDisponibles.map((cat, index) => (
                <option key={`${cat}-${index}`} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Precio Mínimo */}
          <div className="col-md-3">
            <label className="form-label small fw-bold text-uppercase" style={{ color: '#5d4037' }}>Precio Mínimo ($)</label>
            <input
              type="number"
              className="form-control border-secondary"
              placeholder="Ej. 1000"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
            />
          </div>

          {/* Filtro por Precio Máximo */}
          <div className="col-md-3">
            <label className="form-label small fw-bold text-uppercase" style={{ color: '#5d4037' }}>Precio Máximo ($)</label>
            <input
              type="number"
              className="form-control border-secondary"
              placeholder="Ej. 50000"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
            />
          </div>

          {/* Botón para limpiar filtros */}
          <div className="col-md-2 d-flex align-items-end">
            <button
              className="btn btn-outline-dark w-100 fw-bold"
              onClick={() => {
                setCategoriaSeleccionada('')
                setPrecioMin('')
                setPrecioMax('')
                setSoloDescuentos(false)
              }}
            >
              Limpiar
            </button>
          </div>

          {/* Checkbox: Solo ver productos con descuentos */}
          <div className="col-12 d-flex align-items-center mt-2">
            <div className="form-check">
              <input
                className="form-check-input border-secondary"
                type="checkbox"
                id="checkDescuentos"
                checked={soloDescuentos}
                onChange={(e) => setSoloDescuentos(e.target.checked)}
              />
              <label className="form-check-label fw-bold text-danger small" htmlFor="checkDescuentos" style={{ cursor: 'pointer' }}>
                🔥 Solo ver productos con descuentos automáticos (Stock &gt; 10)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Si está cargando mostramos un indicador, de lo contrario renderizamos las cartas filtradas */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status">
            <span className="visually-hidden">Cargando productos...</span>
          </div>
        </div>
      ) : productosFiltrados.length > 0 ? (
        <Card productos={productosFiltrados} onAgregarAlCarro={handleAgregar} />
      ) : (
        <div className="alert alert-warning text-center py-4">
          No se encontraron productos que coincidan con los filtros seleccionados.
        </div>
      )}
    </div>
  )
}

export default Productos