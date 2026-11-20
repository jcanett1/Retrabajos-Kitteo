import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { insertInventoryCatalogItem, type PartOption } from '../lib/inventoryCatalog'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (item: PartOption) => void
}

export default function InventoryCatalogDialog({ open, onClose, onCreated }: Props) {
  const [inventoryId, setInventoryId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const inventoryIdRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    setInventoryId('')
    setDescription('')
    setError('')
    const focusTimer = window.setTimeout(() => inventoryIdRef.current?.focus(), 80)
    return () => window.clearTimeout(focusTimer)
  }, [open])

  const closeDialog = () => {
    if (isSaving) return
    setError('')
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const normalizedInventoryId = inventoryId.trim()
    const normalizedDescription = description.trim()
    if (!normalizedInventoryId || !normalizedDescription) {
      setError('Completa el Inventory ID y la descripción.')
      return
    }

    setIsSaving(true)
    try {
      const item = await insertInventoryCatalogItem({
        inventory_id: normalizedInventoryId,
        description: normalizedDescription,
      })
      onCreated(item)
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar el número de parte.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(3px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-catalog-title"
      onMouseDown={event => {
        if (event.target === event.currentTarget) closeDialog()
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
            <Plus className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="inventory-catalog-title" className="text-lg font-bold text-gray-800">
              Nuevo número de parte
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              El Inventory ID y su descripción se guardarán en el catálogo PXG.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            disabled={isSaving}
            aria-label="Cerrar"
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label htmlFor="new-inventory-id" className="mb-1 block text-sm font-medium text-gray-700">
              Inventory ID <span className="text-red-600">*</span>
            </label>
            <input
              ref={inventoryIdRef}
              id="new-inventory-id"
              value={inventoryId}
              onChange={event => {
                setInventoryId(event.target.value)
                setError('')
              }}
              placeholder="Ej. A-SHAFT-ADAPTER-DRIV"
              autoComplete="off"
              maxLength={160}
              required
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="new-inventory-description" className="mb-1 block text-sm font-medium text-gray-700">
              Descripción <span className="text-red-600">*</span>
            </label>
            <textarea
              id="new-inventory-description"
              value={description}
              onChange={event => {
                setDescription(event.target.value)
                setError('')
              }}
              placeholder="Descripción del número de parte"
              rows={3}
              maxLength={500}
              required
              disabled={isSaving}
              className="w-full resize-y rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-100"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={closeDialog}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !inventoryId.trim() || !description.trim()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isSaving ? 'Guardando...' : 'Guardar número'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
