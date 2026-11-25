import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { blogApi } from '../Data/ConexionBlog'

function ArticuloBlog() {
  const { id } = useParams() // Captura el título (o slug) desde la URL
  const [articulo, setArticulo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const obtenerArticulo = async () => {
      try {
        setLoading(true)
        setErrorMsg('')
        const listaBlogs = await blogApi.getBlogs()
        const paramDecodificado = decodeURIComponent(id || '').toLowerCase()

        const encontrado = (listaBlogs || []).find((b) => {
          const tituloNorm = (b.titulo || '').toLowerCase()
          const slugTitulo = tituloNorm.replace(/\s+/g, '-')
          return tituloNorm === paramDecodificado || slugTitulo === paramDecodificado
        })

        setArticulo(encontrado || null)
      } catch (error) {
        console.error('Error al cargar el artículo:', error)
        setErrorMsg(error.message || 'No se pudo cargar el artículo.')
        setArticulo(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      obtenerArticulo()
    }
  }, [id])

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Cargando artículo...</span>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">{errorMsg}</div>
        <Link to="/blog" className="btn btn-outline-dark mt-3">
          ← Volver al blog
        </Link>
      </div>
    )
  }

  if (!articulo) {
    return (
      <div className="container py-5 text-center">
        <h2>Artículo no encontrado</h2>
        <Link to="/blog" className="btn btn-outline-dark mt-3">
          ← Volver al blog
        </Link>
      </div>
    )
  }

  const bloques = Array.isArray(articulo.contenidoJson)
    ? articulo.contenidoJson
    : Array.isArray(articulo.contenido)
      ? articulo.contenido
      : []

  // Extrae la imagen principal desde el bloque de tipo "portada"
  const bloquePortada = bloques.find(
    (b) => (b?.tipo || '').toLowerCase() === 'portada'
  )
  const imagenPortada = articulo.portada || bloquePortada?.contenido || ''

  // El resto de bloques que se renderizan en el cuerpo (excluyendo "portada")
  const bloquesCuerpo = bloques.filter(
    (b) => (b?.tipo || '').toLowerCase() !== 'portada'
  )

  const nombreAutor =
    articulo.autor?.nombre ||
    articulo.autor?.nick ||
    articulo.autor?.correo ||
    'Equipo AnimeWord'

  const fechaFormateada = articulo.fecha
    ? new Date(articulo.fecha).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : ''

  return (
    <div style={{
      backgroundImage: "url('/img/polkadots1.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      width: '100%'
    }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="card text-dark shadow-lg border-secondary p-4 p-md-5" style={{ backgroundColor: '#fff9c4' }}>

              <Link
                to="/blog"
                className="text-decoration-none fw-bold mb-3"
                style={{ color: '#5d4037' }}
              >
                ← Volver al blog
              </Link>

              {/* Imagen principal = portada */}
              {imagenPortada && (
                <img
                  src={imagenPortada}
                  alt={articulo.titulo}
                  className="w-100 rounded border border-secondary mb-4"
                  style={{ maxHeight: '600px', objectFit: 'cover' }}
                />
              )}

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="badge bg-danger">Blog</span>
                {fechaFormateada && <small className="text-muted">{fechaFormateada}</small>}
              </div>

              <h1 className="fw-bold">{articulo.titulo}</h1>
              <p className="text-muted">Por {nombreAutor}</p>
              <hr />

              {/* Bloques dinámicos de contenidoJson */}
              {bloquesCuerpo.map((sec, i) => {
                const tipo = (sec?.tipo || '').toLowerCase()

                if (tipo === 'subtitulo') {
                  return (
                    <h3 key={i} className="fw-bold mt-4 mb-3" style={{ color: '#5d4037' }}>
                      {sec.contenido}
                    </h3>
                  )
                }

                if (tipo === 'resumen') {
                  return (
                    <p key={i} className="lead fw-normal mb-4" style={{ lineHeight: '1.7' }}>
                      {sec.contenido}
                    </p>
                  )
                }

                if (tipo === 'imagen') {
                  return (
                    <div key={i} className="my-4 text-center">
                      <img
                        src={sec.contenido}
                        alt={sec.caption || `Imagen ${i + 1}`}
                        className="img-fluid rounded border border-secondary"
                        style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                      />
                      {sec.caption && (
                        <small className="d-block text-muted mt-2 fst-italic">{sec.caption}</small>
                      )}
                    </div>
                  )
                }

                return (
                  <p key={i} style={{ lineHeight: '1.7' }}>
                    {sec.contenido}
                  </p>
                )
              })}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArticuloBlog