import { Link } from 'react-router-dom'

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

function CartasBlog({ posts }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        No hay publicaciones disponibles en este momento.
      </div>
    )
  }

  return (
    <div className="row">
      {posts.map((item, idx) => {
        const titulo = item.titulo || 'Sin título'
        const categoria = item.categoria || 'Blog'

        const imagenUrl =
          item.portada ||
          obtenerBloque(item, 'portada') ||
          'https://via.placeholder.com/300'

        const resumen =
          item.resumen ||
          obtenerBloque(item, 'resumen') ||
          obtenerBloque(item, 'parrafo') ||
          ''

        const fecha = item.fecha
          ? new Date(item.fecha).toLocaleDateString('es-CL')
          : ''

        const rutaArticulo = `/blog/${encodeURIComponent(titulo)}`

        return (
          <div
            className="col-12 col-md-6 col-lg-4 mb-4 d-flex justify-content-center"
            key={`${titulo}-${idx}`}
          >
            <div
              className="card border-secondary shadow-sm w-100"
              style={{ maxWidth: '22rem', backgroundColor: '#fce4ec' }}
            >
              <img
                src={imagenUrl}
                className="card-img-top border-bottom border-secondary"
                alt={titulo}
                style={{ width: '100%', height: '200px', objectFit: 'cover', objectPosition: 'center' }}
              />

              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="badge bg-danger">{categoria}</span>
                  {fecha && <small className="text-muted">{fecha}</small>}
                </div>

                <h5 className="fw-bold">{titulo}</h5>
                <p className="small text-muted flex-grow-1">{resumen}</p>

                <div className="mt-auto">
                  <Link
                    to={rutaArticulo}
                    className="btn w-100 fw-bold py-2 btn-outline-dark"
                    style={{ borderColor: '#5d4037', color: '#5d4037' }}
                  >
                    Leer artículo completo →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default CartasBlog