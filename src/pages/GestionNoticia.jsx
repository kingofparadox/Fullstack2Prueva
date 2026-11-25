import { useState, useEffect } from 'react'
import { blogApi } from '../Data/ConexionBlog'
import { useNavigate } from 'react-router-dom'

function obtenerBloque(item, tipoBuscado) {
  const bloques = Array.isArray(item?.contenidoJson)
    ? item.contenidoJson
    : Array.isArray(item?.contenido)
      ? item.contenido
      : []

  const encontrado = bloques.find(
    (b) => (b?.tipo || '').toLowerCase() === tipoBuscado.toLowerCase()
  )
  return encontrado?.contenido || ''
}

function extraerBloquesCuerpo(item) {
  const bloques = Array.isArray(item?.contenidoJson)
    ? item.contenidoJson
    : Array.isArray(item?.contenido)
      ? item.contenido
      : []

  const filtrados = bloques
    .filter((b) => {
      const tipo = (b?.tipo || '').toLowerCase()
      return tipo !== 'portada' && tipo !== 'resumen'
    })
    .map((b) => ({
      tipo: (b?.tipo || 'parrafo').toLowerCase(),
      contenido: b?.contenido || '',
      caption: b?.caption || ''
    }))

  return filtrados.length > 0
    ? filtrados
    : [{ tipo: 'parrafo', contenido: '', caption: '' }]
}

function GestionNoticias() {
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState([])
  const [seleccionado, setSeleccionado] = useState(null)
  const [loading, setLoading] = useState(false)

  const [formBlog, setFormBlog] = useState({
    rutAutor: '',
    titulo: '',
    resumen: '',
    imagenPortada: '',
    fecha: ''
  })

  const [previewImagen, setPreviewImagen] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const [secciones, setSecciones] = useState([
    { tipo: 'parrafo', contenido: '', caption: '' }
  ])

  const cargarBlogs = async () => {
    try {
      setLoading(true)
      const datos = await blogApi.getBlogs()
      setBlogs(Array.isArray(datos) ? datos : [])
    } catch (error) {
      console.error('Error al cargar blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarBlogs()
  }, [])

  const normalizarRuta = (ruta) => (typeof ruta === 'string' ? ruta.toLowerCase() : '')

  const procesarArchivoPortada = async (file) => {
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
            imagenBase64: reader.result,
            folder: 'Blog'
          })
        })

        const resultado = await response.json()
        if (resultado.success) {
          const rutaLimpia = normalizarRuta(resultado.path)
          setFormBlog(prev => ({ ...prev, imagenPortada: rutaLimpia }))
          setPreviewImagen(rutaLimpia)
        } else {
          alert('Error al guardar la imagen en el servidor.')
        }
      } catch (error) {
        console.error('Error de red al subir la imagen:', error)
      }
    }
  }

  const procesarArchivoSeccion = async (file, index) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.')
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
            imagenBase64: reader.result,
            folder: 'Blog'
          })
        })

        const resultado = await response.json()
        if (resultado.success) {
          handleCambiarSeccion(index, 'contenido', normalizarRuta(resultado.path))
        } else {
          alert('Error al guardar la imagen de la sección.')
        }
      } catch (error) {
        console.error('Error de red al subir la imagen de la sección:', error)
      }
    }
  }

  const handleAgregarSeccion = (tipo = 'parrafo') => {
    setSecciones(prev => [...prev, { tipo, contenido: '', caption: '' }])
  }

  const handleCambiarSeccion = (index, campo, valor) => {
    setSecciones(prev => {
      const copia = [...prev]
      copia[index] = { ...copia[index], [campo]: valor }
      return copia
    })
  }

  const handleEliminarSeccion = (index) => {
    if (secciones.length === 1) {
      alert('El artículo debe tener al menos un bloque de contenido.')
      return
    }
    setSecciones(prev => prev.filter((_, i) => i !== index))
  }

  const handleSelectBlog = (blogItem) => {
    setSeleccionado(blogItem)

    const portadaVal = normalizarRuta(
      blogItem.portada || obtenerBloque(blogItem, 'portada')
    )
    const resumenVal =
      blogItem.resumen || obtenerBloque(blogItem, 'resumen')

    setFormBlog({
      rutAutor: blogItem.autor?.rut || '',
      titulo: blogItem.titulo || '',
      resumen: resumenVal,
      imagenPortada: portadaVal,
      fecha: blogItem.fecha || ''
    })
    setPreviewImagen(portadaVal)
    setSecciones(extraerBloquesCuerpo(blogItem))
  }

  const handleLimpiarForm = () => {
    setSeleccionado(null)
    setFormBlog({
      rutAutor: '',
      titulo: '',
      resumen: '',
      imagenPortada: '',
      fecha: ''
    })
    setPreviewImagen('')
    setSecciones([{ tipo: 'parrafo', contenido: '', caption: '' }])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formBlog.titulo.trim()) {
      alert('Por favor, ingresa un título para la publicación.')
      return
    }

    const bloquesContenido = []

    if (formBlog.imagenPortada.trim()) {
      bloquesContenido.push({
        tipo: 'portada',
        contenido: normalizarRuta(formBlog.imagenPortada.trim())
      })
    }

    if (formBlog.resumen.trim()) {
      bloquesContenido.push({
        tipo: 'resumen',
        contenido: formBlog.resumen.trim()
      })
    }

    secciones.forEach((sec) => {
      if (sec.contenido && sec.contenido.trim() !== '') {
        bloquesContenido.push({
          tipo: sec.tipo,
          contenido: sec.tipo === 'imagen'
            ? normalizarRuta(sec.contenido.trim())
            : sec.contenido.trim()
        })
      }
    })

    const fechaEnvio = formBlog.fecha || new Date().toISOString().slice(0, 19)

    const payload = {
      blog: {
        titulo: formBlog.titulo.trim(),
        fecha: fechaEnvio
      },
      contenido: bloquesContenido
    }

    try {
      if (seleccionado) {
        await blogApi.updateBlog(payload)
        alert('¡Publicación actualizada con éxito!')
      } else {
        if (!formBlog.rutAutor.trim()) {
          alert('Por favor, ingresa el RUT del autor para crear la publicación.')
          return
        }
        await blogApi.createBlog(formBlog.rutAutor.trim(), payload)
        alert('¡Publicación creada con éxito!')
      }

      await cargarBlogs()
      handleLimpiarForm()
    } catch (error) {
      console.error('Error al guardar la publicación:', error)
      alert(`Ocurrió un error: ${error.message || 'Error en la solicitud'}`)
    }
  }

  const handleEliminar = async () => {
    if (!seleccionado) return

    const tituloEliminar = seleccionado.titulo

    if (window.confirm(`¿Estás seguro de eliminar la publicación "${tituloEliminar}"?`)) {
      try {
        await blogApi.deleteBlog(tituloEliminar)
        alert('¡Publicación eliminada correctamente!')
        await cargarBlogs()
        handleLimpiarForm()
      } catch (error) {
        console.error('Error al eliminar publicación:', error)
        alert(`No se pudo eliminar: ${error.message || 'Error de red'}`)
      }
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0" style={{ color: '#5d4037' }}>
          Panel de Administración: Noticias & Blog
        </h2>
        <button
          onClick={() => navigate('/admin')}
          className="btn btn-outline-dark fw-bold shadow-sm"
          style={{ backgroundColor: '#fff', borderColor: '#5d4037', color: '#5d4037' }}
        >
          🏠 Volver al Admin Home
        </button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#5d4037' }}>
              <span className="fw-bold text-uppercase">Publicaciones ({blogs.length})</span>
              <button type="button" className="btn btn-sm btn-light text-dark fw-bold" onClick={handleLimpiarForm}>
                + Nueva Publicación
              </button>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {loading ? (
                <div className="text-center py-4 text-muted">Cargando publicaciones...</div>
              ) : blogs.length === 0 ? (
                <div className="text-center py-4 text-muted">No hay publicaciones registradas.</div>
              ) : (
                <div className="list-group list-group-flush">
                  {blogs.map((item, idx) => {
                    const isSelected = seleccionado?.titulo === item.titulo
                    const imgUrl = normalizarRuta(
                      item.portada || obtenerBloque(item, 'portada')
                    ) || 'https://via.placeholder.com/60'
                    const nombreAutor =
                      item.autor?.nombre ||
                      item.autor?.nick ||
                      item.autor?.correo ||
                      'Equipo AnimeWord'

                    return (
                      <button
                        type="button"
                        key={`${item.titulo}-${idx}`}
                        onClick={() => handleSelectBlog(item)}
                        className={`list-group-item list-group-item-action p-3 text-start ${isSelected ? 'bg-light border-start border-4 border-danger' : ''}`}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={imgUrl}
                            alt="Portada"
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                          <div>
                            <span className="badge bg-secondary mb-1">Blog</span>
                            <h6 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '220px' }}>
                              {item.titulo || 'Sin título'}
                            </h6>
                            <small className="text-muted">{nombreAutor}</small>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0" style={{ backgroundColor: '#fce4ec' }}>
            <div className="card-header text-white fw-bold py-2 text-uppercase" style={{ backgroundColor: '#5d4037' }}>
              {seleccionado ? 'Editar Publicación' : 'Crear Nueva Publicación'}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <h5 className="fw-bold mb-3" style={{ color: '#5d4037' }}>1. Datos Principales y Vista Previa</h5>

                {!seleccionado && (
                  <div className="mb-3">
                    <label className="form-label small fw-bold">RUT del Autor</label>
                    <input
                      type="text"
                      value={formBlog.rutAutor}
                      onChange={(e) => setFormBlog({ ...formBlog, rutAutor: e.target.value })}
                      className="form-control border-secondary"
                      placeholder="Ej: 12345678-9"
                      required
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small fw-bold">Título de la Publicación</label>
                  <input
                    type="text"
                    value={formBlog.titulo}
                    onChange={(e) => setFormBlog({ ...formBlog, titulo: e.target.value })}
                    className="form-control border-secondary"
                    placeholder="Ej: La vitrina de Carlos..."
                    disabled={Boolean(seleccionado)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold" style={{ color: '#5d4037' }}>Imagen de Portada (bloque "portada")</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragging(false)
                      if (e.dataTransfer.files?.[0]) procesarArchivoPortada(e.dataTransfer.files[0])
                    }}
                    className={`border border-2 border-dashed rounded-3 p-3 text-center position-relative bg-white ${isDragging ? 'border-dark bg-light' : 'border-secondary'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => document.getElementById('fileInputBlogPortada').click()}
                  >
                    <input 
                      id="fileInputBlogPortada"
                      type="file" 
                      accept="image/*" 
                      className="d-none" 
                      onChange={(e) => e.target.files?.[0] && procesarArchivoPortada(e.target.files[0])}
                    />

                    {previewImagen ? (
                      <div className="d-flex align-items-center justify-content-center gap-3">
                        <img 
                          src={previewImagen} 
                          alt="Vista previa" 
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} 
                          className="border border-secondary shadow-sm"
                        />
                        <div className="text-start">
                          <span className="small text-success fw-bold d-block">Imagen cargada correctamente</span>
                          <span className="small text-muted">{formBlog.imagenPortada}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-muted">
                        <p className="mb-0 small fw-bold">Arrastra una imagen aquí o haz clic para seleccionarla</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Resumen corto (bloque "resumen")</label>
                  <textarea
                    value={formBlog.resumen}
                    onChange={(e) => setFormBlog({ ...formBlog, resumen: e.target.value })}
                    className="form-control border-secondary"
                    rows="2"
                    placeholder="Breve vista previa para la tarjeta..."
                  ></textarea>
                </div>

                <hr className="my-4" />

                <h5 className="fw-bold mb-3" style={{ color: '#5d4037' }}>2. Cuerpo del Artículo</h5>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label small fw-bold mb-0">Bloques de Contenido</label>
                    <div className="btn-group btn-group-sm">
                      <button type="button" className="btn btn-outline-dark" onClick={() => handleAgregarSeccion('parrafo')}>
                        + Párrafo
                      </button>
                      <button type="button" className="btn btn-outline-dark" onClick={() => handleAgregarSeccion('subtitulo')}>
                        + Subtítulo
                      </button>
                      <button type="button" className="btn btn-outline-dark" onClick={() => handleAgregarSeccion('imagen')}>
                        + Imagen
                      </button>
                    </div>
                  </div>

                  {secciones.map((sec, idx) => (
                    <div key={idx} className="card p-2 mb-2 border-secondary bg-white">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-dark text-uppercase">{sec.tipo} #{idx + 1}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-0 px-2 fw-bold"
                          onClick={() => handleEliminarSeccion(idx)}
                        >
                          ✕
                        </button>
                      </div>

                      {sec.tipo === 'imagen' ? (
                        <div className="mb-2">
                          <div 
                            className="border border-2 border-dashed rounded-2 p-2 text-center bg-light"
                            style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                            onClick={() => document.getElementById(`fileInputSeccion_${idx}`).click()}
                          >
                            <input 
                              id={`fileInputSeccion_${idx}`}
                              type="file" 
                              accept="image/*" 
                              className="d-none" 
                              onChange={(e) => e.target.files?.[0] && procesarArchivoSeccion(e.target.files[0], idx)}
                            />
                            {sec.contenido ? (
                              <div className="d-flex align-items-center gap-2">
                                <img src={sec.contenido} alt="Sección" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                <span className="text-success text-truncate small">Cargada: {sec.contenido}</span>
                              </div>
                            ) : (
                              <span className="text-muted fw-bold">Haz clic o arrastra una imagen para este bloque</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={sec.contenido}
                          onChange={(e) => handleCambiarSeccion(idx, 'contenido', e.target.value)}
                          className="form-control form-control-sm border-secondary mb-1"
                          rows={sec.tipo === 'parrafo' ? 2 : 1}
                          placeholder={sec.tipo === 'parrafo' ? 'Escribe el párrafo...' : 'Escribe el subtítulo...'}
                        ></textarea>
                      )}
                    </div>
                  ))}
                </div>

                <div className="d-grid gap-2 mt-4">
                  <button type="submit" className="btn text-white fw-bold py-2" style={{ backgroundColor: '#5d4037' }}>
                    {seleccionado ? 'Guardar Cambios' : 'Publicar Blog'}
                  </button>

                  {seleccionado && (
                    <>
                      <button type="button" className="btn btn-danger fw-bold py-2" onClick={handleEliminar}>
                        Eliminar Publicación
                      </button>
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleLimpiarForm}>
                        Cancelar Selección
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

export default GestionNoticias