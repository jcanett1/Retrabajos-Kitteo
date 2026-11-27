import { Fragment, useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
  Search, Plus, Download, FileSpreadsheet, X, Eye, EyeOff,
  ChevronLeft, ChevronRight, ChevronDown, AlertCircle, CheckCircle,
  Filter, BarChart2, ClipboardList, ShieldAlert
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { supabase } from './supabaseClient'
import InventoryCatalogDialog from './components/InventoryCatalogDialog'
import { fetchInventoryCatalog, type PartOption } from './lib/inventoryCatalog'

import { canonicalizarUsuarioAutorizadoKitteo, canonicalizarUsuarioKitteo } from './lib/usuarioKitteo'

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
  celda?: string
  nota?: string
  created_at?: string
  noOrden?: string
  noParte?: string
}

const HALLAZGO_OPTIONS = [
  '1 - SHAFT EQUIVOCADO',
  '2 - CABEZAL EQUIVOCADO',
  '3 - GRIP EQUIVOCADO',
  '4 - HEADCOVER EQUIVOCADO',
  '5 - SHAFT EXTRA',
  '6 - CABEZAL EXTRA',
  '7 - GRIP EXTRA',
  '8 - HEADCOVER EXTRA',
  '9 - SHAFT FALTANTE',
  '10 - CABEZAL FALTANTE',
  '11 - GRIP FALTANTE',
  '12 - HEADCOVER FALTANTE',
  '13 - TORQUETOOL FALTANTE',
   '14 - PATCH EQUIVOCADO',
  '15 - PATCH FALTANTE',
  '16 - HOSEL FALTANTE',
  '17 - HOSEL EQUIVOCADO',
   '18 - TORQUETOOL EXTRA',
  '19 - TORQUE FALTANTE',
   '20 - ACCESORIO FALTANTE',
   '21 - MATERIAL SOBRANTE',
  '22 - SIN BANDERA Y SIN SELLO',
  '23 - SHAFT MEZCLADO SIN ETIQUETA',
  '24 - SHAFT MEZCLADO CON ETIQUETA',
  '25 - HOSEL EQUIVOCADO',
  '26 - HOSEL FALTANTE',
  '27 - REIMPRESION DE PACKING LIST',
  '28 - TORQUE FALTANTE',
  '29 - ORDEN ABIERTA',
  'ACCESORIO EQUIVOCADO',
  'HALLAZGO INTERNO'
]

const USUARIOS = [
  'YODELI',
  'DENISSE',
  'YAJAIRA',
  'DIANA',
  'KARLA',
  'CARMEN'
]

const USUARIOS_AUTORIZADOS = [
  {
    area: 'Kitteo',
    usuarios: [
      { nombre: 'Ma. Elizabeth Olivarria Sanchez', iniciales: 'EO' },
      { nombre: 'Maredna del Milagro Puig Arvizu', iniciales: 'MP' },
      { nombre: 'Adriana Janely Sanabria Castro', iniciales: 'AS' },
      { nombre: 'Diana Mendez Rodriguez', iniciales: 'DM' },
      { nombre: 'Yodeli Gpe. Lopez Manrriquez', iniciales: 'YL' },
      { nombre: 'Karel Yajaira Ontiveros Moreno', iniciales: 'KY' },
      { nombre: 'Denisse Abril Sansarric Valverde', iniciales: 'DS' },
      { nombre: 'Michael Meza Noriega', iniciales: 'MM' },
      { nombre: 'Francisco Eduardo Leyva Martinez', iniciales: 'FL' },
      { nombre: 'Francisco Javier Vega', iniciales: 'FJ' },
      { nombre: 'Francisco Antonio Gastelum Lopez', iniciales: 'AG' },
      { nombre: 'Alejandro Vazquez Urrea', iniciales: 'AV' },
      { nombre: 'Eduardo Cervantes Salazar', iniciales: 'EC' },
      { nombre: 'Cruz Diego Lopez Vargas', iniciales: 'CD' },
    ],
  },
  {
    area: 'Almacén',
    usuarios: [
      { nombre: 'Eleazar Santana Paes', iniciales: 'ES' },
      { nombre: 'Gil Eduardo Macedo', iniciales: 'GM' },
      { nombre: 'Jorge Santillanes', iniciales: 'JS' },
      { nombre: 'Mario Grajeda', iniciales: 'MG' },
    ],
  },
  {
    area: 'Producción',
    usuarios: [
      { nombre: 'RAMIREZ/VALENZUELA/NORMA PATRICIA', iniciales: 'PR' },
      { nombre: 'SOLARES/GARCIA/NORMA EDILIA', iniciales: 'NS' },
      { nombre: 'HERNANDEZ/PEREZ/KIMBERLY ELIZABETH', iniciales: 'KH' },
      { nombre: 'CHAVEZ/LEYVA/BRYAN ALFREDO', iniciales: 'BC' },
      { nombre: 'CAZARES/VALENZUELA/AZALIA YAHAIRA', iniciales: 'AC' },
      { nombre: 'LUGO/CASTRO/LETICIA/JULIETH', iniciales: 'JL' },
      { nombre: 'ESPINOZA/AMAVISZCA/EDITH/EUNICE', iniciales: 'EE' },
    ],
  },
]

const USUARIOS_AUTORIZADOS_PERSONAS = USUARIOS_AUTORIZADOS.flatMap(grupo => grupo.usuarios)
const USUARIOS_HISTORICOS_DASHBOARD = ['MILAGROS NAVARRO', 'ALAN RAMOS', 'OTTON MORALES', 'CINTHYA LEON']

const renderUsuarioAutorizadoTick = ({ x, y, payload }: any) => {
  const words = String(payload?.value ?? '').replace(/\//g, ' / ').split(/\s+/)
  const lines: string[] = []
  let currentLine = ''
  words.forEach(word => {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (candidate.length > 22 && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = candidate
    }
  })
  if (currentLine) lines.push(currentLine)

  return (
    <text x={x} y={y} textAnchor="end" dominantBaseline="central" fill="#6b7280" fontSize={10}>
      {lines.map((line, index) => (
        <tspan key={`${index}-${line}`} x={x} y={y + (index - (lines.length - 1) / 2) * 11}>{line}</tspan>
      ))}
    </text>
  )
}

const AREA_OPTIONS = [
  'DOCK AUDIT',
  'KITTEO',
]

const CELDA_OPTIONS = [
  '10',
  '11',
  '15',
  '16',
  '6',
  'Prep Area',
  'JAULA',
  'N/A'
]

const RECORDS_PER_PAGE = 100
const PARTS_PER_PAGE = 100
const DASHBOARD_RECORDS_PER_PAGE = 25
const NO_REQUIRED_PART_FILTER = '__NO_REQUIRED_PART__'
const UNIDENTIFIED_AUTHORIZED_FILTER = 'Sin usuario autorizado identificable'

const normalizeDashSearch = (value: unknown): string => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es-MX')
  .replace(/\s+/g, ' ')
  .trim()

const formatDashboardDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const SUPABASE_FETCH_PAGE_SIZE = 500

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
        <p className="font-semibold text-gray-800 mb-2">{d.hallazgo}</p>
        <p className="text-gray-600 mb-0.5">No. de Parte: <span className="font-medium text-gray-900">{d.no_parte}</span></p>
        {d.no_parte_requerido && (
          <p className="text-gray-600 mb-0.5">No. de Parte Requerido: <span className="font-medium text-blue-700">{d.no_parte_requerido}</span></p>
        )}
        <p className="text-gray-600 mb-0.5">Cantidad registrada: <span className="font-bold text-emerald-700">{d.cantidad ?? d.count}</span></p>
        <p className="text-gray-600 mb-0.5">Frecuencia: <span className="font-bold" style={{ color: FREQ_COLORS[d.frecuencia] }}>{d.frecuencia}</span></p>
        <p className="text-gray-600">Veces registrado: <span className="font-bold text-gray-900">{d.count}</span></p>
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
  const [activeTab, setActiveTab] = useState<'registros' | 'dashboard' | 'interno' | 'dashInterno'>('registros')
  const [partsOptions, setPartsOptions] = useState<PartOption[]>([])
  const [showInventoryCatalogModal, setShowInventoryCatalogModal] = useState(false)
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
  const [area, setArea] = useState('KITTEO')
  const [noOrden, setNoOrden] = useState('')
  const [hallazgo, setHallazgo] = useState('')
  const [noParte, setNoParte] = useState('')
  const [noParteDisplay, setNoParteDisplay] = useState('')
  const [noParteRequerido, setNoParteRequerido] = useState('')
  const [noParteRequeridoDisplay, setNoParteRequeridoDisplay] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [usuario, setUsuario] = useState('')
  const [usuarioKitteo, setUsuarioKitteo] = useState('')
  const [celda, setCelda] = useState('')
  const [nota, setNota] = useState('')

  // Filter state (listado)
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [filterUsuario, setFilterUsuario] = useState('')
  const [recordsPage, setRecordsPage] = useState(1)

  // ── Estado formulario INTERNO ──────────────────────────────────────────────
  const [internoFecha, setInternoFecha] = useState(new Date().toISOString().split('T')[0])
  const [internoArea, setInternoArea] = useState('KITTEO')
  const [internoCelda, setInternoCelda] = useState('')
  const [internoNoOrden, setInternoNoOrden] = useState('')
  const [internoHallazgo, setInternoHallazgo] = useState('')
  const [internoNoParte, setInternoNoParte] = useState('')
  const [internoNoParteDisplay, setInternoNoParteDisplay] = useState('')
  const [internoNoParteRequerido, setInternoNoParteRequerido] = useState('')
  const [internoNoParteRequeridoDisplay, setInternoNoParteRequeridoDisplay] = useState('')
  const [internoCantidad, setInternoCantidad] = useState(1)
  const [internoUsuario, setInternoUsuario] = useState('')
  const [internoUsuarioKitteo, setInternoUsuarioKitteo] = useState('')
  const [internoNota, setInternoNota] = useState('')
  const [internoUsuarioValidacion, setInternoUsuarioValidacion] = useState('')

  // Modal partes INTERNO
  const [showInternoPartsModal, setShowInternoPartsModal] = useState(false)
  const [internoModalSearch, setInternoModalSearch] = useState('')
  const [currentInternoPartsPage, setCurrentInternoPartsPage] = useState(1)
  const [showInternoPartsRequeridoModal, setShowInternoPartsRequeridoModal] = useState(false)
  const [internoModalRequeridoSearch, setInternoModalRequeridoSearch] = useState('')
  const [currentInternoPartsRequeridoPage, setCurrentInternoPartsRequeridoPage] = useState(1)

  // Registros INTERNO
  const [registrosInterno, setRegistrosInterno] = useState<Hallazgo[]>([])
  const [filterInternoFechaDesde, setFilterInternoFechaDesde] = useState('')
  const [filterInternoFechaHasta, setFilterInternoFechaHasta] = useState('')
  const [filterInternoUsuario, setFilterInternoUsuario] = useState('')
  const [internoRecordsPage, setInternoRecordsPage] = useState(1)

  // Dashboard filter state
  const [dashFilterNoParte, setDashFilterNoParte] = useState('')
  const [dashFilterNoParteInput, setDashFilterNoParteInput] = useState('')
  const [dashFilterNoParteRequerido, setDashFilterNoParteRequerido] = useState('')
  const [dashFilterHallazgos, setDashFilterHallazgos] = useState<string[]>([])
  const [showDashHallazgoMenu, setShowDashHallazgoMenu] = useState(false)
  const [dashHallazgoSearch, setDashHallazgoSearch] = useState('')
  const [dashFilterUsuario, setDashFilterUsuario] = useState('')
  const [dashFilterUsuarioKitteo, setDashFilterUsuarioKitteo] = useState('')
  const [dashFilterCelda, setDashFilterCelda] = useState('')
  const [dashSearch, setDashSearch] = useState('')
  const [dashDatePreset, setDashDatePreset] = useState<'week' | 'month' | 'all' | 'custom'>('all')
  const [dashRecordsPage, setDashRecordsPage] = useState(1)
  const [expandedDetailKey, setExpandedDetailKey] = useState<string | null>(null)
  const [showDashPartsModal, setShowDashPartsModal] = useState(false)
  const [dashModalSearch, setDashModalSearch] = useState('')
  const [currentDashPartsPage, setCurrentDashPartsPage] = useState(1)

  // Dashboard: filtro global de fechas (afecta TODAS las gráficas)
  const [dashFechaDesde, setDashFechaDesde] = useState<string>('')
  const [dashFechaHasta, setDashFechaHasta] = useState<string>('')

  // Dashboard: filtro por fecha para gráfica de barras por semana (local, ya no se usa separado)
  const [dashBarFechaDesde, setDashBarFechaDesde] = useState<string>('')
  const [dashBarFechaHasta, setDashBarFechaHasta] = useState<string>('')

  // ── Estado Dashboard INTERNO ──────────────────────────────────────────────
  const [dashInternoFechaDesde, setDashInternoFechaDesde] = useState<string>('')
  const [dashInternoFechaHasta, setDashInternoFechaHasta] = useState<string>('')

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  useEffect(() => {
    let cancelled = false
    void fetchInventoryCatalog()
      .then(catalog => {
        if (!cancelled) setPartsOptions(catalog)
      })
      .catch(error => {
        console.error('Error loading parts from Supabase:', error)
        if (!cancelled) {
          setNotification({ type: 'error', message: 'No se pudo cargar el catálogo de partes desde Supabase.' })
          window.setTimeout(() => setNotification(null), 5000)
        }
      })

    return () => { cancelled = true }
  }, [])

  useEffect(() => { loadRegistros() }, [])
  useEffect(() => { loadRegistrosInterno() }, [])

  const loadRegistros = async () => {
    try {
      setLoading(true)
      const allData: any[] = []
      for (let from = 0; ; from += SUPABASE_FETCH_PAGE_SIZE) {
        const { data, error } = await supabase
          .from('hallazgoskitteo')
          .select('*')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, from + SUPABASE_FETCH_PAGE_SIZE - 1)
        if (error) throw error
        const page = data ?? []
        allData.push(...page)
        if (page.length < SUPABASE_FETCH_PAGE_SIZE) break
      }
      setRegistros(allData.map(item => ({
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
        celda: item.celda,
        nota: item.nota,
        created_at: item.created_at
      })))
    } catch (error) {
      showNotification('error', 'Error al cargar los registros')
    } finally {
      setLoading(false)
    }
  }

  const loadRegistrosInterno = async () => {
    try {
      setLoading(true)
      const allData: any[] = []
      for (let from = 0; ; from += SUPABASE_FETCH_PAGE_SIZE) {
        const { data, error } = await supabase
          .from('hallazgos_interno')
          .select('*')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, from + SUPABASE_FETCH_PAGE_SIZE - 1)
        if (error) throw error
        const page = data ?? []
        allData.push(...page)
        if (page.length < SUPABASE_FETCH_PAGE_SIZE) break
      }
      setRegistrosInterno(allData.map(item => ({
        id: item.id,
        fecha: item.fecha,
        area: item.area,
        no_orden: item.no_orden,
        noOrden: item.no_orden,
        hallazgo: item.hallazgo,
        no_parte: item.parte_equivocada,
        noParte: item.parte_equivocada,
        cantidad: item.cantidad,
        usuario: item.usuario_registra,
        usuario_kitteo: item.usuario_kitteo,
        no_parte_requerido: item.parte_requerida,
        celda: item.celda,
        nota: item.nota,
        created_at: item.created_at,
        usuario_validacion: item.usuario_validacion
      })))
    } catch (error) {
      showNotification('error', 'Error al cargar los registros internos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitInterno = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!internoFecha || !internoArea || !internoNoOrden || !internoHallazgo || !internoNoParte || !internoNoParteRequerido || !internoCantidad || !internoUsuario || !internoUsuarioKitteo || !internoCelda) {
      showNotification('error', 'Por favor complete todos los campos')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.from('hallazgos_interno').insert([{
        fecha: internoFecha,
        area: internoArea,
        celda: internoCelda,
        no_orden: internoNoOrden,
        hallazgo: internoHallazgo,
        parte_equivocada: internoNoParte,
        parte_requerida: internoNoParteRequerido,
        cantidad: internoCantidad,
        usuario_registra: internoUsuario,
        usuario_kitteo: internoUsuarioKitteo,
        nota: internoNota || null,
        usuario_validacion: internoUsuarioValidacion || null
      }]).select()
      if (error) throw error
      showNotification('success', 'Hallazgo INTERNO registrado exitosamente')
      await loadRegistrosInterno()
      setInternoNoOrden(''); setInternoHallazgo(''); setInternoNoParte(''); setInternoNoParteDisplay('')
      setInternoNoParteRequerido(''); setInternoNoParteRequeridoDisplay('')
      setInternoCantidad(1); setInternoUsuario(''); setInternoUsuarioKitteo(''); setInternoCelda('')
      setInternoNota(''); setInternoArea('KITTEO'); setInternoUsuarioValidacion('')
    } catch (error) {
      showNotification('error', 'Error al guardar el registro interno')
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

  // ─── Parts modal INTERNO ─────────────────────────────────────────────────
  const filteredInternoParts = partsOptions.filter(p =>
    p.id.toLowerCase().includes(internoModalSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(internoModalSearch.toLowerCase())
  )
  const totalInternoPartsPages = Math.ceil(filteredInternoParts.length / PARTS_PER_PAGE)
  const paginatedInternoParts = filteredInternoParts.slice((currentInternoPartsPage - 1) * PARTS_PER_PAGE, currentInternoPartsPage * PARTS_PER_PAGE)

  const filteredInternoPartsRequerido = partsOptions.filter(p =>
    p.id.toLowerCase().includes(internoModalRequeridoSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(internoModalRequeridoSearch.toLowerCase())
  )
  const totalInternoPartsRequeridoPages = Math.ceil(filteredInternoPartsRequerido.length / PARTS_PER_PAGE)
  const paginatedInternoPartsRequerido = filteredInternoPartsRequerido.slice((currentInternoPartsRequeridoPage - 1) * PARTS_PER_PAGE, currentInternoPartsRequeridoPage * PARTS_PER_PAGE)

  useEffect(() => { setCurrentInternoPartsPage(1) }, [internoModalSearch])
  useEffect(() => { setCurrentInternoPartsRequeridoPage(1) }, [internoModalRequeridoSearch])

  // ─── Records INTERNO filtering ───────────────────────────────────────────
  const filteredRegistrosInterno = useMemo(() => registrosInterno.filter(r => {
    if (filterInternoFechaDesde && r.fecha < filterInternoFechaDesde) return false
    if (filterInternoFechaHasta && r.fecha > filterInternoFechaHasta) return false
    if (filterInternoUsuario && r.usuario !== filterInternoUsuario) return false
    return true
  }), [registrosInterno, filterInternoFechaDesde, filterInternoFechaHasta, filterInternoUsuario])

  useEffect(() => { setInternoRecordsPage(1) }, [filterInternoFechaDesde, filterInternoFechaHasta, filterInternoUsuario])

  const totalInternoRecordsPages = Math.ceil(filteredRegistrosInterno.length / RECORDS_PER_PAGE)
  const paginatedRegistrosInterno = filteredRegistrosInterno.slice((internoRecordsPage - 1) * RECORDS_PER_PAGE, internoRecordsPage * RECORDS_PER_PAGE)
  const hasActiveInternoFilters = filterInternoFechaDesde || filterInternoFechaHasta || filterInternoUsuario
  const clearInternoFilters = () => { setFilterInternoFechaDesde(''); setFilterInternoFechaHasta(''); setFilterInternoUsuario('') }

  const exportInternoToExcel = () => {
    const headers = ['Fecha', 'Área', 'Celda', 'No. Orden', 'Hallazgo', 'No. de Parte', 'No. de Parte Requerido', 'Cantidad', 'Usuario', 'Usuario autorizado', 'Usuario Validó', 'Nota']
    const rows = filteredRegistrosInterno.map(r => ({
      'Fecha': r.fecha, 'Área': r.area, 'Celda': r.celda || '',
      'No. Orden': r.noOrden || r.no_orden || '', 'Hallazgo': r.hallazgo,
      'No. de Parte': r.noParte || r.no_parte || '',
      'No. de Parte Requerido': r.no_parte_requerido || '',
      'Cantidad': r.cantidad, 'Usuario': r.usuario,
      'Usuario autorizado': r.usuario_kitteo || '',
      'Usuario Validó': (r as any).usuario_validacion || '',
      'Nota': r.nota || ''
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 30 },
      { wch: 20 }, { wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 40 }, { wch: 18 }, { wch: 30 }
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hallazgos Interno')
    XLSX.writeFile(workbook, `kitteo_hallazgos_interno_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

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

  const dashHallazgoOptions = useMemo(() =>
    Array.from(new Set<string>(registros.map(r => r.hallazgo).filter(value => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'es')),
  [registros])

  const dashUsuarioOptions = useMemo(() =>
    Array.from(new Set<string>(registros.map(r => r.usuario).filter(value => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'es')),
  [registros])

  const dashUsuarioKitteoOptions = useMemo(() => {
    const recognized = registros
      .map(r => canonicalizarUsuarioAutorizadoKitteo(r.usuario_kitteo, USUARIOS_AUTORIZADOS_PERSONAS, USUARIOS_HISTORICOS_DASHBOARD))
      .filter((value): value is string => value !== null)
    const hasUnidentified = registros.some(r =>
      !canonicalizarUsuarioAutorizadoKitteo(r.usuario_kitteo, USUARIOS_AUTORIZADOS_PERSONAS, USUARIOS_HISTORICOS_DASHBOARD))
    const options = [...recognized, ...(hasUnidentified ? [UNIDENTIFIED_AUTHORIZED_FILTER] : [])]
    return Array.from(new Set(options)).sort((a, b) => {
      if (a === UNIDENTIFIED_AUTHORIZED_FILTER) return 1
      if (b === UNIDENTIFIED_AUTHORIZED_FILTER) return -1
      return a.localeCompare(b, 'es')
    })
  }, [registros])

  const dashNoParteRequeridoOptions = useMemo(() => {
    const values = registros.map(r => r.no_parte_requerido?.trim() || '')
    const options = values.filter((value): value is string => value.length > 0)
    if (values.some(value => value.length === 0)) options.push(NO_REQUIRED_PART_FILTER)
    return Array.from(new Set<string>(options)).sort((a, b) => {
      if (a === NO_REQUIRED_PART_FILTER) return 1
      if (b === NO_REQUIRED_PART_FILTER) return -1
      return a.localeCompare(b, 'es', { numeric: true })
    })
  }, [registros])

  const dashCeldaOptions = useMemo(() =>
    Array.from(new Set<string>(registros.map(r => r.celda?.trim() || 'SIN CELDA')))
      .sort((a, b) => a.localeCompare(b, 'es', { numeric: true })),
  [registros])

  // Base dataset for dashboard; all filters apply to charts and detail.
  const dashBase = useMemo(() => {
    const query = normalizeDashSearch(dashSearch)
    return registros.filter(r => {
      if (dashFilterNoParte && r.no_parte !== dashFilterNoParte) return false
      if (dashFilterNoParteRequerido) {
        const requiredPart = r.no_parte_requerido?.trim() || ''
        if (dashFilterNoParteRequerido === NO_REQUIRED_PART_FILTER ? requiredPart !== '' : requiredPart !== dashFilterNoParteRequerido) return false
      }
      if (dashFilterHallazgos.length > 0 && !dashFilterHallazgos.includes(r.hallazgo)) return false
      if (dashFilterUsuario && r.usuario !== dashFilterUsuario) return false
      if (dashFilterUsuarioKitteo) {
        const authorizedUser = canonicalizarUsuarioAutorizadoKitteo(r.usuario_kitteo, USUARIOS_AUTORIZADOS_PERSONAS, USUARIOS_HISTORICOS_DASHBOARD)
        if (dashFilterUsuarioKitteo === UNIDENTIFIED_AUTHORIZED_FILTER ? authorizedUser !== null : authorizedUser !== dashFilterUsuarioKitteo) return false
      }
      if (dashFilterCelda && (r.celda?.trim() || 'SIN CELDA') !== dashFilterCelda) return false
      if (dashFechaDesde && r.fecha < dashFechaDesde) return false
      if (dashFechaHasta && r.fecha > dashFechaHasta) return false
      if (query) {
        const searchable = normalizeDashSearch([
          r.no_orden, r.noOrden, r.no_parte, r.noParte, r.no_parte_requerido,
          r.nota, r.usuario, r.usuario_kitteo
        ].join(' '))
        if (!searchable.includes(query)) return false
      }
      return true
    })
  }, [registros, dashFilterNoParte, dashFilterNoParteRequerido, dashFilterHallazgos, dashFilterUsuario, dashFilterUsuarioKitteo, dashFilterCelda, dashSearch, dashFechaDesde, dashFechaHasta])

  const hasDashFechaFilter = dashFechaDesde || dashFechaHasta
  const hasActiveDashFilters = Boolean(dashFilterNoParte || dashFilterNoParteRequerido || dashFilterHallazgos.length > 0 || dashFilterUsuario || dashFilterUsuarioKitteo || dashFilterCelda || dashSearch.trim() || hasDashFechaFilter)
  const clearDashFilters = () => {
    setDashFilterNoParte('')
    setDashFilterNoParteInput('')
    setDashFilterNoParteRequerido('')
    setDashFilterHallazgos([])
    setShowDashHallazgoMenu(false)
    setDashHallazgoSearch('')
    setDashFilterUsuario('')
    setDashFilterUsuarioKitteo('')
    setDashFilterCelda('')
    setDashSearch('')
    setDashFechaDesde('')
    setDashFechaHasta('')
    setDashDatePreset('all')
    setDashRecordsPage(1)
    setExpandedDetailKey(null)
  }
  const toggleDashHallazgo = (hallazgo: string) => {
    setDashFilterHallazgos(current => current.includes(hallazgo)
      ? current.filter(item => item !== hallazgo)
      : [...current, hallazgo])
  }
  const dashFilterSummary = [
    dashFilterHallazgos.length > 0 ? `Hallazgos: ${dashFilterHallazgos.join(', ')}` : '',
    dashFilterNoParte ? `No. de Parte: ${dashFilterNoParte}` : '',
    dashFilterNoParteRequerido ? `Parte requerida: ${dashFilterNoParteRequerido === NO_REQUIRED_PART_FILTER ? 'Sin parte requerida' : dashFilterNoParteRequerido}` : '',
    dashFilterUsuario ? `Usuario que registra: ${dashFilterUsuario}` : '',
    dashFilterUsuarioKitteo ? `Usuario autorizado: ${dashFilterUsuarioKitteo === UNIDENTIFIED_AUTHORIZED_FILTER ? 'Sin usuario identificable' : dashFilterUsuarioKitteo}` : '',
    dashFilterCelda ? `Celda: ${dashFilterCelda}` : '',
    dashSearch.trim() ? `Búsqueda: “${dashSearch.trim()}”` : '',
    dashFechaDesde && dashFechaHasta ? `Fechas: ${dashFechaDesde} a ${dashFechaHasta}`
      : dashFechaDesde ? `Desde ${dashFechaDesde}`
      : dashFechaHasta ? `Hasta ${dashFechaHasta}` : ''
  ].filter(value => value.length > 0).join(' · ') || 'Todos los registros'
  const clearDashFechas = () => { setDashFechaDesde(''); setDashFechaHasta(''); setDashDatePreset('all') }
  const applyDashPreset = (preset: 'week' | 'month' | 'all') => {
    if (preset === 'all') {
      setDashFechaDesde('')
      setDashFechaHasta('')
    } else if (preset === 'week') {
      const monday = new Date()
      monday.setHours(0, 0, 0, 0)
      const day = monday.getDay() || 7
      monday.setDate(monday.getDate() - day + 1)
      const sunday = new Date(monday)
      sunday.setDate(sunday.getDate() + 6)
      setDashFechaDesde(formatDashboardDate(monday))
      setDashFechaHasta(formatDashboardDate(sunday))
    } else {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      setDashFechaDesde(formatDashboardDate(firstDay))
      setDashFechaHasta(formatDashboardDate(lastDay))
    }
    setDashDatePreset(preset)
  }

  const toggleDashHallazgoFilter = (hallazgo: string) => {
    setDashFilterHallazgos(current => current.length === 1 && current[0] === hallazgo ? [] : [hallazgo])
    setDashRecordsPage(1)
  }
  const toggleDashCeldaFilter = (celda: string) => {
    setDashFilterCelda(current => current === celda ? '' : celda)
    setDashRecordsPage(1)
  }
  const toggleDashMatrixCell = (hallazgo: string, celda: string) => {
    const alreadySelected = dashFilterHallazgos.length === 1 && dashFilterHallazgos[0] === hallazgo && dashFilterCelda === celda
    setDashFilterHallazgos(alreadySelected ? [] : [hallazgo])
    setDashFilterCelda(alreadySelected ? '' : celda)
    setDashRecordsPage(1)
  }

  // 1. Hallazgo + No. de Parte combinados con frecuencia
  const hallazgoParteData = useMemo(() => {
    const counts: Record<string, {
      key: string
      hallazgo: string
      no_parte: string
      no_parte_requerido: string
      count: number
      cantidad: number
      registradores: Record<string, { nombre: string; veces: number; cantidad: number }>
    }> = {}
    dashBase.forEach(r => {
      const requiredPart = r.no_parte_requerido?.trim() || ''
      const key = `${r.hallazgo}||${r.no_parte}||${requiredPart}`
      if (!counts[key]) counts[key] = {
        key,
        hallazgo: r.hallazgo,
        no_parte: r.no_parte,
        no_parte_requerido: requiredPart,
        count: 0,
        cantidad: 0,
        registradores: {}
      }
      counts[key].count += 1
      counts[key].cantidad += r.cantidad || 0
      const nombre = r.usuario || 'SIN USUARIO'
      if (!counts[key].registradores[nombre]) {
        counts[key].registradores[nombre] = { nombre, veces: 0, cantidad: 0 }
      }
      counts[key].registradores[nombre].veces += 1
      counts[key].registradores[nombre].cantidad += r.cantidad || 0
    })
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .map(d => ({
        ...d,
        registradores: Object.values(d.registradores).sort((a, b) => b.veces - a.veces),
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

  // 3. Todos los usuarios autorizados asociados a los registros filtrados
  const usuarioKitteoData = useMemo(() => {
    const counts: Record<string, { registros: number; cantidad: number }> = {}
    dashBase.forEach(r => {
      const uk = canonicalizarUsuarioAutorizadoKitteo(r.usuario_kitteo, USUARIOS_AUTORIZADOS_PERSONAS, USUARIOS_HISTORICOS_DASHBOARD)
        ?? UNIDENTIFIED_AUTHORIZED_FILTER
      if (!counts[uk]) counts[uk] = { registros: 0, cantidad: 0 }
      counts[uk].registros += 1
      counts[uk].cantidad += r.cantidad || 0
    })
    return Object.entries(counts)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.registros - a.registros)
  }, [dashBase])

  // ─── Helper: obtener semana ISO (YYYY-Wxx) de una fecha ─────────────────────
  const getISOWeek = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00')
    if (isNaN(d.getTime())) return 'Sin fecha'
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const dayNum = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return `${date.getUTCFullYear()}-S${String(weekNo).padStart(2, '0')}`
  }

  // 4. Datos por semana: hallazgos por tipo y cantidades agrupados por semana
  // semanaBase usa dashBase directamente (ya incluye filtro global de fechas y No. de Parte)
  const semanaBase = useMemo(() => dashBase, [dashBase])

  // Obtener todos los tipos de hallazgo presentes en los datos filtrados
  const semanaHallazgoTypes = useMemo(() => {
    const types = new Set<string>()
    semanaBase.forEach(r => { if (r.hallazgo) types.add(r.hallazgo) })
    return Array.from(types).sort()
  }, [semanaBase])

  // Construir datos agrupados por semana con una clave por tipo de hallazgo
  const semanaData = useMemo(() => {
    const weeks: Record<string, { [key: string]: string | number; semana: string; cantidad: number }> = {}
    semanaBase.forEach(r => {
      const semana = getISOWeek(r.fecha)
      if (!weeks[semana]) {
        weeks[semana] = { semana, cantidad: 0 }
        semanaHallazgoTypes.forEach(t => { weeks[semana][t] = 0 })
      }
      if (r.hallazgo) {
        const currentCount = weeks[semana][r.hallazgo]
        weeks[semana][r.hallazgo] = (typeof currentCount === 'number' ? currentCount : 0) + 1
      }
      weeks[semana].cantidad += r.cantidad || 0
    })
    return Object.values(weeks).sort((a, b) => a.semana.localeCompare(b.semana))
  }, [semanaBase, semanaHallazgoTypes])

  const hasBarFechaFilter = dashBarFechaDesde || dashBarFechaHasta

  // Resumen total de hallazgos por tipo y cantidad total (para mostrar debajo de la gráfica)
  const semanaResumen = useMemo(() => {
    const counts: Record<string, number> = {}
    let totalCantidad = 0
    semanaBase.forEach(r => {
      if (r.hallazgo) counts[r.hallazgo] = (counts[r.hallazgo] || 0) + 1
      totalCantidad += r.cantidad || 0
    })
    const items = Object.entries(counts)
      .map(([tipo, total]) => ({ tipo, total }))
      .sort((a, b) => b.total - a.total)
    return { items, totalCantidad, totalHallazgos: semanaBase.length }
  }, [semanaBase])

  // 5. Hallazgos por Celda
  const celdaData = useMemo(() => {
    const counts: Record<string, number> = {}
    dashBase.forEach(r => {
      const c = r.celda?.trim() || 'SIN CELDA'
      counts[c] = (counts[c] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [dashBase])

  const matrixData = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {}
    dashBase.forEach(r => {
      const finding = r.hallazgo || 'SIN HALLAZGO'
      const cell = r.celda?.trim() || 'SIN CELDA'
      if (!counts[finding]) counts[finding] = {}
      counts[finding][cell] = (counts[finding][cell] || 0) + 1
    })
    return hallazgoDistData.map(item => ({
      hallazgo: item.name,
      total: item.value,
      celdas: celdaData.map(cell => ({ name: cell.name, value: counts[item.name]?.[cell.name] || 0 }))
    }))
  }, [dashBase, hallazgoDistData, celdaData])

  const dashTotalQuantity = useMemo(() => dashBase.reduce((total, r) => total + (r.cantidad || 0), 0), [dashBase])
  const dashMissingAuthorized = useMemo(() => dashBase.filter(r =>
    !canonicalizarUsuarioAutorizadoKitteo(r.usuario_kitteo, USUARIOS_AUTORIZADOS_PERSONAS, USUARIOS_HISTORICOS_DASHBOARD)
  ).length, [dashBase])
  const dashRecordsSorted = useMemo(() => dashBase.slice().sort((a, b) => b.fecha.localeCompare(a.fecha)), [dashBase])
  const dashRecordsPageCount = Math.max(1, Math.ceil(dashRecordsSorted.length / DASHBOARD_RECORDS_PER_PAGE))
  const dashRecordsPageRows = dashRecordsSorted.slice(
    (dashRecordsPage - 1) * DASHBOARD_RECORDS_PER_PAGE,
    dashRecordsPage * DASHBOARD_RECORDS_PER_PAGE
  )

  useEffect(() => { setDashRecordsPage(1) }, [dashBase])

  // 6. Hallazgos por Área
  const areaData = useMemo(() => {
    const counts: Record<string, number> = {}
    dashBase.forEach(r => {
      const a = r.area || 'SIN ÁREA'
      counts[a] = (counts[a] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [dashBase])

  // ─── Form submit ──────────────────────────────────────────────────────────

  // ─── Dashboard INTERNO data ───────────────────────────────────────────────
  const hasDashInternoFechaFilter = dashInternoFechaDesde || dashInternoFechaHasta
  const clearDashInternoFechas = () => { setDashInternoFechaDesde(''); setDashInternoFechaHasta('') }

  const dashInternoBase = useMemo(() => {
    return registrosInterno.filter(r => {
      if (dashInternoFechaDesde && r.fecha < dashInternoFechaDesde) return false
      if (dashInternoFechaHasta && r.fecha > dashInternoFechaHasta) return false
      return true
    })
  }, [registrosInterno, dashInternoFechaDesde, dashInternoFechaHasta])

  const internoHallazgoParteData = useMemo(() => {
    const counts: Record<string, { hallazgo: string; no_parte: string; no_parte_requerido: string; count: number; cantidad: number }> = {}
    dashInternoBase.forEach(r => {
      const key = `${r.hallazgo}||${r.no_parte}||${r.no_parte_requerido || ''}`
      if (!counts[key]) counts[key] = { hallazgo: r.hallazgo, no_parte: r.no_parte, no_parte_requerido: r.no_parte_requerido || '', count: 0, cantidad: 0 }
      counts[key].count += 1
      counts[key].cantidad += r.cantidad || 0
    })
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .map(d => ({
        ...d,
        label: `${d.hallazgo}\n(${d.no_parte})`,
        shortLabel: d.no_parte,
        frecuencia: d.count <= 2 ? '1-2 veces' : d.count <= 5 ? '2-5 veces' : 'Más de 5 veces'
      }))
  }, [dashInternoBase])

  const internoFreqSummary = useMemo(() => {
    const groups: Record<string, number> = { '1-2 veces': 0, '2-5 veces': 0, 'Más de 5 veces': 0 }
    internoHallazgoParteData.forEach(d => { groups[d.frecuencia] += 1 })
    return groups
  }, [internoHallazgoParteData])

  const internoHallazgoDistData = useMemo(() => {
    const counts: Record<string, number> = {}
    dashInternoBase.forEach(r => { counts[r.hallazgo] = (counts[r.hallazgo] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [dashInternoBase])

  const internoUsuarioKitteoData = useMemo(() => {
    const counts: Record<string, number> = {}
    dashInternoBase.forEach(r => {
      const uk = canonicalizarUsuarioAutorizadoKitteo(r.usuario_kitteo, USUARIOS_AUTORIZADOS_PERSONAS, USUARIOS_HISTORICOS_DASHBOARD)
        ?? canonicalizarUsuarioKitteo(r.usuario_kitteo)
      counts[uk] = (counts[uk] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  }, [dashInternoBase])

  const internoSemanaHallazgoTypes = useMemo(() => {
    const types = new Set<string>()
    dashInternoBase.forEach(r => { if (r.hallazgo) types.add(r.hallazgo) })
    return Array.from(types).sort()
  }, [dashInternoBase])

  const internoSemanaData = useMemo(() => {
    const weeks: Record<string, { [key: string]: string | number; semana: string; cantidad: number }> = {}
    dashInternoBase.forEach(r => {
      const semana = getISOWeek(r.fecha)
      if (!weeks[semana]) {
        weeks[semana] = { semana, cantidad: 0 }
        internoSemanaHallazgoTypes.forEach(t => { weeks[semana][t] = 0 })
      }
      if (r.hallazgo) {
        const currentCount = weeks[semana][r.hallazgo]
        weeks[semana][r.hallazgo] = (typeof currentCount === 'number' ? currentCount : 0) + 1
      }
      weeks[semana].cantidad += r.cantidad || 0
    })
    return Object.values(weeks).sort((a, b) => a.semana.localeCompare(b.semana))
  }, [dashInternoBase, internoSemanaHallazgoTypes])

  const internoSemanaResumen = useMemo(() => {
    const counts: Record<string, number> = {}
    let totalCantidad = 0
    dashInternoBase.forEach(r => {
      if (r.hallazgo) counts[r.hallazgo] = (counts[r.hallazgo] || 0) + 1
      totalCantidad += r.cantidad || 0
    })
    const items = Object.entries(counts).map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total)
    return { items, totalCantidad, totalHallazgos: dashInternoBase.length }
  }, [dashInternoBase])

  const internoCeldaData = useMemo(() => {
    const counts: Record<string, number> = {}
    dashInternoBase.forEach(r => {
      const c = r.celda || 'SIN CELDA'
      counts[c] = (counts[c] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [dashInternoBase])

  const internoAreaData = useMemo(() => {
    const counts: Record<string, number> = {}
    dashInternoBase.forEach(r => {
      const a = r.area || 'SIN ÁREA'
      counts[a] = (counts[a] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [dashInternoBase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fecha || !area || !noOrden || !hallazgo || !noParte || !noParteRequerido || !cantidad || !usuario || !usuarioKitteo || !celda) {
      showNotification('error', 'Por favor complete todos los campos')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.from('hallazgoskitteo').insert([{
        fecha, area, no_orden: noOrden, hallazgo,
        no_parte: noParte, no_parte_requerido: noParteRequerido,
        cantidad, usuario, usuario_kitteo: usuarioKitteo, celda,
        nota: nota || null
      }]).select()
      if (error) throw error
      showNotification('success', 'Hallazgo registrado exitosamente')
      await loadRegistros()
      setNoOrden(''); setHallazgo(''); setNoParte(''); setNoParteDisplay('')
      setNoParteRequerido(''); setNoParteRequeridoDisplay('')
      setCantidad(1); setUsuario(''); setUsuarioKitteo(''); setCelda('')
      setNota(''); setArea('KITTEO')
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

  const handleInventoryCatalogCreated = (item: PartOption) => {
    setPartsOptions(current => {
      const existingParts = current.filter(part => part.id.trim().toUpperCase() !== 'N/A' && part.id !== item.id)
      const sortedParts = [...existingParts, item].sort((left, right) =>
        left.id.localeCompare(right.id, undefined, { sensitivity: 'base' })
      )
      return [{ id: 'N/A', description: 'N/A' }, ...sortedParts]
    })
    showNotification('success', `Número de parte ${item.id} agregado al catálogo.`)
  }

  const exportToExcel = () => {
    const headers = ['Fecha', 'Área', 'Celda', 'No. Orden', 'Hallazgo', 'No. de Parte', 'No. de Parte Requerido', 'Cantidad', 'Usuario', 'Usuario autorizado', 'Nota']
    const rows = filteredRegistros.map(r => ({
      'Fecha': r.fecha,
      'Área': r.area,
      'Celda': r.celda || '',
      'No. Orden': r.noOrden || r.no_orden || '',
      'Hallazgo': r.hallazgo,
      'No. de Parte': r.noParte || r.no_parte || '',
      'No. de Parte Requerido': r.no_parte_requerido || '',
      'Cantidad': r.cantidad,
      'Usuario': r.usuario,
      'Usuario autorizado': r.usuario_kitteo || '',
      'Nota': r.nota || ''
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })
    // Ajustar ancho de columnas
    worksheet['!cols'] = [
      { wch: 12 }, // Fecha
      { wch: 10 }, // Área
      { wch: 10 }, // Celda
      { wch: 14 }, // No. Orden
      { wch: 30 }, // Hallazgo
      { wch: 20 }, // No. de Parte
      { wch: 22 }, // No. de Parte Requerido
      { wch: 10 }, // Cantidad
      { wch: 14 }, // Usuario
      { wch: 40 }, // Usuario autorizado
      { wch: 30 }, // Nota
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hallazgos')
    XLSX.writeFile(workbook, `kitteo_hallazgos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportDashboardToExcel = () => {
    const headers = ['Fecha', 'Área', 'Celda', 'No. Orden', 'Hallazgo', 'No. de Parte', 'No. de Parte Requerido', 'Cantidad', 'Usuario', 'Usuario autorizado', 'Nota']
    const rows = dashRecordsSorted.map(r => ({
      'Fecha': r.fecha,
      'Área': r.area,
      'Celda': r.celda || '',
      'No. Orden': r.noOrden || r.no_orden || '',
      'Hallazgo': r.hallazgo,
      'No. de Parte': r.noParte || r.no_parte || '',
      'No. de Parte Requerido': r.no_parte_requerido || '',
      'Cantidad': r.cantidad || 0,
      'Usuario': r.usuario || '',
      'Usuario autorizado': canonicalizarUsuarioAutorizadoKitteo(r.usuario_kitteo, USUARIOS_AUTORIZADOS_PERSONAS, USUARIOS_HISTORICOS_DASHBOARD) || UNIDENTIFIED_AUTHORIZED_FILTER,
      'Nota': r.nota || ''
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 32 },
      { wch: 24 }, { wch: 24 }, { wch: 12 }, { wch: 18 }, { wch: 42 }, { wch: 36 }
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dashboard filtrado')
    XLSX.writeFile(workbook, `kitteo_dashboard_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportDashboardToCsv = () => {
    const headers = ['Fecha', 'Área', 'Celda', 'No. Orden', 'Hallazgo', 'No. de Parte', 'No. de Parte Requerido', 'Cantidad', 'Usuario', 'Usuario autorizado', 'Nota']
    const rows = dashRecordsSorted.map(r => [
      r.fecha, r.area, r.celda || '', r.noOrden || r.no_orden || '', r.hallazgo,
      r.noParte || r.no_parte || '', r.no_parte_requerido || '', r.cantidad || 0,
      r.usuario || '', canonicalizarUsuarioAutorizadoKitteo(r.usuario_kitteo, USUARIOS_AUTORIZADOS_PERSONAS, USUARIOS_HISTORICOS_DASHBOARD) || UNIDENTIFIED_AUTHORIZED_FILTER, r.nota || ''
    ])
    const csvCell = (value: unknown) => {
      const raw = String(value ?? '')
      const safe = /^[=+\-@]/.test(raw.trimStart()) ? `'${raw}` : raw
      return /[",;\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
    }
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kitteo_dashboard_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
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
        <div className="flex flex-wrap gap-2 mb-6">
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
          <button
            type="button"
            onClick={() => setShowInventoryCatalogModal(true)}
            aria-label="Nuevo número de parte"
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
          >
            <Plus className="w-5 h-5" />
            Nuevo número de parte
          </button>
          <button
            onClick={() => setActiveTab('interno')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'interno'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            Hallazgo INTERNO
          </button>
          <button
            onClick={() => setActiveTab('dashInterno')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'dashInterno'
                ? 'bg-rose-700 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            Dashboard INTERNO
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
                  <select value={area} onChange={e => setArea(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-900" required>
                    {AREA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {/* Celda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celda *</label>
                  <select value={celda} onChange={e => setCelda(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-900" required>
                    <option value="">Seleccione una celda</option>
                    {CELDA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
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
                {/* No. de Parte EQUIVOCADO */}
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-1">No. de Parte EQUIVOCADO *</label>
                  <button type="button" onClick={() => setShowPartsModal(true)}
                    className="w-full px-4 py-2 bg-red-50 border-2 border-red-500 rounded-lg text-left hover:bg-red-100 focus:ring-2 focus:ring-red-500 flex items-center justify-between text-gray-900">
                    <span className={`truncate ${noParteDisplay ? 'text-gray-900' : 'text-red-400'}`}>
                      {noParteDisplay || 'Seleccionar número de parte...'}
                    </span>
                    <Search className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
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
                {/* Usuario autorizado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario autorizado *</label>
                  <select value={usuarioKitteo} onChange={e => setUsuarioKitteo(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-900" required>
                    <option value="">Seleccione un usuario autorizado</option>
                    {USUARIOS_AUTORIZADOS.map(grupo => (
                      <optgroup key={grupo.area} label={grupo.area}>
                        {grupo.usuarios.map(persona => {
                          const value = `${persona.nombre} (${persona.iniciales})`
                          return <option key={persona.iniciales} value={value}>{value}</option>
                        })}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {/* Nota */}
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nota <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                    placeholder="Escribe una nota adicional..."
                    rows={2}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-gray-900 resize-none"
                  />
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
                  <button onClick={exportToExcel}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" /> Exportar Excel
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
                          <th className="px-4 py-3">Celda</th>
                          <th className="px-4 py-3">No. Orden</th>
                          <th className="px-4 py-3">Hallazgo</th>
                          <th className="px-4 py-3">No. de Parte</th>
                          <th className="px-4 py-3">No. de Parte Requerido</th>
                          <th className="px-4 py-3">Cantidad</th>
                          <th className="px-4 py-3">Usuario</th>
                          <th className="px-4 py-3">Usuario autorizado</th>
                          <th className="px-4 py-3 rounded-tr-lg">Nota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRegistros.map((r, idx) => (
                          <tr key={r.id} className={`border-b border-gray-200 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-4 py-3 text-gray-900">{r.fecha}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">{r.area}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">{r.celda || '-'}</td>
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
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                              {r.nota
                                ? <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded border border-amber-200 whitespace-pre-wrap">{r.nota}</span>
                                : <span className="text-gray-400">-</span>}
                            </td>
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
            {/* Dashboard header + filters */}
            <div className="bg-white rounded-xl shadow-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
                    <BarChart2 className="w-6 h-6" /> Dashboard de Hallazgos
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {hasActiveDashFilters
                      ? `Registros filtrados: ${dashBase.length} de ${registros.length}`
                      : `Total de registros analizados: ${registros.length}`}
                  </p>
                  {dashFilterUsuario && (
                    <p className="text-sm text-indigo-700 mt-1">
                      Mostrando los hallazgos y partes que registró {dashFilterUsuario}.
                    </p>
                  )}
                  {dashFilterUsuarioKitteo && (
                    <p className="text-sm text-indigo-700 mt-1">
                      Hallazgos asociados al usuario autorizado {dashFilterUsuarioKitteo}.
                    </p>
                  )}
                </div>
                {/* Filtros del dashboard */}
                <div className="flex flex-wrap items-end gap-4">
                  {/* Filtro por rango de fechas global */}
                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fecha desde</label>
                      <input
                        type="date"
                        value={dashFechaDesde}
                        onChange={e => { setDashFechaDesde(e.target.value); setDashDatePreset('custom') }}
                        className="px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fecha hasta</label>
                      <input
                        type="date"
                        value={dashFechaHasta}
                        onChange={e => { setDashFechaHasta(e.target.value); setDashDatePreset('custom') }}
                        className="px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    {hasDashFechaFilter && (
                      <button
                        onClick={clearDashFechas}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                        title="Limpiar filtro de fechas"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Filtro de selección múltiple por tipo de hallazgo */}
                  <div className="relative min-w-[250px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Filtrar por Hallazgo</label>
                    <button type="button" onClick={() => setShowDashHallazgoMenu(open => !open)}
                      aria-expanded={showDashHallazgoMenu} aria-controls="dash-hallazgo-options"
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-left text-gray-900 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-400 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate">
                        {dashFilterHallazgos.length === 0
                          ? 'Todos los hallazgos'
                          : dashFilterHallazgos.length === 1
                            ? dashFilterHallazgos[0]
                            : `${dashFilterHallazgos.length} hallazgos seleccionados`}
                      </span>
                      <ChevronDown className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                    </button>
                    {showDashHallazgoMenu && (
                      <div id="dash-hallazgo-options" className="absolute z-30 mt-2 w-full min-w-[280px] rounded-xl border border-indigo-200 bg-white p-3 shadow-xl">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-700">Selecciona uno o varios</span>
                          <button type="button" onClick={() => setDashFilterHallazgos([])}
                            disabled={dashFilterHallazgos.length === 0}
                            className="text-xs font-medium text-indigo-700 hover:text-indigo-900 disabled:opacity-40">
                            Limpiar selección
                          </button>
                        </div>
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input type="search" value={dashHallazgoSearch} onChange={e => setDashHallazgoSearch(e.target.value)}
                            placeholder="Buscar hallazgo..."
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {dashHallazgoOptions.filter(option => option.toLowerCase().includes(dashHallazgoSearch.toLowerCase())).map(option => (
                            <label key={option} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-indigo-50">
                              <input type="checkbox" checked={dashFilterHallazgos.includes(option)} onChange={() => toggleDashHallazgo(option)}
                                className="mt-0.5 accent-indigo-600" />
                              <span>{option}</span>
                            </label>
                          ))}
                          {dashHallazgoOptions.filter(option => option.toLowerCase().includes(dashHallazgoSearch.toLowerCase())).length === 0 && (
                            <p className="px-2 py-4 text-center text-sm text-gray-400">No se encontraron hallazgos</p>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                          <span className="text-xs text-gray-500">{dashFilterHallazgos.length} seleccionados</span>
                          <button type="button" onClick={() => setShowDashHallazgoMenu(false)}
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
                            Listo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Filtro por usuario que captura */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Usuario que registra</label>
                    <select value={dashFilterUsuario} onChange={e => setDashFilterUsuario(e.target.value)}
                      className="px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-400 min-w-[190px]">
                      <option value="">Todos los usuarios</option>
                      {dashUsuarioOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  {/* Filtro por usuario autorizado asociado al hallazgo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Usuario autorizado</label>
                    <select value={dashFilterUsuarioKitteo} onChange={e => setDashFilterUsuarioKitteo(e.target.value)}
                      className="px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-400 min-w-[260px]">
                      <option value="">Todos los usuarios autorizados</option>
                      {dashUsuarioKitteoOptions.map(option => (
                        <option key={option} value={option}>
                          {option === UNIDENTIFIED_AUTHORIZED_FILTER ? 'Sin usuario autorizado identificable' : option}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Filtro por celda */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Celda</label>
                    <select value={dashFilterCelda} onChange={e => setDashFilterCelda(e.target.value)}
                      className="px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-400 min-w-[150px]">
                      <option value="">Todas las celdas</option>
                      {dashCeldaOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  {/* Filtro por No. de Parte */}
                  <div className="flex items-end gap-2">
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
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors" title="Quitar filtro de parte">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Filtro por parte requerida */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Parte requerida</label>
                    <select value={dashFilterNoParteRequerido} onChange={e => setDashFilterNoParteRequerido(e.target.value)}
                      className="px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-400 min-w-[210px]">
                      <option value="">Todas las partes requeridas</option>
                      {dashNoParteRequeridoOptions.map(option => (
                        <option key={option} value={option}>
                          {option === NO_REQUIRED_PART_FILTER ? 'Sin parte requerida' : option}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Búsqueda de texto libre sobre orden, partes y nota */}
                  <div className="min-w-[240px] flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Buscar registros</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input type="search" value={dashSearch} onChange={e => setDashSearch(e.target.value)}
                        placeholder="Orden, parte equivocada/requerida o nota"
                        className="w-full rounded-lg border border-indigo-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Periodo:</span>
                  {([
                    ['week', 'Esta semana'],
                    ['month', 'Este mes'],
                    ['all', 'Todo']
                  ] as const).map(([preset, label]) => (
                    <button key={preset} type="button" onClick={() => applyDashPreset(preset)}
                      aria-pressed={dashDatePreset === preset}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${dashDatePreset === preset ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                      {label}
                    </button>
                  ))}
                  {dashDatePreset === 'custom' && <span className="text-xs text-gray-500">Rango personalizado</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs text-gray-500">{dashBase.length} registros para exportar</span>
                  <button type="button" onClick={exportDashboardToCsv} disabled={dashBase.length === 0}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">
                    Exportar CSV
                  </button>
                  <button type="button" onClick={exportDashboardToExcel} disabled={dashBase.length === 0}
                    className="rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                    Exportar Excel
                  </button>
                  <button type="button" onClick={clearDashFilters} disabled={!hasActiveDashFilters}
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50">
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>

            {/* ── KPI cards ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border-l-4 border-indigo-500 bg-white p-5 shadow">
                <p className="text-sm font-medium text-gray-500">Número de registros</p>
                <p className="mt-1 text-3xl font-extrabold text-indigo-700">{dashBase.length}</p>
                <p className="mt-1 text-xs text-gray-500">Capturas dentro del filtro actual</p>
              </div>
              <div className="rounded-xl border-l-4 border-emerald-500 bg-white p-5 shadow">
                <p className="text-sm font-medium text-gray-500">Suma de piezas</p>
                <p className="mt-1 text-3xl font-extrabold text-emerald-700">{dashTotalQuantity}</p>
                <p className="mt-1 text-xs text-gray-500">Suma del campo cantidad; no equivale a registros</p>
              </div>
              <div className="rounded-xl border-l-4 border-amber-500 bg-white p-5 shadow">
                <p className="text-sm font-medium text-gray-500">Hallazgo más común</p>
                <p className="mt-1 truncate text-xl font-extrabold text-amber-700" title={hallazgoDistData[0]?.name || ''}>
                  {hallazgoDistData[0]?.name || 'Sin datos'}
                </p>
                <p className="mt-1 text-xs text-gray-500">{hallazgoDistData[0] ? `${hallazgoDistData[0].value} registros` : '—'}</p>
              </div>
              <div className="rounded-xl border-l-4 border-rose-500 bg-white p-5 shadow">
                <p className="text-sm font-medium text-gray-500">Sin usuario autorizado identificable</p>
                <p className="mt-1 text-3xl font-extrabold text-rose-700">{dashMissingAuthorized}</p>
                <p className="mt-1 text-xs text-gray-500">Registros no asociados a un usuario reconocido</p>
              </div>
            </div>

            {/* ── Summary cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.entries(freqSummary) as [string, number][]).map(([label, count]) => (
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
                        <Cell key={`cell-${index}`} fill={FREQ_COLORS[entry.frecuencia]} cursor="pointer"
                          onClick={() => {
                            setDashFilterHallazgos([entry.hallazgo])
                            setDashFilterNoParte(entry.no_parte)
                            setDashFilterNoParteInput(entry.no_parte)
                            setDashFilterNoParteRequerido(entry.no_parte_requerido || NO_REQUIRED_PART_FILTER)
                          }} />
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
                        {hallazgoDistData.map((entry, index) => (
                          <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} cursor="pointer"
                            onClick={() => toggleDashHallazgoFilter(entry.name)} />
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

              {/* Barras: registros y unidades por usuario autorizado */}
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Registros y unidades por Usuario autorizado</h3>
                <p className="text-sm text-gray-500 mb-1">Registros = número de capturas; unidades = suma del campo Cantidad. “Usuario que registra” es quien capturó cada registro.</p>
                <p className="text-xs text-indigo-700 mb-4">En los filtros actuales: {usuarioKitteoData.reduce((total, item) => total + item.registros, 0)} registros · {usuarioKitteoData.reduce((total, item) => total + item.cantidad, 0)} unidades.</p>
                {usuarioKitteoData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(320, usuarioKitteoData.length * 48)}>
                    <BarChart
                      data={usuarioKitteoData}
                      layout="vertical"
                      margin={{ top: 4, right: 40, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={185} tick={renderUsuarioAutorizadoTick} />
                      <Tooltip />
                      <Legend formatter={(value) => <span className="text-xs text-gray-700">{value}</span>} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="registros" name="Registros" fill="#6366f1" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11 }}>
                        {usuarioKitteoData.map((entry, index) => (
                          <Cell key={`kiteador-registros-${index}`} cursor={dashUsuarioKitteoOptions.includes(entry.name) ? 'pointer' : 'default'}
                            onClick={() => {
                              if (dashUsuarioKitteoOptions.includes(entry.name)) {
                                setDashFilterUsuarioKitteo(current => current === entry.name ? '' : entry.name)
                              }
                            }} />
                        ))}
                      </Bar>
                      <Bar dataKey="cantidad" name="Piezas" fill="#10b981" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11 }}>
                        {usuarioKitteoData.map((entry, index) => (
                          <Cell key={`kiteador-piezas-${index}`} cursor={dashUsuarioKitteoOptions.includes(entry.name) ? 'pointer' : 'default'}
                            onClick={() => {
                              if (dashUsuarioKitteoOptions.includes(entry.name)) {
                                setDashFilterUsuarioKitteo(current => current === entry.name ? '' : entry.name)
                              }
                            }} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Chart 4: Hallazgos por Tipo y Semana ── */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Hallazgos y Cantidades por Semana</h3>
                <p className="text-sm text-gray-500">Tipos de hallazgo y cantidad total agrupados por semana{hasDashFechaFilter ? ` — filtrado por fechas` : ''}</p>
              </div>
              {semanaData.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(300, semanaData.length * 70)}>
                    <BarChart
                      data={semanaData}
                      margin={{ top: 16, right: 20, left: 10, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="semana"
                        tick={{ fontSize: 12 }}
                        angle={-25}
                        textAnchor="end"
                        height={55}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        labelFormatter={(label) => `Semana: ${label}`}
                        formatter={(value: number, name: string) => [
                          value,
                          name === 'cantidad' ? 'Cantidad total' : name
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
                        formatter={(value) => value === 'cantidad' ? 'Cantidad total' : value}
                      />
                      {semanaHallazgoTypes.map((tipo, idx) => (
                        <Bar
                          key={tipo}
                          dataKey={tipo}
                          name={tipo}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                          radius={[3, 3, 0, 0]}
                          stackId="hallazgos"
                          cursor="pointer"
                          onClick={() => toggleDashHallazgoFilter(tipo)}
                        />
                      ))}
                      <Bar
                        dataKey="cantidad"
                        name="cantidad"
                        fill="#10b981"
                        radius={[3, 3, 0, 0]}
                        label={{ position: 'top', fontSize: 11 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* ── Resumen de totales por tipo de hallazgo ── */}
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <div className="flex flex-wrap gap-3 mb-4">
                      {semanaResumen.items.map((item, idx) => (
                        <div
                          key={item.tipo}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
                          style={{ borderColor: PIE_COLORS[semanaHallazgoTypes.indexOf(item.tipo) % PIE_COLORS.length] + '60',
                                   backgroundColor: PIE_COLORS[semanaHallazgoTypes.indexOf(item.tipo) % PIE_COLORS.length] + '12' }}
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PIE_COLORS[semanaHallazgoTypes.indexOf(item.tipo) % PIE_COLORS.length] }}
                          />
                          <span className="text-gray-700 font-medium">{item.tipo}:</span>
                          <span className="font-bold text-gray-900">{item.total}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <span className="text-sm font-medium text-indigo-700">Total hallazgos:</span>
                        <span className="text-xl font-extrabold text-indigo-800">{semanaResumen.totalHallazgos}</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-emerald-700">Cantidad total:</span>
                          <p className="text-xs text-emerald-600 mt-0.5">Suma del campo cantidad de cada registro</p>
                        </div>
                        <span className="text-xl font-extrabold text-emerald-800">{semanaResumen.totalCantidad}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Chart 5 + 6: Celda y Área side by side ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar: Hallazgos por Celda */}
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                  Celda con mayor registro
                </h3>
                <p className="text-sm text-gray-500 mb-4">Registros por celda de producción · Alcance: {dashFilterSummary}.</p>
                {celdaData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={Math.max(220, celdaData.length * 52)}>
                      <BarChart
                        data={celdaData}
                        layout="vertical"
                        margin={{ top: 4, right: 50, left: 20, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 13, fontWeight: 600 }} />
                        <Tooltip formatter={(value) => [`${value} hallazgos`, 'Total']} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 13, fontWeight: 700 }}>
                          {celdaData.map((entry, index) => (
                            <Cell key={`celda-${index}`} fill={['#f97316','#fb923c','#fdba74','#fed7aa','#ffedd5'][index % 5]} cursor="pointer"
                              onClick={() => toggleDashCeldaFilter(entry.name)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {/* Top celda badge */}
                    {celdaData[0] && (
                      <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <span className="text-sm font-medium text-orange-700">Celda con más registros en los filtros actuales:</span>
                        <span className="text-2xl font-extrabold text-orange-600">Celda {celdaData[0].name}</span>
                        <span className="ml-auto text-lg font-bold text-orange-800">{celdaData[0].value} registros</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bar: Hallazgos por Área */}
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-teal-500"></span>
                  Hallazgos por Área
                </h3>
                <p className="text-sm text-gray-500 mb-4">Áreas donde se están registrando los hallazgos</p>
                {areaData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={Math.max(220, areaData.length * 52)}>
                      <BarChart
                        data={areaData}
                        layout="vertical"
                        margin={{ top: 4, right: 50, left: 20, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => [`${value} hallazgos`, 'Total']} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 13, fontWeight: 700 }}>
                          {areaData.map((_, index) => (
                            <Cell key={`area-${index}`} fill={['#14b8a6','#2dd4bf','#5eead4','#99f6e4','#ccfbf1'][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {/* Top area badge */}
                    {areaData[0] && (
                      <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <span className="text-sm font-medium text-teal-700">Área con más hallazgos:</span>
                        <span className="text-2xl font-extrabold text-teal-600">{areaData[0].name}</span>
                        <span className="ml-auto text-lg font-bold text-teal-800">{areaData[0].value} registros</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Matrix: Hallazgo × Celda ── */}
            <div className="rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-1 text-lg font-semibold text-gray-800">Matriz de hallazgos por celda</h3>
              <p className="mb-4 text-sm text-gray-500">Cada valor es el número de registros. Selecciona una celda de la matriz para filtrar el Dashboard y el detalle.</p>
              {matrixData.length === 0 ? (
                <div className="py-10 text-center text-gray-400">Sin datos para mostrar</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-left text-gray-700">
                        <th className="sticky left-0 z-10 rounded-tl-lg bg-gray-100 px-4 py-3">Hallazgo</th>
                        {celdaData.map(cell => (
                          <th key={cell.name} className="whitespace-nowrap px-3 py-3 text-center">
                            <button type="button" onClick={() => toggleDashCeldaFilter(cell.name)}
                              className={`rounded px-2 py-1 hover:bg-indigo-100 ${dashFilterCelda === cell.name ? 'bg-indigo-600 font-semibold text-white hover:bg-indigo-700' : ''}`}>
                              {cell.name}
                            </button>
                          </th>
                        ))}
                        <th className="rounded-tr-lg px-4 py-3 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixData.map((row, rowIndex) => (
                        <tr key={row.hallazgo} className={`border-b border-gray-100 ${rowIndex % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                          <th scope="row" className="sticky left-0 z-[1] bg-inherit px-4 py-2 text-left font-medium text-gray-800">
                            <button type="button" onClick={() => toggleDashHallazgoFilter(row.hallazgo)}
                              className={`rounded px-2 py-1 text-left hover:bg-amber-100 ${dashFilterHallazgos.length === 1 && dashFilterHallazgos[0] === row.hallazgo ? 'bg-amber-100 font-semibold text-amber-900' : ''}`}>
                              {row.hallazgo}
                            </button>
                          </th>
                          {row.celdas.map(cell => {
                            const selected = dashFilterHallazgos.length === 1 && dashFilterHallazgos[0] === row.hallazgo && dashFilterCelda === cell.name
                            return (
                              <td key={cell.name} className="px-3 py-2 text-center">
                                {cell.value > 0 ? (
                                  <button type="button" onClick={() => toggleDashMatrixCell(row.hallazgo, cell.name)}
                                    aria-pressed={selected} aria-label={`Filtrar ${row.hallazgo}, celda ${cell.name}: ${cell.value} registros`}
                                    className={`min-w-9 rounded-md px-2 py-1 font-semibold transition-colors ${selected ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-200'}`}>
                                    {cell.value}
                                  </button>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                            )
                          })}
                          <td className="px-4 py-2 text-center font-bold text-gray-800">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-3 text-xs text-gray-500">La matriz incluye todos los hallazgos del filtro actual. Para quitar la selección, vuelve a pulsar la celda o usa “Limpiar filtros”.</p>
            </div>

            {/* ── Individual filtered records ── */}
            <div className="rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Registros individuales filtrados</h3>
                  <p className="mt-1 text-sm text-gray-500">Cada fila es una captura; la búsqueda, los filtros y las selecciones de gráficas se aplican aquí.</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-800">{dashRecordsSorted.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left text-gray-700">
                      <th className="whitespace-nowrap rounded-tl-lg px-3 py-3">Fecha</th>
                      <th className="px-3 py-3">Área</th>
                      <th className="px-3 py-3">Celda</th>
                      <th className="px-3 py-3">Orden</th>
                      <th className="px-3 py-3">Hallazgo</th>
                      <th className="px-3 py-3">Parte equivocada</th>
                      <th className="px-3 py-3">Parte requerida</th>
                      <th className="px-3 py-3 text-center">Cantidad</th>
                      <th className="px-3 py-3">Usuario que registra</th>
                      <th className="px-3 py-3">Kiteador autorizado</th>
                      <th className="rounded-tr-lg px-3 py-3">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashRecordsPageRows.map((r, index) => {
                      const autorizado = canonicalizarUsuarioAutorizadoKitteo(r.usuario_kitteo, USUARIOS_AUTORIZADOS_PERSONAS, USUARIOS_HISTORICOS_DASHBOARD)
                      return (
                        <tr key={r.id || `${r.fecha}-${r.no_orden}-${index}`} className={`border-b border-gray-100 align-top ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{r.fecha}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{r.area || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{r.celda?.trim() || 'SIN CELDA'}</td>
                          <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-800">{r.noOrden || r.no_orden || '—'}</td>
                          <td className="min-w-[180px] px-3 py-2">
                            <button type="button" onClick={() => toggleDashHallazgoFilter(r.hallazgo)}
                              className="rounded bg-amber-50 px-2 py-1 text-left text-xs font-medium text-amber-900 hover:bg-amber-100">
                              {r.hallazgo}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{r.noParte || r.no_parte || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{r.no_parte_requerido || '—'}</td>
                          <td className="px-3 py-2 text-center font-semibold text-emerald-700">{r.cantidad || 0}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-700">{r.usuario || '—'}</td>
                          <td className="min-w-[180px] px-3 py-2">
                            {autorizado
                              ? <button type="button" onClick={() => setDashFilterUsuarioKitteo(current => current === autorizado ? '' : autorizado)}
                                  className="rounded bg-indigo-50 px-2 py-1 text-left text-xs font-medium text-indigo-800 hover:bg-indigo-100">{autorizado}</button>
                              : <button type="button" onClick={() => setDashFilterUsuarioKitteo(current => current === UNIDENTIFIED_AUTHORIZED_FILTER ? '' : UNIDENTIFIED_AUTHORIZED_FILTER)}
                                  className="rounded bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100">No identificable</button>}
                          </td>
                          <td className="min-w-[180px] max-w-[320px] break-words px-3 py-2 text-gray-700">{r.nota || '—'}</td>
                        </tr>
                      )
                    })}
                    {dashRecordsSorted.length === 0 && (
                      <tr><td colSpan={11} className="py-10 text-center text-gray-400">No hay registros que coincidan con los filtros actuales.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600">
                  Mostrando {dashRecordsSorted.length === 0 ? 0 : (dashRecordsPage - 1) * DASHBOARD_RECORDS_PER_PAGE + 1}–{Math.min(dashRecordsPage * DASHBOARD_RECORDS_PER_PAGE, dashRecordsSorted.length)} de {dashRecordsSorted.length}
                </p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setDashRecordsPage(page => Math.max(1, page - 1))} disabled={dashRecordsPage <= 1}
                    aria-label="Página anterior" className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600">Página {dashRecordsPage} de {dashRecordsPageCount}</span>
                  <button type="button" onClick={() => setDashRecordsPage(page => Math.min(dashRecordsPageCount, page + 1))} disabled={dashRecordsPage >= dashRecordsPageCount}
                    aria-label="Página siguiente" className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Detail table ── */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Detalle: Hallazgo + No. de Parte</h3>
              <p className="text-sm text-gray-500 mb-4">Usa “Ver” para consultar quién registró cada combinación. El filtro por usuario muestra las combinaciones que esa persona capturó.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left text-gray-700">
                      <th className="px-4 py-3 rounded-tl-lg">#</th>
                      <th className="px-4 py-3">Tipo de Hallazgo</th>
                      <th className="px-4 py-3">No. de Parte</th>
                      <th className="px-4 py-3">No. de Parte Requerido</th>
                      <th className="px-4 py-3 text-center">Veces registrado</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3">Frecuencia</th>
                      <th className="px-4 py-3 text-center rounded-tr-lg">Desglose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallazgoParteData.map((d, idx) => (
                      <Fragment key={d.key}>
                        <tr className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs border border-yellow-200">{d.hallazgo}</span>
                          </td>
                          <td className="px-4 py-2 font-medium text-gray-800">{d.no_parte}</td>
                          <td className="px-4 py-2">
                            {d.no_parte_requerido
                              ? <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs border border-blue-200">{d.no_parte_requerido}</span>
                              : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-2 text-center font-bold text-gray-900">{d.count}</td>
                          <td className="px-4 py-2 text-center font-bold text-emerald-700">{d.cantidad}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 rounded text-xs font-semibold text-white"
                              style={{ backgroundColor: FREQ_COLORS[d.frecuencia] }}>
                              {d.frecuencia}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button type="button"
                              onClick={() => setExpandedDetailKey(current => current === d.key ? null : d.key)}
                              aria-expanded={expandedDetailKey === d.key}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-semibold transition-colors">
                              {expandedDetailKey === d.key
                                ? <><EyeOff className="w-3.5 h-3.5" /> Ocultar</>
                                : <><Eye className="w-3.5 h-3.5" /> Ver</>}
                            </button>
                          </td>
                        </tr>
                        {expandedDetailKey === d.key && (
                          <tr className="border-b border-indigo-100 bg-indigo-50/60">
                            <td colSpan={8} className="px-5 py-4">
                              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                <div>
                                  <h4 className="font-semibold text-indigo-900">Usuarios que registraron este hallazgo</h4>
                                  <p className="text-xs text-indigo-700 mt-1">{d.hallazgo} · No. de Parte: {d.no_parte}</p>
                                </div>
                                <p className="text-sm text-indigo-800">{d.count} registros · {d.cantidad} unidades</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {d.registradores.map(registrador => (
                                  <div key={registrador.nombre} className="flex items-center justify-between gap-3 rounded-lg border border-indigo-100 bg-white px-3 py-2">
                                    <span className="font-medium text-gray-800">{registrador.nombre}</span>
                                    <span className="text-right text-xs text-gray-600">
                                      {registrador.veces} {registrador.veces === 1 ? 'registro' : 'registros'}
                                      <span className="block text-emerald-700">{registrador.cantidad} unidades</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    {hallazgoParteData.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-8 text-gray-400">Sin datos para mostrar</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: HALLAZGO INTERNO
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'interno' && (
          <>
            {/* Form INTERNO */}
            <div className="bg-white rounded-xl shadow-xl p-6 mb-8 border-l-4 border-orange-500">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-orange-700">
                <ShieldAlert className="w-5 h-5" /> Registrar Nuevo Hallazgo INTERNO
              </h2>
              <form onSubmit={handleSubmitInterno} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input type="date" value={internoFecha} onChange={e => setInternoFecha(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-gray-900" required />
                </div>
                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
                  <select value={internoArea} onChange={e => setInternoArea(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-gray-900" required>
                    {AREA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {/* Celda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celda *</label>
                  <select value={internoCelda} onChange={e => setInternoCelda(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-gray-900" required>
                    <option value="">Seleccione una celda</option>
                    {CELDA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {/* No. Orden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Orden *</label>
                  <input type="text" value={internoNoOrden} onChange={e => setInternoNoOrden(e.target.value)} placeholder="Número de orden"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-gray-900" required />
                </div>
                {/* Hallazgo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hallazgo *</label>
                  <select value={internoHallazgo} onChange={e => setInternoHallazgo(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-gray-900" required>
                    <option value="">Seleccione un hallazgo</option>
                    {HALLAZGO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {/* No. de Parte EQUIVOCADO */}
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-1">No. de Parte EQUIVOCADO *</label>
                  <button type="button" onClick={() => setShowInternoPartsModal(true)}
                    className="w-full px-4 py-2 bg-red-50 border-2 border-red-500 rounded-lg text-left hover:bg-red-100 focus:ring-2 focus:ring-red-500 flex items-center justify-between text-gray-900">
                    <span className={`truncate ${internoNoParteDisplay ? 'text-gray-900' : 'text-red-400'}`}>
                      {internoNoParteDisplay || 'Seleccionar número de parte...'}
                    </span>
                    <Search className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                  </button>
                  {internoNoParte && <div className="mt-1 text-sm text-green-600">Seleccionado: {internoNoParte}</div>}
                </div>
                {/* No. de Parte REQUERIDO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. de Parte REQUERIDO *</label>
                  <button type="button" onClick={() => setShowInternoPartsRequeridoModal(true)}
                    className="w-full px-4 py-2 bg-white border border-blue-400 rounded-lg text-left hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 flex items-center justify-between text-gray-900">
                    <span className={`truncate ${internoNoParteRequeridoDisplay ? 'text-gray-900' : 'text-gray-500'}`}>
                      {internoNoParteRequeridoDisplay || 'Seleccionar parte requerida...'}
                    </span>
                    <Search className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />
                  </button>
                  {internoNoParteRequerido && <div className="mt-1 text-sm text-blue-600">Seleccionado: {internoNoParteRequerido}</div>}
                </div>
                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                  <input type="number" value={internoCantidad} onChange={e => setInternoCantidad(parseInt(e.target.value) || 1)} min="1"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-gray-900" required />
                </div>
                {/* Usuario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario que Registra *</label>
                  <select value={internoUsuario} onChange={e => setInternoUsuario(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-gray-900" required>
                    <option value="">Seleccione un usuario</option>
                    {USUARIOS.map(usr => <option key={usr} value={usr}>{usr}</option>)}
                  </select>
                </div>
                {/* Usuario autorizado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario autorizado *</label>
                  <select value={internoUsuarioKitteo} onChange={e => setInternoUsuarioKitteo(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-gray-900" required>
                    <option value="">Seleccione un usuario autorizado</option>
                    {USUARIOS_AUTORIZADOS.map(grupo => (
                      <optgroup key={grupo.area} label={grupo.area}>
                        {grupo.usuarios.map(persona => {
                          const value = `${persona.nombre} (${persona.iniciales})`
                          return <option key={persona.iniciales} value={value}>{value}</option>
                        })}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {/* Nota */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nota <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea value={internoNota} onChange={e => setInternoNota(e.target.value)}
                    placeholder="Escribe una nota adicional..." rows={2}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-gray-900 resize-none" />
                </div>
                {/* Usuario que Validó */}
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-1">Usuario que Validó <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input type="text" value={internoUsuarioValidacion} onChange={e => setInternoUsuarioValidacion(e.target.value.toUpperCase())} placeholder="Nombre del validador"
                    className="w-full px-4 py-2 bg-purple-50 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-400 text-gray-900" />
                </div>
                {/* Submit */}
                <div className="flex items-end">
                  <button type="submit" disabled={loading}
                    className="w-full px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <Plus className="w-5 h-5" /> Registrar Hallazgo INTERNO
                  </button>
                </div>
              </form>
            </div>

            {/* Records list INTERNO */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Registros INTERNOS
                  <span className="text-sm font-normal text-gray-500">
                    ({filteredRegistrosInterno.length}{hasActiveInternoFilters ? ` filtrados de ${registrosInterno.length}` : ' total'})
                  </span>
                </h2>
                {registrosInterno.length > 0 && (
                  <button onClick={exportInternoToExcel}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" /> Exportar Excel
                  </button>
                )}
              </div>

              {/* Filters INTERNO */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">Filtros</span>
                  {hasActiveInternoFilters && (
                    <button onClick={clearInternoFilters}
                      className="ml-auto text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full flex items-center gap-1">
                      <X className="w-3 h-3" /> Limpiar filtros
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha desde</label>
                    <input type="date" value={filterInternoFechaDesde} onChange={e => setFilterInternoFechaDesde(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha hasta</label>
                    <input type="date" value={filterInternoFechaHasta} onChange={e => setFilterInternoFechaHasta(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Usuario que registra</label>
                    <select value={filterInternoUsuario} onChange={e => setFilterInternoUsuario(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900">
                      <option value="">Todos los usuarios</option>
                      {USUARIOS.map(usr => <option key={usr} value={usr}>{usr}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {filteredRegistrosInterno.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShieldAlert className="w-16 h-16 mx-auto mb-4 opacity-30 text-orange-400" />
                  {registrosInterno.length === 0 ? (
                    <><p>No hay registros internos aún</p><p className="text-sm">Los hallazgos internos registrados aparecerán aquí</p></>
                  ) : (
                    <><p>No hay registros que coincidan con los filtros</p>
                      <button onClick={clearInternoFilters} className="mt-2 text-sm text-blue-600 hover:underline">Limpiar filtros</button></>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-orange-100 text-left text-gray-800">
                          <th className="px-4 py-3 rounded-tl-lg">Fecha</th>
                          <th className="px-4 py-3">Área</th>
                          <th className="px-4 py-3">Celda</th>
                          <th className="px-4 py-3">No. Orden</th>
                          <th className="px-4 py-3">Hallazgo</th>
                          <th className="px-4 py-3">No. de Parte</th>
                          <th className="px-4 py-3">No. de Parte Requerido</th>
                          <th className="px-4 py-3">Cantidad</th>
                          <th className="px-4 py-3">Usuario</th>
                          <th className="px-4 py-3">Usuario autorizado</th>
                          <th className="px-4 py-3">Usuario Validó</th>
                          <th className="px-4 py-3 rounded-tr-lg">Nota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRegistrosInterno.map((r, idx) => (
                          <tr key={r.id} className={`border-b border-gray-200 hover:bg-orange-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-orange-50/30'}`}>
                            <td className="px-4 py-3 text-gray-900">{r.fecha}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">{r.area}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">{r.celda || '-'}</td>
                            <td className="px-4 py-3 text-gray-900">{r.noOrden}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm border border-orange-300">{r.hallazgo}</span>
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
                            <td className="px-4 py-3">
                              {(r as any).usuario_validacion
                                ? <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm border border-purple-300">{(r as any).usuario_validacion}</span>
                                : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                              {r.nota
                                ? <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded border border-amber-200 whitespace-pre-wrap">{r.nota}</span>
                                : <span className="text-gray-400">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalInternoRecordsPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {((internoRecordsPage - 1) * RECORDS_PER_PAGE) + 1}–{Math.min(internoRecordsPage * RECORDS_PER_PAGE, filteredRegistrosInterno.length)} de {filteredRegistrosInterno.length} registros
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setInternoRecordsPage(p => Math.max(1, p - 1))} disabled={internoRecordsPage === 1}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm">
                          <ChevronLeft className="w-4 h-4" /> Anterior
                        </button>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600">Página</span>
                          <select value={internoRecordsPage} onChange={e => setInternoRecordsPage(parseInt(e.target.value))}
                            className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-900">
                            {Array.from({ length: totalInternoRecordsPages }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                          <span className="text-sm text-gray-600">de {totalInternoRecordsPages}</span>
                        </div>
                        <button onClick={() => setInternoRecordsPage(p => Math.min(totalInternoRecordsPages, p + 1))} disabled={internoRecordsPage === totalInternoRecordsPages}
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
      </main>


        {/* ════════════════════════════════════════════════════════════════
            TAB: DASHBOARD INTERNO
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashInterno' && (
          <div className="space-y-6">
            {/* Header + filtros */}
            <div className="bg-white rounded-xl shadow-xl p-5 border-l-4 border-rose-600">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-rose-700 flex items-center gap-2">
                    <BarChart2 className="w-6 h-6" /> Dashboard de Hallazgos INTERNOS
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {hasDashInternoFechaFilter
                      ? `Registros filtrados: ${dashInternoBase.length} de ${registrosInterno.length}`
                      : `Total de registros analizados: ${registrosInterno.length}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha desde</label>
                    <input type="date" value={dashInternoFechaDesde} onChange={e => setDashInternoFechaDesde(e.target.value)}
                      className="px-3 py-2 bg-white border border-rose-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha hasta</label>
                    <input type="date" value={dashInternoFechaHasta} onChange={e => setDashInternoFechaHasta(e.target.value)}
                      className="px-3 py-2 bg-white border border-rose-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-400" />
                  </div>
                  {hasDashInternoFechaFilter && (
                    <button onClick={clearDashInternoFechas}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors" title="Limpiar filtro de fechas">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.entries(internoFreqSummary) as [string, number][]).map(([label, count]) => (
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

            {/* Chart 1: Hallazgo + No. de Parte por frecuencia */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Hallazgos más comunes por No. de Parte (INTERNO)</h3>
              <p className="text-sm text-gray-500 mb-4">Combinación de tipo de hallazgo y número de parte — color indica frecuencia</p>
              {internoHallazgoParteData.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(300, internoHallazgoParteData.length * 38)}>
                  <BarChart data={internoHallazgoParteData} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="shortLabel" width={110} tick={{ fontSize: 11 }}
                      tickFormatter={(_v, i) => { const d = internoHallazgoParteData[i]; return d ? `${d.no_parte}` : _v }} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 12 }}>
                      {internoHallazgoParteData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FREQ_COLORS[entry.frecuencia]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {Object.entries(FREQ_COLORS).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                    <span className="text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2 + 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Distribución por tipo de hallazgo (INTERNO)</h3>
                <p className="text-sm text-gray-500 mb-4">Proporción de cada tipo de hallazgo</p>
                {internoHallazgoDistData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={internoHallazgoDistData} cx="50%" cy="45%" outerRadius={110} dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {internoHallazgoDistData.map((_, index) => (
                          <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend formatter={(value) => <span className="text-xs text-gray-700">{value}</span>} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Top usuarios autorizados (INTERNO)</h3>
                <p className="text-sm text-gray-500 mb-4">Usuarios con más hallazgos internos registrados</p>
                {internoUsuarioKitteoData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={internoUsuarioKitteoData} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`${value} registros`, 'Total']} />
                      <Bar dataKey="value" fill="#e11d48" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 12 }}>
                        {internoUsuarioKitteoData.map((_, index) => (
                          <Cell key={`uk-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 4: Por semana */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Hallazgos y Cantidades por Semana (INTERNO)</h3>
              <p className="text-sm text-gray-500 mb-4">Tipos de hallazgo y cantidad total agrupados por semana</p>
              {internoSemanaData.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(300, internoSemanaData.length * 70)}>
                    <BarChart data={internoSemanaData} margin={{ top: 16, right: 20, left: 10, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="semana" tick={{ fontSize: 12 }} angle={-25} textAnchor="end" height={55} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip labelFormatter={(label) => `Semana: ${label}`}
                        formatter={(value: number, name: string) => [value, name === 'cantidad' ? 'Cantidad total' : name]} />
                      <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
                        formatter={(value) => value === 'cantidad' ? 'Cantidad total' : value} />
                      {internoSemanaHallazgoTypes.map((tipo, idx) => (
                        <Bar key={tipo} dataKey={tipo} name={tipo} fill={PIE_COLORS[idx % PIE_COLORS.length]} radius={[3, 3, 0, 0]} stackId="hallazgos" />
                      ))}
                      <Bar dataKey="cantidad" name="cantidad" fill="#10b981" radius={[3, 3, 0, 0]} label={{ position: 'top', fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <div className="flex flex-wrap gap-3 mb-4">
                      {internoSemanaResumen.items.map((item) => (
                        <div key={item.tipo} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
                          style={{ borderColor: PIE_COLORS[internoSemanaHallazgoTypes.indexOf(item.tipo) % PIE_COLORS.length] + '60',
                                   backgroundColor: PIE_COLORS[internoSemanaHallazgoTypes.indexOf(item.tipo) % PIE_COLORS.length] + '12' }}>
                          <span className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PIE_COLORS[internoSemanaHallazgoTypes.indexOf(item.tipo) % PIE_COLORS.length] }} />
                          <span className="text-gray-700 font-medium">{item.tipo}:</span>
                          <span className="font-bold text-gray-900">{item.total}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <span className="text-sm font-medium text-rose-700">Total hallazgos:</span>
                        <span className="text-xl font-extrabold text-rose-800">{internoSemanaResumen.totalHallazgos}</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <span className="text-sm font-medium text-emerald-700">Cantidad total:</span>
                        <span className="text-xl font-extrabold text-emerald-800">{internoSemanaResumen.totalCantidad}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Chart 5 + 6: Celda y Área */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                  Celda con mayor registro (INTERNO)
                </h3>
                <p className="text-sm text-gray-500 mb-4">Número de hallazgos internos por celda</p>
                {internoCeldaData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={Math.max(220, internoCeldaData.length * 52)}>
                      <BarChart data={internoCeldaData} layout="vertical" margin={{ top: 4, right: 50, left: 20, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 13, fontWeight: 600 }} />
                        <Tooltip formatter={(value) => [`${value} hallazgos`, 'Total']} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 13, fontWeight: 700 }}>
                          {internoCeldaData.map((_, index) => (
                            <Cell key={`celda-${index}`} fill={['#f97316','#fb923c','#fdba74','#fed7aa','#ffedd5'][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {internoCeldaData[0] && (
                      <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <span className="text-sm font-medium text-orange-700">Celda con más hallazgos:</span>
                        <span className="text-2xl font-extrabold text-orange-600">Celda {internoCeldaData[0].name}</span>
                        <span className="ml-auto text-lg font-bold text-orange-800">{internoCeldaData[0].value} registros</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-teal-500"></span>
                  Hallazgos por Área (INTERNO)
                </h3>
                <p className="text-sm text-gray-500 mb-4">Áreas con hallazgos internos registrados</p>
                {internoAreaData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Sin datos para mostrar</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={Math.max(220, internoAreaData.length * 52)}>
                      <BarChart data={internoAreaData} layout="vertical" margin={{ top: 4, right: 50, left: 20, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => [`${value} hallazgos`, 'Total']} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 13, fontWeight: 700 }}>
                          {internoAreaData.map((_, index) => (
                            <Cell key={`area-${index}`} fill={['#14b8a6','#2dd4bf','#5eead4','#99f6e4','#ccfbf1'][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {internoAreaData[0] && (
                      <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <span className="text-sm font-medium text-teal-700">Área con más hallazgos:</span>
                        <span className="text-2xl font-extrabold text-teal-600">{internoAreaData[0].name}</span>
                        <span className="ml-auto text-lg font-bold text-teal-800">{internoAreaData[0].value} registros</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Detail table */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle: Hallazgo + No. de Parte (INTERNO)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-rose-100 text-left text-gray-700">
                      <th className="px-4 py-3 rounded-tl-lg">#</th>
                      <th className="px-4 py-3">Tipo de Hallazgo</th>
                      <th className="px-4 py-3">No. de Parte</th>
                      <th className="px-4 py-3">No. de Parte Requerido</th>
                      <th className="px-4 py-3 text-center">Veces registrado</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3 rounded-tr-lg">Frecuencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internoHallazgoParteData.map((d, idx) => (
                      <tr key={idx} className={`border-b border-gray-100 hover:bg-rose-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs border border-orange-200">{d.hallazgo}</span>
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-800">{d.no_parte}</td>
                        <td className="px-4 py-2">
                          {d.no_parte_requerido
                            ? <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs border border-blue-200">{d.no_parte_requerido}</span>
                            : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-2 text-center font-bold text-gray-900">{d.count}</td>
                        <td className="px-4 py-2 text-center font-bold text-emerald-700">{d.cantidad}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold text-white"
                            style={{ backgroundColor: FREQ_COLORS[d.frecuencia] }}>
                            {d.frecuencia}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {internoHallazgoParteData.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-400">Sin datos para mostrar</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* ── Modal: No. de Parte INTERNO ── */}
      {showInternoPartsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-orange-200 flex justify-between items-center bg-orange-50 rounded-t-xl">
              <h3 className="text-xl font-semibold text-orange-800">Seleccionar Número de Parte (INTERNO)</h3>
              <button onClick={() => { setShowInternoPartsModal(false); setInternoModalSearch('') }} className="p-2 hover:bg-orange-100 rounded-lg">
                <X className="w-5 h-5 text-orange-600" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
                <input type="text" value={internoModalSearch} onChange={e => setInternoModalSearch(e.target.value)} autoFocus
                  placeholder="Buscar por ID o descripción..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg text-gray-900" />
              </div>
              <div className="mt-2 text-sm text-gray-600">Mostrando {paginatedInternoParts.length} de {filteredInternoParts.length} resultados</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {paginatedInternoParts.map(part => (
                  <div key={part.id} onClick={() => { setInternoNoParte(part.id); setInternoNoParteDisplay(`${part.id} - ${part.description}`); setShowInternoPartsModal(false); setInternoModalSearch('') }}
                    className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg cursor-pointer border border-orange-200 hover:border-orange-400">
                    <div className="font-medium text-orange-800">{part.id}</div>
                    <div className="text-sm text-orange-600 truncate">{part.description}</div>
                  </div>
                ))}
              </div>
            </div>
            {totalInternoPartsPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button onClick={() => setCurrentInternoPartsPage(p => Math.max(1, p - 1))} disabled={currentInternoPartsPage === 1}
                  className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Página</span>
                  <select value={currentInternoPartsPage} onChange={e => setCurrentInternoPartsPage(parseInt(e.target.value))}
                    className="px-3 py-1 bg-white border border-orange-300 rounded-lg text-gray-900">
                    {Array.from({ length: totalInternoPartsPages }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                  <span className="text-gray-600">de {totalInternoPartsPages}</span>
                </div>
                <button onClick={() => setCurrentInternoPartsPage(p => Math.min(totalInternoPartsPages, p + 1))} disabled={currentInternoPartsPage === totalInternoPartsPages}
                  className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: No. de Parte REQUERIDO INTERNO ── */}
      {showInternoPartsRequeridoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-blue-200 flex justify-between items-center bg-blue-50 rounded-t-xl">
              <h3 className="text-xl font-semibold text-blue-800">Seleccionar No. de Parte REQUERIDO (INTERNO)</h3>
              <button onClick={() => { setShowInternoPartsRequeridoModal(false); setInternoModalRequeridoSearch('') }} className="p-2 hover:bg-blue-100 rounded-lg">
                <X className="w-5 h-5 text-blue-600" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input type="text" value={internoModalRequeridoSearch} onChange={e => setInternoModalRequeridoSearch(e.target.value)} autoFocus
                  placeholder="Buscar por ID o descripción..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg text-gray-900" />
              </div>
              <div className="mt-2 text-sm text-gray-600">Mostrando {paginatedInternoPartsRequerido.length} de {filteredInternoPartsRequerido.length} resultados</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {paginatedInternoPartsRequerido.map(part => (
                  <div key={part.id} onClick={() => { setInternoNoParteRequerido(part.id); setInternoNoParteRequeridoDisplay(`${part.id} - ${part.description}`); setShowInternoPartsRequeridoModal(false); setInternoModalRequeridoSearch('') }}
                    className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer border border-blue-200 hover:border-blue-400">
                    <div className="font-medium text-blue-800">{part.id}</div>
                    <div className="text-sm text-blue-600 truncate">{part.description}</div>
                  </div>
                ))}
              </div>
            </div>
            {totalInternoPartsRequeridoPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button onClick={() => setCurrentInternoPartsRequeridoPage(p => Math.max(1, p - 1))} disabled={currentInternoPartsRequeridoPage === 1}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Página</span>
                  <select value={currentInternoPartsRequeridoPage} onChange={e => setCurrentInternoPartsRequeridoPage(parseInt(e.target.value))}
                    className="px-3 py-1 bg-white border border-blue-300 rounded-lg text-gray-900">
                    {Array.from({ length: totalInternoPartsRequeridoPages }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                  <span className="text-gray-600">de {totalInternoPartsRequeridoPages}</span>
                </div>
                <button onClick={() => setCurrentInternoPartsRequeridoPage(p => Math.min(totalInternoPartsRequeridoPages, p + 1))} disabled={currentInternoPartsRequeridoPage === totalInternoPartsRequeridoPages}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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

      <InventoryCatalogDialog
        open={showInventoryCatalogModal}
        onClose={() => setShowInventoryCatalogModal(false)}
        onCreated={handleInventoryCatalogCreated}
      />

      {/* Footer */}
      <footer className="bg-white mt-8 py-4 text-center text-gray-600 text-sm border-t border-gray-200">
        <p>PXG KITTEO - Sistema de Registro de Hallazgos &copy; {new Date().getFullYear()}</p>
        <p>Creado por IT PXG trquila - julio canett para soporte</p>
      </footer>
    </div>
  )
}

export default App
