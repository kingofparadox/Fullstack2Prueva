import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productApi } from '../Data/ConexionProducto'
import GestionProductosTab from '../components/GestionProductos'
import GestionCategoriasTab from '../components/Categorias'

function GestionInventario() {
  const navigate = useNavigate()
  const [tabActiva, setTabActiva] = useState('productos')
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])

  const cargarDatos = async () => {
    try {
      const [listaProductos, listaCategorias] = await Promise.all([
        productApi.getProducts().catch(() => []),
        productApi.getCategories().catch(() => [])
      ])
      setProductos(listaProductos || [])
      setCategorias(listaCategorias || [])
    } catch (error) {
      console.error('Error al cargar datos del inventario:', error)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0" style={{ color: '#5d4037' }}>Panel de Administración: Inventario</h2>
        <button
          onClick={() => navigate('/admin')}
          className="btn btn-outline-dark fw-bold shadow-sm"
          style={{ backgroundColor: '#fff', borderColor: '#5d4037', color: '#5d4037' }}
        >
          🏠 Volver al Admin Home
        </button>
      </div>

      {/* Botones de Pestañas */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button 
            className={`nav-link fw-bold px-4 ${tabActiva === 'productos' ? 'text-white' : 'text-dark border border-secondary'}`}
            style={{ backgroundColor: tabActiva === 'productos' ? '#5d4037' : 'transparent' }}
            onClick={() => setTabActiva('productos')}
          >
            Gestión de Productos
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link fw-bold px-4 ${tabActiva === 'categorias' ? 'text-white' : 'text-dark border border-secondary'}`}
            style={{ backgroundColor: tabActiva === 'categorias' ? '#5d4037' : 'transparent' }}
            onClick={() => setTabActiva('categorias')}
          >
            Gestión de Categorías
          </button>
        </li>
      </ul>

      {tabActiva === 'productos' ? (
        <GestionProductosTab 
          productos={productos} 
          categorias={categorias} 
          onRecargar={cargarDatos} 
        />
      ) : (
        <GestionCategoriasTab 
          categorias={categorias} 
          onRecargar={cargarDatos} 
        />
      )}
    </div>
  )
}

export default GestionInventario