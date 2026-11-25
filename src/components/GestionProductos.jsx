import { useState } from 'react'
import { productApi } from '../Data/ConexionProducto'
import { validarProducto } from '../validaciones/validacionesProductos'

function GestionProductosTab({ productos, categorias, onRecargar }) {
  const [modoEdicionProd, setModoEdicionProd] = useState(false)
  const [previewImagen, setPreviewImagen] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const primeraCategoria = categorias[0]?.cnombre || categorias[0]?.nombre || ''

  const [formProducto, setFormProducto] = useState({
    nombre: '',
    precio: '',
    oferta: '',
    stock: '',
    categoria: primeraCategoria,
    cBarras: '',
    imagen: ''
  })

  const normalizarRuta = (ruta) => (typeof ruta === 'string' ? ruta.toLowerCase() : '')

  const handleFormProductoChange = (e) => {
    setFormProducto({
      ...formProducto,
      [e.target.name]: e.target.value
    })
  }

  const procesarArchivoImagen = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Por favor, selecciona o arrastra un archivo de imagen válido.')
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: file.name,
            imagenBase64: reader.result
          })
        })

        const resultado = await response.json()
        if (resultado.success) {
          const rutaMinusculas = normalizarRuta(resultado.path)
          setFormProducto(prev => ({ ...prev, imagen: rutaMinusculas }))
          setPreviewImagen(rutaMinusculas)
        } else {
          alert('Error al guardar la imagen en el servidor.')
        }
      } catch (error) {
        console.error('Error de red al subir la imagen:', error)
      }
    }
  }

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => { setIsDragging(false) }
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivoImagen(e.dataTransfer.files[0])
    }
  }

  const limpiarFormProducto = () => {
    const catDefault = categorias[0]?.cnombre || categorias[0]?.nombre || ''
    setFormProducto({
      nombre: '',
      precio: '',
      oferta: '',
      stock: '',
      categoria: catDefault,
      cBarras: '',
      imagen: ''
    })
    setPreviewImagen('')
    setModoEdicionProd(false)
  }

  const handleSubmitProducto = async (e) => {
    e.preventDefault()
    const error = validarProducto(formProducto)
    if (error) {
      alert(error)
      return
    }

    const precioNum = Number(formProducto.precio)
    const ofertaNum = formProducto.oferta ? Number(formProducto.oferta) : precioNum
    const imagenLimpia = normalizarRuta(formProducto.imagen)

    try {
      const payload = {
        nombre: formProducto.nombre,
        codigoBarras: formProducto.cBarras,
        precio: precioNum,
        oferta: ofertaNum,
        Stok: Number(formProducto.stock),
        path: imagenLimpia ? [imagenLimpia] : [],
        Categoria: formProducto.categoria || primeraCategoria
      }

      if (modoEdicionProd) {
        await productApi.updateProduct(payload)
        alert('¡Producto actualizado con éxito!')
      } else {
        await productApi.createProduct(payload)
        alert('¡Producto creado con éxito!')
      }

      await onRecargar()
      limpiarFormProducto()
    } catch (err) {
      console.error('Error al guardar producto:', err)
      alert(`Ocurrió un error: ${err.message || 'Error en la solicitud'}`)
    }
  }

  const handleEditarProducto = (prod) => {
    setModoEdicionProd(true)

    const primeraImagen = Array.isArray(prod.path) && prod.path.length > 0
      ? normalizarRuta(prod.path[0])
      : ''

    setFormProducto({
      nombre: prod.nombre || '',
      precio: prod.precio || '',
      oferta: prod.oferta || '',
      stock: prod.Stok ?? prod.stock ?? '',
      categoria: prod.Categoria || prod.categoria || primeraCategoria,
      cBarras: prod.codigoBarras || prod.cBarras || '',
      imagen: primeraImagen
    })
    setPreviewImagen(primeraImagen)
  }

  const handleEliminarProducto = async (prod) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${prod.nombre}"?`)) {
      try {
        await productApi.deleteProduct(prod)
        alert('¡Producto eliminado con éxito!')
        await onRecargar()
      } catch (err) {
        console.error('Error al eliminar producto:', err)
        alert(`No se pudo eliminar: ${err.message || 'Error de red'}`)
      }
    }
  }

  return (
    <div>
      {/* FORMULARIO DE PRODUCTO */}
      <div className="card shadow-sm border-secondary mb-5" style={{ backgroundColor: '#fce4ec' }}>
        <div className="card-header text-white fw-bold py-2" style={{ backgroundColor: '#5d4037' }}>
          {modoEdicionProd ? 'Modificar Producto' : 'Agregar Nuevo Producto'}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmitProducto}>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold" style={{ color: '#5d4037' }}>Nombre del Producto</label>
                <input 
                  type="text" 
                  name="nombre"
                  value={formProducto.nombre}
                  onChange={handleFormProductoChange}
                  className="form-control border-secondary"
                  placeholder="Ej: Kisaragi Saya"
                  disabled={modoEdicionProd}
                  required
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold" style={{ color: '#5d4037' }}>Precio Normal (CLP)</label>
                <input 
                  type="number" 
                  name="precio"
                  value={formProducto.precio}
                  onChange={handleFormProductoChange}
                  className="form-control border-secondary"
                  placeholder="Ej: 20000"
                  min={1000}
                  required
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold" style={{ color: '#5d4037' }}>Precio Oferta (CLP)</label>
                <input 
                  type="number" 
                  name="oferta"
                  value={formProducto.oferta}
                  onChange={handleFormProductoChange}
                  className="form-control border-secondary"
                  placeholder="Ej: 15000 (Mín. 500)"
                  min={500}
                  required
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold" style={{ color: '#5d4037' }}>Stock</label>
                <input 
                  type="number" 
                  name="stock"
                  value={formProducto.stock}
                  onChange={handleFormProductoChange}
                  className="form-control border-secondary"
                  placeholder="Ej: 15"
                  min={1}
                  required
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold" style={{ color: '#5d4037' }}>Categoría</label>
                <select 
                  name="categoria"
                  value={formProducto.categoria || primeraCategoria}
                  onChange={handleFormProductoChange}
                  className="form-select border-secondary w-100"
                  required
                >
                  {categorias.map((cat, idx) => {
                    const nombreCat = cat.cnombre || cat.nombre || ''
                    return (
                      <option key={cat.id || idx} value={nombreCat}>
                        {nombreCat}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold" style={{ color: '#5d4037' }}>Código de Barras (cBarras)</label>
                <input 
                  type="text" 
                  name="cBarras"
                  value={formProducto.cBarras}
                  onChange={handleFormProductoChange}
                  className="form-control border-secondary"
                  placeholder="Ej: 780123456789"
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold" style={{ color: '#5d4037' }}>Imagen del Producto</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border border-2 border-dashed rounded-3 p-3 text-center position-relative bg-white ${isDragging ? 'border-dark bg-light' : 'border-secondary'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => document.getElementById('fileInputProducto').click()}
                >
                  <input 
                    id="fileInputProducto"
                    type="file" 
                    accept="image/*" 
                    className="d-none" 
                    onChange={(e) => e.target.files?.[0] && procesarArchivoImagen(e.target.files[0])}
                  />

                  {previewImagen ? (
                    <div className="d-flex align-items-center justify-content-center gap-3">
                      <img 
                        src={previewImagen} 
                        alt="Vista previa" 
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }} 
                        className="border border-secondary shadow-sm"
                      />
                      <div className="text-start">
                        <span className="small text-success fw-bold d-block">Imagen cargada correctamente</span>
                        <span className="small text-muted">{formProducto.imagen}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-muted">
                      <p className="mb-0 small fw-bold">Arrastra una imagen aquí o haz clic para seleccionarla</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12 d-flex gap-2">
                <button 
                  type="submit" 
                  className="btn text-white fw-bold px-4" 
                  style={{ backgroundColor: '#5d4037' }}
                >
                  {modoEdicionProd ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
                {modoEdicionProd && (
                  <button 
                    type="button" 
                    onClick={limpiarFormProducto}
                    className="btn btn-secondary fw-bold px-4"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="card shadow-sm border-secondary">
        <div className="card-header text-white fw-bold py-2 text-uppercase" style={{ backgroundColor: '#5d4037' }}>
          Lista de Productos Registrados
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0 align-middle">
              <thead className="table-light border-bottom border-secondary">
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Oferta</th>
                  <th>Stock</th>
                  <th>cBarras</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">No hay productos registrados.</td>
                  </tr>
                ) : (
                  productos.map((prod, idx) => {
                    const imgPath = Array.isArray(prod.path) && prod.path.length > 0
                      ? normalizarRuta(prod.path[0])
                      : ''
                    const cbarrasVal = prod.codigoBarras || prod.cBarras || 'N/A'
                    const nombreCat = prod.Categoria || prod.categoria || 'Sin categoría'
                    const stockVal = prod.Stok ?? prod.stock ?? 0

                    return (
                      <tr key={prod.id || cbarrasVal || idx}>
                        <td>
                          {imgPath ? (
                            <img 
                              src={imgPath} 
                              alt={prod.nombre} 
                              style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '50%' }} 
                              className="border border-secondary"
                            />
                          ) : (
                            <span className="badge bg-light text-dark border">Sin Img</span>
                          )}
                        </td>
                        <td className="fw-bold">{prod.nombre}</td>
                        <td><span className="badge bg-secondary">{nombreCat}</span></td>
                        <td className="fw-bold" style={{ color: '#5d4037' }}>
                          ${Number(prod.precio).toLocaleString('es-CL')}
                        </td>
                        <td className="fw-bold text-success">
                          {prod.oferta ? `$${Number(prod.oferta).toLocaleString('es-CL')}` : '-'}
                        </td>
                        <td>{stockVal}</td>
                        <td className="small text-muted">{cbarrasVal}</td>
                        <td className="text-center">
                          <button 
                            onClick={() => handleEditarProducto(prod)} 
                            className="btn btn-sm btn-outline-dark me-2 fw-bold"
                          >
                            Modificar
                          </button>
                          <button 
                            onClick={() => handleEliminarProducto(prod)} 
                            className="btn btn-sm btn-danger fw-bold"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GestionProductosTab