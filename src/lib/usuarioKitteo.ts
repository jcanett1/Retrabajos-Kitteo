type AliasGroup = {
  canonical: string
  aliases: string[]
}

// Solo alias confirmados; no incluye N/A, SN ni nombres ambiguos.
const ALIAS_GROUPS: AliasGroup[] = [
  { canonical: 'CAZARES/VALENZUELA/AZALIA YAHAIRA', aliases: ['AZALEA COTA', 'AZALIA COTA'] },
  { canonical: 'CHAVEZ/LEYVA/BRYAN ALFREDO', aliases: ['BRAYAN CHAVEZ', 'BRIAN CHAVEZ'] },
  { canonical: 'CINTHYA LEON', aliases: ['CL'] },
  { canonical: 'Cruz Diego Lopez Vargas', aliases: ['CRUZ ', 'CRUZ LOOPEZ', 'CRUZ LOPEZ', 'Cruz Diego Lopez Vargas (CD)'] },
  { canonical: 'Diana Mendez Rodriguez', aliases: ['DIANA,ENDES', 'DIANA  MENDEZ', 'DIANA MENDEZ', 'DM'] },
  { canonical: 'Ma. Elizabeth Olivarria Sanchez', aliases: ['ELIZABETH OLIVARRIA', 'EO', 'Ma. Elizabeth Olivarria Sanchez (EO)'] },
  { canonical: 'Eleazar Santana Paes', aliases: ['ELEAZAR SANTANA', 'ES', 'Eleazar Santana Paes (ES)'] },
  { canonical: 'ESPINOZA/AMAVISZCA/EDITH/EUNICE', aliases: ['EDITH ESPINOZA', 'EE'] },
  { canonical: 'Eduardo Cervantes Salazar', aliases: ['EDUARDO SALAZAR', 'EC'] },
  { canonical: 'Francisco Javier Vega', aliases: ['FRANCISCO VEG', 'FRANCISCO VEGA', 'FRANCISCO VEGA ', 'FRNACISCO VEGA', 'Francisco Javier Vega (FJ)', 'FV'] },
  { canonical: 'Gil Eduardo Macedo', aliases: ['GIL M', 'GIL MACEDO', 'GIL MECEDO', 'GM'] },
  { canonical: 'Adriana Janely Sanabria Castro', aliases: ['JANELI SANABRIA', 'JANELY SANABRIA', 'AS'] },
  { canonical: 'Jorge Santillanes', aliases: ['JORGE SANTILLAN', 'JORGE SANTILLAN ', 'JS'] },
  { canonical: 'LUGO/CASTRO/LETICIA/JULIETH', aliases: ['JULIETH LUGO', 'JL'] },
  { canonical: 'HERNANDEZ/PEREZ/KIMBERLY ELIZABETH', aliases: ['KIMBERLY HERNANDEZ', 'KH'] },
  { canonical: 'Maredna del Milagro Puig Arvizu', aliases: ['MAREDNA PIUG', 'MAREDNA PUIG', 'MP'] },
  { canonical: 'Mario Grajeda', aliases: ['MAARIO GRAJEDA', 'MNARIO GRAJEDA', 'MARIO', 'MARIO GRAJEDA', 'Mario Grajeda (MG)', 'MG'] },
  { canonical: 'MILAGROS NAVARRO', aliases: ['MILAGROS N'] },
  { canonical: 'Michael Meza Noriega', aliases: ['MICHAEL', 'MICHAEL MEZA', 'MM'] },
  { canonical: 'SOLARES/GARCIA/NORMA EDILIA', aliases: ['NORMA SOLARES', 'NS'] },
  { canonical: 'RAMIREZ/VALENZUELA/NORMA PATRICIA', aliases: ['PATRICIA RAMIRES', 'PATRICIA RAMIREZ', 'PR'] },
  { canonical: 'Denisse Abril Sansarric Valverde', aliases: ['DENISSE SANZARRIC', 'DENNISE SANZARRIC', 'DENISSE SANZARRICK', 'DS', 'Denisse Abril Sansarric Valverde (DS)'] },
  { canonical: 'Karel Yajaira Ontiveros Moreno', aliases: ['YAJAIRA ONTIVEROS', 'KY'] },
  { canonical: 'Yodeli Gpe. Lopez Manrriquez', aliases: ['YODELI LOPEZ', 'YL'] },
]

const normalizeAliasKey = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleUpperCase('es-MX')

const canonicalByAlias = new Map<string, string>()

for (const group of ALIAS_GROUPS) {
  canonicalByAlias.set(normalizeAliasKey(group.canonical), group.canonical)
  for (const alias of group.aliases) {
    canonicalByAlias.set(normalizeAliasKey(alias), group.canonical)
  }
}

export function canonicalizarUsuarioAutorizadoKitteo(
  value: string | null | undefined,
  usuariosAutorizados: readonly { nombre: string; iniciales: string }[],
  nombresAdicionales: readonly string[] = []
): string | null {
  const canonical = canonicalizarUsuarioKitteo(value)
  const candidateKeys = new Set([
    normalizeAliasKey(value ?? ''),
    normalizeAliasKey(canonical),
  ])

  const usuario = usuariosAutorizados.find(persona =>
    [persona.nombre, `${persona.nombre} (${persona.iniciales})`, persona.iniciales]
      .some(candidate => candidateKeys.has(normalizeAliasKey(candidate)))
  )

  if (usuario) return usuario.nombre
  return nombresAdicionales.find(nombre => candidateKeys.has(normalizeAliasKey(nombre))) ?? null
}

export function canonicalizarUsuarioKitteo(value?: string | null): string {
  const original = value ?? ''
  if (!original.trim()) return 'SIN ASIGNAR'
  return canonicalByAlias.get(normalizeAliasKey(original)) ?? original
}
