import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Feature, Geometry } from 'geojson';
// Importando datos de country_flags.json
import countryFlagsData from '../logos/country_flags.json';
// Importar las funciones de mapeo de países
import { getIso3FromCountryName, isSupranationalEntity as isSupranationalFromMapping } from '../utils/countryMapping';
import { EUROPEAN_COUNTRY_CODES } from '../utils/europeanCountries';

// Definir colores específicos para los componentes de investigadores
const RESEARCHER_SECTOR_COLORS = {
  total: '#607D8B',        // Azul grisáceo (antes para organizaciones sin fines de lucro)
  business: '#546E7A',     // Azul grisáceo más sobrio para empresas
  government: '#795548',   // Marrón para gobierno
  education: '#7E57C2',    // Morado para educación (intercambiado)
  nonprofit: '#5C6BC0'     // Azul índigo (antes para todos los sectores)
};

// Interfaz para los elementos del archivo country_flags.json
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
}

// Aseguramos el tipo correcto para el array de flags
const countryFlags = countryFlagsData as CountryFlag[];

// Definir la interfaz para los datos de entrada
interface ResearchersData {
  sectperf: string;  // Sector of performance
  geo: string;       // Geopolitical entity (ISO code)
  TIME_PERIOD: string; // Año
  OBS_VALUE: string;   // Número de investigadores
  OBS_FLAG?: string;   // Flag de observación
  // Otros campos opcionales que podrían ser necesarios
  [key: string]: string | undefined;
}

// Definición de tipos más estrictos para propiedades
type GeoJsonProperties = {
  NAME?: string;
  NAME_EN?: string;
  ADMIN?: string;
  CNTRY_NAME?: string;
  iso_a3?: string;
  iso_a2?: string;
  [key: string]: string | number | undefined;
};

// Tipo para las características GeoJSON
type GeoJsonFeature = Feature<Geometry, GeoJsonProperties>;

interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

interface ResearchersEuropeanMapProps {
  data: ResearchersData[];
  selectedYear: number;
  selectedSector: string;
  language: 'es' | 'en';
  onClick?: (country: string) => void;
}

// URL del archivo GeoJSON de Europa
const EUROPE_GEOJSON_URL = '/data/geo/europe.geojson';

// Añadir mapeo de códigos de país a nombres en español e inglés
const countryCodeMapping: Record<string, {es: string, en: string}> = {
  'AT': {es: 'Austria', en: 'Austria'},
  'BE': {es: 'Bélgica', en: 'Belgium'},
  'BG': {es: 'Bulgaria', en: 'Bulgaria'},
  'CY': {es: 'Chipre', en: 'Cyprus'},
  'CZ': {es: 'República Checa', en: 'Czech Republic'},
  'DE': {es: 'Alemania', en: 'Germany'},
  'DK': {es: 'Dinamarca', en: 'Denmark'},
  'EE': {es: 'Estonia', en: 'Estonia'},
  'EL': {es: 'Grecia', en: 'Greece'},
  'ES': {es: 'España', en: 'Spain'},
  'FI': {es: 'Finlandia', en: 'Finland'},
  'FR': {es: 'Francia', en: 'France'},
  'HR': {es: 'Croacia', en: 'Croatia'},
  'HU': {es: 'Hungría', en: 'Hungary'},
  'IE': {es: 'Irlanda', en: 'Ireland'},
  'IT': {es: 'Italia', en: 'Italy'},
  'LT': {es: 'Lituania', en: 'Lithuania'},
  'LU': {es: 'Luxemburgo', en: 'Luxembourg'},
  'LV': {es: 'Letonia', en: 'Latvia'},
  'MT': {es: 'Malta', en: 'Malta'},
  'NL': {es: 'Países Bajos', en: 'Netherlands'},
  'PL': {es: 'Polonia', en: 'Poland'},
  'PT': {es: 'Portugal', en: 'Portugal'},
  'RO': {es: 'Rumanía', en: 'Romania'},
  'SE': {es: 'Suecia', en: 'Sweden'},
  'SI': {es: 'Eslovenia', en: 'Slovenia'},
  'SK': {es: 'Eslovaquia', en: 'Slovakia'},
  'UK': {es: 'Reino Unido', en: 'United Kingdom'},
  'EU27_2020': {es: 'Unión Europea (27)', en: 'European Union (27)'},
  'EA19': {es: 'Zona Euro (19)', en: 'Euro Area (19)'},
  'EA20': {es: 'Zona Euro (20)', en: 'Euro Area (20)'},
  'NO': {es: 'Noruega', en: 'Norway'},
  'CH': {es: 'Suiza', en: 'Switzerland'},
  'IS': {es: 'Islandia', en: 'Iceland'},
  'TR': {es: 'Turquía', en: 'Turkey'},
  'ME': {es: 'Montenegro', en: 'Montenegro'},
  'MK': {es: 'Macedonia del Norte', en: 'North Macedonia'},
  'MKD': {es: 'Macedonia del Norte', en: 'North Macedonia'},
  'AL': {es: 'Albania', en: 'Albania'},
  'RS': {es: 'Serbia', en: 'Serbia'},
  'SRB': {es: 'Serbia', en: 'Serbia'},
  'BA': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
  'BIH': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
  'MD': {es: 'Moldavia', en: 'Moldova'},
  'MDA': {es: 'Moldavia', en: 'Moldova'},
  'UA': {es: 'Ucrania', en: 'Ukraine'},
  'UKR': {es: 'Ucrania', en: 'Ukraine'},
  'XK': {es: 'Kosovo', en: 'Kosovo'},
  'XKX': {es: 'Kosovo', en: 'Kosovo'},
  'RU': {es: 'Rusia', en: 'Russia'},
  'RUS': {es: 'Rusia', en: 'Russia'},
  'JP': {es: 'Japón', en: 'Japan'},
  'US': {es: 'Estados Unidos', en: 'United States'},
  'CN_X_HK': {es: 'China (exc. Hong Kong)', en: 'China (exc. Hong Kong)'},
  'KR': {es: 'Corea del Sur', en: 'South Korea'},
  'MNE': {es: 'Montenegro', en: 'Montenegro'}
};

// Paleta de colores para el mapa
const getSectorPalette = (sectorId: string) => {
  let normalizedId = sectorId.toLowerCase();
  
  // Transformar sectores a IDs
  if (normalizedId === 'all sectors' || normalizedId === 'all' || normalizedId === 'total') normalizedId = 'total';
  if (normalizedId === 'business enterprise sector' || normalizedId === 'bes') normalizedId = 'business';
  if (normalizedId === 'government sector' || normalizedId === 'gov') normalizedId = 'government';
  if (normalizedId === 'higher education sector' || normalizedId === 'hes') normalizedId = 'education';
  if (normalizedId === 'private non-profit sector' || normalizedId === 'pnp') normalizedId = 'nonprofit';
  
  // Asegurar que usamos una clave válida para RESEARCHER_SECTOR_COLORS
  const validSectorId = (normalizedId in RESEARCHER_SECTOR_COLORS) ? normalizedId : 'total';
  const baseColor = RESEARCHER_SECTOR_COLORS[validSectorId as keyof typeof RESEARCHER_SECTOR_COLORS];
  
  // Crear un contraste más fuerte para el mapa de calor
  return {
    NULL: '#f5f5f5',           // Gris claro para valores nulos
    ZERO: '#ff9800',           // Color anaranjado para países con 0 investigadores
    MIN: d3.color(baseColor)?.brighter(1.9)?.toString() || '#f5f5f5',  // Muy claro
    LOW: d3.color(baseColor)?.brighter(1.1)?.toString() || '#d0d0d0',  // Claro
    MID: baseColor,                                                    // Color base del sector
    HIGH: d3.color(baseColor)?.darker(1.0)?.toString() || '#909090',   // Oscuro
    MAX: d3.color(baseColor)?.darker(1.8)?.toString() || '#707070',    // Muy oscuro
  };
};

// Textos localizados para el mapa
const mapTexts = {
  es: {
    title: "Investigadores por país",
    loading: "Cargando mapa...",
    error: "Error al cargar el mapa de Europa",
    noData: "Sin datos",
    researchers: "Investigadores",
    fullTimeEquivalent: "ETC (Equivalente Tiempo Completo)",
    sector_business: "Sector empresarial",
    sector_government: "Administración Pública",
    sector_education: "Enseñanza Superior",
    sector_nonprofit: "Instituciones Privadas sin Fines de Lucro",
    sector_total: "Todos los sectores",
    researchersByCountry: "Investigadores por país"
  },
  en: {
    title: "Researchers by Country",
    loading: "Loading map...",
    error: "Error loading Europe map",
    noData: "No data",
    researchers: "Researchers",
    fullTimeEquivalent: "FTE (Full-Time Equivalent)",
    sector_business: "Business enterprise sector",
    sector_government: "Government sector",
    sector_education: "Higher education sector",
    sector_nonprofit: "Private non-profit sector",
    sector_total: "All sectors",
    researchersByCountry: "Researchers by Country"
  }
};

// Función para normalizar texto (remover acentos y caracteres especiales)
function normalizarTexto(texto: string | undefined): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Función para verificar si una entidad es UE o zona euro (no un país)
// Esta función se usa en el tooltip para mostrar información adicional
function isSupranationalEntity(name: string | undefined): boolean {
  if (!name) return false;
  
  // Usar el nuevo sistema de mapeo
  return isSupranationalFromMapping(name);
}

// Función para obtener el nombre del país de las propiedades GeoJSON
function getCountryName(feature: GeoJsonFeature): string {
  const props = feature.properties || {};
  return (
    props.NAME ||
    props.NAME_EN ||
    props.ADMIN ||
    props.CNTRY_NAME ||
    props.name ||
    'Desconocido'
  ) as string;
}

// Función para obtener el código ISO3 del país
function getCountryIso3(feature: GeoJsonFeature): string {
  const props = feature.properties || {};
  
  // Obtener el nombre del país
  const countryName = getCountryName(feature);
  
  // Usar el nuevo sistema de mapeo para obtener el ISO3
  const iso3FromMapping = getIso3FromCountryName(countryName);
  if (iso3FromMapping) {
    return iso3FromMapping;
  }
  
  // Como fallback, intentar obtener el código ISO3 de diferentes propiedades posibles
  return (props.ISO3 || props.iso_a3 || props.ADM0_A3 || '') as string;
}

// Función para obtener el valor de la UE
function getEUValue(data: ResearchersData[], year: number, sector: string): number | null {
  if (!data || data.length === 0) return null;
  
  // Buscar los datos de la UE
  const euData = data.filter(item => {
    const isEU = item.geo === 'EU27_2020';
    const yearMatch = parseInt(item.TIME_PERIOD) === year;
    
    // Normalizar el sector para manejar diferentes valores
    let normalizedSector = sector.toLowerCase();
    if (normalizedSector === 'total' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
      normalizedSector = 'total';
    if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'business enterprise sector') 
      normalizedSector = 'business';
    if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'government sector') 
      normalizedSector = 'government';
    if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'higher education sector') 
      normalizedSector = 'education';
    if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'private non-profit sector') 
      normalizedSector = 'nonprofit';

    let sectorMatch = false;
    if (normalizedSector === 'total') {
      sectorMatch = item.sectperf === 'TOTAL';
    } else if (normalizedSector === 'business') {
      sectorMatch = item.sectperf === 'BES';
    } else if (normalizedSector === 'government') {
      sectorMatch = item.sectperf === 'GOV';
    } else if (normalizedSector === 'education') {
      sectorMatch = item.sectperf === 'HES';
    } else if (normalizedSector === 'nonprofit') {
      sectorMatch = item.sectperf === 'PNP';
    }
    
    return isEU && yearMatch && sectorMatch;
  });
  
  // Usar el primer resultado que coincida
  if (euData.length > 0 && euData[0].OBS_VALUE) {
    return parseFloat(euData[0].OBS_VALUE);
  }
  
  return null;
}

// Función para obtener el valor para España
function getSpainValue(data: ResearchersData[], year: number, sector: string): number | null {
  if (!data || data.length === 0) return null;
  
  // Buscar los datos de España
  const spainData = data.filter(item => {
    const isSpain = item.geo === 'ES';
    const yearMatch = parseInt(item.TIME_PERIOD) === year;
    
    // Normalizar el sector
    let normalizedSector = sector.toLowerCase();
    if (normalizedSector === 'total' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
      normalizedSector = 'total';
    if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'business enterprise sector') 
      normalizedSector = 'business';
    if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'government sector') 
      normalizedSector = 'government';
    if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'higher education sector') 
      normalizedSector = 'education';
    if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'private non-profit sector') 
      normalizedSector = 'nonprofit';

    let sectorMatch = false;
    if (normalizedSector === 'total') {
      sectorMatch = item.sectperf === 'TOTAL';
    } else if (normalizedSector === 'business') {
      sectorMatch = item.sectperf === 'BES';
    } else if (normalizedSector === 'government') {
      sectorMatch = item.sectperf === 'GOV';
    } else if (normalizedSector === 'education') {
      sectorMatch = item.sectperf === 'HES';
    } else if (normalizedSector === 'nonprofit') {
      sectorMatch = item.sectperf === 'PNP';
    }
    
    return isSpain && yearMatch && sectorMatch;
  });
  
  // Usar el primer resultado que coincida
  if (spainData.length > 0 && spainData[0].OBS_VALUE) {
    return parseFloat(spainData[0].OBS_VALUE);
  }
  
  return null;
}

// Función para verificar si el código es de una entidad supranacional
function isSupranationalCode(code: string): boolean {
  if (!code) return false;
  
  // Lista específica de códigos supranacionales (no países)
  const supranationalCodes = [
    'EU27_2020', 'EA19', 'EA20',           // Códigos directos
    'EU', 'EZ', 'EA', 'OECD', 'OCDE',      // Otros posibles códigos
    'EU27', 'EZ19', 'EZ20', 'EU28',        // Variantes adicionales
    'EU_27', 'EU-27', 'EA-19', 'EA-20'     // Variantes con guiones
  ];
  
  // Solo usar coincidencia exacta o prefijos específicos para evitar falsos positivos
  return supranationalCodes.includes(code) || 
         (code.startsWith('EU') && code.length <= 5) || 
         (code.startsWith('EA') && code.length <= 5) ||
         code === 'European Union' ||
         code === 'Euro area';
}

// Función para obtener rango de valores para todos los países
function getValueRange(
  data: ResearchersData[], 
  year: number, 
  sector: string
): { min: number, max: number, median: number, quartiles: number[] } {
  if (!data || data.length === 0) return { min: 0, max: 1, median: 0.5, quartiles: [0, 0.33, 0.66, 1] };
  
  const values: number[] = [];
  
  // Usar la lista centralizada de códigos de países europeos
  const europeanCountryCodes = EUROPEAN_COUNTRY_CODES;
  
  // Filtrar datos por año y sector, solo países europeos y excluir entidades supranacionales
  const filteredData = data.filter(item => {
    const yearMatch = parseInt(item.TIME_PERIOD) === year;
    
    // Normalizar el sector
    let sectorMatch = false;
    if (sector === 'All Sectors' || sector === 'total') {
      sectorMatch = item.sectperf === 'TOTAL';
    } else if (sector === 'Business enterprise sector' || sector === 'business') {
      sectorMatch = item.sectperf === 'BES';
    } else if (sector === 'Government sector' || sector === 'government') {
      sectorMatch = item.sectperf === 'GOV';
    } else if (sector === 'Higher education sector' || sector === 'education') {
      sectorMatch = item.sectperf === 'HES';
    } else if (sector === 'Private non-profit sector' || sector === 'nonprofit') {
      sectorMatch = item.sectperf === 'PNP';
    }
    
    // Verificar si es un país europeo (y no una entidad supranacional)
    const isEuropeanCountry = europeanCountryCodes.includes(item.geo) && !isSupranationalCode(item.geo);
    
    return yearMatch && sectorMatch && isEuropeanCountry;
  });
  
  console.log(`Datos filtrados para rango de valores: ${filteredData.length} registros`);
  
  // Extraer valores numéricos
  filteredData.forEach(item => {
    if (item.OBS_VALUE) {
      const value = parseFloat(item.OBS_VALUE);
      if (!isNaN(value) && value > 0) { // Solo incluir valores positivos
        values.push(value);
      }
    }
  });
  
  // Si no hay valores, retornar un rango por defecto
  if (values.length === 0) {
    console.warn("No se encontraron valores para calcular el rango");
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
  
  console.log(`Estadísticas calculadas (${values.length} valores):`);
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
  data: ResearchersData[] = [], 
  year: number = 0
): string {
  if (value === null) return getSectorPalette(selectedSector).NULL;
  if (value === 0) return getSectorPalette(selectedSector).ZERO;
  
  // Obtener estadísticas y rango de valores (solo de países europeos, sin entidades supranacionales)
  const stats = getValueRange(data, year, selectedSector);
  const { min, max, quartiles } = stats;
  
  // Usar una interpolación más intensa para el mapa de calor
  const palette = getSectorPalette(selectedSector);
  
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

// Función para obtener la descripción de las etiquetas
function getLabelDescription(label: string, language: 'es' | 'en'): string {
  const labelDescriptions: Record<string, { es: string, en: string }> = {
    'e': {
      es: 'Estimado',
      en: 'Estimated'
    },
    'p': {
      es: 'Provisional',
      en: 'Provisional'
    },
    'b': {
      es: 'Ruptura en la serie',
      en: 'Break in series'
    },
    'd': {
      es: 'Definición difiere',
      en: 'Definition differs'
    },
    'u': {
      es: 'Baja fiabilidad',
      en: 'Low reliability'
    },
    'bd': {
      es: 'Ruptura en la serie y definición difiere',
      en: 'Break in series and definition differs'
    },
    'bp': {
      es: 'Ruptura en la serie y provisional',
      en: 'Break in series and provisional'
    },
    'dp': {
      es: 'Definición difiere y provisional',
      en: 'Definition differs and provisional'
    },
    'ep': {
      es: 'Estimado y provisional',
      en: 'Estimated and provisional'
    }
  };
  
  return label in labelDescriptions 
    ? labelDescriptions[label][language] 
    : language === 'es' ? 'Desconocido' : 'Unknown';
}

// Función para obtener URL de bandera del país
function getCountryFlagUrl(countryName: string, feature?: GeoJsonFeature): string {  
  // Intentar obtener ISO3 del feature si está disponible
  let iso3 = feature ? getCountryIso3(feature) : '';
  
  // Si no tenemos ISO3 del feature, buscar por nombre
  if (!iso3) {
    // Normalizar el nombre del país para búsqueda
    const normalizedCountryName = normalizarTexto(countryName);
    
    // Buscar en la lista de banderas
    const foundFlag = countryFlags.find(flag => 
      normalizarTexto(flag.country) === normalizedCountryName
    );
    
    if (foundFlag) {
      iso3 = foundFlag.iso3;
    }
  }
  
  // Buscar en la lista de banderas por ISO3
  const foundFlag = iso3 ? countryFlags.find(flag => flag.iso3 === iso3) : null;
  
  if (foundFlag && foundFlag.flag) {
    return foundFlag.flag;
  }
  
  // Fallback a una bandera genérica
  return '/data/flags/placeholder.svg';
}

// Formatear valores numéricos con separador de miles (versión abreviada)
function formatNumberWithThousandSeparator(value: number, decimals: number = 0, lang: 'es' | 'en' = 'es'): string {
  // Verificar si el valor es muy grande y formatearlo adecuadamente
  if (value >= 1000000) {
    // Para valores de millones o más, mostrar en formato abreviado
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    // Para valores de miles, mostrar en formato abreviado
    return (value / 1000).toFixed(1) + 'K';
  } else {
    // Para valores menores a mil, usar formato normal
    return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
}

// Formatear números siempre completos con separador de miles (sin abreviar)
function formatNumberComplete(value: number, decimals: number = 0, lang: 'es' | 'en' = 'es'): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

// Corregir los tipos para la función positionTooltip usando un tipo genérico más amplio - Optimizada para móvil
function positionTooltip<T extends Element>(
  tooltip: d3.Selection<T, unknown, null, undefined>, 
  event: MouseEvent, 
  tooltipNode: HTMLElement
): void {
  // Obtener las dimensiones del tooltip
  const tooltipRect = tooltipNode.getBoundingClientRect();
  const tooltipWidth = tooltipRect.width || 320; // Aumentar ancho por defecto para móvil
  const tooltipHeight = tooltipRect.height || 280; // Aumentar altura por defecto
  
  // Obtener dimensiones de la ventana
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Detectar si es móvil (pantalla pequeña)
  const isMobile = windowWidth < 768;
  
  let left, top;
  
  if (isMobile) {
    // En móvil, centrar el tooltip en la pantalla con margen
    const margin = 10;
    
    // Centrar horizontalmente con margen de seguridad
    left = Math.max(margin, (windowWidth - tooltipWidth) / 2);
    
    // Posicionar verticalmente - preferir la parte superior si cabe
    if (event.clientY > windowHeight / 2) {
      // Si el click está en la mitad inferior, mostrar arriba
      top = Math.max(margin, event.clientY - tooltipHeight - 20);
    } else {
      // Si el click está en la mitad superior, mostrar abajo
      top = Math.min(windowHeight - tooltipHeight - margin, event.clientY + 20);
    }
    
    // Asegurar que cabe en la pantalla
    if (tooltipHeight > windowHeight - 2 * margin) {
      top = margin;
    }
  } else {
    // Comportamiento original para desktop
    left = event.clientX + 15;
    top = event.clientY - 15;
    
    // Ajustar horizontalmente si se sale por la derecha
    if (left + tooltipWidth > windowWidth - 10) {
      left = event.clientX - tooltipWidth - 15; // Mover a la izquierda del cursor
    }
    
    // Ajustar verticalmente si se sale por abajo
    if (top + tooltipHeight > windowHeight - 10) {
      if (tooltipHeight < windowHeight - 20) {
        // Si cabe en la pantalla, ajustar hacia arriba
        top = windowHeight - tooltipHeight - 10;
      } else {
        // Si es demasiado grande, colocarlo en la parte superior con scroll
        top = 10;
      }
    }
    
    // Asegurar que no se salga por arriba
    if (top < 10) {
      top = 10;
    }
    
    // Asegurar que no se salga por la izquierda
    if (left < 10) {
      left = 10;
    }
  }
  
  // Aplicar la posición
  tooltip
    .style('left', `${left}px`)
    .style('top', `${top}px`);
}

// Actualizar la función para obtener nombre del país
function getLocalizedCountryName(countryCode: string, language: 'es' | 'en'): string {
  if (countryCode in countryCodeMapping) {
    return countryCodeMapping[countryCode][language];
  }
  
  // Si no está en el mapeo, ver si podemos encontrarlo en countryFlags
  const flagInfo = countryFlags.find(flag => flag.code === countryCode || flag.iso3 === countryCode);
  if (flagInfo) {
    return flagInfo.country;
  }
  
  // Si no se encuentra, devolver el código como fallback
  return countryCode;
}

// Función para obtener el valor del año anterior con mejor manejo del sector y búsqueda más exhaustiva
function getPreviousYearValue(
  data: ResearchersData[],
  countryCode: string | undefined,
  year: number,
  sector: string
): number | null {
  if (!data || data.length === 0 || !countryCode || year <= 1) {
    console.log(`[YoY Debug] Retornando null - Condiciones iniciales no cumplidas: data=${!!data}, countryCode=${countryCode}, year=${year}`);
    return null;
  }
  
  const previousYear = year - 1;
  console.log(`[YoY Debug] Buscando datos para país=${countryCode}, año anterior=${previousYear}, sector=${sector}`);
  
  // Normalizar el sector seleccionado para mejorar las coincidencias
  let normalizedSector = sector.toLowerCase();
  if (normalizedSector === 'total' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
    normalizedSector = 'total';
  if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'business enterprise sector') 
    normalizedSector = 'business';
  if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'government sector') 
    normalizedSector = 'government';
  if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'higher education sector') 
    normalizedSector = 'education';
  if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'private non-profit sector') 
    normalizedSector = 'nonprofit';
  
  // Crear un array de posibles códigos alternativos para el país
  const possibleCodes = [countryCode];
  
  // Códigos ISO mapeados más comunes
  const codeMapping: Record<string, string[]> = {
    'GRC': ['EL', 'GR'],
    'GBR': ['UK', 'GB'],
    'DEU': ['DE'],
    'FRA': ['FR'],
    'ESP': ['ES'],
    'ITA': ['IT'],
    'CZE': ['CZ'],
    'SWE': ['SE'],
    'DNK': ['DK'],
    'FIN': ['FI'],
    'AUT': ['AT'],
    'BEL': ['BE'],
    'BGR': ['BG'],
    'HRV': ['HR'],
    'CYP': ['CY'],
    'EST': ['EE'],
    'HUN': ['HU'],
    'IRL': ['IE'],
    'LVA': ['LV'],
    'LTU': ['LT'],
    'LUX': ['LU'],
    'MLT': ['MT'],
    'NLD': ['NL'],
    'POL': ['PL'],
    'PRT': ['PT'],
    'ROU': ['RO'],
    'SVK': ['SK'],
    'SVN': ['SI'],
    'CHE': ['CH'],
    'NOR': ['NO'],
    'ISL': ['IS'],
    'TUR': ['TR'],
    'MKD': ['MK'],
    'SRB': ['RS'],
    'MNE': ['ME'],
    'ALB': ['AL'],
    'BIH': ['BA'],
    'UKR': ['UA'],
    'RUS': ['RU']
  };

  // Mapeo inverso - ISO2 a ISO3
  const codeMapping2to3: Record<string, string> = {
    'EL': 'GRC',
    'UK': 'GBR',
    'GB': 'GBR',
    'DE': 'DEU',
    'FR': 'FRA',
    'ES': 'ESP',
    'IT': 'ITA',
    'CZ': 'CZE',
    'SE': 'SWE',
    'DK': 'DNK',
    'FI': 'FIN',
    'AT': 'AUT',
    'BE': 'BEL',
    'BG': 'BGR',
    'HR': 'HRV',
    'CY': 'CYP',
    'EE': 'EST',
    'HU': 'HUN',
    'IE': 'IRL',
    'LV': 'LVA',
    'LT': 'LTU',
    'LU': 'LUX',
    'MT': 'MLT',
    'NL': 'NLD',
    'PL': 'POL',
    'PT': 'PRT',
    'RO': 'ROU',
    'SK': 'SVK',
    'SI': 'SVN',
    'CH': 'CHE',
    'NO': 'NOR',
    'IS': 'ISL',
    'TR': 'TUR',
    'MK': 'MKD',
    'RS': 'SRB',
    'ME': 'MNE',
    'AL': 'ALB',
    'BA': 'BIH',
    'UA': 'UKR',
    'RU': 'RUS'
  };
  
  // Añadir códigos alternativos del mapeo
  if (countryCode.length === 3 && countryCode in codeMapping) {
    possibleCodes.push(...codeMapping[countryCode]);
  } else if (countryCode.length === 2 && countryCode in codeMapping2to3) {
    possibleCodes.push(codeMapping2to3[countryCode]);
  }
  
  console.log(`[YoY Debug] Códigos de país a buscar: ${possibleCodes.join(', ')}`);
  
  // Buscar datos del año anterior utilizando todos los códigos alternativos
  for (const code of possibleCodes) {
    // Buscar los datos del país para el año anterior
    const prevYearData = data.filter(item => {
      // Comprobar si el código geo coincide
      const geoMatch = item.geo === code;
      const yearMatch = parseInt(item.TIME_PERIOD) === previousYear;
      
      // Normalizar el sector para manejar diferentes valores
      let sectorMatch = false;
      if (normalizedSector === 'total') {
        sectorMatch = item.sectperf === 'TOTAL';
      } else if (normalizedSector === 'business') {
        sectorMatch = item.sectperf === 'BES';
      } else if (normalizedSector === 'government') {
        sectorMatch = item.sectperf === 'GOV';
      } else if (normalizedSector === 'education') {
        sectorMatch = item.sectperf === 'HES';
      } else if (normalizedSector === 'nonprofit') {
        sectorMatch = item.sectperf === 'PNP';
      }
      
      // Depuración detallada para diagnóstico
      if (geoMatch) {
        console.log(`[YoY Debug] Encontrada coincidencia geo=${item.geo}, año=${item.TIME_PERIOD}, sector=${item.sectperf}, yearMatch=${yearMatch}, sectorMatch=${sectorMatch}`);
      }
      
      return geoMatch && yearMatch && sectorMatch;
    });
    
    console.log(`[YoY Debug] Resultados encontrados para código ${code}: ${prevYearData.length}`);
    
    // Usar el primer resultado que coincida
    if (prevYearData.length > 0 && prevYearData[0].OBS_VALUE) {
      const prevValue = parseFloat(prevYearData[0].OBS_VALUE);
      console.log(`[YoY Debug] Valor del año anterior encontrado: ${prevValue}`);
      return prevValue;
    }
  }
  
  console.log('[YoY Debug] No se encontró valor para el año anterior');
  return null;
}

const ResearchersEuropeanMap: React.FC<ResearchersEuropeanMapProps> = ({ 
  data, 
  selectedYear, 
  selectedSector, 
  language, 
  onClick 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [europeanMapData, setEuropeanMapData] = useState<GeoJsonData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Añadir estado para almacenar el rango de valores
  const [valueRange, setValueRange] = useState<{min: number, max: number, median?: number, quartiles?: number[]}>({min: 0, max: 1});
  
  // Textos del idioma seleccionado
  const t = mapTexts[language];
  
  // Obtener título del mapa
  const getMapTitle = (): string => {
    return t.researchersByCountry;
  };
  
  // Obtener texto del sector
  const getSectorText = (): string => {
    // Normalizar el sector
    let normalizedSector = selectedSector.toLowerCase();
    
    if (normalizedSector === 'total' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
      normalizedSector = 'total';
    if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'business enterprise sector') 
      normalizedSector = 'business';
    if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'government sector') 
      normalizedSector = 'government';
    if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'higher education sector') 
      normalizedSector = 'education';
    if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'private non-profit sector') 
      normalizedSector = 'nonprofit';
    
    switch(normalizedSector) {
      case 'business':
        return t.sector_business;
      case 'government':
        return t.sector_government;
      case 'education':
        return t.sector_education;
      case 'nonprofit':
        return t.sector_nonprofit;
      default:
        return t.sector_total;
    }
  };
  
  // Obtener color del sector para el título
  const getSectorColor = (): string => {
    let normalizedId = selectedSector.toLowerCase();
    
    // Mapear sectores a ids (misma lógica que getSectorText)
    if (normalizedId === 'total' || normalizedId === 'all sectors' || normalizedId === 'all') 
      normalizedId = 'total';
    if (normalizedId === 'bes' || normalizedId === 'business' || normalizedId === 'business enterprise sector') 
      normalizedId = 'business';
    if (normalizedId === 'gov' || normalizedId === 'government' || normalizedId === 'government sector') 
      normalizedId = 'government';
    if (normalizedId === 'hes' || normalizedId === 'education' || normalizedId === 'higher education sector') 
      normalizedId = 'education';
    if (normalizedId === 'pnp' || normalizedId === 'nonprofit' || normalizedId === 'private non-profit sector') 
      normalizedId = 'nonprofit';
    
    // Obtener color del sector usando los nuevos colores de investigadores
    const baseColor = RESEARCHER_SECTOR_COLORS[normalizedId as keyof typeof RESEARCHER_SECTOR_COLORS] || RESEARCHER_SECTOR_COLORS.total;
    // Usar d3 para obtener una versión más oscura del color
    return d3.color(baseColor)?.darker(0.8)?.toString() || '#333333';
  };
  
  // Calcular el rango de valores cuando cambian los datos, año o sector
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Calcular el rango de valores solo para países europeos (sin entidades supranacionales)
    const range = getValueRange(data, selectedYear, selectedSector);
    setValueRange(range);
    
    console.log("Rango de valores actualizado para mapa:");
    console.log(`- Año: ${selectedYear}`);
    console.log(`- Sector: ${selectedSector}`);
    console.log(`- Valor mínimo: ${range.min}`);
    console.log(`- Valor máximo: ${range.max}`);
    console.log(`- Cuartiles: ${range.quartiles?.join(', ')}`);
  }, [data, selectedYear, selectedSector]);
  
  // Cargar mapa de Europa
  useEffect(() => {
    const fetchMap = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(EUROPE_GEOJSON_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setEuropeanMapData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading map data:', err);
        setError(t.error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMap();
  }, [t.error]);
  
        // Añadir estilos CSS para el tooltip en el useEffect
  useEffect(() => {
    // Crear un elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = 'tooltip-researchers-map-styles';
    
    // Definir estilos CSS para el tooltip
    styleElement.textContent = `
      .country-tooltip {
        transform-origin: top left;
        transform: scale(0.95);
        transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
        opacity: 0;
        z-index: 9999;
        pointer-events: none;
        position: fixed;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border-radius: 8px;
      }
      .country-tooltip.visible {
        opacity: 1 !important;
        transform: scale(1);
      }
      .country-tooltip .text-green-600 { color: #059669; }
      .country-tooltip .text-red-600 { color: #DC2626; }
      .country-tooltip .bg-blue-50 { background-color: #EFF6FF; }
      .country-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
      .country-tooltip .border-blue-100 { border-color: #DBEAFE; }
      .country-tooltip .border-gray-100 { border-color: #F3F4F6; }
      .country-tooltip .text-gray-500 { color: #6B7280; }
      .country-tooltip .text-blue-700 { color: #1D4ED8; }
      .country-tooltip .text-gray-800 { color: #1F2937; }
      .country-tooltip .text-gray-600 { color: #4B5563; }
      .country-tooltip .text-yellow-500 { color: #F59E0B; }
      .country-tooltip .rounded-lg { border-radius: 0.5rem; }
      .country-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
      .country-tooltip .p-3 { padding: 0.75rem; }
      .country-tooltip .p-4 { padding: 1rem; }
      .country-tooltip .p-2 { padding: 0.5rem; }
      .country-tooltip .pt-3 { padding-top: 0.75rem; }
      .country-tooltip .mb-3 { margin-bottom: 0.75rem; }
      .country-tooltip .mb-1 { margin-bottom: 0.25rem; }
      .country-tooltip .mb-4 { margin-bottom: 1rem; }
      .country-tooltip .mr-1 { margin-right: 0.25rem; }
      .country-tooltip .mr-2 { margin-right: 0.5rem; }
      .country-tooltip .mt-1 { margin-top: 0.25rem; }
      .country-tooltip .mt-3 { margin-top: 0.75rem; }
      .country-tooltip .text-xs { font-size: 0.75rem; }
      .country-tooltip .text-sm { font-size: 0.875rem; }
      .country-tooltip .text-lg { font-size: 1.125rem; }
      .country-tooltip .text-xl { font-size: 1.25rem; }
      .country-tooltip .font-bold { font-weight: 700; }
      .country-tooltip .font-medium { font-weight: 500; }
      .country-tooltip .flex { display: flex; }
      .country-tooltip .items-center { align-items: center; }
      .country-tooltip .justify-between { justify-content: space-between; }
      .country-tooltip .w-8 { width: 2rem; }
      .country-tooltip .h-6 { height: 1.5rem; }
      .country-tooltip .w-36 { width: 9rem; }
      .country-tooltip .w-44 { width: 11rem; }
      .country-tooltip .w-48 { width: 12rem; }
      .country-tooltip .rounded { border-radius: 0.25rem; }
      .country-tooltip .rounded-md { border-radius: 0.375rem; }
      .country-tooltip .overflow-hidden { overflow: hidden; }
      .country-tooltip .border-t { border-top-width: 1px; }
      .country-tooltip .border-b { border-bottom-width: 1px; }
      .country-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
      .country-tooltip .max-w-xs { max-width: 20rem; }
      .country-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
      .country-tooltip .w-full { width: 100%; }
      .country-tooltip .h-full { height: 100%; }
      .country-tooltip img { max-width: 100%; height: 100%; object-fit: cover; }
      .country-tooltip .relative { position: relative; }
    `;
    
    // Añadir al head
    document.head.appendChild(styleElement);
    
    // Eliminar cuando se desmonte el componente
    return () => {
      const existingStyle = document.getElementById('tooltip-researchers-map-styles');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);
  
  // Diagnóstico inicial para ver la estructura de datos
  useEffect(() => {
    if (data && data.length > 0) {
      console.log("[Data Structure Debug] Ejemplo de estructura de datos:", data[0]);
      // Verificar si OBS_FLAG está presente en algunos registros
      const flagSamples = data.filter(item => item.OBS_FLAG).slice(0, 5);
      console.log("[Data Structure Debug] Ejemplos con OBS_FLAG:", flagSamples);
    }
  }, [data]);
  
  // Renderizar el mapa cuando cambian los datos
  useEffect(() => {
    if (!svgRef.current || !europeanMapData || isLoading) return;
    
    const renderMap = () => {
      // Limpiar SVG
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      
      // Configurar proyección
      const projection = d3.geoMercator()
        .center([10, 55])
        .scale(700)
        .translate([svg.node()?.getBoundingClientRect().width ?? 500 / 2, 350]);
      
      // Crear generador de paths
      const pathGenerator = d3.geoPath().projection(projection);
      
      // Función para obtener el ranking de un país (se usará después de dibujar los países)
      const getCountryRank = (feature: GeoJsonFeature, countryValuesMap: Map<string, number>): { rank: number, total: number } | null => {
        const countryName = getCountryName(feature);
        const countryIso3 = getCountryIso3(feature);
        const countryIso2 = feature.properties?.iso_a2 as string;
        
        // Si es una entidad supranacional, no mostrar ranking
        if (isSupranationalEntity(countryName)) return null;
        
        // Mapeo de códigos GeoJSON a códigos de datos
        const codeMapping: Record<string, string> = {
          'GRC': 'EL',
          'GBR': 'UK',
          'DEU': 'DE',
          'FRA': 'FR',
          'ESP': 'ES',
          'ITA': 'IT',
          'CZE': 'CZ',
          'SWE': 'SE',
          'DNK': 'DK',
          'FIN': 'FI',
          'AUT': 'AT',
          'BEL': 'BE',
          'BGR': 'BG',
          'HRV': 'HR',
          'CYP': 'CY',
          'EST': 'EE',
          'HUN': 'HU',
          'IRL': 'IE',
          'LVA': 'LV',
          'LTU': 'LT',
          'LUX': 'LU',
          'MLT': 'MT',
          'NLD': 'NL',
          'POL': 'PL',
          'PRT': 'PT',
          'ROU': 'RO',
          'SVK': 'SK',
          'SVN': 'SI',
          'CHE': 'CH',
          'NOR': 'NO',
          'ISL': 'IS',
          'TUR': 'TR',
          'MKD': 'MK',
          'RUS': 'RU',
          'SRB': 'RS',
          'MNE': 'ME',
          'ALB': 'AL',
          'BIH': 'BA',
          'MDA': 'MD',
          'UKR': 'UA',
          'XKX': 'XK'
        };
        
        // Buscar el código correcto en el mapa de valores
        const possibleCodes = [countryIso2, countryIso3];
        if (countryIso3 && codeMapping[countryIso3]) {
          possibleCodes.push(codeMapping[countryIso3]);
        }
        
        let currentValue: number | null = null;
        let matchedCode: string | null = null;
        
        for (const code of possibleCodes) {
          if (code && countryValuesMap.has(code)) {
            currentValue = countryValuesMap.get(code)!;
            matchedCode = code;
            break;
          }
        }
        
        if (currentValue === null || matchedCode === null) return null;
        
        // Crear lista ordenada excluyendo entidades supranacionales (igual que ResearcherRankingChart)
        const sortedValues: [string, number][] = [];
        countryValuesMap.forEach((val, code) => {
          // Verificar si es un país (no una entidad supranacional)
          const isSupranational = code === 'EU27_2020' || code === 'EA19' || code === 'EA20';
          
          if (!isSupranational) {
            sortedValues.push([code, val]);
          }
        });
        
        // Ordenar por valor (mayor a menor)
        sortedValues.sort((a, b) => b[1] - a[1]);
        
        // Buscar la posición en el ranking usando el valor actual
        const position = sortedValues.findIndex(([, val]) => val === currentValue);
        
        if (position === -1) return null;
        
        return {
          rank: position + 1, // +1 porque los índices empiezan en 0
          total: sortedValues.length
        };
      };
      
      // Crear una leyenda para el mapa
      const createLegend = () => {
        const legendGroup = svg.append('g')
          .attr('transform', `translate(60, 480)`);
        
        // Obtener los valores necesarios para la leyenda
        const { min, max } = valueRange;
        const quartiles = valueRange.quartiles || [min, min + (max-min)*0.25, min + (max-min)*0.5, min + (max-min)*0.75, max];
        
        // Crear rectángulos para cada categoría
        const palette = getSectorPalette(selectedSector);
        const colors = [palette.MIN, palette.LOW, palette.MID, palette.HIGH, palette.MAX];
        
        // Añadir título a la leyenda
        legendGroup.append('text')
          .attr('x', 0)
          .attr('y', -80)
          .attr('font-size', '16px')
          .attr('font-weight', 'bold')
          .text(t.researchers);
        
        // Añadir primero la etiqueta "Sin datos" a la leyenda
        legendGroup.append('rect')
          .attr('x', 0)
          .attr('y', -60)
          .attr('width', 25)
          .attr('height', 25)
          .attr('fill', palette.NULL)
          .attr('stroke', '#666')
          .attr('stroke-width', 0.5);
          
        legendGroup.append('text')
          .attr('x', 35)
          .attr('y', -42)
          .attr('font-size', '14px')
          .text(language === 'es' ? 'Sin datos' : 'No data');
          
        // Añadir etiqueta para valores cero
        legendGroup.append('rect')
          .attr('x', 0)
          .attr('y', -30)
          .attr('width', 25)
          .attr('height', 25)
          .attr('fill', palette.ZERO)
          .attr('stroke', '#666')
          .attr('stroke-width', 0.5);
          
        legendGroup.append('text')
          .attr('x', 35)
          .attr('y', -12)
          .attr('font-size', '14px')
          .text('0');
        
        // Usar los cuartiles para las etiquetas de la leyenda
        const rangeValues = quartiles;
        
        for (let i = 0; i < 4; i++) {
          const rangeStart = Math.round(rangeValues[i]);
          const rangeEnd = Math.round(rangeValues[i + 1]);
          
          // Asegurar que no haya rangos duplicados
          if (i > 0 && rangeStart === Math.round(rangeValues[i-1])) {
            continue;
          }
          
          legendGroup.append('rect')
            .attr('x', 0)
            .attr('y', i * 30)
            .attr('width', 25)
            .attr('height', 25)
            .attr('fill', colors[i])
            .attr('stroke', '#666')
            .attr('stroke-width', 0.5);
          
          // Formatear los valores con separadores de miles
          const formattedStart = formatNumberWithThousandSeparator(rangeStart, 0, language);
          const formattedEnd = formatNumberWithThousandSeparator(rangeEnd, 0, language);
          
          legendGroup.append('text')
            .attr('x', 35)
            .attr('y', i * 30 + 18)
            .attr('font-size', '14px')
            .text(`${formattedStart} - ${formattedEnd}`);
        }
      };
      
      // Función para obtener el valor de un país
      const getCountryValue = (
        feature: GeoJsonFeature,
        data: ResearchersData[],
        year: number,
        sector: string
      ): number | null => {
        if (!data || data.length === 0) return null;
        
        // Obtener códigos del país desde el feature
        const iso3 = getCountryIso3(feature);
        const iso2 = feature.properties?.iso_a2 as string;
        
        // Usar la lista centralizada de códigos de países europeos
        const europeanCountryCodes = EUROPEAN_COUNTRY_CODES;
        
        // Verificar si el país es europeo de forma más permisiva
        // Solo excluir si ambos códigos (iso2 e iso3) no están en la lista
        if (iso2 && iso3 && 
            !europeanCountryCodes.includes(iso2) && 
            !europeanCountryCodes.includes(iso3)) {
          // Si claramente no es un país europeo, no mostrar datos
          return null;
        }
        
        // Solo excluir entidades claramente supranacionales
        if (isSupranationalCode(iso3) || isSupranationalCode(iso2)) {
          return null;
        }
        
        // Normalizar el sector seleccionado para mejorar las coincidencias
        let normalizedSector = sector.toLowerCase();
        if (normalizedSector === 'total' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
          normalizedSector = 'total';
        if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'business enterprise sector') 
          normalizedSector = 'business';
        if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'government sector') 
          normalizedSector = 'government';
        if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'higher education sector') 
          normalizedSector = 'education';
        if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'private non-profit sector') 
          normalizedSector = 'nonprofit';
        
        // Mapeo especial para códigos que no coinciden directamente
        const codeMapping: Record<string, string[]> = {
          'GRC': ['EL'],
          'GBR': ['UK'],
          'DEU': ['DE'],
          'FRA': ['FR'],
          'ESP': ['ES'],
          'ITA': ['IT'],
          'CZE': ['CZ'],
          'SWE': ['SE'],
          'DNK': ['DK'],
          'FIN': ['FI'],
          'AUT': ['AT'],
          'BEL': ['BE'],
          'BGR': ['BG'],
          'HRV': ['HR'],
          'CYP': ['CY'],
          'EST': ['EE'],
          'HUN': ['HU'],
          'IRL': ['IE'],
          'LVA': ['LV'],
          'LTU': ['LT'],
          'LUX': ['LU'],
          'MLT': ['MT'],
          'NLD': ['NL'],
          'POL': ['PL'],
          'PRT': ['PT'],
          'ROU': ['RO'],
          'SVK': ['SK'],
          'SVN': ['SI'],
          'CHE': ['CH'],
          'NOR': ['NO'],
          'ISL': ['IS'],
          'TUR': ['TR'],
          'MKD': ['MK'],
          'RUS': ['RU'],
          'SRB': ['RS'],     // Serbia
          'MNE': ['ME'],     // Montenegro
          'ALB': ['AL'],     // Albania
          'BIH': ['BA'],     // Bosnia y Herzegovina
          'XKX': ['XK']      // Kosovo
        };
        
        // Lista de posibles códigos a buscar
        const possibleCodes = [iso3, iso2];
        
        // Añadir códigos alternativos del mapeo
        if (iso3 && iso3 in codeMapping) {
          possibleCodes.push(...codeMapping[iso3]);
        }
        if (iso2 && codeMapping[iso2]) {
          possibleCodes.push(...codeMapping[iso2]);
        }
        
        // Buscar los datos para cualquiera de los posibles códigos
        const countryData = data.filter(item => {
          // Verificar si el código geo coincide con cualquiera de los posibles códigos
          const geoMatch = possibleCodes.some(code => item.geo === code);
          const yearMatch = parseInt(item.TIME_PERIOD) === year;
          
          // Normalizar el sector para manejar diferentes valores
          let sectorMatch = false;
          if (normalizedSector === 'total') {
            sectorMatch = item.sectperf === 'TOTAL';
          } else if (normalizedSector === 'business') {
            sectorMatch = item.sectperf === 'BES';
          } else if (normalizedSector === 'government') {
            sectorMatch = item.sectperf === 'GOV';
          } else if (normalizedSector === 'education') {
            sectorMatch = item.sectperf === 'HES';
          } else if (normalizedSector === 'nonprofit') {
            sectorMatch = item.sectperf === 'PNP';
          }
          
          return geoMatch && yearMatch && sectorMatch;
        });
        
        // Usar el primer resultado que coincida
        if (countryData.length > 0 && countryData[0].OBS_VALUE) {
          return parseFloat(countryData[0].OBS_VALUE);
        }
        
        return null;
      };
      
      // Funciones de interacción con tooltip mejorado
      const handleMouseOver = (event: MouseEvent, feature: GeoJsonFeature) => {
        const countryIso3 = getCountryIso3(feature);
        const countryIso2 = feature.properties?.iso_a2 as string;
        const countryName = getLocalizedCountryName(countryIso3 || countryIso2, language);
        const value = getCountryValue(feature, data, selectedYear, selectedSector);
        
        // Recopilar todos los valores basándose en los datos reales, no en el GeoJSON
        const countryValuesMap = new Map<string, number>();
        
        // Usar la misma lógica que ResearcherRankingChart para obtener los países con datos
        const countryDataForYear = data.filter(item => {
          const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
          
          // Normalizar el sector
          let normalizedSector = selectedSector.toLowerCase();
          if (normalizedSector === 'total' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
            normalizedSector = 'total';
          if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'business enterprise sector') 
            normalizedSector = 'business';
          if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'government sector') 
            normalizedSector = 'government';
          if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'higher education sector') 
            normalizedSector = 'education';
          if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'private non-profit sector') 
            normalizedSector = 'nonprofit';

          let sectorMatch = false;
          if (normalizedSector === 'total') {
            sectorMatch = item.sectperf === 'TOTAL';
          } else if (normalizedSector === 'business') {
            sectorMatch = item.sectperf === 'BES';
          } else if (normalizedSector === 'government') {
            sectorMatch = item.sectperf === 'GOV';
          } else if (normalizedSector === 'education') {
            sectorMatch = item.sectperf === 'HES';
          } else if (normalizedSector === 'nonprofit') {
            sectorMatch = item.sectperf === 'PNP';
          }
          
          // Verificar si es un país europeo usando la lista centralizada
          const isEuropean = EUROPEAN_COUNTRY_CODES.includes(item.geo);
          
          return yearMatch && sectorMatch && isEuropean;
        });
        
        // Procesar los datos para crear el mapa de valores (igual que en ResearcherRankingChart)
        const tempCountryMap = new Map<string, {code: string, value: number, isSupranational: boolean}>();
        
        countryDataForYear.forEach(item => {
          const countryCode = item.geo;
          let value = parseFloat(item.OBS_VALUE || '0');
          if (isNaN(value)) return;
          
          // Aplicar el mismo cálculo de promedios para entidades supranacionales
          if (countryCode === 'EU27_2020') {
            value = Math.round(value / 27);
          } else if (countryCode === 'EA19') {
            value = Math.round(value / 19);
          } else if (countryCode === 'EA20') {
            value = Math.round(value / 20);
          }
          
          const isSupranational = countryCode === 'EU27_2020' || countryCode === 'EA19' || countryCode === 'EA20';
          tempCountryMap.set(countryCode, {code: countryCode, value: value, isSupranational: isSupranational});
        });
        
        // Ordenar y limitar a 25 elementos (igual que ResearcherRankingChart)
        let sortedData = Array.from(tempCountryMap.values())
          .sort((a, b) => b.value - a.value);
        
        // Limitar a un máximo de 25 entidades en total (sean países o entidades supranacionales)
        sortedData = sortedData.slice(0, 25);
        
        // Crear el mapa final de valores solo con los 25 primeros
        sortedData.forEach(item => {
          countryValuesMap.set(item.code, item.value);
        });
        
        // Ahora podemos obtener el ranking usando el mapa de valores
        const rankInfo = !isSupranationalEntity(countryName) ? 
          getCountryRank(feature, countryValuesMap) : null;
        
        // Usar la lista centralizada de códigos de países europeos
        const europeanCountryCodes = EUROPEAN_COUNTRY_CODES;
        
        // Verificar si el país es europeo de forma más flexible
        if ((countryIso2 && !europeanCountryCodes.includes(countryIso2)) && 
            (countryIso3 && !europeanCountryCodes.includes(countryIso3))) {
          // Si no es un país europeo, ignorar
          return;
        }
        
        // Verificar si es una entidad supranacional para personalizar el tooltip
        const countryNameAlt = getCountryName(feature);
        if (isSupranationalEntity(countryNameAlt)) {
          // Si es una entidad supranacional podríamos mostrar información adicional
          console.log(`Tooltip para entidad supranacional: ${countryNameAlt}`);
        }
        
        // Destacar país seleccionado
        d3.select(event.currentTarget as SVGPathElement)
          .attr('stroke-width', '1.5')
          .attr('stroke', '#333');
        
        // Buscar información adicional en los datos
        const countryData = data.find(item => {
          // Lista de posibles códigos a buscar
          const possibleCodes = [countryIso3, countryIso2];
          
          // Mapeo especial para códigos que no coinciden directamente
          const codeMapping: Record<string, string[]> = {
            'GRC': ['EL'],
            'GBR': ['UK'],
            'DEU': ['DE'],
            'FRA': ['FR'],
            'ESP': ['ES'],
            'ITA': ['IT'],
            'CZE': ['CZ'],
            'SWE': ['SE'],
            'DNK': ['DK'],
            'FIN': ['FI'],
            'AUT': ['AT'],
            'BEL': ['BE'],
            'BGR': ['BG'],
            'HRV': ['HR'],
            'CYP': ['CY'],
            'EST': ['EE'],
            'HUN': ['HU'],
            'IRL': ['IE'],
            'LVA': ['LV'],
            'LTU': ['LT'],
            'LUX': ['LU'],
            'MLT': ['MT'],
            'NLD': ['NL'],
            'POL': ['PL'],
            'PRT': ['PT'],
            'ROU': ['RO'],
            'SVK': ['SK'],
            'SVN': ['SI'],
            'CHE': ['CH'],
            'NOR': ['NO'],
            'ISL': ['IS'],
            'TUR': ['TR'],
            'MKD': ['MK'],
            'UA': ['UKR'],
            'RS': ['SRB'],
            'ME': ['MNE'],
            'AL': ['ALB'],
            'BA': ['BIH'],
            'XK': ['XKX'],
            'RU': ['RUS']
          };
          
          // Mapeo inverso - ISO2 a ISO3
          const codeMapping2to3: Record<string, string> = {
            'EL': 'GRC',
            'UK': 'GBR',
            'GB': 'GBR',
            'DE': 'DEU',
            'FR': 'FRA',
            'ES': 'ESP',
            'IT': 'ITA',
            'CZ': 'CZE',
            'SE': 'SWE',
            'DK': 'DNK',
            'FI': 'FIN',
            'AT': 'AUT',
            'BE': 'BEL',
            'BG': 'BGR',
            'HR': 'HRV',
            'CY': 'CYP',
            'EE': 'EST',
            'HU': 'HUN',
            'IE': 'IRL',
            'LV': 'LVA',
            'LT': 'LTU',
            'LU': 'LUX',
            'MT': 'MLT',
            'NL': 'NLD',
            'PL': 'POL',
            'PT': 'PRT',
            'RO': 'ROU',
            'SK': 'SVK',
            'SI': 'SVN',
            'CH': 'CHE',
            'NO': 'NOR',
            'IS': 'ISL',
            'TR': 'TUR',
            'MK': 'MKD',
            'UA': 'UKR',
            'RS': 'SRB',
            'ME': 'MNE',
            'AL': 'ALB',
            'BA': 'BIH',
            'RU': 'RUS'
          };
          
          // Añadir códigos alternativos desde los mapeos
          if (countryIso3 && countryIso3.length === 3 && codeMapping[countryIso3]) {
            possibleCodes.push(...codeMapping[countryIso3]);
          }
          if (countryIso2 && countryIso2.length === 2) {
            if (codeMapping2to3[countryIso2]) {
              possibleCodes.push(codeMapping2to3[countryIso2]);
            }
          }
          
          // Depurar los códigos alternativos
          console.log(`[Codes Debug] País: ${countryName}, Códigos alternativos: ${possibleCodes.join(', ')}`);
          
          // Comprobar si el código geo coincide con cualquiera de los posibles códigos
          const geoMatch = possibleCodes.some(code => item.geo === code);
          const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
          
          let sectorMatch = false;
          if (selectedSector === 'total' && item.sectperf === 'TOTAL') sectorMatch = true;
          else if (selectedSector === 'business' && item.sectperf === 'BES') sectorMatch = true;
          else if (selectedSector === 'government' && item.sectperf === 'GOV') sectorMatch = true;
          else if (selectedSector === 'education' && item.sectperf === 'HES') sectorMatch = true;
          else if (selectedSector === 'nonprofit' && item.sectperf === 'PNP') sectorMatch = true;
          
          // Depurar si hay un match
          if (geoMatch) {
            console.log(`[Match Debug] Encontrado para ${item.geo}: yearMatch=${yearMatch}, sectorMatch=${sectorMatch}, TIME_PERIOD=${item.TIME_PERIOD}, sectperf=${item.sectperf}, OBS_FLAG=${item.OBS_FLAG}`);
          }
          
          return geoMatch && yearMatch && sectorMatch;
        });
        
        console.log(`[Tooltip Debug] País: ${countryName}, ISO3: ${countryIso3}, geo data: ${countryData?.geo}, OBS_FLAG: ${countryData?.OBS_FLAG}, Objeto completo:`, countryData);
        
        // Obtener la bandera del país
        const flagUrl = getCountryFlagUrl(countryName, feature);
        
        // Verificar si es España o la UE para la visualización del tooltip
        const isSpain = countryIso2 === 'ES' || countryIso3 === 'ESP';
        const isEU = countryIso2 === 'EU' || countryData?.geo === 'EU27_2020';
        
        // Obtener valores para comparativas
        const euValue = !isEU ? getEUValue(data, selectedYear, selectedSector) : null;
        const euAverageValue = euValue !== null ? Math.round(euValue / 27) : null;
        const spainValue = !isSpain ? getSpainValue(data, selectedYear, selectedSector) : null;
        
        // Obtener el valor del año anterior para la comparación YoY - mejorar búsqueda
        let previousYearValue = null;
        
        // Intentar primero con códigos más específicos
        if (value !== null) {
          // Si tenemos datos de countryData, ese es el mejor código a usar
          if (countryData?.geo) {
            previousYearValue = getPreviousYearValue(data, countryData.geo, selectedYear, selectedSector);
          }
          
          // Si no se encontró, intentar con ISO3 e ISO2
          if (previousYearValue === null && countryIso3) {
            previousYearValue = getPreviousYearValue(data, countryIso3, selectedYear, selectedSector);
          }
          
          if (previousYearValue === null && countryIso2) {
            previousYearValue = getPreviousYearValue(data, countryIso2, selectedYear, selectedSector);
          }
          
          // Búsqueda adicional en los datos directamente
          if (previousYearValue === null) {
            // Intentar buscar en los datos del año anterior por el nombre normalizado del país
            const normalizedCountryName = normalizarTexto(countryName);
            console.log(`[YoY Debug] Intentando búsqueda por nombre: ${normalizedCountryName}`);
            
            const prevYearDirectData = data.filter(item => {
              const itemCountry = normalizarTexto(item.geo);
              const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear - 1;
              
              // Verificar si contiene parte del nombre del país
              return itemCountry.includes(normalizedCountryName) && yearMatch;
            });
            
            if (prevYearDirectData.length > 0 && prevYearDirectData[0].OBS_VALUE) {
              previousYearValue = parseFloat(prevYearDirectData[0].OBS_VALUE);
              console.log(`[YoY Debug] Valor encontrado por coincidencia de nombre: ${previousYearValue}`);
            }
          }
        }
        
        console.log(`[Tooltip Debug] Valor actual: ${value}, Valor año anterior: ${previousYearValue}`);
        
        // Preparar HTML para la comparación YoY
        let yoyComparisonHtml = '';
        if (value !== null && previousYearValue !== null && previousYearValue !== 0) {
          const difference = value - previousYearValue;
          const percentDiff = (difference / previousYearValue) * 100;
          const formattedDiff = percentDiff.toFixed(1);
          const isPositive = difference > 0;
          console.log(`[Tooltip Debug] Generando HTML de comparación YoY: diff=${difference}, percentDiff=${percentDiff}%`);
          yoyComparisonHtml = `
            <div class="${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                <path d="${isPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
              </svg>
              <span>${isPositive ? '+' : ''}${formattedDiff}% vs ${selectedYear - 1}</span>
            </div>
          `;
        } else {
          console.log(`[Tooltip Debug] No se puede generar comparación YoY: value=${value}, previousYearValue=${previousYearValue}`);
          yoyComparisonHtml = `<div class="text-gray-400 flex items-center mt-1 text-xs">--</div>`;
        }
        
        // Construir comparaciones HTML
        let comparisonsHtml = '';
        
        // Solo mostrar comparaciones si el país actual tiene datos
        if (value !== null) {
          // Comparación con la UE
          if (!isEU && euAverageValue !== null) {
            const difference = value - euAverageValue;
            const percentDiff = (difference / euAverageValue) * 100;
            const formattedDiff = percentDiff.toFixed(1);
            const isPositive = difference > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                  `vs Media UE (${formatNumberComplete(Math.round(euAverageValue), 0, language)}):` : 
                  `vs Avg UE (${formatNumberComplete(Math.round(euAverageValue), 0, language)}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
              </div>
            `;
          }
          
          // Comparación con España
          if (!isSpain && spainValue !== null) {
            const difference = value - spainValue;
            const percentDiff = (difference / spainValue) * 100;
            const formattedDiff = percentDiff.toFixed(1);
            const isPositive = difference > 0;
            
            comparisonsHtml += `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                  `vs España (${formatNumberComplete(Math.round(spainValue), 0, language)}):` : 
                  `vs Spain (${formatNumberComplete(Math.round(spainValue), 0, language)}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
              </div>
            `;
          }
        }

        let tooltipContent = '';
        
        // Si no hay datos, mostrar un tooltip simple
        if (value === null) {
          tooltipContent = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                  <img src="${flagUrl}" class="w-full h-full object-cover" alt="${countryName}" />
                </div>
                <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
              </div>
              <div class="p-4">
                <p class="text-gray-500">${t.noData}</p>
              </div>
            </div>
          `;
        } else {
          // Seguro que value no es null en este punto
          const safeValue = value; // Asignar a una constante para satisfacer TypeScript
          
          // Construir contenido del tooltip con estilo mejorado y ranking
          tooltipContent = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <!-- Header con el nombre del país -->
              <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                  <img src="${flagUrl}" class="w-full h-full object-cover" alt="${countryName}" />
                </div>
                <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
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
                    <span class="text-xl font-bold text-blue-700">${formatNumberComplete(Math.round(safeValue), 0, language)}</span>
                    ${countryData && countryData.OBS_FLAG ? `<span class="ml-2 text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">${countryData.OBS_FLAG}</span>` : ''}
                  </div>
                  ${yoyComparisonHtml}
                </div>
                
                <!-- Ranking (si está disponible y no es entidad supranacional) -->
                ${rankInfo ? `
                <div class="mb-4">
                  <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                    <span class="font-medium">Rank </span>
                    <span class="font-bold text-lg mx-1">${rankInfo.rank}</span>
                    <span class="text-gray-600">${language === 'es' ? `de ${rankInfo.total}` : `of ${rankInfo.total}`}</span>
                  </div>
                </div>
                ` : ''}
                
                <!-- Si hay comparaciones, mostrarlas -->
                ${comparisonsHtml ? `
                <div class="space-y-2 border-t border-gray-100 pt-3">
                  <div class="text-xs text-gray-500 mb-1">${language === 'es' ? 'Comparativa' : 'Comparative'}</div>
                  ${comparisonsHtml}
                </div>
                ` : ''}
              </div>
              
              <!-- Footer con información de la bandera de observación -->
              ${countryData && countryData.OBS_FLAG && getLabelDescription(countryData.OBS_FLAG, language) ? `
                <div class="bg-gray-50 px-3 py-2 flex items-center text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                  <span>${countryData.OBS_FLAG} - ${getLabelDescription(countryData.OBS_FLAG, language)}</span>
                </div>
              ` : ''}
            </div>
          `;
        }
        
        // Mostrar tooltip
        const tooltip = d3.select(tooltipRef.current!);
        tooltip
          .style('display', 'block')
          .html(tooltipContent)
          .classed('visible', true);
        
        // Posicionar tooltip con animación - usar setTimeout para asegurar que el DOM se ha actualizado
        setTimeout(() => {
          if (tooltipRef.current) {
            positionTooltip(tooltip, event, tooltipRef.current);
          }
        }, 10);
      };
      
              const handleMouseMove = (event: MouseEvent) => {
          // Solo actualizar la posición si el tooltip es visible
          const tooltip = d3.select(tooltipRef.current!);
          if (tooltip.style('display') !== 'none' && tooltipRef.current) {
            // Usar setTimeout para recalcular posición después de que el DOM se actualice
            setTimeout(() => {
              if (tooltipRef.current) {
                positionTooltip(tooltip, event, tooltipRef.current);
              }
            }, 0);
          }
        };
      
      const handleMouseOut = (event: MouseEvent) => {
        // Restaurar estilo original
        d3.select(event.currentTarget as SVGPathElement)
          .attr('stroke-width', '0.5')
          .attr('stroke', '#fff');
        
        // Fade out tooltip
        const tooltip = d3.select(tooltipRef.current!);
        tooltip.classed('visible', false);
        
        // Ocultar después de la transición
        setTimeout(() => {
          if (!tooltip.classed('visible')) {
            tooltip.style('display', 'none');
          }
        }, 150);
      };
      
      const handleClick = (event: MouseEvent, feature: GeoJsonFeature) => {
        if (onClick) {
          const countryName = getCountryName(feature);
          onClick(countryName);
        }
      };
      
      // Dibujar países
      svg.selectAll<SVGPathElement, GeoJsonFeature>('path')
        .data(europeanMapData!.features)
        .enter()
        .append('path')
        .attr('d', feature => pathGenerator(feature) || '')
        .attr('fill', feature => {
          const value = getCountryValue(feature, data, selectedYear, selectedSector);
          return getColorForValue(value, selectedSector, data, selectedYear);
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event: MouseEvent, d: GeoJsonFeature) {
          handleMouseOver(event, d);
        })
        .on('mousemove', function(event: MouseEvent) {
          handleMouseMove(event);
        })
        .on('mouseout', function(event: MouseEvent) {
          handleMouseOut(event);
        })
        .on('click', function(event: MouseEvent, d: GeoJsonFeature) {
          handleClick(event, d);
        })
        .style('cursor', onClick ? 'pointer' : 'default');
      
      // Añadir leyenda
      createLegend();
    };
    
    renderMap();
  }, [europeanMapData, data, selectedYear, selectedSector, language, valueRange]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {getMapTitle()} · {selectedYear}
        </h3>
        <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
             style={{ backgroundColor: `${d3.color(getSectorColor())?.copy({ opacity: 0.15 })}` }}>
          {getSectorText()}
        </div>
      </div>
      
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">{t.loading}</p>
          </div>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center text-red-500">{error}</div>
        </div>
      ) : (
        <>
          <svg 
            ref={svgRef} 
            className="w-full h-full min-h-[450px]" 
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid meet"
          />
                <div 
        ref={tooltipRef}
        className="country-tooltip"
        style={{
          display: 'none',
          maxWidth: '350px',
          transformOrigin: 'top left'
        }}
          />
        </>
      )}
    </div>
  );
};

export default ResearchersEuropeanMap; 