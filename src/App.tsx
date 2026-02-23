import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Download, FileSpreadsheet, X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Filter } from 'lucide-react'
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
  usuario_kitteo?: string
  no_parte_requerido?: string
  created_at?: string
  // mapped fields
  noOrden?: string
  noParte?: string
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

const RECORDS_PER_PAGE = 100
const PARTS_PER_PAGE = 100

function App() {
  const [partsOptions, setPartsOptions] = useState<PartOption[]>([])
  const [registros, setRegistros] = useState<Hallazgo[]>([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Modal state - No. de Parte
  const [showPartsModal, setShowPartsModal] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [currentPartsPage, setCurrentPartsPage] = useState(1)

  // Modal state - No. de Parte REQUERIDO
  const [showPartsRequeridoModal, setShowPartsRequeridoModal] = useState(false)
  const [modalRequeridoSearch, setModalRequeridoSearch] = useState('')
  const [currentPartsRequeridoPage, setCurrentPartsRequeridoPage] = useState(1)

  // Form state
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [noOrden, setNoOrden] = useState('')
  const [hallazgo, setHallazgo] = useState('')
  const [noParte, setNoParte] = useState('')
  const [noParteDisplay, setNoParteDisplay] = useState('')
  const [noParteRequerido, setNoParteRequerido] = useState('')
  const [noParteRequeridoDisplay, setNoParteRequeridoDisplay] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [usuario, setUsuario] = useState('')
  const [usuarioKitteo, setUsuarioKitteo] = useState('')

  // Filter state
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [filterUsuario, setFilterUsuario] = useState('')

  // Pagination state for records list
  const [recordsPage, setRecordsPage] = useState(1)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  useEffect(() => {
    fetch('parts_data.json')
      .then(res => res.json())
      .then(data => setPartsOptions(data))
      .catch(err => console.error('Error loading parts:', err))
  }, [])

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

      const transformedData = data.map(item => ({
        id: item.id,
        fecha: item.fecha,
        area: item.area,
        no_orden: item.no_orden,
        noOrden: item.no_orden,
        hallazgo: item.hallazgo,
        no_parte: item.no_parte,
        noParte: item.no_parte,
        cantidad: item.cantidad,
        usuario: item.usuario,
        usuario_kitteo: item.usuario_kitteo,
        no_parte_requerido: item.no_parte_requerido,
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

  // --- Parts modal filtering ---
  const filteredParts = partsOptions.filter(part =>
    part.id.toLowerCase().includes(modalSearch.toLowerCase()) ||
    part.description.toLowerCase().includes(modalSearch.toLowerCase())
  )
  const totalPartsPages = Math.ceil(filteredParts.length / PARTS_PER_PAGE)
  const paginatedParts = filteredParts.slice(
    (currentPartsPage - 1) * PARTS_PER_PAGE,
    currentPartsPage * PARTS_PER_PAGE
  )

  const filteredPartsRequerido = partsOptions.filter(part =>
    part.id.toLowerCase().includes(modalRequeridoSearch.toLowerCase()) ||
    part.description.toLowerCase().includes(modalRequeridoSearch.toLowerCase())
  )
  const totalPartsRequeridoPages = Math.ceil(filteredPartsRequerido.length / PARTS_PER_PAGE)
  const paginatedPartsRequerido = filteredPartsRequerido.slice(
    (currentPartsRequeridoPage - 1) * PARTS_PER_PAGE,
    currentPartsRequeridoPage * PARTS_PER_PAGE
  )

  useEffect(() => { setCurrentPartsPage(1) }, [modalSearch])
  useEffect(() => { setCurrentPartsRequeridoPage(1) }, [modalRequeridoSearch])

  // --- Records filtering ---
  const filteredRegistros = useMemo(() => {
    return registros.filter(r => {
      if (filterFechaDesde && r.fecha < filterFechaDesde) return false
      if (filterFechaHasta && r.fecha > filterFechaHasta) return false
      if (filterUsuario && r.usuario !== filterUsuario) return false
      return true
    })
  }, [registros, filterFechaDesde, filterFechaHasta, filterUsuario])

  // Reset records page when filters change
  useEffect(() => { setRecordsPage(1) }, [filterFechaDesde, filterFechaHasta, filterUsuario])

  const totalRecordsPages = Math.ceil(filteredRegistros.length / RECORDS_PER_PAGE)
  const paginatedRegistros = filteredRegistros.slice(
    (recordsPage - 1) * RECORDS_PER_PAGE,
    recordsPage * RECORDS_PER_PAGE
  )

  const clearFilters = () => {
    setFilterFechaDesde('')
    setFilterFechaHasta('')
    setFilterUsuario('')
  }

  const hasActiveFilters = filterFechaDesde || filterFechaHasta || filterUsuario

  // --- Form submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fecha || !noOrden || !hallazgo || !noParte || !noParteRequerido || !cantidad || !usuario || !usuarioKitteo) {
      showNotification('error', 'Por favor complete todos los campos')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('hallazgoskitteo')
        .insert([{
          fecha,
          area: 'KITTEO',
          no_orden: noOrden,
          hallazgo,
          no_parte: noParte,
          no_parte_requerido: noParteRequerido,
          cantidad,
          usuario,
          usuario_kitteo: usuarioKitteo
        }])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      showNotification('success', 'Hallazgo registrado exitosamente')
      await loadRegistros()

      setNoOrden('')
      setHallazgo('')
      setNoParte('')
      setNoParteDisplay('')
      setNoParteRequerido('')
      setNoParteRequeridoDisplay('')
      setCantidad(1)
      setUsuario('')
      setUsuarioKitteo('')
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

  const handleSelectPartRequerido = (part: PartOption) => {
    setNoParteRequerido(part.id)
    setNoParteRequeridoDisplay(`${part.id} - ${part.description}`)
    setShowPartsRequeridoModal(false)
    setModalRequeridoSearch('')
  }

  const exportToCSV = () => {
    const headers = ['Fecha', 'Area', 'No. Orden', 'Hallazgo', 'No. de Parte', 'No. de Parte Requerido', 'Cantidad', 'Usuario', 'Usuario Kitteo']
    const csvContent = [
      headers.join(','),
      ...filteredRegistros.map(r => [
        r.fecha,
        r.area,
        r.noOrden,
        `"${r.hallazgo}"`,
        r.noParte,
        r.no_parte_requerido || '',
        r.cantidad,
        `"${r.usuario}"`,
        `"${r.usuario_kitteo || ''}"`
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
        } text-white`}>
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
              <h1 className="text-3xl font-bold">PXG KITTEO</h1>
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

            {/* Area */}
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

            {/* No. de Parte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. de Parte *</label>
              <button
                type="button"
                onClick={() => setShowPartsModal(true)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-transparent flex items-center justify-between text-gray-900"
              >
                <span className={`truncate ${noParteDisplay ? 'text-gray-900' : 'text-gray-500'}`}>
                  {noParteDisplay || 'Seleccionar número de parte...'}
                </span>
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {noParte && (
                <div className="mt-1 text-sm text-green-600">Seleccionado: {noParte}</div>
              )}
            </div>

            {/* No. de Parte REQUERIDO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. de Parte REQUERIDO *</label>
              <button
                type="button"
                onClick={() => setShowPartsRequeridoModal(true)}
                className="w-full px-4 py-2 bg-white border border-blue-400 rounded-lg text-left hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between text-gray-900"
              >
                <span className={`truncate ${noParteRequeridoDisplay ? 'text-gray-900' : 'text-gray-500'}`}>
                  {noParteRequeridoDisplay || 'Seleccionar parte requerida...'}
                </span>
                <Search className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />
              </button>
              {noParteRequerido && (
                <div className="mt-1 text-sm text-blue-600">Seleccionado: {noParteRequerido}</div>
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

            {/* Usuario */}
            <div>
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

            {/* Usuario de Kitteo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario de Kitteo *</label>
              <input
                type="text"
                value={usuarioKitteo}
                onChange={e => setUsuarioKitteo(e.target.value.toUpperCase())}
                placeholder="Nombre o iniciales"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
                required
              />
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
          {/* Header row */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Registros
              <span className="text-sm font-normal text-gray-500">
                ({filteredRegistros.length} {hasActiveFilters ? 'filtrados de ' + registros.length : 'total'})
              </span>
            </h2>
            {registros.length > 0 && (
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Filtros</span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Limpiar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Fecha Desde */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha desde</label>
                <input
                  type="date"
                  value={filterFechaDesde}
                  onChange={e => setFilterFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900"
                />
              </div>
              {/* Fecha Hasta */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha hasta</label>
                <input
                  type="date"
                  value={filterFechaHasta}
                  onChange={e => setFilterFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900"
                />
              </div>
              {/* Usuario */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Usuario que registra</label>
                <select
                  value={filterUsuario}
                  onChange={e => setFilterUsuario(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900"
                >
                  <option value="">Todos los usuarios</option>
                  {USUARIOS.map(usr => (
                    <option key={usr} value={usr}>{usr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          {filteredRegistros.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50" />
              {registros.length === 0 ? (
                <>
                  <p>No hay registros aún</p>
                  <p className="text-sm">Los hallazgos registrados aparecerán aquí</p>
                </>
              ) : (
                <>
                  <p>No hay registros que coincidan con los filtros</p>
                  <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline">
                    Limpiar filtros
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-200 text-left text-gray-800">
                      <th className="px-4 py-3 rounded-tl-lg">Fecha</th>
                      <th className="px-4 py-3">Área</th>
                      <th className="px-4 py-3">No. Orden</th>
                      <th className="px-4 py-3">Hallazgo</th>
                      <th className="px-4 py-3">No. de Parte</th>
                      <th className="px-4 py-3">No. de Parte Requerido</th>
                      <th className="px-4 py-3">Cantidad</th>
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3 rounded-tr-lg">Usuario Kitteo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRegistros.map((registro, idx) => (
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
                        <td className="px-4 py-3 text-sm">
                          {registro.no_parte_requerido ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm border border-blue-300">
                              {registro.no_parte_requerido}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-900">{registro.cantidad}</td>
                        <td className="px-4 py-3 text-gray-700">{registro.usuario}</td>
                        <td className="px-4 py-3 text-gray-700">{registro.usuario_kitteo || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination for records */}
              {totalRecordsPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {((recordsPage - 1) * RECORDS_PER_PAGE) + 1}–{Math.min(recordsPage * RECORDS_PER_PAGE, filteredRegistros.length)} de {filteredRegistros.length} registros
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRecordsPage(p => Math.max(1, p - 1))}
                      disabled={recordsPage === 1}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-600">Página</span>
                      <select
                        value={recordsPage}
                        onChange={e => setRecordsPage(parseInt(e.target.value))}
                        className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-900"
                      >
                        {Array.from({ length: totalRecordsPages }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-600">de {totalRecordsPages}</span>
                    </div>
                    <button
                      onClick={() => setRecordsPage(p => Math.min(totalRecordsPages, p + 1))}
                      disabled={recordsPage === totalRecordsPages}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal: No. de Parte */}
      {showPartsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Seleccionar Número de Parte</h3>
              <button
                onClick={() => { setShowPartsModal(false); setModalSearch('') }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
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
            <div className="flex-1 overflow-y-auto p-4">
              {paginatedParts.length === 0 ? (
                <div className="text-center py-8 text-gray-500"><p>No se encontraron resultados</p></div>
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
            {totalPartsPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPartsPage(p => Math.max(1, p - 1))}
                  disabled={currentPartsPage === 1}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Página</span>
                  <select
                    value={currentPartsPage}
                    onChange={e => setCurrentPartsPage(parseInt(e.target.value))}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-900"
                  >
                    {Array.from({ length: totalPartsPages }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <span className="text-gray-600">de {totalPartsPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPartsPage(p => Math.min(totalPartsPages, p + 1))}
                  disabled={currentPartsPage === totalPartsPages}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: No. de Parte REQUERIDO */}
      {showPartsRequeridoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-blue-200 flex justify-between items-center bg-blue-50 rounded-t-xl">
              <h3 className="text-xl font-semibold text-blue-800">Seleccionar No. de Parte REQUERIDO</h3>
              <button
                onClick={() => { setShowPartsRequeridoModal(false); setModalRequeridoSearch('') }}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-blue-600" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type="text"
                  value={modalRequeridoSearch}
                  onChange={e => setModalRequeridoSearch(e.target.value)}
                  placeholder="Buscar por ID o descripción..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
                  autoFocus
                />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Mostrando {paginatedPartsRequerido.length} de {filteredPartsRequerido.length} resultados
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {paginatedPartsRequerido.length === 0 ? (
                <div className="text-center py-8 text-gray-500"><p>No se encontraron resultados</p></div>
              ) : (
                <div className="grid gap-2">
                  {paginatedPartsRequerido.map(part => (
                    <div
                      key={part.id}
                      onClick={() => handleSelectPartRequerido(part)}
                      className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors border border-blue-200 hover:border-blue-400"
                    >
                      <div className="font-medium text-blue-800">{part.id}</div>
                      <div className="text-sm text-blue-600 truncate">{part.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {totalPartsRequeridoPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPartsRequeridoPage(p => Math.max(1, p - 1))}
                  disabled={currentPartsRequeridoPage === 1}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Página</span>
                  <select
                    value={currentPartsRequeridoPage}
                    onChange={e => setCurrentPartsRequeridoPage(parseInt(e.target.value))}
                    className="px-3 py-1 bg-white border border-blue-300 rounded-lg text-gray-900"
                  >
                    {Array.from({ length: totalPartsRequeridoPages }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <span className="text-gray-600">de {totalPartsRequeridoPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPartsRequeridoPage(p => Math.min(totalPartsRequeridoPages, p + 1))}
                  disabled={currentPartsRequeridoPage === totalPartsRequeridoPages}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white mt-8 py-4 text-center text-gray-600 text-sm border-t border-gray-200">
        <p>PXG KITTEO - Sistema de Registro de Hallazgos &copy; {new Date().getFullYear()}</p>
        <p>Creado por IT PXG trquila - julio canett para soporte</p>
      </footer>
    </div>
  )
}

export default App
