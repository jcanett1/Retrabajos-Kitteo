import { useState, useEffect } from 'react'
import { Search, Plus, Trash2, Download, FileSpreadsheet, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface PartOption {
  id: string
  description: string
}

interface Hallazgo {
  id: string
  fecha: string
  area: string
  noOrden: string
  hallazgo: string
  noParte: string
  cantidad: number
  usuario: string
  timestamp: number
}

const HALLAZGO_OPTIONS = [
  'SHAFT EQUIVOCADO',
  'CABEZAL EQUIVOCADO',
  'HOSEL EQUIVOCADO',
  'GRIP EQUIVOCADO',
  'SHAFT FALTANTE',
  'CABEZAL FALTANTE',
  'GRIP FALTANTE',
  'HEADCOVER FALTANTE',
  'SHAFT EXTRA',
  'GRIP EXTRA',
  'SIN BANDERA Y SIN SELLO',
  'SHAFT MEZCLADO SIN ETIQUETA',
  'SHAFT MEZCLADO CON ETIQUETA'
]

const USUARIOS = [
  'OTTON',
  'CARMEN',
  'KARLA',
  'ADRIAN',
  'DENISE',
  'ALAN',
  'CINTYA',
  'ESTRELLA',
  'JUAN',
  'FAUSTO',
  'DIANA'
]

const ITEMS_PER_PAGE = 100

function App() {
  const [partsOptions, setPartsOptions] = useState<PartOption[]>([])
  const [registros, setRegistros] = useState<Hallazgo[]>([])

  // Modal state
  const [showPartsModal, setShowPartsModal] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Form state
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [noOrden, setNoOrden] = useState('')
  const [hallazgo, setHallazgo] = useState('')
  const [noParte, setNoParte] = useState('')
  const [noParteDisplay, setNoParteDisplay] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [usuario, setUsuario] = useState('')

  // Load parts data
  useEffect(() => {
   fetch('parts_data.json')
      .then(res => res.json())
      .then(data => setPartsOptions(data))
      .catch(err => console.error('Error loading parts:', err))
  }, [])

  // Load saved records from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kitteo_hallazgos')
    if (saved) {
      setRegistros(JSON.parse(saved))
    }
  }, [])

  // Save records to localStorage
  useEffect(() => {
    localStorage.setItem('kitteo_hallazgos', JSON.stringify(registros))
  }, [registros])

  // Filter parts based on search
  const filteredParts = partsOptions.filter(part =>
    part.id.toLowerCase().includes(modalSearch.toLowerCase()) ||
    part.description.toLowerCase().includes(modalSearch.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / ITEMS_PER_PAGE)
  const paginatedParts = filteredParts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [modalSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fecha || !noOrden || !hallazgo || !noParte || !cantidad || !usuario) {
      alert('Por favor complete todos los campos')
      return
    }

    const nuevoRegistro: Hallazgo = {
      id: Date.now().toString(),
      fecha,
      area: 'KITTEO',
      noOrden,
      hallazgo,
      noParte,
      cantidad,
      usuario,
      timestamp: Date.now()
    }

    setRegistros(prev => [nuevoRegistro, ...prev])

    // Reset form
    setNoOrden('')
    setHallazgo('')
    setNoParte('')
    setNoParteDisplay('')
    setCantidad(1)
    setUsuario('')
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro?')) {
      setRegistros(prev => prev.filter(r => r.id !== id))
    }
  }

  const handleSelectPart = (part: PartOption) => {
    setNoParte(part.id)
    setNoParteDisplay(`${part.id} - ${part.description}`)
    setShowPartsModal(false)
    setModalSearch('')
  }

  const exportToCSV = () => {
    const headers = ['Fecha', 'Area', 'No. Orden', 'Hallazgo', 'No. de Parte', 'Cantidad', 'Usuario']
    const csvContent = [
      headers.join(','),
      ...registros.map(r => [
        r.fecha,
        r.area,
        r.noOrden,
        `"${r.hallazgo}"`,
        r.noParte,
        r.cantidad,
        `"${r.usuario}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `kitteo_hallazgos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">KITTEO</h1>
              <p className="text-blue-200">Sistema de Registro de Hallazgos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Form Section */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Registrar Nuevo Hallazgo
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fecha *</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Area - Bloqueado como KITTEO */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Área</label>
              <input
                type="text"
                value="KITTEO"
                disabled
                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 cursor-not-allowed font-semibold"
              />
            </div>

            {/* No. Orden */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">No. Orden *</label>
              <input
                type="text"
                value={noOrden}
                onChange={e => setNoOrden(e.target.value)}
                placeholder="Número de orden"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Hallazgo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Hallazgo *</label>
              <select
                value={hallazgo}
                onChange={e => setHallazgo(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccione un hallazgo</option>
                {HALLAZGO_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* No. de Parte - Opens Modal */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">No. de Parte *</label>
              <button
                type="button"
                onClick={() => setShowPartsModal(true)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-left hover:bg-gray-650 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
              >
                <span className={noParteDisplay ? 'text-white' : 'text-gray-400'}>
                  {noParteDisplay || 'Seleccionar número de parte...'}
                </span>
                <Search className="w-4 h-4 text-gray-400" />
              </button>
              {noParte && (
                <div className="mt-1 text-sm text-green-400">Seleccionado: {noParte}</div>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Cantidad *</label>
              <input
                type="number"
                value={cantidad}
                onChange={e => setCantidad(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Usuario - Select */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Usuario que Registra *</label>
              <select
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccione un usuario</option>
                {USUARIOS.map(usr => (
                  <option key={usr} value={usr}>{usr}</option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Registrar Hallazgo
              </button>
            </div>
          </form>
        </div>

        {/* Records Section */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Registros ({registros.length})
            </h2>
            {registros.length > 0 && (
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            )}
          </div>

          {registros.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay registros aún</p>
              <p className="text-sm">Los hallazgos registrados aparecerán aquí</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700 text-left">
                    <th className="px-4 py-3 rounded-tl-lg">Fecha</th>
                    <th className="px-4 py-3">Área</th>
                    <th className="px-4 py-3">No. Orden</th>
                    <th className="px-4 py-3">Hallazgo</th>
                    <th className="px-4 py-3">No. de Parte</th>
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3 rounded-tr-lg">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((registro, idx) => (
                    <tr
                      key={registro.id}
                      className={`border-b border-gray-700 hover:bg-gray-700/50 ${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}
                    >
                      <td className="px-4 py-3">{registro.fecha}</td>
                      <td className="px-4 py-3 font-medium text-blue-400">{registro.area}</td>
                      <td className="px-4 py-3">{registro.noOrden}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-yellow-600/30 text-yellow-300 rounded text-sm">
                          {registro.hallazgo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{registro.noParte}</td>
                      <td className="px-4 py-3 text-center font-medium">{registro.cantidad}</td>
                      <td className="px-4 py-3 text-gray-300">{registro.usuario}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(registro.id)}
                          className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Parts Selection Modal */}
      {showPartsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Seleccionar Número de Parte</h3>
              <button
                onClick={() => {
                  setShowPartsModal(false)
                  setModalSearch('')
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  placeholder="Buscar por ID o descripción..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  autoFocus
                />
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Mostrando {paginatedParts.length} de {filteredParts.length} resultados
              </div>
            </div>

            {/* Parts List */}
            <div className="flex-1 overflow-y-auto p-4">
              {paginatedParts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No se encontraron resultados</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {paginatedParts.map(part => (
                    <div
                      key={part.id}
                      onClick={() => handleSelectPart(part)}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors border border-gray-600 hover:border-blue-500"
                    >
                      <div className="font-medium text-blue-400">{part.id}</div>
                      <div className="text-sm text-gray-300 truncate">{part.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Página</span>
                  <select
                    value={currentPage}
                    onChange={e => setCurrentPage(parseInt(e.target.value))}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    {Array.from({ length: totalPages }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <span className="text-gray-400">de {totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 mt-8 py-4 text-center text-gray-400 text-sm">
        <p>KITTEO - Sistema de Registro de Hallazgos &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
