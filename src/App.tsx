import { useState, useEffect, useMemo } from 'react'
import {
  Search, Plus, Download, FileSpreadsheet, X,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle,
  Filter, BarChart2, ClipboardList
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
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
  'OTTON', 'CARMEN', 'KARLA', 'ADRIAN', 'DENISE',
  'ALAN', 'CINTYA', 'ESTRELLA', 'JUAN', 'FAUSTO', 'DIANA'
]

const RECORDS_PER_PAGE = 100
const PARTS_PER_PAGE = 100

const FREQ_COLORS: Record<string, string> = {
  '1-2 veces': '#f59e0b',
  '2-5 veces': '#3b82f6',
  'Más de 5 veces': '#ef4444',
}

const PIE_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
]

// ─── Custom Tooltip for Bar Chart ───────────────────────────────────────────
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
        <p className="font-semibold text-gray-800 mb-1">{d.hallazgo}</p>
        <p className="text-gray-600">No. Parte: <span className="font-medium text-gray-900">{d.no_parte}</span></p>
        <p className="text-gray-600">Frecuencia: <span className="font-bold" style={{ color: FREQ_COLORS[d.frecuencia] }}>{d.frecuencia}</span></p>
        <p className="text-gray-600">Total registros: <span className="font-bold text-gray-900">{d.count}</span></p>
      </div>
    )
  }
  return null
}

// ─── Custom Tooltip for Pie Chart ───────────────────────────────────────────
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-gray-600">Registros: <span className="font-bold text-gray-900">{payload[0].value}</span></p>
      </div>
    )
  }
  return null
}

function App() {
  const [activeTab, setActiveTab] = useState<'registros' | 'dashboard'>('registros')
  const [partsOptions, setPartsOptions] = useState<PartOption[]>([])
  const [registros, setRegistros] = useState<Hallazgo[]>([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal: No. de Parte
  const [showPartsModal, setShowPartsModal] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [currentPartsPage, setCurrentPartsPage] = useState(1)

  // Modal: No. de Parte REQUERIDO
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

  // Filter state (listado)
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [filterUsuario, setFilterUsuario] = useState('')
  const [recordsPage, setRecordsPage] = useState(1)

  // Dashboard filter state
  const [dashFilterNoParte, setDashFilterNoParte] = useState('')
  const [dashFilterNoParteInput, setDashFilterNoParteInput] = useState('')
  const [showDashPartsModal, setShowDashPartsModal] = useState(false)
  const [dashModalSearch, setDashModalSearch] = useState('')
  const [currentDashPartsPage, setCurrentDashPartsPage] = useState(1)

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

  useEffect(() => { loadRegistros() }, [])

  const loadRegistros = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('hallazgoskitteo')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setRegistros(data.map(item => ({
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
      })))
    } catch (error) {
      showNotification('error', 'Error al cargar los registros')
    } finally {
      setLoading(false)
    }
  }

  // ─── Parts modal filtering ────────────────────────────────────────────────
  const filteredParts = partsOptions.filter(p =>
    p.id.toLowerCase().includes(modalSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(modalSearch.toLowerCase())
  )
  const totalPartsPages = Math.ceil(filteredParts.length / PARTS_PER_PAGE)
  const paginatedParts = filteredParts.slice((currentPartsPage - 1) * PARTS_PER_PAGE, currentPartsPage * PARTS_PER_PAGE)

  const filteredPartsRequerido = partsOptions.filter(p =>
    p.id.toLowerCase().includes(modalRequeridoSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(modalRequeridoSearch.toLowerCase())
  )
  const totalPartsRequeridoPages = Math.ceil(filteredPartsRequerido.length / PARTS_PER_PAGE)
  const paginatedPartsRequerido = filteredPartsRequerido.slice((currentPartsRequeridoPage - 1) * PARTS_PER_PAGE, currentPartsRequeridoPage * PARTS_PER_PAGE)

  const filteredDashParts = partsOptions.filter(p =>
    p.id.toLowerCase().includes(dashModalSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(dashModalSearch.toLowerCase())
  )
  const totalDashPartsPages = Math.ceil(filteredDashParts.length / PARTS_PER_PAGE)
  const paginatedDashParts = filteredDashParts.slice((currentDashPartsPage - 1) * PARTS_PER_PAGE, currentDashPartsPage * PARTS_PER_PAGE)

  useEffect(() => { setCurrentPartsPage(1) }, [modalSearch])
  useEffect(() => { setCurrentPartsRequeridoPage(1) }, [modalRequeridoSearch])
  useEffect(() => { setCurrentDashPartsPage(1) }, [dashModalSearch])

  // ─── Records filtering ────────────────────────────────────────────────────
  const filteredRegistros = useMemo(() => registros.filter(r => {
    if (filterFechaDesde && r.fecha < filterFechaDesde) return false
    if (filterFechaHasta && r.fecha > filterFechaHasta) return false
    if (filterUsuario && r.usuario !== filterUsuario) return false
    return true
  }), [registros, filterFechaDesde, filterFechaHasta, filterUsuario])

  useEffect(() => { setRecordsPage(1) }, [filterFechaDesde, filterFechaHasta, filterUsuario])

  const totalRecordsPages = Math.ceil(filteredRegistros.length / RECORDS_PER_PAGE)
  const paginatedRegistros = filteredRegistros.slice((recordsPage - 1) * RECORDS_PER_PAGE, recordsPage * RECORDS_PER_PAGE)
  const hasActiveFilters = filterFechaDesde || filterFechaHasta || filterUsuario

  const clearFilters = () => { setFilterFechaDesde(''); setFilterFechaHasta(''); setFilterUsuario('') }

  // ─── Dashboard data ───────────────────────────────────────────────────────

  // Base dataset for dashboard (filtered by no_parte if selected)
  const dashBase = useMemo(() => {
    if (!dashFilterNoParte) return registros
    return registros.filter(r => r.no_parte === dashFilterNoParte)
  }, [registros, dashFilterNoParte])

  // 1. Hallazgo + No. de Parte combinados con frecuencia
  const hallazgoParteData = useMemo(() => {
    const counts: Record<string, { hallazgo: string; no_parte: string; count: number }> = {}
    dashBase.forEach(r => {
      const key = `${r.hallazgo}||${r.no_parte}`
      if (!counts[key]) counts[key] = { hallazgo: r.hallazgo, no_parte: r.no_parte, count: 0 }
      counts[key].count += 1
    })
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .map(d => ({
        ...d,
        label: `${d.hallazgo}\n(${d.no_parte})`,
        shortLabel: d.no_parte,
        frecuencia: d.count <= 2 ? '1-2 veces' : d.count <= 5 ? '2-5 veces' : 'Más de 5 veces'
      }))
  }, [dashBase])

  // Grouped by frequency for summary cards
  const freqSummary = useMemo(() => {
    const groups: Record<string, number> = { '1-2 veces': 0, '2-5 veces': 0, 'Más de 5 veces': 0 }
    hallazgoParteData.forEach(d => { groups[d.frecuencia] += 1 })
    return groups
  }, [hallazgoParteData])

  // 2. Hallazgo type distribution (pie)
  const hallazgoDistData = useMemo(() => {
    const counts: Record<string, number> = {}
    dashBase.forEach(r => { counts[r.hallazgo] = (counts[r.hallazgo] || 0) + 1 })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [dashBase])

  // 3. Top usuarios de kitteo
  const usuarioKitteoData = useMemo(() => {
    const counts: Record<string, number> = {}
    dashBase.forEach(r => {
      const uk = r.usuario_kitteo || 'SIN ASIGNAR'
      counts[uk] = (counts[uk] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [dashBase])

  // ─── Form submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fecha || !noOrden || !hallazgo || !noParte || !noParteRequerido || !cantidad || !usuario || !usuarioKitteo) {
      showNotification('error', 'Por favor complete todos los campos')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.from('hallazgoskitteo').insert([{
        fecha, area: 'KITTEO', no_orden: noOrden, hallazgo,
        no_parte: noParte, no_parte_requerido: noParteRequerido,
        cantidad, usuario, usuario_kitteo: usuarioKitteo
      }]).select()
      if (error) throw error
      showNotification('success', 'Hallazgo registrado exitosamente')
      await loadRegistros()
      setNoOrden(''); setHallazgo(''); setNoParte(''); setNoParteDisplay('')
      setNoParteRequerido(''); setNoParteRequeridoDisplay('')
      setCantidad(1); setUsuario(''); setUsuarioKitteo('')
    } catch (error) {
      showNotification('error', 'Error al guardar el registro')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPart = (part: PartOption) => {
    setNoParte(part.id); setNoParteDisplay(`${part.id} - ${part.description}`)
    setShowPartsModal(false); setModalSearch('')
  }
  const handleSelectPartRequerido = (part: PartOption) => {
    setNoParteRequerido(part.id); setNoParteRequeridoDisplay(`${part.id} - ${part.description}`)
    setShowPartsRequeridoModal(false); setModalRequeridoSearch('')
  }
  const handleSelectDashPart = (part: PartOption) => {
    setDashFilterNoParte(part.id); setDashFilterNoParteInput(`${part.id} - ${part.description}`)
    setShowDashPartsModal(false); setDashModalSearch('')
  }
  const clearDashFilter = () => { setDashFilterNoParte(''); setDashFilterNoParteInput('') }

  const exportToCSV = () => {
    const headers = ['Fecha', 'Area', 'No. Orden', 'Hallazgo', 'No. de Parte', 'No. de Parte Requerido', 'Cantidad', 'Usuario', 'Usuario Kitteo']
    const csvContent = [
      headers.join(','),
      ...filteredRegistros.map(r => [
        r.fecha, r.area, r.noOrden, `"${r.hallazgo}"`, r.noParte,
        r.no_parte_requerido || '', r.cantidad, `"${r.usuario}"`, `"${r.usuario_kitteo || ''}"`
      ].join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `kitteo_hallazgos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 text-white ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Loading */}
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
        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('registros')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'registros'
                ? 'bg-gray-700 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Registros
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            Dashboard
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB: REGISTROS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'registros' && (
          <>
            {/* Form */}
            <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <Plus className="w-5 h-5" /> Registrar Nuevo Hallazgo
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-900" required />
                </div>
                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                  <input type="text" value="KITTEO" disabled
                    className="w-full px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed font-semibold" />
                </div>
                {/* No. Orden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Orden *</label>
                  <input type="text" value={noOrden} onChange={e => setNoOrden(e.target.value)} placeholder="Número de orden"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-900" required />
                </div>
                {/* Hallazgo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hallazgo *</label>
                  <select value={hallazgo} onChange={e => setHallazgo(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-900" required>
                    <option value="">Seleccione un hallazgo</option>
                    {HALLAZGO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {/* No. de Parte */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. de Parte *</label>
                  <button type="button" onClick={() => setShowPartsModal(true)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 flex items-center justify-between text-gray-900">
                    <span className={`truncate ${noParteDisplay ? 'text-gray-900' : 'text-gray-500'}`}>
                      {noParteDisplay || 'Seleccionar número de parte...'}
                    </span>
                    <Search className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                  </button>
                  {noParte && <div className="mt-1 text-sm text-green-600">Seleccionado: {noParte}</div>}
                </div>
                {/* No. de Parte REQUERIDO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. de Parte REQUERIDO *</label>
                  <button type="button" onClick={() => setShowPartsRequeridoModal(true)}
                    className="w-full px-4 py-2 bg-white border border-blue-400 rounded-lg text-left hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 flex items-center justify-between text-gray-900">
                    <span className={`truncate ${noParteRequeridoDisplay ? 'text-gray-900' : 'text-gray-500'}`}>
                      {noParteRequeridoDisplay || 'Seleccionar parte requerida...'}
                    </span>
                    <Search className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />
                  </button>
                  {noParteRequerido && <div className="mt-1 text-sm text-blue-600">Seleccionado: {noParteRequerido}</div>}
                </div>
                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                  <input type="number" value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 1)} min="1"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-900" required />
                </div>
                {/* Usuario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario que Registra *</label>
                  <select value={usuario} onChange={e => setUsuario(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-900" required>
                    <option value="">Seleccione un usuario</option>
                    {USUARIOS.map(usr => <option key={usr} value={usr}>{usr}</option>)}
                  </select>
                </div>
                {/* Usuario Kitteo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario de Kitteo *</label>
                  <input type="text" value={usuarioKitteo} onChange={e => setUsuarioKitteo(e.target.value.toUpperCase())} placeholder="Nombre o iniciales"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-900" required />
                </div>
                {/* Submit */}
                <div className="flex items-end">
                  <button type="submit" disabled={loading}
                    className="w-full px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <Plus className="w-5 h-5" /> Registrar Hallazgo
                  </button>
                </div>
              </form>
            </div>

            {/* Records list */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Registros
                  <span className="text-sm font-normal text-gray-500">
                    ({filteredRegistros.length}{hasActiveFilters ? ` filtrados de ${registros.length}` : ' total'})
                  </span>
                </h2>
                {registros.length > 0 && (
                  <button onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" /> Exportar CSV
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">Filtros</span>
                  {hasActiveFilters && (
                    <button onClick={clearFilters}
                      className="ml-auto text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full flex items-center gap-1">
                      <X className="w-3 h-3" /> Limpiar filtros
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha desde</label>
                    <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha hasta</label>
                    <input type="date" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Usuario que registra</label>
                    <select value={filterUsuario} onChange={e => setFilterUsuario(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900">
                      <option value="">Todos los usuarios</option>
                      {USUARIOS.map(usr => <option key={usr} value={usr}>{usr}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {filteredRegistros.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  {registros.length === 0 ? (
                    <><p>No hay registros aún</p><p className="text-sm">Los hallazgos registrados aparecerán aquí</p></>
                  ) : (
                    <><p>No hay registros que coincidan con los filtros</p>
                      <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline">Limpiar filtros</button></>
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
                        {paginatedRegistros.map((r, idx) => (
                          <tr key={r.id} className={`border-b border-gray-200 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-4 py-3 text-gray-900">{r.fecha}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">{r.area}</td>
                            <td className="px-4 py-3 text-gray-900">{r.noOrden}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm border border-yellow-300">{r.hallazgo}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{r.noParte}</td>
                            <td className="px-4 py-3 text-sm">
                              {r.no_parte_requerido
                                ? <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm border border-blue-300">{r.no_parte_requerido}</span>
                                : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-4 py-3 text-center font-medium text-gray-900">{r.cantidad}</td>
                            <td className="px-4 py-3 text-gray-700">{r.usuario}</td>
                            <td className="px-4 py-3 text-gray-700">{r.usuario_kitteo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalRecordsPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {((recordsPage - 1) * RECORDS_PER_PAGE) + 1}–{Math.min(recordsPage * RECORDS_PER_PAGE, filteredRegistros.length)} de {filteredRegistros.length} registros
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setRecordsPage(p => Math.max(1, p - 1))} disabled={recordsPage === 1}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm">
                          <ChevronLeft className="w-4 h-4" /> Anterior
                        </button>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600">Página</span>
                          <select value={recordsPage} onChange={e => setRecordsPage(parseInt(e.target.value))}
                            className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-900">
                            {Array.from({ length: totalRecordsPages }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                          <span className="text-sm text-gray-600">de {totalRecordsPages}</span>
                        </div>
                        <button onClick={() => setRecordsPage(p => Math.min(totalRecordsPages, p + 1))} disabled={recordsPage === totalRecordsPages}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm">
                          Siguiente <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: DASHBOARD
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Dashboard header + filter */}
            <div className="bg-white rounded-xl shadow-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
                    <BarChart2 className="w-6 h-6" /> Dashboard de Hallazgos
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {dashFilterNoParte
                      ? `Mostrando datos para No. de Parte: ${dashFilterNoParte} — ${dashBase.length} registros`
                      : `Total de registros analizados: ${registros.length}`}
                  </p>
                </div>
                {/* Filter by No. de Parte */}
                <div className="flex items-center gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Filtrar por No. de Parte</label>
                    <button type="button" onClick={() => setShowDashPartsModal(true)}
                      className="px-4 py-2 bg-white border border-indigo-300 rounded-lg text-left hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-400 flex items-center gap-2 text-gray-900 min-w-[220px]">
                      <span className={`truncate text-sm ${dashFilterNoParteInput ? 'text-gray-900' : 'text-gray-400'}`}>
                        {dashFilterNoParteInput || 'Todos los números de parte'}
                      </span>
                      <Search className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-auto" />
                    </button>
                  </div>
                  {dashFilterNoParte && (
                    <button onClick={clearDashFilter}
                      className="mt-5 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors" title="Quitar filtro">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Summary cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(freqSummary).map(([label, count]) => (
                <div key={label} className="bg-white rounded-xl shadow p-5 flex items-center gap-4 border-l-4"
                  style={{ borderColor: FREQ_COLORS[label] }}>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Combinaciones con frecuencia</p>
                    <p className="text-lg font-bold" style={{ color: FREQ_COLORS[label] }}>{label}</p>
                  </div>
                  <div className="text-4xl font-extrabold" style={{ color: FREQ_COLORS[label] }}>{count}</div>
                </div>
              ))}
            </div>

            {/* ── Chart 1: Hallazgo + No. de Parte por frecuencia ── */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Hallazgos más comunes por No. de Parte
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Combinación de tipo de hallazgo y número de parte — color indica frecuencia de repetición
              </p>
              {hallazgoParteData.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(300, hallazgoParteData.length * 38)}>
                  <BarChart
                    data={hallazgoParteData}
                    layout="vertical"
                    margin={{ top: 4, right: 40, left: 10, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="shortLabel"
                      width={110}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v, i) => {
                        const d = hallazgoParteData[i]
                        return d ? `${d.no_parte}` : v
                      }}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 12 }}>
                      {hallazgoParteData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FREQ_COLORS[entry.frecuencia]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {Object.entries(FREQ_COLORS).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                    <span className="text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Chart 2 + 3 side by side ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie: Distribución de tipos de hallazgo */}
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Distribución por tipo de hallazgo</h3>
                <p className="text-sm text-gray-500 mb-4">Proporción de cada tipo de hallazgo en el total de registros</p>
                {hallazgoDistData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={hallazgoDistData}
                        cx="50%"
                        cy="45%"
                        outerRadius={110}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {hallazgoDistData.map((_, index) => (
                          <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend
                        formatter={(value) => <span className="text-xs text-gray-700">{value}</span>}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Bar: Top usuarios de Kitteo */}
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Top usuarios de Kitteo</h3>
                <p className="text-sm text-gray-500 mb-4">Usuarios con más hallazgos registrados a su nombre</p>
                {usuarioKitteoData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={usuarioKitteoData}
                      layout="vertical"
                      margin={{ top: 4, right: 40, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`${value} registros`, 'Total']} />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}
                        label={{ position: 'right', fontSize: 12 }}>
                        {usuarioKitteoData.map((_, index) => (
                          <Cell key={`uk-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Detail table ── */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle: Hallazgo + No. de Parte</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left text-gray-700">
                      <th className="px-4 py-3 rounded-tl-lg">#</th>
                      <th className="px-4 py-3">Tipo de Hallazgo</th>
                      <th className="px-4 py-3">No. de Parte</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3 rounded-tr-lg">Frecuencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallazgoParteData.map((d, idx) => (
                      <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs border border-yellow-200">{d.hallazgo}</span>
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-800">{d.no_parte}</td>
                        <td className="px-4 py-2 text-center font-bold text-gray-900">{d.count}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold text-white"
                            style={{ backgroundColor: FREQ_COLORS[d.frecuencia] }}>
                            {d.frecuencia}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {hallazgoParteData.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin datos para mostrar</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal: No. de Parte ── */}
      {showPartsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Seleccionar Número de Parte</h3>
              <button onClick={() => { setShowPartsModal(false); setModalSearch('') }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={modalSearch} onChange={e => setModalSearch(e.target.value)} autoFocus
                  placeholder="Buscar por ID o descripción..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-lg text-gray-900" />
              </div>
              <div className="mt-2 text-sm text-gray-600">Mostrando {paginatedParts.length} de {filteredParts.length} resultados</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {paginatedParts.map(part => (
                  <div key={part.id} onClick={() => handleSelectPart(part)}
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer border border-gray-200 hover:border-gray-400">
                    <div className="font-medium text-gray-800">{part.id}</div>
                    <div className="text-sm text-gray-600 truncate">{part.description}</div>
                  </div>
                ))}
              </div>
            </div>
            {totalPartsPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button onClick={() => setCurrentPartsPage(p => Math.max(1, p - 1))} disabled={currentPartsPage === 1}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Página</span>
                  <select value={currentPartsPage} onChange={e => setCurrentPartsPage(parseInt(e.target.value))}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-900">
                    {Array.from({ length: totalPartsPages }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                  <span className="text-gray-600">de {totalPartsPages}</span>
                </div>
                <button onClick={() => setCurrentPartsPage(p => Math.min(totalPartsPages, p + 1))} disabled={currentPartsPage === totalPartsPages}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: No. de Parte REQUERIDO ── */}
      {showPartsRequeridoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-blue-200 flex justify-between items-center bg-blue-50 rounded-t-xl">
              <h3 className="text-xl font-semibold text-blue-800">Seleccionar No. de Parte REQUERIDO</h3>
              <button onClick={() => { setShowPartsRequeridoModal(false); setModalRequeridoSearch('') }} className="p-2 hover:bg-blue-100 rounded-lg">
                <X className="w-5 h-5 text-blue-600" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input type="text" value={modalRequeridoSearch} onChange={e => setModalRequeridoSearch(e.target.value)} autoFocus
                  placeholder="Buscar por ID o descripción..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg text-gray-900" />
              </div>
              <div className="mt-2 text-sm text-gray-600">Mostrando {paginatedPartsRequerido.length} de {filteredPartsRequerido.length} resultados</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {paginatedPartsRequerido.map(part => (
                  <div key={part.id} onClick={() => handleSelectPartRequerido(part)}
                    className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer border border-blue-200 hover:border-blue-400">
                    <div className="font-medium text-blue-800">{part.id}</div>
                    <div className="text-sm text-blue-600 truncate">{part.description}</div>
                  </div>
                ))}
              </div>
            </div>
            {totalPartsRequeridoPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button onClick={() => setCurrentPartsRequeridoPage(p => Math.max(1, p - 1))} disabled={currentPartsRequeridoPage === 1}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Página</span>
                  <select value={currentPartsRequeridoPage} onChange={e => setCurrentPartsRequeridoPage(parseInt(e.target.value))}
                    className="px-3 py-1 bg-white border border-blue-300 rounded-lg text-gray-900">
                    {Array.from({ length: totalPartsRequeridoPages }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                  <span className="text-gray-600">de {totalPartsRequeridoPages}</span>
                </div>
                <button onClick={() => setCurrentPartsRequeridoPage(p => Math.min(totalPartsRequeridoPages, p + 1))} disabled={currentPartsRequeridoPage === totalPartsRequeridoPages}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Dashboard No. de Parte filter ── */}
      {showDashPartsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-indigo-200 flex justify-between items-center bg-indigo-50 rounded-t-xl">
              <h3 className="text-xl font-semibold text-indigo-800">Filtrar por No. de Parte</h3>
              <button onClick={() => { setShowDashPartsModal(false); setDashModalSearch('') }} className="p-2 hover:bg-indigo-100 rounded-lg">
                <X className="w-5 h-5 text-indigo-600" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                <input type="text" value={dashModalSearch} onChange={e => setDashModalSearch(e.target.value)} autoFocus
                  placeholder="Buscar por ID o descripción..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg text-gray-900" />
              </div>
              <div className="mt-2 text-sm text-gray-600">Mostrando {paginatedDashParts.length} de {filteredDashParts.length} resultados</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {paginatedDashParts.map(part => (
                  <div key={part.id} onClick={() => handleSelectDashPart(part)}
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer border border-indigo-200 hover:border-indigo-400">
                    <div className="font-medium text-indigo-800">{part.id}</div>
                    <div className="text-sm text-indigo-600 truncate">{part.description}</div>
                  </div>
                ))}
              </div>
            </div>
            {totalDashPartsPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button onClick={() => setCurrentDashPartsPage(p => Math.max(1, p - 1))} disabled={currentDashPartsPage === 1}
                  className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Página</span>
                  <select value={currentDashPartsPage} onChange={e => setCurrentDashPartsPage(parseInt(e.target.value))}
                    className="px-3 py-1 bg-white border border-indigo-300 rounded-lg text-gray-900">
                    {Array.from({ length: totalDashPartsPages }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                  <span className="text-gray-600">de {totalDashPartsPages}</span>
                </div>
                <button onClick={() => setCurrentDashPartsPage(p => Math.min(totalDashPartsPages, p + 1))} disabled={currentDashPartsPage === totalDashPartsPages}
                  className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg disabled:opacity-50 flex items-center gap-2">
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
