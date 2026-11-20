import { supabase } from '../supabaseClient'

export interface PartOption {
  id: string
  description: string
}

const PAGE_SIZE = 1000
const NOT_APPLICABLE_PART: PartOption = { id: 'N/A', description: 'N/A' }

export async function fetchInventoryCatalog(): Promise<PartOption[]> {
  const catalog: PartOption[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('pxg_inventory_catalog')
      .select('inventory_id, description')
      .order('inventory_id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw new Error(error.message)

    const page = (data ?? []).map(item => ({
      id: item.inventory_id,
      description: item.description ?? '',
    }))
    catalog.push(...page)

    if (page.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  const sortedParts = catalog
    .filter(item => item.id.trim().toUpperCase() !== 'N/A')
    .sort((left, right) => left.id.localeCompare(right.id, undefined, { sensitivity: 'base' }))

  // N/A is a UI-only sentinel from the former JSON catalog; it is not inserted into Supabase.
  return [NOT_APPLICABLE_PART, ...sortedParts]
}

export async function insertInventoryCatalogItem(input: {
  inventory_id: string
  description: string
}): Promise<PartOption> {
  const inventoryId = input.inventory_id.trim()
  const description = input.description.trim()

  if (!inventoryId || !description) {
    throw new Error('Completa el Inventory ID y la descripción.')
  }
  if (inventoryId.toUpperCase() === 'N/A') {
    throw new Error('N/A es una opción especial del sistema y no se registra como número de parte.')
  }
  if (inventoryId.length > 160 || description.length > 500) {
    throw new Error('El Inventory ID admite hasta 160 caracteres y la descripción hasta 500.')
  }

  const { data, error } = await supabase
    .from('pxg_inventory_catalog')
    .insert({ inventory_id: inventoryId, description })
    .select('inventory_id, description')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(`El Inventory ID “${inventoryId}” ya existe en el catálogo.`)
    }
    throw new Error(error.message)
  }

  return {
    id: data.inventory_id,
    description: data.description ?? '',
  }
}
