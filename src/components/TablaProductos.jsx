export const formatear = (n) => `$ ${Number(n).toLocaleString('es-CL')}`

// Extrae la ruta ya sea desde item.imagen o item.path (array o string) y la normaliza
const obtenerRutaImagen = (item) => {
  const raw =
    item?.imagen ||
    (Array.isArray(item?.path) && item.path.length > 0 ? item.path[0] : item?.path) ||
    ''

  if (!raw || typeof raw !== 'string') return ''
  const ruta = raw.startsWith('/') || raw.startsWith('http') ? raw : `/${raw}`
  return ruta.toLowerCase()
}


// Tabla Imagen | Nombre | Precio | Cantidad | Subtotal
// Si le pasas onEliminar, agrega una columna con botón "Eliminar" (solo para el carrito).
function TablaProductos({ items = [], onEliminar }) {
  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0" style={{ '--bs-table-bg': 'transparent' }}>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
            {onEliminar && <th className="d-print-none"></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.id}-${index}`}>
              <td>
                <img
                  src={obtenerRutaImagen(item)}
                  alt={item.nombre}
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }}
                />
              </td>
              <td className="fw-semibold">{item.nombre}</td>
              <td>{formatear(item.precio)}</td>
              <td>{item.cantidad}</td>
              <td>{formatear(item.precio * item.cantidad)}</td>
              {onEliminar && (
                <td className="d-print-none">
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => onEliminar(index)}>
                    Eliminar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TablaProductos
