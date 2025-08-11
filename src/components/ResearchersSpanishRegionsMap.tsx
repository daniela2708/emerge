import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { communityFlags, communityNameMapping, normalizarTexto } from '../utils/spanishCommunitiesUtils';

// Definir colores específicos para los componentes de investigadores
// Estos son los mismos que se usan en ResearchersEuropeanMap.tsx
const RESEARCHER_SECTOR_COLORS = {
  total: '#607D8B',        // Azul grisáceo
  business: '#546E7A',     // Azul grisáceo más sobrio para empresas
  government: '#795548',   // Marrón para gobierno
  education: '#7E57C2',    // Morado para educación
  nonprofit: '#5C6BC0'     // Azul índigo para organizaciones sin fines de lucro
};

// Color constante para valores nulos/sin datos
const NO_DATA_COLOR = '#f5f5f5';

// URL del archivo GeoJSON de España
const SPAIN_GEOJSON_URL = '/data/geo/spain-communities.geojson';

// Interfaces y tipos

// Tipo para mostrar datos
type DataDisplayType = 'researchers_count' | 'researchers_per_thousand';

// Definición de tipos para propiedades GeoJSON
type GeoJsonProperties = {
  name?: string;
  name_es?: string;
  name_en?: string;
  code?: string;
  iso?: string;
  ccaa?: string;
  [key: string]: string | number | undefined;
};

interface GeoJsonGeometry {
  type: string;
  coordinates: number[][][] | number[][][][] | number[][][][][];
}

interface GeoJsonFeature {
  type: string;
  properties: GeoJsonProperties;
  geometry: GeoJsonGeometry;
}

interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

// Interfaz para los datos de investigadores por comunidades autónomas
interface ResearchersCommunityData {
  TERRITORIO: string;
  TERRITORIO_CODE: string;
  TIME_PERIOD: string;
  TIME_PERIOD_CODE: string;
  SEXO: string;
  SEXO_CODE: string;
  SECTOR_EJECUCION: string;
  SECTOR_EJECUCION_CODE: string;
  MEDIDAS: string;
  MEDIDAS_CODE: string;
  OBS_VALUE: string;
  [key: string]: string;
}

// Props del componente
interface ResearchersSpanishRegionsMapProps {
  data: ResearchersCommunityData[];
  selectedYear: number;
  selectedSector: string;
  language: 'es' | 'en';
  onClick?: (region: string) => void;
  dataDisplayType?: DataDisplayType;
}

// Textos según idioma
const mapTexts = {
  'es': {
    loading: 'Cargando mapa...',
    error: 'Error al cargar el mapa',
    legend: 'Investigadores (EJC)',
    rankLabel: 'Ranking:',
    canaryIslands: 'Islas Canarias',
    canaryBox: 'Islas Canarias',
    tooltipTitle: 'Investigadores',
    researchers: 'Investigadores',
    researchersPerThousand: 'Investigadores por mil habitantes',
    noData: 'Sin datos',
    noResearchers: 'Sin investigadores',
    of: 'de'
  },
  'en': {
    loading: 'Loading map...',
    error: 'Error loading map',
    legend: 'Researchers (FTE)',
    rankLabel: 'Ranking:',
    canaryIslands: 'Canary Islands',
    canaryBox: 'Canary Islands',
    tooltipTitle: 'Researchers',
    researchers: 'Researchers',
    researchersPerThousand: 'Researchers per thousand inhabitants',
    noData: 'No data',
    noResearchers: 'No researchers',
    of: 'of'
  }
};

// Tabla de mapeo entre nombres de comunidades en el CSV y nombres en GeoJSON
// Esto ayuda a estandarizar los nombres entre diferentes formatos

// Función para obtener el nombre de la comunidad de las propiedades GeoJSON
function getCommunityName(feature: GeoJsonFeature, language: 'es' | 'en'): string {
  const props = feature.properties || {};
  
  // Manejar casos especiales por su código (códigos de comunidades autónomas españolas)
  if (props.iso) {
    const code = props.iso.toString().toUpperCase();
    // Mapeo de códigos ISO a nombres completos
    const isoCodeMap: Record<string, {es: string, en: string}> = {
      'ES-AN': {es: 'Andalucía', en: 'Andalusia'},
      'ES-AR': {es: 'Aragón', en: 'Aragon'},
      'ES-AS': {es: 'Asturias', en: 'Asturias'},
      'ES-CB': {es: 'Cantabria', en: 'Cantabria'},
      'ES-CL': {es: 'Castilla y León', en: 'Castile and León'},
      'ES-CM': {es: 'Castilla-La Mancha', en: 'Castilla–La Mancha'},
      'ES-CN': {es: 'Islas Canarias', en: 'Canary Islands'},
      'ES-CT': {es: 'Cataluña', en: 'Catalonia'},
      'ES-EX': {es: 'Extremadura', en: 'Extremadura'},
      'ES-GA': {es: 'Galicia', en: 'Galicia'},
      'ES-IB': {es: 'Islas Baleares', en: 'Balearic Islands'},
      'ES-MC': {es: 'Murcia', en: 'Murcia'},
      'ES-MD': {es: 'Madrid', en: 'Madrid'},
      'ES-NC': {es: 'Navarra', en: 'Navarre'},
      'ES-PV': {es: 'País Vasco', en: 'Basque Country'},
      'ES-RI': {es: 'La Rioja', en: 'La Rioja'},
      'ES-VC': {es: 'Com. Valenciana', en: 'Valencia'},
      'ES-CE': {es: 'Ceuta', en: 'Ceuta'},
      'ES-ML': {es: 'Melilla', en: 'Melilla'}
    };
    
    if (code in isoCodeMap) {
      return language === 'es' ? isoCodeMap[code].es : isoCodeMap[code].en;
    }
  }
  
  // Si no tiene código ISO, intentar con otros campos
  let name = '';
  
  if (language === 'es') {
    name = props.name_es || props.name || props.ccaa || '';
  } else {
    name = props.name_en || props.name || props.ccaa || '';
  }
  
  // Si tenemos un nombre, intentar normalizarlo con el mapeo
  if (name) {
    const normalizedName = normalizarTexto(name);
    for (const key in communityNameMapping) {
      if (normalizarTexto(key) === normalizedName) {
        return language === 'es' ? 
          communityNameMapping[key].es : 
          communityNameMapping[key].en;
      }
    }
  }
  
  return name;
}

// Función para obtener el código de la comunidad
function getCommunityCode(feature: GeoJsonFeature): string {
  const props = feature.properties || {};
  // Intentar obtener el código de la comunidad
  return (props.code || props.iso || '') as string;
}

// Función para obtener la paleta de colores según el sector
function getSectorPalette(sectorId: string) {
  let normalizedId = sectorId.toLowerCase();
  
  // Transformar sectores a IDs con normalización mejorada
  if (normalizedId === 'total' || normalizedId === 'todos los sectores' || normalizedId === 'all sectors' || normalizedId === 'all') 
    normalizedId = 'total';
  if (normalizedId === 'bes' || normalizedId === 'business' || normalizedId === 'sector empresarial' || normalizedId === 'business enterprise sector') 
    normalizedId = 'business';
  if (normalizedId === 'gov' || normalizedId === 'government' || normalizedId === 'administración pública' || normalizedId === 'government sector') 
    normalizedId = 'government';
  if (normalizedId === 'hes' || normalizedId === 'education' || normalizedId === 'enseñanza superior' || normalizedId === 'higher education sector') 
    normalizedId = 'education';
  if (normalizedId === 'pnp' || normalizedId === 'nonprofit' || normalizedId === 'instituciones privadas sin fines de lucro' || normalizedId === 'private non-profit sector') 
    normalizedId = 'nonprofit';
  
  // Asegurar que usamos una clave válida para RESEARCHER_SECTOR_COLORS
  const validSectorId = (normalizedId in RESEARCHER_SECTOR_COLORS) ? normalizedId : 'total';
  const baseColor = RESEARCHER_SECTOR_COLORS[validSectorId as keyof typeof RESEARCHER_SECTOR_COLORS];
  
  // Crear un contraste más fuerte para el mapa de calor
  return {
    NULL: NO_DATA_COLOR,       // Usar la constante global para valores nulos
    ZERO: '#ff9800',           // Color anaranjado para regiones con 0 investigadores
    MIN: d3.color(baseColor)?.brighter(1.9)?.toString() || '#f5f5f5',  // Muy claro
    LOW: d3.color(baseColor)?.brighter(1.1)?.toString() || '#d0d0d0',  // Claro
    MID: baseColor,                                                    // Color base del sector
    HIGH: d3.color(baseColor)?.darker(1.0)?.toString() || '#909090',   // Oscuro
    MAX: d3.color(baseColor)?.darker(1.8)?.toString() || '#707070',    // Muy oscuro
  };
}

// Función para obtener el valor de investigadores para una comunidad
function getCommunityValue(
  feature: GeoJsonFeature,
  data: ResearchersCommunityData[],
  year: string,
  selectedSector: string,
  language: 'es' | 'en'
): number | null {
  try {
  // Obtener el nombre de la comunidad del feature
  const communityName = getCommunityName(feature, language);
  if (!communityName) return null;
  
  // Para debugging
  console.log(`Buscando valor para comunidad: "${communityName}"`);
  
  // Convertir a normalizado para comparar
  const normalizedCommunityName = normalizarTexto(communityName);
  
  // Mapear el sector seleccionado al código del sector en el CSV usando normalización mejorada
  let normalizedSector = selectedSector.toLowerCase();
  
  // Normalizar códigos y nombres a IDs estándar
  if (normalizedSector === 'total' || normalizedSector === 'todos los sectores' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
    normalizedSector = 'total';
  if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'sector empresarial' || normalizedSector === 'business enterprise sector') 
    normalizedSector = 'business';
  if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'administración pública' || normalizedSector === 'government sector') 
    normalizedSector = 'government';
  if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'enseñanza superior' || normalizedSector === 'higher education sector') 
    normalizedSector = 'education';
  if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'instituciones privadas sin fines de lucro' || normalizedSector === 'private non-profit sector') 
    normalizedSector = 'nonprofit';
  
  let sectorId = '';
  switch (normalizedSector) {
    case 'total':
      sectorId = '_T';
      break;
    case 'business':
      sectorId = 'EMPRESAS';
      break;
    case 'government':
      sectorId = 'ADMINISTRACION_PUBLICA';
      break;
    case 'education':
      sectorId = 'ENSENIANZA_SUPERIOR';
      break;
    case 'nonprofit':
      sectorId = 'IPSFL';
      break;
    default:
      sectorId = '_T'; // Total por defecto
  }
  
  // Filtrar datos por año, sector y sexo (total)
  const filteredData = data.filter(item => {
    return item.TIME_PERIOD === year &&
           item.SECTOR_EJECUCION_CODE === sectorId &&
           item.SEXO_CODE === '_T' &&
           item.MEDIDAS_CODE === 'INVESTIGADORES_EJC';
  });
  
  if (filteredData.length === 0) {
    console.log(`No hay datos para el año ${year}, sector ${sectorId}`);
    return null;
  }
  
  // Crear un mapa para matchear códigos ISO a los TERRITORIO_CODE del dataset
  const isoToTerritorioCodeMap: {[key: string]: string} = {
    'ES-AN': '01', // Andalucía
    'ES-AR': '02', // Aragón
    'ES-AS': '03', // Asturias
    'ES-CN': '05', // Canarias
    'ES-CB': '06', // Cantabria
    'ES-CM': '08', // Castilla-La Mancha
    'ES-CL': '07', // Castilla y León
    'ES-CT': '09', // Cataluña
    'ES-CE': '18', // Ceuta
    'ES-MD': '13', // Madrid
    'ES-VC': '10', // Comunidad Valenciana
    'ES-EX': '11', // Extremadura
    'ES-GA': '12', // Galicia
    'ES-IB': '04', // Islas Baleares
    'ES-RI': '17', // La Rioja
    'ES-ML': '19', // Melilla
    'ES-MC': '14', // Murcia
    'ES-NC': '15', // Navarra
    'ES-PV': '16'  // País Vasco
  };
    
    // Función para validar valores
    const validarValor = (valor: string | undefined): number | null => {
      // Si no hay valor o es undefined, retornar null
      if (valor === undefined || valor === null) {
        return null;
      }
      
      // Verificar que no sea una cadena vacía o solo espacios
      const trimmedValue = valor.trim();
      if (trimmedValue === '') {
        return null;
      }
      
      // Intentar convertir a número
      const numero = parseFloat(trimmedValue);
      // Verificar explícitamente si es NaN para evitar problemas de tipo
      if (Number.isNaN(numero)) {
        return null;
      }
      
      return numero;
  };
  
  // Intentar diferentes estrategias para encontrar una coincidencia
  
  // 1. Buscar por código ISO si está disponible
  if (feature.properties?.iso) {
    const isoCode = feature.properties.iso.toString().toUpperCase();
    const territorioCode = isoToTerritorioCodeMap[isoCode];
    
    if (territorioCode) {
      const matchByCode = filteredData.find(item => item.TERRITORIO_CODE === territorioCode);
      if (matchByCode) {
        console.log(`Coincidencia encontrada por código ISO ${isoCode} -> ${territorioCode} para "${communityName}"`);
          // Verificar que OBS_VALUE existe y no está vacío
          const parsedValue = validarValor(matchByCode.OBS_VALUE);
          if (parsedValue !== null) {
            return parsedValue;
          } else {
            console.log(`Valor no numérico para "${communityName}": "${matchByCode.OBS_VALUE || 'VACÍO'}"`);
          }
          return null;
      }
    }
  }
  
  // 2. Buscar por nombre exacto
  const communityMatch = filteredData.find(item => {
    const itemCommunityName = normalizarTexto(item.TERRITORIO);
    return itemCommunityName === normalizedCommunityName;
  });
  
  if (communityMatch) {
      // Verificar que OBS_VALUE existe y no está vacío
      const valor = validarValor(communityMatch.OBS_VALUE);
      if (valor !== null) {
    console.log(`Coincidencia exacta encontrada para "${communityName}": ${communityMatch.OBS_VALUE}`);
        return valor;
      } else {
        console.log(`Coincidencia exacta encontrada para "${communityName}" pero el valor "${communityMatch.OBS_VALUE || 'VACÍO'}" no es válido`);
      }
      return null;
  }
  
  // 3. Buscar a través del mapeo de nombres
  for (const key in communityNameMapping) {
    const keyNormalized = normalizarTexto(key);
    const valueInCurrentLanguage = language === 'es' ? 
      communityNameMapping[key].es : 
      communityNameMapping[key].en;
    const valueNormalized = normalizarTexto(valueInCurrentLanguage);
    
    // Si el nombre normalizado de la comunidad coincide con alguna clave o valor del mapeo
    if (normalizedCommunityName === keyNormalized || normalizedCommunityName === valueNormalized) {
      // Buscar en los datos por todas las posibles variaciones del nombre
      const possibleNames = [
        key,
        communityNameMapping[key].es,
        communityNameMapping[key].en
      ];
      
      for (const name of possibleNames) {
        const match = filteredData.find(item => 
          normalizarTexto(item.TERRITORIO) === normalizarTexto(name)
        );
        
        if (match) {
            // Verificar que OBS_VALUE existe y no está vacío
            const parsedValue = validarValor(match.OBS_VALUE);
            if (parsedValue !== null) {
          console.log(`Coincidencia por mapeo encontrada para "${communityName}" usando "${name}": ${match.OBS_VALUE}`);
              return parsedValue;
            } else {
              console.log(`Coincidencia por mapeo encontrada para "${communityName}" usando "${name}" pero el valor "${match.OBS_VALUE || 'VACÍO'}" no es válido`);
            }
            return null;
        }
      }
    }
  }
  
  // 4. Búsqueda por contención (para casos como "Principado de Asturias" vs "Asturias")
  const matchByContains = filteredData.find(item => {
    const itemName = normalizarTexto(item.TERRITORIO);
    return itemName.includes(normalizedCommunityName) || normalizedCommunityName.includes(itemName);
  });
  
  if (matchByContains) {
      // Verificar que OBS_VALUE existe y no está vacío
      const parsedValue = validarValor(matchByContains.OBS_VALUE);
      if (parsedValue !== null) {
    console.log(`Coincidencia por contención encontrada para "${communityName}" con "${matchByContains.TERRITORIO}": ${matchByContains.OBS_VALUE}`);
        return parsedValue;
      } else {
        console.log(`Coincidencia por contención encontrada para "${communityName}" con "${matchByContains.TERRITORIO}" pero el valor "${matchByContains.OBS_VALUE || 'VACÍO'}" no es válido`);
      }
      return null;
  }
  
  // 5. Casos especiales conocidos
  const specialCases: {[key: string]: string[]} = {
    'andalucia': ['01'],
    'aragon': ['02'],
    'asturias': ['03'],
    'baleares': ['04', 'islas baleares', 'illes balears'],
    'canarias': ['05', 'islas canarias'],
    'cantabria': ['06'],
    'castilla y leon': ['07', 'castilla leon', 'castilla-leon'],
    'castilla-la mancha': ['08', 'castilla la mancha'],
    'cataluna': ['09', 'cataluña', 'catalunya'],
    'comunidad valenciana': ['10', 'c valenciana', 'valencia'],
    'extremadura': ['11'],
    'galicia': ['12'],
    'madrid': ['13', 'comunidad de madrid'],
    'murcia': ['14', 'region de murcia'],
    'navarra': ['15', 'comunidad foral de navarra'],
    'pais vasco': ['16', 'euskadi'],
    'la rioja': ['17', 'rioja'],
    'ceuta': ['18'],
    'melilla': ['19']
  };
  
  for (const baseName in specialCases) {
    if (normalizedCommunityName.includes(baseName) || baseName.includes(normalizedCommunityName)) {
      // Buscar por código primero
      const codes = specialCases[baseName].filter(c => c.length === 2);
      for (const code of codes) {
        const matchBySpecialCode = filteredData.find(item => item.TERRITORIO_CODE === code);
        if (matchBySpecialCode) {
            // Verificar que OBS_VALUE existe y no está vacío
            const parsedValue = validarValor(matchBySpecialCode.OBS_VALUE);
            if (parsedValue !== null) {
          console.log(`Coincidencia por caso especial (código) para "${communityName}" usando código "${code}": ${matchBySpecialCode.OBS_VALUE}`);
              return parsedValue;
            } else {
              console.log(`Coincidencia por caso especial (código) para "${communityName}" usando código "${code}" pero el valor "${matchBySpecialCode.OBS_VALUE || 'VACÍO'}" no es válido`);
            }
            return null;
        }
      }
      
      // Luego buscar por nombres alternativos
      const altNames = specialCases[baseName].filter(c => c.length > 2);
      for (const altName of altNames) {
        const matchBySpecialName = filteredData.find(item => 
          normalizarTexto(item.TERRITORIO).includes(altName) || 
          altName.includes(normalizarTexto(item.TERRITORIO))
        );
        
        if (matchBySpecialName) {
            // Verificar que OBS_VALUE existe y no está vacío
            const parsedValue = validarValor(matchBySpecialName.OBS_VALUE);
            if (parsedValue !== null) {
          console.log(`Coincidencia por caso especial (nombre) para "${communityName}" usando "${altName}": ${matchBySpecialName.OBS_VALUE}`);
              return parsedValue;
            } else {
              console.log(`Coincidencia por caso especial (nombre) para "${communityName}" usando "${altName}" pero el valor "${matchBySpecialName.OBS_VALUE || 'VACÍO'}" no es válido`);
            }
            return null;
        }
      }
    }
  }
  
  // 6. Último recurso: imprimir todos los nombres de territorios disponibles para debugging
  console.log(`No se encontró coincidencia para "${communityName}". Territorios disponibles en los datos:`);
  filteredData.forEach(item => {
    console.log(`- "${item.TERRITORIO}" (${item.TERRITORIO_CODE}): ${item.OBS_VALUE}`);
  });
  
  return null;
  } catch (error) {
    console.error(`Error al obtener valor para ${feature.properties?.name || 'desconocido'}:`, error);
  return null;
}
}

// Función para obtener rango de valores para todas las comunidades autónomas
function getValueRange(
  data: ResearchersCommunityData[],
  year: string, 
  sector: string
): { min: number, max: number, median: number, quartiles: number[] } {
  if (!data || data.length === 0) return { min: 0, max: 1, median: 0.5, quartiles: [0, 0.33, 0.66, 1] };
  
  // Mapear el sector seleccionado al código del sector en el CSV usando normalización mejorada
  let normalizedSector = sector.toLowerCase();
  
  // Normalizar códigos y nombres a IDs estándar
  if (normalizedSector === 'total' || normalizedSector === 'todos los sectores' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
    normalizedSector = 'total';
  if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'sector empresarial' || normalizedSector === 'business enterprise sector') 
    normalizedSector = 'business';
  if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'administración pública' || normalizedSector === 'government sector') 
    normalizedSector = 'government';
  if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'enseñanza superior' || normalizedSector === 'higher education sector') 
    normalizedSector = 'education';
  if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'instituciones privadas sin fines de lucro' || normalizedSector === 'private non-profit sector') 
    normalizedSector = 'nonprofit';
  
  let sectorId = '';
  switch (normalizedSector) {
    case 'total':
      sectorId = '_T';
      break;
    case 'business':
      sectorId = 'EMPRESAS';
      break;
    case 'government':
      sectorId = 'ADMINISTRACION_PUBLICA';
      break;
    case 'education':
      sectorId = 'ENSENIANZA_SUPERIOR';
      break;
    case 'nonprofit':
      sectorId = 'IPSFL';
      break;
    default:
      sectorId = '_T'; // Total por defecto
  }
  
  // Filtrar datos por año, sector y sexo, asegurando INVESTIGADORES_EJC
  const filteredData = data.filter(item => {
    return item.TIME_PERIOD === year &&
           item.SECTOR_EJECUCION_CODE === sectorId &&
           item.SEXO_CODE === '_T' &&
           item.MEDIDAS_CODE === 'INVESTIGADORES_EJC';
  });
  
  // Excluir a España del cálculo del rango
  const communityOnlyData = filteredData.filter(item => {
    const isTerritorySpain = (
      item.TERRITORIO_CODE === '00' || 
      item.TERRITORIO_CODE === 'ES' || 
      normalizarTexto(item.TERRITORIO) === 'espana' ||
      normalizarTexto(item.TERRITORIO) === 'spain' ||
      normalizarTexto(item.TERRITORIO) === 'total nacional'
    );
    return !isTerritorySpain;
  });
  
  // Si después de filtrar no hay datos, salir con valores por defecto
  if (communityOnlyData.length === 0) {
    console.warn("No se encontraron valores para calcular el rango (después de excluir España)");
    return { min: 0, max: 1, median: 0.5, quartiles: [0, 0.33, 0.66, 1] };
  }
  
  const values: number[] = [];
  
  // Extraer valores numéricos
  communityOnlyData.forEach(item => {
    if (item.OBS_VALUE) {
      const value = parseFloat(item.OBS_VALUE);
      if (!isNaN(value) && value > 0) { // Solo incluir valores positivos
        values.push(value);
      }
    }
  });
  
  // Si no hay valores, retornar un rango por defecto
  if (values.length === 0) {
    console.warn("No se encontraron valores válidos para calcular el rango");
    return { min: 0, max: 1, median: 0.5, quartiles: [0, 0.33, 0.66, 1] };
  }
  
  // Ordenar valores para calcular estadísticas
  values.sort((a, b) => a - b);
  
  // Calcular min, max y estadísticas
  const min = values[0];
  const max = values[values.length - 1];
  
  // Calcular la mediana
  const midpoint = Math.floor(values.length / 2);
  const median = values.length % 2 === 0
    ? (values[midpoint - 1] + values[midpoint]) / 2
    : values[midpoint];
  
  // Calcular cuartiles (divide los datos en 4 partes)
  const calculateQuantile = (arr: number[], q: number) => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
      return arr[base] + rest * (arr[base + 1] - arr[base]);
    } else {
      return arr[base];
    }
  };
  
  const quartiles = [
    min,
    calculateQuantile(values, 0.25),
    calculateQuantile(values, 0.5),
    calculateQuantile(values, 0.75),
    max
  ];
  
  console.log(`Estadísticas calculadas (${values.length} valores, excluyendo España):`);
  console.log(`Min: ${min}, Max: ${max}, Mediana: ${median}`);
  console.log(`Cuartiles: ${quartiles.join(', ')}`);
  
  return {
    min,
    max,
    median,
    quartiles
  };
}

// Función para obtener el color según el valor
function getColorForValue(
  value: number | null, 
  selectedSector: string,
  data: ResearchersCommunityData[],
  year: string,
  activePalette?: ReturnType<typeof getSectorPalette> // Parámetro opcional para recibir una paleta ya creada
): string {
  // Obtener la paleta de colores para el sector seleccionado o usar la proporcionada
  const palette = activePalette || getSectorPalette(selectedSector);
  
  // Si no hay valor, siempre usar #f5f5f5 (gris claro)
  if (value === null) {
    console.log("getColorForValue: Valor nulo detectado, usando #f5f5f5");
    return "#f5f5f5";
  }
  
  // Si el valor es exactamente 0, usar color específico para cero
  if (value === 0) return palette.ZERO;

  // Obtener estadísticas y rango de valores
  const stats = getValueRange(data, year, selectedSector);
  const { min, max, quartiles } = stats;
  
  // Calcular ratio de rango (para determinar si usar escala log o lineal)
  const rangeRatio = max / min;
  
  // Usar una escala logarítmica si el rango es muy grande
  if (rangeRatio > 15) {
    // Si hay una gran diferencia, usar escala logarítmica para mejor visualización
    const logScale = d3.scaleLog<string>()
      .domain([Math.max(min, 0.1), max]) // Evitar logaritmo de 0
      .range([palette.MIN, palette.MAX])
      .clamp(true);
    
    return logScale(Math.max(value, 0.1)); // Evitar logaritmo de 0
  } else {
    // Escala lineal con cuartiles reales para mejor distribución de colores
    const colorScale = d3.scaleLinear<string>()
      .domain(quartiles)
      .range([
        palette.MIN,
        palette.LOW,
        palette.MID,
        palette.HIGH,
        palette.MAX
      ])
      .clamp(true);
    
    return colorScale(value);
  }
}

// Función para obtener el valor del año anterior
function getPreviousYearValue(
  feature: GeoJsonFeature,
  data: ResearchersCommunityData[],
  previousYear: string,
  selectedSector: string,
  language: 'es' | 'en'
): number | null {
  // Verificamos si el año anterior existe en los datos
  const prevYearExists = data.some(item => 
    item.TIME_PERIOD === previousYear && 
    item.SEXO_CODE === '_T' && 
    item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
  );
  
  // Si no hay datos del año anterior, retornamos null directamente
  if (!prevYearExists) {
    console.log(`No hay datos disponibles para el año ${previousYear}`);
    return null;
  }
  
  return getCommunityValue(feature, data, previousYear, selectedSector, language);
}

// Componente principal
const ResearchersSpanishRegionsMap: React.FC<ResearchersSpanishRegionsMapProps> = ({ 
  data, 
  selectedYear, 
  selectedSector, 
  language, 
  onClick, 
  dataDisplayType = 'researchers_count'
}) => {
  // Referencias a elementos DOM
  const svgRef = useRef<SVGSVGElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Estado local
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [geoJson, setGeoJson] = useState<GeoJsonData | null>(null);
  // Añadir estado para almacenar el rango de valores
  const [valueRange, setValueRange] = useState<{min: number, max: number, median?: number, quartiles?: number[]}>({min: 0, max: 1});
  
  // Textos según el idioma actual
  const t = mapTexts[language];
  
  // Función para aplicar estilos CSS personalizados de manera segura
  const addCustomStyles = () => {
    try {
      // Eliminar cualquier estilo anterior para evitar duplicados
      const oldStyle = document.getElementById('researchers-map-custom-styles');
      if (oldStyle && oldStyle.parentNode) {
        oldStyle.parentNode.removeChild(oldStyle);
      }
      
      // Crear y añadir el nuevo estilo
      const styleElement = document.createElement('style');
      styleElement.id = 'researchers-map-custom-styles';
      styleElement.textContent = `
        .community.no-data {
          fill: #f5f5f5 !important;
          stroke: #ccc !important;
          stroke-width: 0.5;
          stroke-dasharray: 2,2;
        }
        .community.no-data:hover {
          fill: #f0f0f0 !important;
          stroke: #999 !important;
          stroke-width: 1.5;
          cursor: help;
        }
      `;
      document.head.appendChild(styleElement);
    } catch (err) {
      console.error('Error al aplicar estilos personalizados:', err);
    }
  };
  
  // Calcular el rango de valores cuando cambian los datos, año o sector
  useEffect(() => {
    try {
      if (!data || data.length === 0) return;
      
      // Calcular el rango de valores para las comunidades autónomas
      const range = getValueRange(data, selectedYear.toString(), selectedSector);
      setValueRange(range);
      
      console.log("Rango de valores actualizado para mapa:");
      console.log(`- Año: ${selectedYear}`);
      console.log(`- Sector: ${selectedSector}`);
      console.log(`- Valor mínimo: ${range.min}`);
      console.log(`- Valor máximo: ${range.max}`);
      console.log(`- Cuartiles: ${range.quartiles?.join(', ')}`);
    } catch (err) {
      console.error('Error al calcular el rango de valores:', err);
      setError(err instanceof Error ? err.message : 'Error calculando datos del mapa');
    }
  }, [data, selectedYear, selectedSector]);
  
  // Efecto para cargar los datos GeoJSON
  useEffect(() => {
    const loadGeoJson = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(SPAIN_GEOJSON_URL);
        if (!response.ok) {
          throw new Error(`${response.status} - ${response.statusText}`);
        }
        
        const jsonData = await response.json();
        
        // Verificar que los datos tienen el formato esperado
        if (!jsonData || !jsonData.features || !Array.isArray(jsonData.features)) {
          throw new Error('Formato de GeoJSON inválido o archivo corrupto');
        }
        
        // Imprimir información de cada comunidad para depuración
        console.log("Comunidades del GeoJSON:", jsonData.features.length);
        jsonData.features.forEach((feature: GeoJsonFeature, index: number) => {
          const props = feature.properties || {};
          console.log(`[${index}] Propiedades:`, props);
          console.log(`   Nombre ES: ${props.name_es || props.name || props.ccaa || 'n/a'}`);
          console.log(`   Nombre EN: ${props.name_en || 'n/a'}`);
          console.log(`   Código: ${props.code || props.iso || 'n/a'}`);
        });
        
        setGeoJson(jsonData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error cargando GeoJSON:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar el mapa');
        setIsLoading(false);
      }
    };
    
    loadGeoJson();
  }, []);
  
  // Efecto para renderizar el mapa
  useEffect(() => {
    if (!geoJson || !svgRef.current) return;
    
    try {
      // Aplicar estilos primero, separado de la renderización
      addCustomStyles();
      
      // Continuar con la renderización normal
    const renderMap = () => {
        try {
      // Limpiar SVG
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      
          // Obtener dimensiones del contenedor con un tamaño fijo
      const containerWidth = mapRef.current?.clientWidth || 800;
          const containerHeight = 400; // Reducido de 500px a 400px para consistencia con otros componentes
          
          // Definir la paleta de colores al inicio para evitar problemas de inicialización
          const mapPalette = getSectorPalette(selectedSector);
          
          // Añadir logs para depuración de colores
          console.log("Paleta de colores para sector:", selectedSector);
          console.log("- Color para NULL (sin datos):", mapPalette.NULL);
          console.log("- Color para ZERO (valor 0):", mapPalette.ZERO);
          console.log("- Color para MIN (valor mínimo):", mapPalette.MIN);
          console.log("- Color para MAX (valor máximo):", mapPalette.MAX);
      
      // Configurar dimensiones y proyecciones
      const width = containerWidth;
      const height = containerHeight;
      
          // Mejorar las proyecciones para mejor visualización con la nueva altura fija
      // Crear proyección para España peninsular con mejor escala
      const projectionMainland = d3.geoMercator()
        .center([-3.5, 40.0])
            .scale(width * 2.8) // Ajustar escala para la nueva altura
            .translate([width / 2, height / 2]);
      
      // Crear proyección específica para las Islas Canarias
      const projectionCanarias = d3.geoMercator()
        .center([-15.5, 28.2])
            .scale(width * 2.5) // Aumentar escala para islas más grandes y visibles
            .translate([width * 0.14, height * 0.80]); // Ajustar posición vertical para centrar mejor en el cuadro
      
      // Crear proyección específica para Ceuta y Melilla (compartirán recuadro)
      const projectionCeuta = d3.geoMercator()
        .center([-5.3, 35.9])  // Centro en Ceuta
        .scale(width * 22)     // Escala aumentada para que sea más grande
        .translate([width * 0.78, height * 0.15]); // Posición en parte superior derecha
      
      const projectionMelilla = d3.geoMercator()
        .center([-3.0, 35.3])  // Centro en Melilla
        .scale(width * 22)     // Escala aumentada para que sea más grande
        .translate([width * 0.90, height * 0.15]); // Posición en parte superior derecha
      
      // Generadores de ruta
      const pathGeneratorMainland = d3.geoPath().projection(projectionMainland);
      const pathGeneratorCanarias = d3.geoPath().projection(projectionCanarias);
      const pathGeneratorCeuta = d3.geoPath().projection(projectionCeuta);
      const pathGeneratorMelilla = d3.geoPath().projection(projectionMelilla);
      
      // Configurar SVG
      svg.attr("width", width)
         .attr("height", height)
         .attr("viewBox", `0 0 ${width} ${height}`)
             .attr("style", "width: 100%; height: 100%; margin-bottom: 10px;");
      
      // Crear grupos para la península y las regiones especiales
      const mapGroup = svg.append("g").attr("class", "mainland");
      const canariasGroup = svg.append("g").attr("class", "canarias");
      const ceutaMelillaGroup = svg.append("g").attr("class", "ceuta-melilla");
      
      // Crear tooltip global en lugar del tooltip interno
      const createGlobalTooltip = (): HTMLElement => {
        // Verificar si ya existe un tooltip global
        let tooltipElement = document.getElementById('researchers-map-tooltip');
        
        if (!tooltipElement) {
          // Crear nuevo tooltip y agregarlo al body
          tooltipElement = document.createElement('div');
          tooltipElement.id = 'researchers-map-tooltip';
          tooltipElement.className = 'researchers-map-tooltip';
          
          // Aplicar estilos base manualmente
          Object.assign(tooltipElement.style, {
            position: 'fixed',
            display: 'none',
            opacity: '0',
            zIndex: '999999',
            pointerEvents: 'none',
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            borderRadius: '4px',
            padding: '0',
            minWidth: '150px',
            maxWidth: '320px',
            border: '1px solid #e2e8f0',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#333',
            transition: 'opacity 0.15s ease-in-out'
          });
          
          document.body.appendChild(tooltipElement);
          
          // Crear hoja de estilo inline para las clases de Tailwind
          const styleSheet = document.createElement('style');
          styleSheet.id = 'tooltip-researchers-map-styles';
          styleSheet.textContent = `
            #researchers-map-tooltip .text-green-600 { color: #059669; }
            #researchers-map-tooltip .text-red-600 { color: #DC2626; }
            #researchers-map-tooltip .bg-blue-50 { background-color: #EFF6FF; }
            #researchers-map-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
            #researchers-map-tooltip .border-blue-100 { border-color: #DBEAFE; }
            #researchers-map-tooltip .border-gray-100 { border-color: #F3F4F6; }
            #researchers-map-tooltip .text-gray-500 { color: #6B7280; }
            #researchers-map-tooltip .text-blue-700 { color: #1D4ED8; }
            #researchers-map-tooltip .text-gray-800 { color: #1F2937; }
            #researchers-map-tooltip .text-gray-600 { color: #4B5563; }
            #researchers-map-tooltip .text-yellow-500 { color: #F59E0B; }
            #researchers-map-tooltip .rounded-lg { border-radius: 0.5rem; }
            #researchers-map-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
            #researchers-map-tooltip .p-3 { padding: 0.75rem; }
            #researchers-map-tooltip .p-4 { padding: 1rem; }
            #researchers-map-tooltip .p-2 { padding: 0.5rem; }
            #researchers-map-tooltip .pt-3 { padding-top: 0.75rem; }
            #researchers-map-tooltip .mb-3 { margin-bottom: 0.75rem; }
            #researchers-map-tooltip .mb-1 { margin-bottom: 0.25rem; }
            #researchers-map-tooltip .mb-4 { margin-bottom: 1rem; }
            #researchers-map-tooltip .mr-1 { margin-right: 0.25rem; }
            #researchers-map-tooltip .mr-2 { margin-right: 0.5rem; }
            #researchers-map-tooltip .mt-1 { margin-top: 0.25rem; }
            #researchers-map-tooltip .mt-3 { margin-top: 0.75rem; }
            #researchers-map-tooltip .text-xs { font-size: 0.75rem; }
            #researchers-map-tooltip .text-sm { font-size: 0.875rem; }
            #researchers-map-tooltip .text-lg { font-size: 1.125rem; }
            #researchers-map-tooltip .text-xl { font-size: 1.25rem; }
            #researchers-map-tooltip .font-bold { font-weight: 700; }
            #researchers-map-tooltip .font-medium { font-weight: 500; }
            #researchers-map-tooltip .flex { display: flex; }
            #researchers-map-tooltip .items-center { align-items: center; }
            #researchers-map-tooltip .justify-between { justify-content: space-between; }
            #researchers-map-tooltip .w-8 { width: 2rem; }
            #researchers-map-tooltip .h-6 { height: 1.5rem; }
            #researchers-map-tooltip .w-36 { width: 9rem; }
            #researchers-map-tooltip .w-44 { width: 11rem; }
            #researchers-map-tooltip .w-48 { width: 12rem; }
            #researchers-map-tooltip .rounded { border-radius: 0.25rem; }
            #researchers-map-tooltip .rounded-md { border-radius: 0.375rem; }
            #researchers-map-tooltip .overflow-hidden { overflow: hidden; }
            #researchers-map-tooltip .border-t { border-top-width: 1px; }
            #researchers-map-tooltip .border-b { border-bottom-width: 1px; }
            #researchers-map-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
            #researchers-map-tooltip .max-w-xs { max-width: 20rem; }
            #researchers-map-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
            #researchers-map-tooltip .w-full { width: 100%; }
            #researchers-map-tooltip .h-full { height: 100%; }
            #researchers-map-tooltip img { max-width: 100%; height: 100%; object-fit: cover; }
            #researchers-map-tooltip .flag-container { min-width: 2rem; min-height: 1.5rem; }
          `;
          document.head.appendChild(styleSheet);
        }
        
        return tooltipElement;
      };
      
      // Crear tooltip global
      const globalTooltip = createGlobalTooltip();
      
      // Función para posicionar el tooltip global
      const positionGlobalTooltip = (event: MouseEvent, content: string): void => {
        const tooltipEl = globalTooltip;
        if (!tooltipEl) return;
        
        // Actualizar contenido
        tooltipEl.innerHTML = content;
        
        // Aplicar estilos
        Object.assign(tooltipEl.style, {
          position: 'fixed',
          display: 'block',
          opacity: '1',
          zIndex: '999999',
          pointerEvents: 'none',
          transition: 'opacity 0.15s'
        });
        
        const tooltipWidth = tooltipEl.offsetWidth;
        const tooltipHeight = tooltipEl.offsetHeight;
        
        // Obtener posición del mouse
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        // Calcular posición del tooltip
        let left = mouseX + 15;
        let top = mouseY - tooltipHeight / 2;
        
        // Ajustar posición si se sale de la ventana
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (left + tooltipWidth > windowWidth) {
          left = mouseX - tooltipWidth - 15;
        }
        
        if (top + tooltipHeight > windowHeight) {
          top = mouseY - tooltipHeight - 15;
        }
        
        if (top < 0) {
          top = 15;
        }
        
        // Establecer posición y visibilidad
        tooltipEl.style.left = `${left}px`;
        tooltipEl.style.top = `${top}px`;
      };
      
      // Filtrar características para península y regiones especiales
      const canariasFeatures = geoJson.features.filter(feature => {
        const name = getCommunityName(feature, language);
        return name.includes('Canarias') || name.includes('Canary');
      });
      
      // Filtrar Ceuta y Melilla por separado
      const ceutaFeatures = geoJson.features.filter(feature => {
        const name = getCommunityName(feature, language);
        return name.includes('Ceuta');
      });
      
      const melillaFeatures = geoJson.features.filter(feature => {
        const name = getCommunityName(feature, language);
        return name.includes('Melilla');
      });
      
      const mainlandFeatures = geoJson.features.filter(feature => {
        const name = getCommunityName(feature, language);
        return !name.includes('Canarias') && !name.includes('Canary') && 
               !name.includes('Ceuta') && !name.includes('Melilla');
      });
      
      // Función para formatear el valor
      const formatValue = (value: number | null): string => {
        if (value === null) return t.noData;
        if (isNaN(value)) return t.noData;
        if (value === 0) return '0';
        
        return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
          maximumFractionDigits: 0
        }).format(value);
      };
      
      // Función para obtener el ranking de una comunidad
      const getCommunityRank = (feature: GeoJsonFeature): { rank: number, total: number } | null => {
        const communityName = getCommunityName(feature, language);
        if (!communityName) return null;
        
        // Obtener el valor actual para esta comunidad
        const currentValue = getCommunityValue(feature, data, selectedYear.toString(), selectedSector, language);
        
        // Si no hay valor para esta comunidad, no mostrar ranking
        if (currentValue === null) return null;
        
        // Mapear el sector seleccionado al código del sector en el CSV usando normalización mejorada
        let normalizedSector = selectedSector.toLowerCase();
        
        // Normalizar códigos y nombres a IDs estándar
        if (normalizedSector === 'total' || normalizedSector === 'todos los sectores' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
          normalizedSector = 'total';
        if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'sector empresarial' || normalizedSector === 'business enterprise sector') 
          normalizedSector = 'business';
        if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'administración pública' || normalizedSector === 'government sector') 
          normalizedSector = 'government';
        if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'enseñanza superior' || normalizedSector === 'higher education sector') 
          normalizedSector = 'education';
        if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'instituciones privadas sin fines de lucro' || normalizedSector === 'private non-profit sector') 
          normalizedSector = 'nonprofit';
        
        let sectorId = '';
        switch (normalizedSector) {
          case 'total':
            sectorId = '_T';
            break;
          case 'business':
            sectorId = 'EMPRESAS';
            break;
          case 'government':
            sectorId = 'ADMINISTRACION_PUBLICA';
            break;
          case 'education':
            sectorId = 'ENSENIANZA_SUPERIOR';
            break;
          case 'nonprofit':
            sectorId = 'IPSFL';
            break;
          default:
            sectorId = '_T'; // Total por defecto
        }
        
        // Filtrar datos por año, sector y sexo
        const filteredData = data.filter(item => {
          return item.TIME_PERIOD === selectedYear.toString() &&
                 item.SECTOR_EJECUCION_CODE === sectorId &&
                 item.SEXO_CODE === '_T' &&
                 item.MEDIDAS_CODE === 'INVESTIGADORES_EJC';
        });
        
        if (filteredData.length === 0) return null;
        
        // Excluir España del cálculo del ranking
        // España generalmente tiene el código '00' o 'ES' o se llama 'España' o 'TOTAL NACIONAL'
        const communityOnlyData = filteredData.filter(item => {
          const isTerritorySpain = (
            item.TERRITORIO_CODE === '00' || 
            item.TERRITORIO_CODE === 'ES' || 
            normalizarTexto(item.TERRITORIO) === 'espana' ||
            normalizarTexto(item.TERRITORIO) === 'spain' ||
            normalizarTexto(item.TERRITORIO) === 'total nacional'
          );
          return !isTerritorySpain;
        });
        
        // Si después de filtrar no hay datos, salir
        if (communityOnlyData.length === 0) return null;
        
        // Crear un mapa para obtener valores por comunidad
        const communityValuesMap = new Map<string, number>();
        
        communityOnlyData.forEach(item => {
          // Intentar obtener el nombre normalizado de la comunidad
          let matchedName = '';
          const itemTerritory = normalizarTexto(item.TERRITORIO);
          
          // Intentar hacer coincidencia directa primero
          for (const key in communityNameMapping) {
            const normalizedKey = normalizarTexto(key);
            const esValue = normalizarTexto(communityNameMapping[key].es);
            const enValue = normalizarTexto(communityNameMapping[key].en);
            
            if (itemTerritory === normalizedKey || 
                itemTerritory === esValue || 
                itemTerritory === enValue ||
                itemTerritory.includes(esValue) || 
                esValue.includes(itemTerritory) ||
                enValue.includes(itemTerritory) ||
                itemTerritory.includes(enValue)) {
              
              matchedName = language === 'es' ? 
                            communityNameMapping[key].es : 
                            communityNameMapping[key].en;
              break;
            }
          }
          
          // Si no se encontró coincidencia, usar el nombre original
          if (!matchedName) {
            matchedName = item.TERRITORIO;
          }
          
          // Normalizar el valor
          const value = parseFloat(item.OBS_VALUE);
          if (!isNaN(value)) {
            // Para manejar posibles duplicados, tomar el mayor valor
            const existingValue = communityValuesMap.get(matchedName) || 0;
            communityValuesMap.set(matchedName, Math.max(existingValue, value));
          }
        });
        
        // Convertir el mapa a un array y ordenar por valor (descendente)
        const sortedEntries = Array.from(communityValuesMap.entries())
          .sort((a, b) => b[1] - a[1]);
        
        // Verificar si tenemos suficientes datos para el ranking
        if (sortedEntries.length === 0) return null;
        
        // Buscar la posición de la comunidad actual
        const normalizedCommunityName = normalizarTexto(communityName);
        
        // Caso especial: buscamos primero por nombre exacto
        let communityIndex = sortedEntries.findIndex(([name]) => 
          normalizarTexto(name) === normalizedCommunityName
        );
        
        // Si no se encuentra por nombre exacto, intentar buscar con el mapeo
        if (communityIndex === -1) {
          // Obtener todos los posibles nombres para esta comunidad
          const possibleNames: string[] = [];
          
          // Añadir el nombre actual
          possibleNames.push(normalizedCommunityName);
          
          // Añadir nombres del mapeo
          for (const key in communityNameMapping) {
            const keyNormalized = normalizarTexto(key);
            const esValueNormalized = normalizarTexto(communityNameMapping[key].es);
            const enValueNormalized = normalizarTexto(communityNameMapping[key].en);
            
            if (keyNormalized === normalizedCommunityName || 
                esValueNormalized === normalizedCommunityName || 
                enValueNormalized === normalizedCommunityName) {
              
              possibleNames.push(keyNormalized);
              possibleNames.push(esValueNormalized);
              possibleNames.push(enValueNormalized);
            }
          }
          
          // Buscar entre todos los posibles nombres
          for (const possibleName of possibleNames) {
            const index = sortedEntries.findIndex(([name]) => {
              const nameNormalized = normalizarTexto(name);
              return nameNormalized === possibleName || 
                     nameNormalized.includes(possibleName) || 
                     possibleName.includes(nameNormalized);
            });
            
            if (index !== -1) {
              communityIndex = index;
              break;
            }
          }
        }
        
        // Si aún no se encuentra, buscar el valor directamente
        if (communityIndex === -1 && currentValue !== null) {
          communityIndex = sortedEntries.findIndex(([, value]) => 
            Math.abs(value - currentValue) < 0.01 // Tolerancia para errores de redondeo
          );
        }
        
        // Si todavía no se encuentra, no podemos mostrar el ranking
        if (communityIndex === -1) {
          console.log(`No se pudo encontrar ranking para: ${communityName}`);
          return null;
        }
        
        // Devolver ranking y total (solo de comunidades, sin España)
        return {
          rank: communityIndex + 1,
          total: sortedEntries.length
        };
      };
      
      // Función para obtener el valor del país/comunidad
      const getSpainValue = (data: ResearchersCommunityData[], year: string, sector: string): number | null => {
        // Mapear el sector seleccionado al código del sector en el CSV usando normalización mejorada
        let normalizedSector = sector.toLowerCase();
        
        // Normalizar códigos y nombres a IDs estándar
        if (normalizedSector === 'total' || normalizedSector === 'todos los sectores' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
          normalizedSector = 'total';
        if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'sector empresarial' || normalizedSector === 'business enterprise sector') 
          normalizedSector = 'business';
        if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'administración pública' || normalizedSector === 'government sector') 
          normalizedSector = 'government';
        if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'enseñanza superior' || normalizedSector === 'higher education sector') 
          normalizedSector = 'education';
        if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'instituciones privadas sin fines de lucro' || normalizedSector === 'private non-profit sector') 
          normalizedSector = 'nonprofit';
        
        let sectorId = '';
        switch (normalizedSector) {
          case 'total':
            sectorId = '_T';
            break;
          case 'business':
            sectorId = 'EMPRESAS';
            break;
          case 'government':
            sectorId = 'ADMINISTRACION_PUBLICA';
            break;
          case 'education':
            sectorId = 'ENSENIANZA_SUPERIOR';
            break;
          case 'nonprofit':
            sectorId = 'IPSFL';
            break;
          default:
            sectorId = '_T'; // Total por defecto
        }
        
        // 1. Buscar el valor total para España en los datos
        const spainData = data.find(item => 
          (normalizarTexto(item.TERRITORIO) === 'espana' || 
           normalizarTexto(item.TERRITORIO) === 'spain' ||
           normalizarTexto(item.TERRITORIO) === 'total nacional' ||
           item.TERRITORIO_CODE === '00' || 
           item.TERRITORIO_CODE === 'ES') && 
          item.TIME_PERIOD === year && 
          item.SECTOR_EJECUCION_CODE === sectorId && 
          item.SEXO_CODE === '_T' &&
          item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
        );
        
        // Si no encontramos un valor para España, retornar null
        if (!spainData) {
          console.log(`No se encontró un valor total para España en el año ${year}, sector ${sectorId}`);
          return null;
        }
        
        // Valor total de investigadores para España
        const totalResearchersInSpain = parseFloat(spainData.OBS_VALUE);
        if (isNaN(totalResearchersInSpain)) {
          console.log(`El valor para España no es numérico: ${spainData.OBS_VALUE}`);
          return null;
        }
        
        // 2. Contar el número de comunidades autónomas con datos para el mismo sector y año
        // para dividir correctamente el total (excluyendo España)
        const communitiesData = data.filter(item => 
          !(normalizarTexto(item.TERRITORIO) === 'espana' || 
            normalizarTexto(item.TERRITORIO) === 'spain' ||
            normalizarTexto(item.TERRITORIO) === 'total nacional' ||
            item.TERRITORIO_CODE === '00' || 
            item.TERRITORIO_CODE === 'ES') && 
          item.TIME_PERIOD === year && 
          item.SECTOR_EJECUCION_CODE === sectorId && 
          item.SEXO_CODE === '_T' &&
          item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
        );
        
        // Número de comunidades autónomas y ciudades con datos
        const numberOfCommunities = communitiesData.length;
        
        if (numberOfCommunities === 0) {
          console.log(`No se encontraron datos de comunidades autónomas para el año ${year}, sector ${sectorId}`);
          return null;
        }
        
        // Calcular la media como el total de España dividido por el número de comunidades
        const averageValue = totalResearchersInSpain / numberOfCommunities;
        
        console.log(`Total de investigadores en España: ${totalResearchersInSpain}`);
        console.log(`Número de comunidades: ${numberOfCommunities}`);
        console.log(`Media por comunidad: ${averageValue}`);
        
        return averageValue;
      };
      
      // Función para obtener el valor de una comunidad específica (por ejemplo Canarias)
      const getCanariasValue = (data: ResearchersCommunityData[], year: string, sector: string): number | null => {
        // Mapear el sector seleccionado al código del sector en el CSV usando normalización mejorada
        let normalizedSector = sector.toLowerCase();
        
        // Normalizar códigos y nombres a IDs estándar
        if (normalizedSector === 'total' || normalizedSector === 'todos los sectores' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
          normalizedSector = 'total';
        if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'sector empresarial' || normalizedSector === 'business enterprise sector') 
          normalizedSector = 'business';
        if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'administración pública' || normalizedSector === 'government sector') 
          normalizedSector = 'government';
        if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'enseñanza superior' || normalizedSector === 'higher education sector') 
          normalizedSector = 'education';
        if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'instituciones privadas sin fines de lucro' || normalizedSector === 'private non-profit sector') 
          normalizedSector = 'nonprofit';
        
        let sectorId = '';
        switch (normalizedSector) {
          case 'total':
            sectorId = '_T';
            break;
          case 'business':
            sectorId = 'EMPRESAS';
            break;
          case 'government':
            sectorId = 'ADMINISTRACION_PUBLICA';
            break;
          case 'education':
            sectorId = 'ENSENIANZA_SUPERIOR';
            break;
          case 'nonprofit':
            sectorId = 'IPSFL';
            break;
          default:
            sectorId = '_T'; // Total por defecto
        }
        
        // Buscar datos de Canarias asegurándose que son INVESTIGADORES_EJC
        const canariasData = data.find(item => 
          normalizarTexto(item.TERRITORIO).includes('canarias') && 
          item.TIME_PERIOD === year && 
          item.SECTOR_EJECUCION_CODE === sectorId && 
          item.SEXO_CODE === '_T' &&
          item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
        );
        
        if (canariasData) {
          console.log(`Valor de Canarias encontrado: ${canariasData.OBS_VALUE} (${canariasData.MEDIDAS})`);
          return parseFloat(canariasData.OBS_VALUE);
        } else {
          console.log(`No se encontraron datos de investigadores para Canarias en ${year}, sector ${sectorId}`);
          return null;
        }
      };
      
      // Función para manejar el evento mouseover común para ambas regiones
      function handleMouseOver(this: d3.BaseType, event: MouseEvent, d: GeoJsonFeature): void {
        // Destacar comunidad al pasar el mouse
        d3.select(this)
          .attr('stroke', '#000')
          .attr('stroke-width', 1.5);
        
            // Forzar color correcto si es una región sin datos (esto es nuevo)
            const valueForColor = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language);
            if (valueForColor === null) {
              d3.select(this).attr('fill', '#f5f5f5');
            }
        
        // Obtener datos de la comunidad
        const communityName = getCommunityName(d, language);
        
        // Obtener valor y ranking
        const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language);
        const ranking = getCommunityRank(d);
        
        // Conseguir la bandera de la comunidad si está disponible
        const communityCode = getCommunityCode(d);
        
        // Mapa de nombres alternativos para cada comunidad (ayuda a resolver problemas de coincidencia)
        const communityNameAliases: Record<string, string[]> = {
          'Asturias': ['Principado de Asturias', 'Asturias'],
          'Navarra': ['Comunidad Foral de Navarra', 'Navarra'],
          'Madrid': ['Comunidad de Madrid', 'Madrid'],
          'Islas Baleares': ['Illes Balears', 'Islas Baleares', 'Baleares'],
          'Com. Valenciana': ['Comunidad Valenciana', 'Valencia'],
          'La Rioja': ['La Rioja', 'Rioja'],
          'Murcia': ['Región de Murcia', 'Murcia'],
          'Castilla-La Mancha': ['Castilla - La Mancha', 'Castilla La Mancha', 'Castilla-La Mancha']
        };
        
        // Buscar correspondencias para el nombre de la comunidad actual
        const possibleNames = communityNameAliases[communityName] || [communityName];
            
            // Obtener también el nombre en español para buscar banderas cuando está en inglés
            let spanishCommunityName = communityName;
            if (language === 'en') {
              // Si estamos en inglés, intentar encontrar el nombre en español
              for (const key in communityNameMapping) {
                const mappedName = communityNameMapping[key];
                if (mappedName.en === communityName) {
                  spanishCommunityName = mappedName.es;
                  // Añadir el nombre en español a las posibilidades
                  if (!possibleNames.includes(spanishCommunityName)) {
                    possibleNames.push(spanishCommunityName);
                  }
                  break;
                }
              }
            }
        
        let flagObj = communityFlags.find(flag => 
          // Por código
          flag.code === communityCode || 
          // Por nombre normalizado
          normalizarTexto(flag.community) === normalizarTexto(communityName) ||
              // También buscar por el nombre en español si estamos en inglés
              (language === 'en' && normalizarTexto(flag.community) === normalizarTexto(spanishCommunityName)) ||
          // Por nombres alternativos
          possibleNames.some(name => flag.community.includes(name) || normalizarTexto(flag.community) === normalizarTexto(name)) ||
          // Por fragmentos de nombre en casos específicos
          (communityName.includes('Valencia') && flag.community.includes('Valenciana')) ||
              (communityName === 'País Vasco' && flag.community.includes('Vasco')) ||
              (communityName === 'Basque Country' && flag.community.includes('Vasco'))
        );
        
        // Caso especial para Castilla-La Mancha
        if (!flagObj && (
            communityName.includes('Castilla-La Mancha') || 
            communityName.includes('Castilla La Mancha') ||
                normalizarTexto(communityName).includes('castilla') && normalizarTexto(communityName).includes('mancha') ||
                communityName.includes('Castilla–La Mancha') // Versión en inglés
           )) {
          flagObj = communityFlags.find(flag => 
            flag.code === 'CLM' || 
            normalizarTexto(flag.community).includes('castilla') && normalizarTexto(flag.community).includes('mancha')
          );
        }
        
        let flagUrl = flagObj ? flagObj.flag : '';

            // Añadir URLs directas para banderas problemáticas
            if (!flagUrl) {
              // Mapa de URLs directas para banderas que no se encuentran automáticamente
              const directFlagUrls: Record<string, string> = {
                // Nombres en español
                'Castilla-La Mancha': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg',
                'Com. Valenciana': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_of_the_Valencian_Community_%282x3%29.svg',
                'Extremadura': 'https://upload.wikimedia.org/wikipedia/commons/4/48/Flag_of_Extremadura_%28with_coat_of_arms%29.svg',
                'País Vasco': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Flag_of_the_Basque_Country.svg',
                'Castilla y León': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Flag_of_Castile_and_Le%C3%B3n.svg',
                'La Rioja': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_La_Rioja.svg',
                'Islas Baleares': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Flag_of_the_Balearic_Islands.svg',
                
                // Nombres en inglés
                'Castilla–La Mancha': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg',
                'Valencia': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_of_the_Valencian_Community_%282x3%29.svg',
                'Basque Country': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Flag_of_the_Basque_Country.svg',
                'Castile and León': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Flag_of_Castile_and_Le%C3%B3n.svg',
                'Balearic Islands': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Flag_of_the_Balearic_Islands.svg',
              };
              
              // Buscar directamente por el nombre actual
              if (directFlagUrls[communityName]) {
                flagUrl = directFlagUrls[communityName];
                console.log(`Usando URL directa para ${communityName}`);
              }
            }

        // Fallback específico para Castilla-La Mancha (URL directa)
        if (!flagUrl && (
            communityName.includes('Castilla-La Mancha') || 
            communityName.includes('Castilla La Mancha') ||
                normalizarTexto(communityName).includes('castilla') && normalizarTexto(communityName).includes('mancha') ||
                communityName.includes('Castilla–La Mancha') // Versión en inglés
           )) {
          console.log("Usando URL directa para Castilla-La Mancha");
          flagUrl = "https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg";
        }

        // Fallback específico para Comunidad Valenciana (URL directa)
        if (!flagUrl && (
            communityName.includes('Com. Valenciana') || 
            communityName.includes('Valencia') ||
            normalizarTexto(communityName).includes('valencia')
           )) {
          console.log("Usando URL directa para Comunidad Valenciana");
          flagUrl = "https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_of_the_Valencian_Community_%282x3%29.svg";
        }

        // Obtener valores para comparativas
        const spainValue = getSpainValue(data, selectedYear.toString(), selectedSector);
        const spainAvg = spainValue; // Ya es el valor medio por comunidad
        const canariasValue = getCanariasValue(data, selectedYear.toString(), selectedSector);
        
        // Obtener valor del año anterior para cálculo YoY
        const prevYearValue = getPreviousYearValue(d, data, (selectedYear - 1).toString(), selectedSector, language);
        const hasYoYData = value !== null && prevYearValue !== null;
        const yoyChange = hasYoYData ? ((value - prevYearValue) / prevYearValue) * 100 : null;
        const yoyIsPositive = yoyChange !== null && yoyChange > 0;
        
        // Crear contenido HTML del tooltip
            let tooltipContent = '';
            
            if (value === null) {
              // Si no hay datos, mostrar un tooltip simplificado con un ícono de reloj
              tooltipContent = `
          <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
            <!-- Header con el nombre del país -->
            <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
              ${flagUrl ? `
                <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                  <img src="${flagUrl}" class="w-full h-full object-cover" alt="${communityName}" />
                </div>
              ` : ''}
              <h3 class="text-lg font-bold text-gray-800">${communityName || 'Desconocido'}</h3>
            </div>
            
                  <!-- Contenido simplificado para casos sin datos -->
                  <div class="p-4 flex flex-col items-center justify-center">
                    <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
                    <div class="text-gray-500 font-medium">${mapTexts[language].noData}</div>
              </div>
            </div>
          `;
        } else if (value === 0) {
          // Si el valor es exactamente 0, mostrar un mensaje especial
              tooltipContent = `
                <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                  <!-- Header con el nombre del país -->
                  <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                    ${flagUrl ? `
                      <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                        <img src="${flagUrl}" class="w-full h-full object-cover" alt="${communityName}" />
                      </div>
                    ` : ''}
                    <h3 class="text-lg font-bold text-gray-800">${communityName || 'Desconocido'}</h3>
                  </div>
                  
                  <!-- Contenido principal -->
                  <div class="p-4">
            <!-- Métrica principal para valor cero -->
            <div class="mb-3">
              <div class="flex items-center text-gray-500 text-sm mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                <span>${t.researchers}:</span>
              </div>
              <div class="flex items-center">
                <span class="text-xl font-bold text-orange-500">0</span>
                <span class="text-xs ml-2 text-orange-500">${mapTexts[language].noResearchers}</span>
                      </div>
                    </div>
              </div>
            </div>
          `;
        } else {
              tooltipContent = `
                <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                  <!-- Header con el nombre del país -->
                  <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                    ${flagUrl ? `
                      <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                        <img src="${flagUrl}" class="w-full h-full object-cover" alt="${communityName}" />
                      </div>
                    ` : ''}
                    <h3 class="text-lg font-bold text-gray-800">${communityName || 'Desconocido'}</h3>
                  </div>
                  
                  <!-- Contenido principal -->
                  <div class="p-4">
            <!-- Métrica principal -->
            <div class="mb-3">
              <div class="flex items-center text-gray-500 text-sm mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                <span>${t.researchers}:</span>
              </div>
              <div class="flex items-center">
                <span class="text-xl font-bold text-blue-700">${formatValue(value)}</span>
              </div>
          `;
          
          // Añadir variación YoY si está disponible
          if (hasYoYData && yoyChange !== null) {
            tooltipContent += `
              <div class="${yoyIsPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                  <path d="${yoyIsPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
                </svg>
                <span>${yoyIsPositive ? '+' : ''}${yoyChange.toFixed(1)}% vs ${selectedYear - 1}</span>
              </div>
            `;
          } else {
            tooltipContent += `
              <div class="text-gray-500 flex items-center mt-1 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>${mapTexts[language].noData} vs ${selectedYear - 1}</span>
              </div>
            `;
          }
          
          tooltipContent += `</div>`;
          
          // Mostrar ranking si está disponible
          if (ranking) {
            tooltipContent += `
              <div class="mb-4">
                <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                  <span class="font-medium">${mapTexts[language].rankLabel} </span>
                  <span class="font-bold text-lg mx-1">${ranking.rank}</span>
                  <span class="text-gray-600">${mapTexts[language].of} ${ranking.total}</span>
                </div>
              </div>
            `;
          }
          
          // Añadir comparativas si hay datos disponibles
          let comparisonsHtml = '';
          
          // Comparativa con la media de España
          if (spainAvg !== null && value !== null) {
            const diffSpain = value - spainAvg;
            const percentDiff = (diffSpain / spainAvg) * 100;
            const isPositive = diffSpain > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                  `vs Media Nacional (${formatValue(spainAvg)}):` : 
                  `vs National Avg (${formatValue(spainAvg)}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${!isNaN(percentDiff) ? percentDiff.toFixed(1) + '%' : t.noData}</span>
              </div>
            `;
          }
          
          // Comparativa con Islas Canarias (solo si la comunidad actual no es Canarias)
          if (canariasValue !== null && value !== null && !communityName.includes('Canarias') && !communityName.includes('Canary')) {
            const diffCanarias = value - canariasValue;
            const percentDiff = (diffCanarias / canariasValue) * 100;
            const isPositive = diffCanarias > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                  `vs Islas Canarias (${formatValue(canariasValue)}):` :
                  `vs Canary Islands (${formatValue(canariasValue)}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${!isNaN(percentDiff) ? percentDiff.toFixed(1) + '%' : t.noData}</span>
              </div>
            `;
          }
          
          // Añadir sección de comparativas si hay datos
          if (comparisonsHtml) {
            tooltipContent += `
              <div class="space-y-2 border-t border-gray-100 pt-3">
                <div class="text-xs text-gray-500 mb-1">Comparativa</div>
                ${comparisonsHtml}
              </div>
            `;
          }
        }
        
        tooltipContent += `
            </div>
          </div>
        `;
        
        // Mostrar tooltip
        positionGlobalTooltip(event, tooltipContent);
      }
      
      // Función para manejar el movimiento del mouse
      function handleMouseMove(event: MouseEvent): void {
        const tooltipEl = globalTooltip;
        if (!tooltipEl) return;
        
        const tooltipWidth = tooltipEl.offsetWidth;
        const tooltipHeight = tooltipEl.offsetHeight;
        
        // Obtener posición del mouse
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        // Calcular posición del tooltip
        let left = mouseX + 15;
        let top = mouseY - tooltipHeight / 2;
        
        // Ajustar posición si se sale de la ventana
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (left + tooltipWidth > windowWidth) {
          left = mouseX - tooltipWidth - 15;
        }
        
        if (top + tooltipHeight > windowHeight) {
          top = mouseY - tooltipHeight - 15;
        }
        
        if (top < 0) {
          top = 15;
        }
        
        // Establecer posición y visibilidad
        tooltipEl.style.left = `${left}px`;
        tooltipEl.style.top = `${top}px`;
      }
      
      // Función para manejar el evento mouseout
      function handleMouseOut(this: d3.BaseType): void {
        const element = d3.select(this);
        
        // Obtener las clases CSS del elemento para determinar el tipo de región
        const classes = element.attr('class') || '';
        
        // Restaurar el stroke original según el tipo de región
        if (classes.includes('mainland')) {
          // Regiones de la península: contorno blanco delgado
          element
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
        } else if (classes.includes('canarias') || classes.includes('ceuta') || classes.includes('melilla')) {
          // Canarias, Ceuta y Melilla: contorno negro más grueso para visibilidad
          element
            .attr('stroke', '#000')
            .attr('stroke-width', 0.7);
        } else {
          // Fallback para cualquier otro caso
          element
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
        }
        
        // Ocultar tooltip global
        const tooltipEl = globalTooltip;
        if (tooltipEl) {
          tooltipEl.style.display = 'none';
          tooltipEl.style.opacity = '0';
        }
      }
      
      // Dibujar comunidades autónomas de la península
      mapGroup.selectAll<SVGPathElement, GeoJsonFeature>('path.mainland')
        .data(mainlandFeatures)
        .enter()
        .append('path')
        // @ts-expect-error - Suppress typing error with d3 geo path
        .attr('d', (d) => pathGeneratorMainland(d) as string)
        .attr('fill', (d: GeoJsonFeature) => {
          const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language);
              const communityName = getCommunityName(d, language);
              
              // Usar un color hardcoded para valores nulos para mayor confiabilidad
              if (value === null) {
                console.log(`Comunidad sin datos: ${communityName}, usando color #f5f5f5 DIRECTO`);
                return "#f5f5f5"; // Color gris claro para regiones sin datos
              } else if (value === 0) {
                // Color específico para regiones con valor exactamente 0
                return mapPalette.ZERO;
              }
              
              const color = getColorForValue(value, selectedSector, data, selectedYear.toString(), mapPalette);
              return color;
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('id', (d: GeoJsonFeature) => {
          const name = getCommunityName(d, language);
          return `community-${normalizarTexto(name)}`;
        })
            .attr('class', (d: GeoJsonFeature) => {
              const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language);
              return value === null ? 'community mainland no-data' : 'community mainland';
            })
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseout', handleMouseOut)
        .on('click', function(event: MouseEvent, d: GeoJsonFeature) {
          if (onClick) {
            onClick(getCommunityName(d, language));
          }
        });
      
      // Dibujar Islas Canarias
      canariasGroup.selectAll<SVGPathElement, GeoJsonFeature>('path.canarias')
        .data(canariasFeatures)
        .enter()
        .append('path')
        // @ts-expect-error - Suppress typing error with d3 geo path
        .attr('d', (d) => pathGeneratorCanarias(d) as string)
        .attr('fill', (d: GeoJsonFeature) => {
          const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language);
              const communityName = getCommunityName(d, language);
              
              if (value === null) {
                console.log(`Canarias sin datos: ${communityName}, usando color #f5f5f5 DIRECTO`);
                return "#f5f5f5"; // Color gris claro para regiones sin datos
              } else if (value === 0) {
                // Color específico para regiones con valor exactamente 0
                return mapPalette.ZERO;
              }
              
              const color = getColorForValue(value, selectedSector, data, selectedYear.toString(), mapPalette);
              return color;
        })
        .attr('stroke', '#000')  // Borde más oscuro para mejor visibilidad
        .attr('stroke-width', 0.7)  // Borde ligeramente más grueso para destacar
        .attr('id', (d: GeoJsonFeature) => {
          const name = getCommunityName(d, language);
          return `community-canarias-${normalizarTexto(name)}`;
        })
            .attr('class', (d: GeoJsonFeature) => {
              const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language);
              return value === null ? 'community canarias no-data' : 'community canarias';
            })
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseout', handleMouseOut)
        .on('click', function(event: MouseEvent, d: GeoJsonFeature) {
          if (onClick) {
            onClick(getCommunityName(d, language));
          }
        });
      
      // Dibujar Ceuta y Melilla en la parte superior derecha del mapa
      // Dibujar Ceuta
      ceutaMelillaGroup.selectAll<SVGPathElement, GeoJsonFeature>('path.ceuta')
        .data(ceutaFeatures)
        .enter()
        .append('path')
        // @ts-expect-error - Suppress typing error with d3 geo path
        .attr('d', (d) => pathGeneratorCeuta(d) as string)
        .attr('fill', (d: GeoJsonFeature) => {
          const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language);
          const communityName = getCommunityName(d, language);
          
          if (value === null) {
            console.log(`Ceuta sin datos: ${communityName}, usando color #f5f5f5 DIRECTO`);
            return "#f5f5f5"; // Color gris claro para regiones sin datos
          } else if (value === 0) {
            // Color específico para regiones con valor exactamente 0
            return mapPalette.ZERO;
          }
          
          const color = getColorForValue(value, selectedSector, data, selectedYear.toString(), mapPalette);
          return color;
        })
        .attr('stroke', '#000')  // Borde más oscuro para mejor visibilidad
        .attr('stroke-width', 0.7)  // Borde ligeramente más grueso para destacar
        .attr('id', (d: GeoJsonFeature) => {
          const name = getCommunityName(d, language);
          return `community-ceuta-${normalizarTexto(name)}`;
        })
        .attr('class', (d: GeoJsonFeature) => {
          const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language);
          return value === null ? 'community ceuta no-data' : 'community ceuta';
        })
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseout', handleMouseOut)
        .on('click', function(event: MouseEvent, d: GeoJsonFeature) {
          if (onClick) {
            onClick(getCommunityName(d, language));
          }
        });
      
      // Dibujar Melilla
      ceutaMelillaGroup.selectAll<SVGPathElement, GeoJsonFeature>('path.melilla')
        .data(melillaFeatures)
        .enter()
        .append('path')
        // @ts-expect-error - Suppress typing error with d3 geo path
        .attr('d', (d) => pathGeneratorMelilla(d) as string)
        .attr('fill', (d: GeoJsonFeature) => {
          const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language);
          const communityName = getCommunityName(d, language);
          
          if (value === null) {
            console.log(`Melilla sin datos: ${communityName}, usando color #f5f5f5 DIRECTO`);
            return "#f5f5f5"; // Color gris claro para regiones sin datos
          } else if (value === 0) {
            // Color específico para regiones con valor exactamente 0
            return mapPalette.ZERO;
          }
          
          const color = getColorForValue(value, selectedSector, data, selectedYear.toString(), mapPalette);
          return color;
        })
        .attr('stroke', '#000')  // Borde más oscuro para mejor visibilidad
        .attr('stroke-width', 0.7)  // Borde ligeramente más grueso para destacar
        .attr('id', (d: GeoJsonFeature) => {
          const name = getCommunityName(d, language);
          return `community-melilla-${normalizarTexto(name)}`;
        })
        .attr('class', (d: GeoJsonFeature) => {
          const value = getCommunityValue(d, data, selectedYear.toString(), selectedSector, language);
          return value === null ? 'community melilla no-data' : 'community melilla';
            })
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseout', handleMouseOut)
        .on('click', function(event: MouseEvent, d: GeoJsonFeature) {
          if (onClick) {
            onClick(getCommunityName(d, language));
          }
        });
      
      // Dibujar el recuadro que contiene a las Islas Canarias con mejor estilo
      if (canariasFeatures.length > 0) {
        // Fondo blanco translúcido para el recuadro
        canariasGroup.append('rect')
          .attr('x', width * 0.02)
          .attr('y', height * 0.68) // Mover ligeramente hacia arriba
          .attr('width', width * 0.24)
          .attr('height', height * 0.20) // Aumentar altura del recuadro de 0.15 a 0.20
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('fill', 'rgba(255, 255, 255, 0.8)')
          .attr('stroke', '#0077b6')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .lower();
        
        // Etiqueta para Canarias con mejor estilo
        canariasGroup.append('text')
          .attr('x', width * 0.04)
          .attr('y', height * 0.71) // Ajustar posición Y de la etiqueta para que coincida con el nuevo recuadro
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', '#0077b6')
          .attr('class', 'canarias-label')
          .text(language === 'es' ? 'Islas Canarias' : 'Canary Islands');
      }
      
      // Dibujar el recuadro para Ceuta y Melilla
      if (ceutaFeatures.length > 0 || melillaFeatures.length > 0) {
        // Fondo blanco translúcido para el recuadro
        ceutaMelillaGroup.append('rect')
          .attr('x', width * 0.70)
          .attr('y', height * 0.05)
          .attr('width', width * 0.28)
          .attr('height', height * 0.15) // Reducir altura del recuadro
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('fill', 'rgba(255, 255, 255, 0.8)')
          .attr('stroke', '#0077b6')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .lower();
        
        // Etiquetas individuales para cada ciudad
        // Etiqueta para Ceuta (parte izquierda)
        ceutaMelillaGroup.append('text')
          .attr('x', width * 0.78)
          .attr('y', height * 0.10)
          .attr('font-size', '9px')
          .attr('text-anchor', 'middle')
          .attr('font-weight', 'bold')
          .attr('fill', '#444')
          .text('Ceuta');
        
        // Etiqueta para Melilla (parte derecha)
        ceutaMelillaGroup.append('text')
          .attr('x', width * 0.90)
          .attr('y', height * 0.10)
          .attr('font-size', '9px')
          .attr('text-anchor', 'middle')
          .attr('font-weight', 'bold')
          .attr('fill', '#444')
          .text('Melilla');
      }
      
          // Añadir depuración justo antes de crear la leyenda
          console.log("Depuración de estilos de elementos SVG:");
          console.log("- Color definido para NO_DATA_COLOR:", NO_DATA_COLOR);
          console.log("- Color en la paleta - NULL:", mapPalette.NULL);
      
          // En lugar de hacer esto en el efecto de renderizado del mapa, asegurémonos de que se haga cuando se detectan regiones sin datos
          const markRegionsWithNoData = () => {
            // Marcar directamente las regiones sin datos con un atributo para mayor confiabilidad
            mainlandFeatures.forEach(feature => {
              const value = getCommunityValue(feature, data, selectedYear.toString(), selectedSector, language);
              if (value === null) {
                const name = getCommunityName(feature, language);
                const id = `community-${normalizarTexto(name)}`;
                const element = document.getElementById(id);
                if (element) {
                  element.setAttribute('fill', '#f5f5f5');
                  element.setAttribute('class', 'community mainland no-data');
                  console.log(`Marcando región sin datos: ${name}`);
                }
        }
            });
      
            // Lo mismo para Canarias
            canariasFeatures.forEach(feature => {
              const value = getCommunityValue(feature, data, selectedYear.toString(), selectedSector, language);
              if (value === null) {
                const name = getCommunityName(feature, language);
                const id = `community-canarias-${normalizarTexto(name)}`;
                const element = document.getElementById(id);
                if (element) {
                  element.setAttribute('fill', '#f5f5f5');
                  element.setAttribute('class', 'community canarias no-data');
                  console.log(`Marcando región sin datos (Canarias): ${name}`);
                }
            }
          });
          
          // Lo mismo para Ceuta y Melilla
          ceutaFeatures.forEach(feature => {
            const value = getCommunityValue(feature, data, selectedYear.toString(), selectedSector, language);
            if (value === null) {
              const name = getCommunityName(feature, language);
              const id = `community-ceuta-${normalizarTexto(name)}`;
              const element = document.getElementById(id);
              if (element) {
                element.setAttribute('fill', '#f5f5f5');
                element.setAttribute('class', 'community ceuta no-data');
                console.log(`Marcando región sin datos (Ceuta): ${name}`);
              }
            }
          });
          
          // Lo mismo para Melilla
          melillaFeatures.forEach(feature => {
            const value = getCommunityValue(feature, data, selectedYear.toString(), selectedSector, language);
            if (value === null) {
              const name = getCommunityName(feature, language);
              const id = `community-melilla-${normalizarTexto(name)}`;
              const element = document.getElementById(id);
              if (element) {
                element.setAttribute('fill', '#f5f5f5');
                element.setAttribute('class', 'community melilla no-data');
                console.log(`Marcando región sin datos (Melilla): ${name}`);
                }
            }
          });
          };
          
          // Llamar a esta función después de renderizar todo el mapa
          setTimeout(markRegionsWithNoData, 100);

        } catch (err) {
          console.error('Error al renderizar el mapa:', err);
          setError(err instanceof Error ? err.message : 'Error desconocido al renderizar el mapa');
          setIsLoading(false);
      }
    };
    
    renderMap();
    } catch (err) {
      console.error('Error al iniciar renderizado del mapa:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al iniciar renderizado');
      setIsLoading(false);
    }
    
    // Limpieza al desmontar
    return () => {
      try {
      const tooltipElement = document.getElementById('researchers-map-tooltip');
      if (tooltipElement && tooltipElement.parentNode) {
        tooltipElement.parentNode.removeChild(tooltipElement);
      }
      
      const styleElement = document.getElementById('tooltip-researchers-map-styles');
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
        
        // Eliminar también los estilos personalizados
        const mapStyleElement = document.getElementById('researchers-map-custom-styles');
        if (mapStyleElement && mapStyleElement.parentNode) {
          mapStyleElement.parentNode.removeChild(mapStyleElement);
        }
      } catch (error) {
        console.error('Error durante la limpieza:', error);
      }
    };
  }, [geoJson, data, selectedYear, selectedSector, language, onClick, dataDisplayType, t, valueRange]);
  
  // Función para obtener el color del sector para el título
  const getSectorColor = (): string => {
    let normalizedId = selectedSector.toLowerCase();
    
    // Mapear sectores a IDs
    if (normalizedId === 'total' || normalizedId === 'todos los sectores' || normalizedId === 'all sectors' || normalizedId === 'all') 
      normalizedId = 'total';
    if (normalizedId === 'bes' || normalizedId === 'business' || normalizedId === 'sector empresarial' || normalizedId === 'business enterprise sector') 
      normalizedId = 'business';
    if (normalizedId === 'gov' || normalizedId === 'government' || normalizedId === 'administración pública' || normalizedId === 'government sector') 
      normalizedId = 'government';
    if (normalizedId === 'hes' || normalizedId === 'education' || normalizedId === 'enseñanza superior' || normalizedId === 'higher education sector') 
      normalizedId = 'education';
    if (normalizedId === 'pnp' || normalizedId === 'nonprofit' || normalizedId === 'instituciones privadas sin fines de lucro' || normalizedId === 'private non-profit sector') 
      normalizedId = 'nonprofit';
    
    return RESEARCHER_SECTOR_COLORS[normalizedId as keyof typeof RESEARCHER_SECTOR_COLORS] || RESEARCHER_SECTOR_COLORS.total;
  };

  // Función para obtener el texto del sector
  const getSectorText = (): string => {
    // Normalizar el sector primero
    let normalizedSector = selectedSector.toLowerCase();
    
    // Mapear códigos y nombres a IDs estándar
    if (normalizedSector === 'total' || normalizedSector === 'todos los sectores' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
      normalizedSector = 'total';
    if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'sector empresarial' || normalizedSector === 'business enterprise sector') 
      normalizedSector = 'business';
    if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'administración pública' || normalizedSector === 'government sector') 
      normalizedSector = 'government';
    if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'enseñanza superior' || normalizedSector === 'higher education sector') 
      normalizedSector = 'education';
    if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'instituciones privadas sin fines de lucro' || normalizedSector === 'private non-profit sector') 
      normalizedSector = 'nonprofit';
    
    // Usar terminología exacta de los selectores de la página
    const sectorNames: Record<string, { es: string, en: string }> = {
      'total': {
        es: 'Todos los sectores',
        en: 'All sectors'
      },
      'business': {
        es: 'Sector empresarial',
        en: 'Business enterprise sector'
      },
      'government': {
        es: 'Administración Pública',
        en: 'Government sector'
      },
      'education': {
        es: 'Enseñanza Superior',
        en: 'Higher education sector'
      },
      'nonprofit': {
        es: 'Instituciones Privadas sin Fines de Lucro',
        en: 'Private non-profit sector'
      }
    };
    
    return sectorNames[normalizedSector] ? 
            sectorNames[normalizedSector][language] : 
            (language === 'es' ? 'Todos los sectores' : 'All sectors');
  };
  
  return (
    <div className="relative h-full" ref={mapRef} key={`map-${language}-${selectedYear}-${selectedSector}`}>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">{t.loading}</p>
          </div>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-red-500">{t.error}: {error}</p>
        </div>
      ) : (
        <>
          <div className="mb-2 text-center">
            <h3 className="text-sm font-semibold text-gray-800">
              {language === 'es' ? `Mapa de investigadores por comunidades autónomas · ${selectedYear}` : `Researchers Map by Autonomous Communities · ${selectedYear}`}
            </h3>
            <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
                 style={{ backgroundColor: `${d3.color(getSectorColor())?.copy({ opacity: 0.15 })}` }}>
              {getSectorText()}
            </div>
          </div>
          <div 
            className="border border-gray-200 rounded-lg bg-white overflow-hidden"
            style={{ 
              height: '400px', // Reducido de 500px a 400px para consistencia con otros componentes
              width: '100%',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <svg ref={svgRef} className="w-full h-full"></svg>
            <div className="text-xs text-gray-600 text-center mt-2">{mapTexts[language].legend}</div>
          </div>
        </>
      )}
    </div>
  );
};

// Componente envoltorio para forzar recarga cuando cambia el idioma
const ForceUpdateMap: React.FC<ResearchersSpanishRegionsMapProps> = (props) => {
  return <ResearchersSpanishRegionsMap key={`language-${props.language}`} {...props} />;
};

export default ForceUpdateMap; 