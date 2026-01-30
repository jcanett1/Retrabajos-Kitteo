import { useState, useEffect } from 'react'
import { Search, Plus, Download, FileSpreadsheet, X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from './supabaseClient'

interface PartOption {
  id: string
  description: string
}

interface Hallazgo {
  id: string
  fecha: string
  area: string
  no_orden: string
  hallazgo: string
  no_parte: string
  cantidad: number
  usuario: string
  created_at?: string
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
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

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

  // Show notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Load parts data
  useEffect(() => {
    fetch('parts_data.json')
      .then(res => res.json())
      .then(data => setPartsOptions(data))
      .catch(err => console.error('Error loading parts:', err))
  }, [])

  // Load records from Supabase
  useEffect(() => {
    loadRegistros()
  }, [])

  const loadRegistros = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('hallazgoskitteo')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to match our interface
      const transformedData = data.map(item => ({
        id: item.id,
        fecha: item.fecha,
        area: item.area,
        noOrden: item.no_orden,
        hallazgo: item.hallazgo,
        noParte: item.no_parte,
        cantidad: item.cantidad,
        usuario: item.usuario,
        created_at: item.created_at
      }))

      setRegistros(transformedData)
    } catch (error) {
      console.error('Error loading records:', error)
      showNotification('error', 'Error al cargar los registros')
    } finally {
      setLoading(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fecha || !noOrden || !hallazgo || !noParte || !cantidad || !usuario) {
      showNotification('error', 'Por favor complete todos los campos')
      return
    }

    try {
      setLoading(true)

      // Insert into Supabase
      const { data, error } = await supabase
        .from('hallazgoskitteo')
        .insert([
          {
            fecha,
            area: 'KITTEO',
            no_orden: noOrden,
            hallazgo,
            no_parte: noParte,
            cantidad,
            usuario
          }
        ])
        .select()

      if (error) throw error

      showNotification('success', 'Hallazgo registrado exitosamente')

      // Reload records
      await loadRegistros()

      // Reset form
      setNoOrden('')
      setHallazgo('')
      setNoParte('')
      setNoParteDisplay('')
      setCantidad(1)
      setUsuario('')
    } catch (error) {
      console.error('Error saving record:', error)
      showNotification('error', 'Error al guardar el registro')
    } finally {
      setLoading(false)
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
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg px-8 py-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
            <span className="text-lg text-gray-800">Procesando...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-gray-700 to-gray-600 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">KITTEO</h1>
              <p className="text-gray-200">Sistema de Registro de Hallazgos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
            <Plus className="w-5 h-5" />
            Registrar Nuevo Hallazgo
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
                required
              />
            </div>

            {/* Area - Bloqueado como KITTEO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
              <input
                type="text"
                value="KITTEO"
                disabled
                className="w-full px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed font-semibold"
              />
            </div>

            {/* No. Orden */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Orden *</label>
              <input
                type="text"
                value={noOrden}
                onChange={e => setNoOrden(e.target.value)}
                placeholder="Número de orden"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
                required
              />
            </div>

            {/* Hallazgo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hallazgo *</label>
              <select
                value={hallazgo}
                onChange={e => setHallazgo(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">No. de Parte *</label>
              <button
                type="button"
                onClick={() => setShowPartsModal(true)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-transparent flex items-center justify-between text-gray-900"
              >
                <span className={noParteDisplay ? 'text-gray-900' : 'text-gray-500'}>
                  {noParteDisplay || 'Seleccionar número de parte...'}
                </span>
                <Search className="w-4 h-4 text-gray-500" />
              </button>
              {noParte && (
                <div className="mt-1 text-sm text-green-600">Seleccionado: {noParte}</div>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
              <input
                type="number"
                value={cantidad}
                onChange={e => setCantidad(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
                required
              />
            </div>

            {/* Usuario - Select */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario que Registra *</label>
              <select
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
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
                disabled={loading}
                className="w-full px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                Registrar Hallazgo
              </button>
            </div>
          </form>
        </div>

        {/* Records Section */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
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
            <div className="text-center py-12 text-gray-500">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay registros aún</p>
              <p className="text-sm">Los hallazgos registrados aparecerán aquí</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-200 text-left text-gray-800">
                    <th className="px-4 py-3 rounded-tl-lg">Fecha</th>
                    <th className="px-4 py-3">Área</th>
                    <th className="px-4 py-3">No. Orden</th>
                    <th className="px-4 py-3">Hallazgo</th>
                    <th className="px-4 py-3">No. de Parte</th>
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3 rounded-tr-lg">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((registro, idx) => (
                    <tr
                      key={registro.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 text-gray-900">{registro.fecha}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{registro.area}</td>
                      <td className="px-4 py-3 text-gray-900">{registro.noOrden}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm border border-yellow-300">
                          {registro.hallazgo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{registro.noParte}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900">{registro.cantidad}</td>
                      <td className="px-4 py-3 text-gray-700">{registro.usuario}</td>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Seleccionar Número de Parte</h3>
              <button
                onClick={() => {
                  setShowPartsModal(false)
                  setModalSearch('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  placeholder="Buscar por ID o descripción..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-lg text-gray-900"
                  autoFocus
                />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Mostrando {paginatedParts.length} de {filteredParts.length} resultados
              </div>
            </div>

            {/* Parts List */}
            <div className="flex-1 overflow-y-auto p-4">
              {paginatedParts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron resultados</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {paginatedParts.map(part => (
                    <div
                      key={part.id}
                      onClick={() => handleSelectPart(part)}
                      className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors border border-gray-200 hover:border-gray-400"
                    >
                      <div className="font-medium text-gray-800">{part.id}</div>
                      <div className="text-sm text-gray-600 truncate">{part.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Página</span>
                  <select
                    value={currentPage}
                    onChange={e => setCurrentPage(parseInt(e.target.value))}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-900"
                  >
                    {Array.from({ length: totalPages }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <span className="text-gray-600">de {totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
      <footer className="bg-white mt-8 py-4 text-center text-gray-600 text-sm border-t border-gray-200">
        <p>KITTEO - Sistema de Registro de Hallazgos &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
