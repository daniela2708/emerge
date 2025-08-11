import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Feature, Geometry } from 'geojson';
// Importando datos de country_flags.json
import countryFlagsData from '../logos/country_flags.json';
// Importar las funciones de mapeo de países
import { getIso3FromCountryName, isSupranationalEntity as isSupranationalFromMapping } from '../utils/countryMapping';
import { EUROPEAN_COUNTRY_CODES } from '../utils/europeanCountries';
// Importar el tipo CooperationPartnerType
import { CooperationPartnerType } from '../pages/Patents/index';

// Versión simplificada del componente

// Tipo para el modo de visualización de patentes
export type PatentsDisplayType = 'number' | 'per_million_inhabitants';

// Interfaz para los elementos del archivo country_flags.json
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
}

// Aseguramos el tipo correcto para el array de flags
const countryFlags = countryFlagsData as CountryFlag[];

// Definir la interfaz para los datos del nuevo CSV (patentes_europa.csv)
interface PatentsData {
  STRUCTURE: string;
  STRUCTURE_ID: string;
  STRUCTURE_NAME: string;
  freq: string;
  'Time frequency': string;
  coop_ptn: string;
  'Cooperation partners': string;
  unit: string;
  'Unit of measure': string;
  geo: string;       // Código del país (AL, AT, BE, etc.)
  'Geopolitical entity (reporting)': string;
  TIME_PERIOD: string; // Año
  Time: string;
  OBS_VALUE: string;   // Número de patentes
  'Observation value': string;
  OBS_FLAG?: string;   // Flag de observación (ej: 'p' para provisional)
  'Observation status (Flag) V2 structure'?: string;
  CONF_STATUS?: string;
  'Confidentiality status (flag)'?: string;
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

interface PatentsEuropeanMapProps {
  data: PatentsData[];
  selectedYear: number;
  language: 'es' | 'en';
  onClick?: (country: string) => void;
  patsDisplayType?: PatentsDisplayType;
  cooperationPartner?: CooperationPartnerType;
}

// URL del archivo GeoJSON de Europa
const EUROPE_GEOJSON_URL = '/data/geo/europe.geojson';

// Función para normalizar texto (remover acentos y caracteres especiales)
function normalizarTexto(texto: string | undefined): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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

// Función para verificar si una entidad es UE o zona euro (no un país)
function isSupranationalEntity(name: string | undefined): boolean {
  if (!name) return false;
  
  // Verificación directa por códigos conocidos de entidades supranacionales
  const supranationalCodes = ['EU27_2020', 'EA19', 'EA20', 'EU', 'EA'];
  if (supranationalCodes.includes(name)) {
    return true;
  }
  
  return isSupranationalFromMapping(name);
}



// Función para obtener el valor de la UE
function getEUValue(data: PatentsData[], year: number, patsDisplayType: PatentsDisplayType = 'number', cooperationPartner: CooperationPartnerType = 'APPL'): number | null {
  if (!data || data.length === 0) return null;
  
  const targetUnit = patsDisplayType === 'number' ? 'NR' : 'P_MHAB';
  
  // Buscar datos de la UE/Europa
  const euRecords = data.filter(record => {
    const matchesYear = parseInt(record.TIME_PERIOD) === year;
    const matchesAppl = record.coop_ptn === cooperationPartner;
    const matchesUnit = record.unit === targetUnit;
    const isEU = record.geo === 'EU27_2020' || record.geo === 'EU' || record.geo === 'EU28';
    
    return matchesYear && matchesAppl && matchesUnit && isEU;
  });
  
  if (euRecords.length === 0) return null;
  
  const value = parseFloat(euRecords[0].OBS_VALUE);
  return isNaN(value) ? null : value;
}

// Función para obtener el valor para España
function getSpainValue(data: PatentsData[], year: number, patsDisplayType: PatentsDisplayType = 'number', cooperationPartner: CooperationPartnerType = 'APPL'): number | null {
  if (!data || data.length === 0) return null;
  
  const targetUnit = patsDisplayType === 'number' ? 'NR' : 'P_MHAB';
  
  // Buscar datos de España
  const spainRecords = data.filter(record => {
    const matchesYear = parseInt(record.TIME_PERIOD) === year;
    const matchesAppl = record.coop_ptn === cooperationPartner;
    const matchesUnit = record.unit === targetUnit;
    const isSpain = record.geo === 'ES';
    
    return matchesYear && matchesAppl && matchesUnit && isSpain;
  });
  
  if (spainRecords.length === 0) return null;
  
  const value = parseFloat(spainRecords[0].OBS_VALUE);
  return isNaN(value) ? null : value;
}

// Función para obtener el valor del año anterior
function getPreviousYearValue(
  data: PatentsData[],
  countryCode: string | undefined,
  year: number,
  patsDisplayType: PatentsDisplayType = 'number',
  cooperationPartner: CooperationPartnerType = 'APPL'
): number | null {
  if (!data || data.length === 0 || !countryCode) return null;
  
  const targetUnit = patsDisplayType === 'number' ? 'NR' : 'P_MHAB';
  const previousYear = year - 1;
  
  // Buscar datos del año anterior
  const previousYearRecords = data.filter(record => {
    const matchesYear = parseInt(record.TIME_PERIOD) === previousYear;
    const matchesAppl = record.coop_ptn === cooperationPartner;
    const matchesUnit = record.unit === targetUnit;
    const matchesCountry = record.geo === countryCode;
    
    return matchesYear && matchesAppl && matchesUnit && matchesCountry;
  });
  
  if (previousYearRecords.length === 0) return null;
  
  const value = parseFloat(previousYearRecords[0].OBS_VALUE);
  return isNaN(value) ? null : value;
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


// Mapeo de códigos de país a nombres en español e inglés
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
  // Países de los Balcanes y Europa del Este
  'AL': {es: 'Albania', en: 'Albania'},
  'BA': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
  'ME': {es: 'Montenegro', en: 'Montenegro'},
  'MK': {es: 'Macedonia del Norte', en: 'North Macedonia'},
  'RS': {es: 'Serbia', en: 'Serbia'},
  'XK': {es: 'Kosovo', en: 'Kosovo'},
  'MD': {es: 'Moldavia', en: 'Moldova'},
  'UA': {es: 'Ucrania', en: 'Ukraine'},
  'BY': {es: 'Bielorrusia', en: 'Belarus'},
  'RU': {es: 'Rusia', en: 'Russia'},
  // Países nórdicos y otros
  'FO': {es: 'Islas Feroe', en: 'Faroe Islands'},
  'GL': {es: 'Groenlandia', en: 'Greenland'},
  // Microstados europeos
  'AD': {es: 'Andorra', en: 'Andorra'},
  'LI': {es: 'Liechtenstein', en: 'Liechtenstein'},
  'MC': {es: 'Mónaco', en: 'Monaco'},
  'SM': {es: 'San Marino', en: 'San Marino'},
  'VA': {es: 'Ciudad del Vaticano', en: 'Vatican City'},
  // Otros países fuera de Europa que pueden aparecer
  'US': {es: 'Estados Unidos', en: 'United States'},
  'CA': {es: 'Canadá', en: 'Canada'},
  'JP': {es: 'Japón', en: 'Japan'},
  'KR': {es: 'Corea del Sur', en: 'South Korea'},
  'CN': {es: 'China', en: 'China'},
  'IN': {es: 'India', en: 'India'},
  'AU': {es: 'Australia', en: 'Australia'},
  'NZ': {es: 'Nueva Zelanda', en: 'New Zealand'},
  'IL': {es: 'Israel', en: 'Israel'},
  'SG': {es: 'Singapur', en: 'Singapore'},
  'TW': {es: 'Taiwán', en: 'Taiwan'},
  'HK': {es: 'Hong Kong', en: 'Hong Kong'},
  'BR': {es: 'Brasil', en: 'Brazil'},
  'MX': {es: 'México', en: 'Mexico'},
  'AR': {es: 'Argentina', en: 'Argentina'},
  'CL': {es: 'Chile', en: 'Chile'},
  'ZA': {es: 'Sudáfrica', en: 'South Africa'},
  // Códigos antiguos para compatibilidad
  'MKD': {es: 'Macedonia del Norte', en: 'North Macedonia'},
  'SRB': {es: 'Serbia', en: 'Serbia'},
  'MNE': {es: 'Montenegro', en: 'Montenegro'},
  'BIH': {es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina'},
  'MDA': {es: 'Moldavia', en: 'Moldova'},
  'UKR': {es: 'Ucrania', en: 'Ukraine'},
  'XKX': {es: 'Kosovo', en: 'Kosovo'},
  'RUS': {es: 'Rusia', en: 'Russia'},
  'CN_X_HK': {es: 'China (exc. Hong Kong)', en: 'China (exc. Hong Kong)'}
};



// Variables simplificadas eliminadas para esta versión básica

// Definir colores específicos para los componentes de patentes - Paleta neutral profesional
const PATENTS_SECTOR_COLORS = {
  total: '#37474F',        // Gris azulado oscuro para el total (neutral y profesional)
  business: '#FF7043',     // Naranja coral para empresas (innovación corporativa)
  government: '#5E35B1',   // Púrpura profundo para gobierno (autoridad institucional)
  education: '#1E88E5',    // Azul vibrante para educación (conocimiento y academia)
  nonprofit: '#8D6E63'     // Marrón medio para organizaciones sin fines de lucro (estabilidad social)
};

// Textos localizados para el mapa
const mapTexts = {
  es: {
    title: "Patentes por país",
    loading: "Cargando mapa...",
    error: "Error al cargar el mapa de Europa",
    noData: "Sin datos",
    researchers: "Patentes",
    fullTimeEquivalent: "ETC (Equivalente Tiempo Completo)",
          sector_business: "Sector empresarial",
      sector_government: "Administración Pública",
      sector_education: "Enseñanza Superior",
      sector_nonprofit: "Instituciones Privadas sin Fines de Lucro",
    sector_total: "Todos los sectores",
    researchersByCountry: "Patentes por país"
  },
  en: {
    title: "Patents by Country",
    loading: "Loading map...",
    error: "Error loading Europe map",
    noData: "No data",
    researchers: "Patents",
    fullTimeEquivalent: "FTE (Full-Time Equivalent)",
          sector_business: "Business enterprise sector",
      sector_government: "Government sector",
      sector_education: "Higher education sector",
      sector_nonprofit: "Private non-profit sector",
    sector_total: "All sectors",
    researchersByCountry: "Patents by Country"
  }
};

// Funciones auxiliares simplificadas (no utilizadas en esta versión básica)

// Función para mostrar números exactamente como aparecen en el dataset
function formatPatentsValueAsInDataset(value: number, patsDisplayType: PatentsDisplayType = 'number'): string {
  if (patsDisplayType === 'number') {
    return Math.round(value).toString();
  } else {
    return value.toFixed(1);
  }
}

function getPatentsDisplayUnit(patsDisplayType: PatentsDisplayType = 'number', language: 'es' | 'en' = 'es'): string {
  if (patsDisplayType === 'number') {
    return language === 'es' ? 'patentes' : 'patents';
  } else {
    return language === 'es' ? 'por millón hab.' : 'per million inhab.';
  }
}

const PatentsEuropeanMap: React.FC<PatentsEuropeanMapProps> = ({ 
  data, 
  selectedYear, 
  language,
  patsDisplayType,
  cooperationPartner
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<GeoJsonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = mapTexts[language];

  // Diagnóstico inicial para ver la estructura de datos
  useEffect(() => {
    if (data && data.length > 0) {
      console.log("[Patents Map Data Debug] Estructura de datos total:", data.length, "registros");
      console.log("[Patents Map Data Debug] Ejemplo de estructura de datos:", data[0]);
      console.log("[Patents Map Data Debug] Campos disponibles:", Object.keys(data[0]));
      
      // Verificar si tenemos coop_ptn o sectperf
      const hasCoop = data.some(item => item.coop_ptn !== undefined);
      const hasSectperf = data.some(item => item.sectperf !== undefined);
      console.log("[Patents Map Data Debug] ¿Datos tienen coop_ptn?", hasCoop);
      console.log("[Patents Map Data Debug] ¿Datos tienen sectperf?", hasSectperf);
      
      // Verificar años disponibles
      
      // Verificar años disponibles
      const availableYears = Array.from(new Set(data.map(item => item.TIME_PERIOD))).sort();
      console.log("[Patents Map Data Debug] Años disponibles:", availableYears);
      
      // Verificar países disponibles
      const availableCountries = Array.from(new Set(data.map(item => item.geo))).sort();
      console.log("[Patents Map Data Debug] Países disponibles:", availableCountries.slice(0, 10), "... (primeros 10)");
      
      // Filtrar datos para el año actual
      const currentData = data.filter(item => 
        parseInt(item.TIME_PERIOD) === selectedYear
      );
      console.log("[Patents Map Data Debug] Datos para año actual", selectedYear, ":", currentData.length, "registros");
      
      if (currentData.length > 0) {
        console.log("[Patents Map Data Debug] Ejemplos de datos actuales:", currentData.slice(0, 5));
      } else {
        console.warn("[Patents Map Data Debug] ⚠️  NO HAY DATOS para el año", selectedYear);
        
        // Buscar cuál es el año más reciente disponible
        const allYears = Array.from(new Set(data.map(item => parseInt(item.TIME_PERIOD)))).sort((a, b) => b - a);
        console.log("[Patents Map Data Debug] Años disponibles en orden:", allYears);
        
        if (allYears.length > 0) {
          const latestYear = allYears[0];
          const latestYearData = data.filter(item => 
            parseInt(item.TIME_PERIOD) === latestYear
          );
          console.log("[Patents Map Data Debug] Datos para el año más reciente", latestYear, ":", latestYearData.length, "registros");
        }
      }
    } else {
      console.log("[Patents Map Data Debug] No hay datos disponibles");
    }
  }, [data, selectedYear]);

  // Obtener título del mapa
  const getMapTitle = (): string => {
    return t.researchersByCountry;
  };
  
  // Obtener texto del sector - Ahora siempre retorna "Total"
  const getSectorText = (): string => {
    return t.sector_total;
  };
  
  // Obtener color del sector para el título - Ahora siempre usa el color total
  const getSectorColor = (): string => {
    const baseColor = PATENTS_SECTOR_COLORS.total;
    return d3.color(baseColor)?.darker(0.8)?.toString() || '#333333';
  };

  // Cargar datos GeoJSON
  useEffect(() => {
    const fetchMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(EUROPE_GEOJSON_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const geoJsonData = await response.json();
        setGeoData(geoJsonData);
      } catch (err) {
        console.error('Error loading map:', err);
        setError(t.error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMap();
  }, [t.error]);

  // Función para obtener el valor de un país desde los datos
  const getCountryValue = (feature: GeoJsonFeature): number | null => {
    if (!data || data.length === 0) return null;
    
    // Obtener códigos del país desde el feature
    const props = feature.properties || {};
    const countryName = (props.NAME || props.NAME_EN || props.ADMIN || props.CNTRY_NAME || '') as string;
    
    // Intentar múltiples formas de obtener ISO codes
    const iso3 = props.iso_a3 || props.ISO3 || props.ADM0_A3 || props.ISO_A3 || props.adm0_a3;
    const iso2 = props.iso_a2 || props.ISO2 || props.ISO_A2 || props.adm0_a2;
    
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
      'SRB': ['RS'],
      'MNE': ['ME'],
      'ALB': ['AL'],
      'BIH': ['BA'],
      'XKX': ['XK']
    };
    
    // Lista de posibles códigos a buscar
    const possibleCodes = [iso3, iso2].filter(code => code && code !== 'undefined');
    
    // Añadir códigos alternativos del mapeo
    if (iso3 && iso3 in codeMapping) {
      possibleCodes.push(...codeMapping[iso3]);
    }
    
    // Mapeo directo por nombre de país cuando no tenemos códigos ISO
    const countryNameMapping: Record<string, string[]> = {
      'Spain': ['ES', 'ESP'],
      'France': ['FR', 'FRA'],
      'Germany': ['DE', 'DEU'],
      'Italy': ['IT', 'ITA'],
      'United Kingdom': ['UK', 'GBR'],
      'Great Britain': ['UK', 'GBR'],
      'Poland': ['PL', 'POL'],
      'Netherlands': ['NL', 'NLD'],
      'Belgium': ['BE', 'BEL'],
      'Portugal': ['PT', 'PRT'],
      'Greece': ['EL', 'GRC'],
      'Sweden': ['SE', 'SWE'],
      'Austria': ['AT', 'AUT'],
      'Switzerland': ['CH', 'CHE'],
      'Norway': ['NO', 'NOR'],
      'Denmark': ['DK', 'DNK'],
      'Finland': ['FI', 'FIN'],
      'Ireland': ['IE', 'IRL'],
      'Iceland': ['IS', 'ISL'],
      'Czech Republic': ['CZ', 'CZE'],
      'Czechia': ['CZ', 'CZE'],
      'Hungary': ['HU', 'HUN'],
      'Slovakia': ['SK', 'SVK'],
      'Slovenia': ['SI', 'SVN'],
      'Estonia': ['EE', 'EST'],
      'Latvia': ['LV', 'LVA'],
      'Lithuania': ['LT', 'LTU'],
      'Luxembourg': ['LU', 'LUX'],
      'Malta': ['MT', 'MLT'],
      'Cyprus': ['CY', 'CYP'],
      'Croatia': ['HR', 'HRV'],
      'Bulgaria': ['BG', 'BGR'],
      'Romania': ['RO', 'ROU'],
      'Turkey': ['TR', 'TUR'],
      'Türkiye': ['TR', 'TUR'],
      'Serbia': ['RS', 'SRB'],
      'Ukraine': ['UA', 'UKR'],
      'Russia': ['RU', 'RUS'],
      'Russian Federation': ['RU', 'RUS'],
      'Republic of Moldova': ['MD', 'MDA'],
      'Moldova': ['MD', 'MDA'],
      'North Macedonia': ['MK', 'MKD'],
      'Macedonia': ['MK', 'MKD'],
      'Montenegro': ['ME', 'MNE'],
      'Albania': ['AL', 'ALB'],
      'Bosnia and Herzegovina': ['BA', 'BIH'],
      'Bosnia & Herzegovina': ['BA', 'BIH'],
      'Kosovo': ['XK', 'XKX'],
      'Belarus': ['BY', 'BLR'],
      'Liechtenstein': ['LI', 'LIE'],
      'Monaco': ['MC', 'MCO'],
      'San Marino': ['SM', 'SMR'],
      'Vatican': ['VA', 'VAT'],
      'Andorra': ['AD', 'AND']
    };
    
    // Si no tenemos códigos ISO, buscar por nombre
    if (possibleCodes.length === 0 && countryName && countryNameMapping[countryName]) {
      possibleCodes.push(...countryNameMapping[countryName]);
    }
    
    // Buscar los datos para cualquiera de los posibles códigos
    const countryData = data.find(item => {
      const geoMatch = possibleCodes.some(code => item.geo === code);
      const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
      const targetCooperation = cooperationPartner || 'APPL';
      const cooperationMatch = item.coop_ptn === targetCooperation;
      const targetUnit = (patsDisplayType || 'number') === 'number' ? 'NR' : 'P_MHAB';
      const unitMatch = item.unit === targetUnit;
      
      return geoMatch && yearMatch && cooperationMatch && unitMatch;
    });
    
    if (countryData && countryData.OBS_VALUE) {
      const value = parseFloat(countryData.OBS_VALUE);
      return value;
    }
    
    return null;
  };

  // Función para obtener el color según el valor
  const getColorForValue = (value: number | null): string => {
    console.log(`[Patents Map Debug] Calculando color para valor: ${value}`);
    
    if (value === null) {
      console.log(`[Patents Map Debug] Valor null, retornando gris claro`);
      return '#f5f5f5'; // Gris claro para valores nulos
    }
    if (value === 0) {
      console.log(`[Patents Map Debug] Valor 0, retornando naranja`);
      return '#ff9800'; // Naranja para valores cero
    }
    
    // Obtener todos los valores para calcular rangos
    const allValues: number[] = [];
    if (geoData) {
      geoData.features.forEach(feature => {
        const val = getCountryValue(feature);
        if (val !== null && val > 0) {
          allValues.push(val);
        }
      });
    }
    
    console.log(`[Patents Map Debug] Valores para cálculo de rangos: ${allValues.length} países con datos`);
    
    if (allValues.length === 0) {
      console.log(`[Patents Map Debug] No hay valores para calcular rangos, retornando gris`);
      return '#e0e0e0';
    }
    
    // Ordenar valores para calcular cuartiles
    allValues.sort((a, b) => a - b);
    
    // Calcular cuartiles
    const q1 = allValues[Math.floor(allValues.length * 0.25)];
    const q2 = allValues[Math.floor(allValues.length * 0.5)];
    const q3 = allValues[Math.floor(allValues.length * 0.75)];
    
    console.log(`[Patents Map Debug] Cuartiles calculados: Q1=${q1}, Q2=${q2}, Q3=${q3}`);
    console.log(`[Patents Map Debug] Rango de valores: ${allValues[0]} - ${allValues[allValues.length - 1]}`);
    
    // Obtener color base del sector - Ahora siempre usa el color total
    const baseColor = PATENTS_SECTOR_COLORS.total;
    console.log(`[Patents Map Debug] Color base (total): ${baseColor}`);
    
    // Asignar colores basados en cuartiles
    let finalColor = '';
    if (value <= q1) {
      finalColor = d3.color(baseColor)?.brighter(1.5)?.toString() || '#e0e0e0';
      console.log(`[Patents Map Debug] Valor ${value} <= Q1, color: ${finalColor}`);
    } else if (value <= q2) {
      finalColor = d3.color(baseColor)?.brighter(0.8)?.toString() || '#d0d0d0';
      console.log(`[Patents Map Debug] Valor ${value} <= Q2, color: ${finalColor}`);
    } else if (value <= q3) {
      finalColor = baseColor;
      console.log(`[Patents Map Debug] Valor ${value} <= Q3, color: ${finalColor}`);
    } else {
      finalColor = d3.color(baseColor)?.darker(0.8)?.toString() || '#606060';
      console.log(`[Patents Map Debug] Valor ${value} > Q3, color: ${finalColor}`);
    }
    
    return finalColor;
  };

  // Función auxiliar para validar si un país tiene datos disponibles
  const validateCountryData = (feature: GeoJsonFeature): boolean => {
    const countryName = getCountryName(feature);
    const countryIso3 = getCountryIso3(feature);
    const countryIso2 = feature.properties?.iso_a2 as string;
    
    // Verificar si es una entidad supranacional (siempre válida para mostrar)
    if (isSupranationalEntity(countryName)) {
      return true;
    }
    
    // Verificar si está en la lista de países europeos
    const europeanCountryCodes = EUROPEAN_COUNTRY_CODES;
    const isEuropean = (countryIso2 && europeanCountryCodes.includes(countryIso2)) || 
                      (countryIso3 && europeanCountryCodes.includes(countryIso3));
    
    if (!isEuropean) {
      console.log(`[Tooltip Validation] País ${countryName} no es europeo, omitiendo tooltip`);
      return false;
    }
    
    // Verificar si tiene códigos válidos para búsqueda de datos
    const codeMapping = getCountryCodeMapping();
    const possibleCodes = [countryIso3, countryIso2];
    
    // Añadir códigos alternativos
    if (countryIso3 && codeMapping[countryIso3]) {
      possibleCodes.push(codeMapping[countryIso3]);
    }
    
    // Mapeo de nombres como fallback
    const countryNameMapping: Record<string, string[]> = {
      'Iceland': ['IS', 'ISL'],
      'Great Britain': ['UK', 'GBR'],
      'United Kingdom': ['UK', 'GBR'],
      'Czechia': ['CZ', 'CZE'],
      'Czech Republic': ['CZ', 'CZE'],
      'Türkiye': ['TR', 'TUR'],
      'Turkey': ['TR', 'TUR'],
      'North Macedonia': ['MK', 'MKD'],
      'Macedonia': ['MK', 'MKD'],
      'Bosnia and Herzegovina': ['BA', 'BIH'],
      'Bosnia & Herzegovina': ['BA', 'BIH']
    };
    
    if (possibleCodes.length === 0 && countryName && countryNameMapping[countryName]) {
      possibleCodes.push(...countryNameMapping[countryName]);
    }
    
    if (possibleCodes.filter(code => code && code !== 'undefined').length === 0) {
      console.log(`[Tooltip Validation] No se encontraron códigos válidos para ${countryName}`);
      return false;
    }
    
    return true;
  };

  // Función auxiliar para obtener el mapeo de códigos de países
  const getCountryCodeMapping = (): Record<string, string> => ({
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
    'XKX': 'XK',
    'BLR': 'BY',
    'LIE': 'LI',
    'MCO': 'MC',
    'SMR': 'SM',
    'VAT': 'VA',
    'AND': 'AD'
  });

  // Referencias para el tooltip
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Añadir estilos CSS para el tooltip
  useEffect(() => {
    // Crear un elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = 'tooltip-patents-map-styles';
    
    // Definir estilos CSS para el tooltip usando el mismo formato que ResearchersEuropeanMap
    styleElement.textContent = `
      .patents-country-tooltip {
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
      .patents-country-tooltip.visible {
        opacity: 1 !important;
        transform: scale(1);
      }
      .patents-country-tooltip .text-green-600 { color: #059669; }
      .patents-country-tooltip .text-red-600 { color: #DC2626; }
      .patents-country-tooltip .text-orange-700 { color: #C2410C; }
      .patents-country-tooltip .bg-orange-50 { background-color: #FFF7ED; }
      .patents-country-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
      .patents-country-tooltip .bg-gray-50 { background-color: #F9FAFB; }
      .patents-country-tooltip .border-orange-100 { border-color: #FFEDD5; }
      .patents-country-tooltip .border-gray-100 { border-color: #F3F4F6; }
      .patents-country-tooltip .text-gray-500 { color: #6B7280; }
      .patents-country-tooltip .text-gray-800 { color: #1F2937; }
      .patents-country-tooltip .text-gray-600 { color: #4B5563; }
      .patents-country-tooltip .text-gray-400 { color: #9CA3AF; }
      .patents-country-tooltip .text-yellow-500 { color: #F59E0B; }
      .patents-country-tooltip .rounded-lg { border-radius: 0.5rem; }
      .patents-country-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
      .patents-country-tooltip .p-3 { padding: 0.75rem; }
      .patents-country-tooltip .p-4 { padding: 1rem; }
      .patents-country-tooltip .p-2 { padding: 0.5rem; }
      .patents-country-tooltip .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
      .patents-country-tooltip .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .patents-country-tooltip .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
      .patents-country-tooltip .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
      .patents-country-tooltip .pt-3 { padding-top: 0.75rem; }
      .patents-country-tooltip .mb-3 { margin-bottom: 0.75rem; }
      .patents-country-tooltip .mb-1 { margin-bottom: 0.25rem; }
      .patents-country-tooltip .mb-4 { margin-bottom: 1rem; }
      .patents-country-tooltip .mr-1 { margin-right: 0.25rem; }
      .patents-country-tooltip .mr-2 { margin-right: 0.5rem; }
      .patents-country-tooltip .ml-2 { margin-left: 0.5rem; }
      .patents-country-tooltip .mt-1 { margin-top: 0.25rem; }
      .patents-country-tooltip .mt-3 { margin-top: 0.75rem; }
      .patents-country-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
      .patents-country-tooltip .text-xs { font-size: 0.75rem; }
      .patents-country-tooltip .text-sm { font-size: 0.875rem; }
      .patents-country-tooltip .text-lg { font-size: 1.125rem; }
      .patents-country-tooltip .text-xl { font-size: 1.25rem; }
      .patents-country-tooltip .font-bold { font-weight: 700; }
      .patents-country-tooltip .font-medium { font-weight: 500; }
      .patents-country-tooltip .flex { display: flex; }
      .patents-country-tooltip .items-center { align-items: center; }
      .patents-country-tooltip .justify-between { justify-content: space-between; }
      .patents-country-tooltip .w-8 { width: 2rem; }
      .patents-country-tooltip .h-6 { height: 1.5rem; }
      .patents-country-tooltip .w-36 { width: 9rem; }
      .patents-country-tooltip .w-44 { width: 11rem; }
      .patents-country-tooltip .w-48 { width: 12rem; }
      .patents-country-tooltip .rounded { border-radius: 0.25rem; }
      .patents-country-tooltip .rounded-md { border-radius: 0.375rem; }
      .patents-country-tooltip .overflow-hidden { overflow: hidden; }
      .patents-country-tooltip .border-t { border-top-width: 1px; }
      .patents-country-tooltip .border-b { border-bottom-width: 1px; }
      .patents-country-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
      .patents-country-tooltip .space-y-1 > * + * { margin-top: 0.25rem; }
      .patents-country-tooltip .max-w-xs { max-width: 20rem; }
      .patents-country-tooltip .w-full { width: 100%; }
      .patents-country-tooltip .h-full { height: 100%; }
      .patents-country-tooltip img { max-width: 100%; height: 100%; object-fit: cover; }
      .patents-country-tooltip .relative { position: relative; }
      .patents-country-tooltip .inline-block { display: inline-block; }
    `;
    
    // Añadir al head
    document.head.appendChild(styleElement);
    
    // Eliminar cuando se desmonte el componente
    return () => {
      const existingStyle = document.getElementById('tooltip-patents-map-styles');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);

  // Renderizar el mapa
  useEffect(() => {
    console.log("[Patents Map Render Debug] Iniciando renderizado del mapa");
    console.log("[Patents Map Render Debug] geoData disponible:", !!geoData);
    console.log("[Patents Map Render Debug] svgRef disponible:", !!svgRef.current);
    console.log("[Patents Map Render Debug] Datos disponibles:", data?.length || 0, "registros");
    
    if (!geoData || !svgRef.current) {
      console.log("[Patents Map Render Debug] No se puede renderizar - faltan datos GeoJSON o referencia SVG");
      return;
    }

    const renderMap = () => {
      console.log("[Patents Map Render Debug] Iniciando función renderMap");
      
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const width = 1000;
      const height = 700;

      // Configurar proyección centrando automáticamente el mapa en el contenedor
      const projection = d3
        .geoMercator()
        .fitSize([width, height], geoData as any);

      const path = d3.geoPath().projection(projection);

      console.log("[Patents Map Render Debug] Proyección configurada");
      console.log("[Patents Map Render Debug] Número de países en GeoJSON:", geoData.features.length);

      // Función para posicionar tooltip - Optimizada para móvil
      const positionTooltip = (tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>, event: MouseEvent, tooltipNode: HTMLElement) => {
        const tooltipRect = tooltipNode.getBoundingClientRect();
        const tooltipWidth = tooltipRect.width || 320;
        const tooltipHeight = tooltipRect.height || 280;
        
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
          
          if (left + tooltipWidth > windowWidth - 10) {
            left = event.clientX - tooltipWidth - 15;
          }
          
          if (top + tooltipHeight > windowHeight - 10) {
            if (tooltipHeight < windowHeight - 20) {
              top = windowHeight - tooltipHeight - 10;
            } else {
              top = 10;
            }
          }
          
          if (top < 10) top = 10;
          if (left < 10) left = 10;
        }
        
        tooltip
          .style('left', `${left}px`)
          .style('top', `${top}px`);
      };

      // Función para obtener bandera del país
      const getCountryFlagUrl = (countryName: string, feature?: GeoJsonFeature): string => {
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
      };

      // Función para obtener nombre localizado del país usando el mapeo global
      const getLocalizedCountryName = (countryCode: string): string => {
        // Primero buscar directamente en el mapeo
        if (countryCode in countryCodeMapping) {
          return countryCodeMapping[countryCode][language];
        }
        
        // Si es ISO3, convertir a ISO2 y buscar
        const codeMapping = getCountryCodeMapping();
        if (countryCode.length === 3 && countryCode in codeMapping) {
          const iso2Code = codeMapping[countryCode];
          if (iso2Code in countryCodeMapping) {
            return countryCodeMapping[iso2Code][language];
          }
        }
        
        // Buscar en las banderas
        const flagInfo = countryFlags.find(flag => flag.code === countryCode || flag.iso3 === countryCode);
        if (flagInfo) {
          return flagInfo.country;
        }
        
        return countryCode;
      };

      // Función para obtener el ranking de un país
      const getCountryRank = (feature: GeoJsonFeature, countryValuesMap: Map<string, number>): { rank: number, total: number } | null => {
        const countryName = getCountryName(feature);
        const countryIso3 = getCountryIso3(feature);
        const countryIso2 = feature.properties?.iso_a2 as string;
        
        if (isSupranationalEntity(countryName)) {
          return null;
        }
        
        const codeMapping = getCountryCodeMapping();
        
        const possibleCodes = [countryIso2, countryIso3];
        if (countryIso3 && codeMapping[countryIso3]) {
          possibleCodes.push(codeMapping[countryIso3]);
        }
        
        // Debug específico para Islandia
        if (countryName.toLowerCase().includes('iceland') || possibleCodes.includes('IS') || possibleCodes.includes('ISL')) {
          console.log(`[Rank Function Debug] Calculando ranking para Islandia`);
          console.log(`[Rank Function Debug] possibleCodes: ${possibleCodes.join(', ')}`);
          console.log(`[Rank Function Debug] countryValuesMap keys: ${Array.from(countryValuesMap.keys()).slice(0, 10).join(', ')}...`);
        }
        
        let currentValue: number | null = null;
        let matchedCode: string | null = null;
        
        for (const code of possibleCodes) {
          if (code && countryValuesMap.has(code)) {
            currentValue = countryValuesMap.get(code)!;
            matchedCode = code;
            console.log(`[Rank Function Debug] Match encontrado para código ${code}: valor ${currentValue}`);
            break;
          } else if (code) {
            console.log(`[Rank Function Debug] Código ${code} NO encontrado en countryValuesMap`);
          }
        }
        
        if (currentValue === null || matchedCode === null) {
          if (countryName.toLowerCase().includes('iceland') || possibleCodes.includes('IS') || possibleCodes.includes('ISL')) {
            console.log(`[Rank Function Debug] ISLANDIA: No se encontró valor o código coincidente, retornando null`);
          }
          return null;
        }
        
        const sortedValues: [string, number][] = [];
        countryValuesMap.forEach((val, code) => {
          const isSupranational = code === 'EU27_2020' || code === 'EA19' || code === 'EA20';
          
          if (!isSupranational) {
            sortedValues.push([code, val]);
          }
        });
        
        sortedValues.sort((a, b) => b[1] - a[1]);
        
        const position = sortedValues.findIndex(([, val]) => val === currentValue);
        
        if (position === -1) {
          return null;
        }
        
        return {
          rank: position + 1,
          total: sortedValues.length
        };
      };

      // Función para obtener países competidores (cercanos en el ranking)
      const getCompetitorCountries = (feature: GeoJsonFeature, countryValuesMap: Map<string, number>): string => {
        const countryName = getCountryName(feature);
        const countryIso3 = getCountryIso3(feature);
        const countryIso2 = feature.properties?.iso_a2 as string;
        
        if (isSupranationalEntity(countryName)) {
          return '';
        }
        
        const codeMapping = getCountryCodeMapping();
        
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
        
        if (currentValue === null || matchedCode === null) return '';
        
        // Crear array ordenado de países
        const sortedValues: [string, number][] = [];
        countryValuesMap.forEach((val, code) => {
          const isSupranational = code === 'EU27_2020' || code === 'EA19' || code === 'EA20';
          
          if (!isSupranational) {
            sortedValues.push([code, val]);
          }
        });
        
        sortedValues.sort((a, b) => b[1] - a[1]);
        
        const currentPosition = sortedValues.findIndex(([, val]) => val === currentValue);
        
        if (currentPosition === -1) return '';
        
        // Obtener competidores cercanos (1 por arriba y 1 por abajo)
        const competitors: Array<{code: string, value: number, position: number, type: 'above' | 'below'}> = [];
        
        // País por arriba (mejor ranking)
        if (currentPosition > 0) {
          const [aboveCode, aboveValue] = sortedValues[currentPosition - 1];
          competitors.push({
            code: aboveCode, 
            value: aboveValue, 
            position: currentPosition, 
            type: 'above'
          });
        }
        
        // País por abajo (peor ranking)
        if (currentPosition < sortedValues.length - 1) {
          const [belowCode, belowValue] = sortedValues[currentPosition + 1];
          competitors.push({
            code: belowCode, 
            value: belowValue, 
            position: currentPosition + 2, 
            type: 'below'
          });
        }
        
        if (competitors.length === 0) return '';
        
        // Construir HTML para competidores
        let competitorsHtml = `
          <div class="space-y-1 border-t border-gray-100 pt-3 mt-3">
            <div class="text-xs text-gray-500 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                <path d="M8 3l4 8 5-5v7H3V6l5 5 4-8z"></path>
              </svg>
              ${language === 'es' ? 'Comparación con el ranking' : 'Ranking comparison'}
            </div>
        `;
        
        competitors.forEach(competitor => {
          const competitorName = getLocalizedCountryName(competitor.code);
          const formattedValue = formatPatentsValueAsInDataset(Math.round(competitor.value), patsDisplayType);
          const difference = Math.abs(currentValue - competitor.value);
          const percentDiff = currentValue > 0 ? ((difference / currentValue) * 100).toFixed(1) : '0.0';
          
          const isAbove = competitor.type === 'above';
          const arrowIcon = isAbove ? 
            'M12 19V5M5 12l7-7 7 7' : // Flecha hacia arriba
            'M12 5v14M5 12l7 7 7-7'; // Flecha hacia abajo
          
          // Calcular la posición real en el ranking
          const competitorPosition = isAbove ? currentPosition : currentPosition + 2;
          
          // Textos explicativos según la posición
          const positionLabel = isAbove ? 
            (language === 'es' ? 'Lugar superior' : 'Position above') :
            (language === 'es' ? 'Lugar inferior' : 'Position below');
          
          const gapText = isAbove ?
            (language === 'es' ? `+${percentDiff}% más` : `+${percentDiff}% more`) :
            (language === 'es' ? `${percentDiff}% menos` : `${percentDiff}% less`);
          
          competitorsHtml += `
            <div class="bg-gray-50 p-2 rounded mb-1">
              <div class="flex justify-between items-center text-xs">
                <div class="flex items-center">
                  <div class="flex items-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1 ${isAbove ? 'text-red-500' : 'text-green-500'}">
                      <path d="${arrowIcon}"></path>
                    </svg>
                    <span class="text-xs text-gray-500">#${competitorPosition}</span>
                  </div>
                  <span class="font-medium text-gray-700">${competitorName}</span>
                </div>
                <div class="text-right">
                  <div class="font-bold text-gray-800">${formattedValue}</div>
                </div>
              </div>
              <div class="flex justify-between items-center mt-1">
                <span class="text-xs text-gray-400">${positionLabel}</span>
                <span class="text-xs font-medium ${isAbove ? 'text-red-600' : 'text-green-600'}">${gapText}</span>
              </div>
            </div>
          `;
        });
        
        competitorsHtml += '</div>';
        
        return competitorsHtml;
      };

      // Funciones de interacción
      const handleMouseOver = (event: MouseEvent, feature: GeoJsonFeature) => {
        // Validar si el país debe mostrar tooltip
        if (!validateCountryData(feature)) {
          return;
        }
        
        const countryIso3 = getCountryIso3(feature);
        const countryIso2 = feature.properties?.iso_a2 as string;
        const geoJsonCountryName = getCountryName(feature);
        
        // Intentar obtener el nombre localizado, con fallback al nombre del GeoJSON
        let countryName = getLocalizedCountryName(countryIso3 || countryIso2 || '');
        
        // Si no se pudo localizar y tenemos el nombre del GeoJSON, usarlo
        if (countryName === (countryIso3 || countryIso2 || '') && geoJsonCountryName) {
          // Para Islandia específicamente, usar el nombre localizado correcto
          if (geoJsonCountryName.toLowerCase() === 'iceland') {
            countryName = language === 'es' ? 'Islandia' : 'Iceland';
          } else {
            countryName = geoJsonCountryName;
          }
        }
        
        const value = getCountryValue(feature);
        
        // Recopilar todos los valores basándose en los datos reales
        const countryValuesMap = new Map<string, number>();
        
        console.log(`[Patents Tooltip Debug] Usando datos de patentes sin sectores`);
        
        const countryDataForYear = data.filter(item => {
          const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
          const targetCooperation = cooperationPartner || 'APPL';
          const cooperationMatch = item.coop_ptn === targetCooperation;
          const targetUnit = (patsDisplayType || 'number') === 'number' ? 'NR' : 'P_MHAB';
          const unitMatch = item.unit === targetUnit;
          
          return yearMatch && cooperationMatch && unitMatch;
        });
        
        console.log(`[Patents Tooltip Debug] Countries found for year ${selectedYear}:`, countryDataForYear.length);
        
        // Debug específico para verificar si Islandia está en los datos
        const icelandiaData = countryDataForYear.filter(item => 
          item.geo === 'IS' || item.geo === 'ISL' || item.geo === 'Iceland'
        );
        if (icelandiaData.length > 0) {
          console.log(`[Debug Islandia] Datos encontrados para Islandia:`, icelandiaData);
        } else {
          console.log(`[Debug Islandia] NO se encontraron datos para Islandia en año ${selectedYear}`);
        }
        
        const tempCountryMap = new Map<string, {code: string, value: number, isSupranational: boolean}>();
        
        countryDataForYear.forEach(item => {
          const countryCode = item.geo;
          let value = parseFloat(item.OBS_VALUE || '0');
          if (isNaN(value)) return;
          
          if (countryCode === 'EU27_2020') {
            value = Math.round(value / 27);
          } else if (countryCode === 'EA19') {
            value = Math.round(value / 19);
          } else if (countryCode === 'EA20') {
            value = Math.round(value / 20);
          }
          
          const isSupranational = countryCode === 'EU27_2020' || countryCode === 'EA19' || countryCode === 'EA20';
          tempCountryMap.set(countryCode, {code: countryCode, value: value, isSupranational: isSupranational});
          
          // Debug específico para Islandia
          if (countryCode === 'IS' || countryCode === 'ISL') {
            console.log(`[Debug Islandia] Añadido ${countryCode} al tempCountryMap con valor: ${value}`);
          }
        });
        
        const sortedData = Array.from(tempCountryMap.values())
          .sort((a, b) => b.value - a.value);
        
        // NO limitar a top 25 para que el ranking funcione para todos los países
        // Incluir todos los países para el ranking
        sortedData.forEach(item => {
          countryValuesMap.set(item.code, item.value);
        });
        
        // Debug específico para ranking
        if (countryName.toLowerCase().includes('iceland') || countryName.toLowerCase().includes('islandia')) {
          console.log(`[Iceland Ranking Debug] *** DEBUGGING ISLANDIA RANKING ***`);
          console.log(`[Iceland Ranking Debug] countryName: ${countryName}`);
          console.log(`[Iceland Ranking Debug] countryIso2: ${countryIso2}, countryIso3: ${countryIso3}`);
          console.log(`[Iceland Ranking Debug] value: ${value}`);
          console.log(`[Iceland Ranking Debug] countryValuesMap size: ${countryValuesMap.size}`);
          console.log(`[Iceland Ranking Debug] Países en countryValuesMap:`, Array.from(countryValuesMap.keys()));
          console.log(`[Iceland Ranking Debug] ¿Islandia en mapa? IS: ${countryValuesMap.has('IS')}, ISL: ${countryValuesMap.has('ISL')}`);
          if (countryValuesMap.has('IS')) {
            console.log(`[Iceland Ranking Debug] Valor de IS en mapa: ${countryValuesMap.get('IS')}`);
          }
          if (countryValuesMap.has('ISL')) {
            console.log(`[Iceland Ranking Debug] Valor de ISL en mapa: ${countryValuesMap.get('ISL')}`);
          }
        }
        
        const rankInfo = !isSupranationalEntity(countryName) ? 
          getCountryRank(feature, countryValuesMap) : null;
        
        if (countryName.toLowerCase().includes('iceland') || countryName.toLowerCase().includes('islandia')) {
          console.log(`[Iceland Ranking Debug] rankInfo resultado: ${JSON.stringify(rankInfo)}`);
        }
        
        console.log(`[Patents Tooltip Debug] Final ranking info:`, rankInfo);
        console.log(`[Patents Tooltip Debug] Country value:`, value);
        console.log(`[Patents Tooltip Debug] Is supranational:`, isSupranationalEntity(countryName));
        
        // Obtener información de competencia
        const competitorsHtml = !isSupranationalEntity(countryName) && value !== null ? 
          getCompetitorCountries(feature, countryValuesMap) : '';
        
        console.log(`[Patents Tooltip Debug] Competitors HTML generated:`, competitorsHtml.length > 0);
        
        const europeanCountryCodes = EUROPEAN_COUNTRY_CODES;
        
        if ((countryIso2 && !europeanCountryCodes.includes(countryIso2)) && 
            (countryIso3 && !europeanCountryCodes.includes(countryIso3))) {
          return;
        }
        
        const countryNameAlt = getCountryName(feature);
        if (isSupranationalEntity(countryNameAlt)) {
          console.log(`Tooltip para entidad supranacional: ${countryNameAlt}`);
        }
        
        // Destacar país seleccionado
        d3.select(event.currentTarget as SVGPathElement)
          .attr('stroke-width', '1.5')
          .attr('stroke', '#333');
        
        // Buscar información adicional en los datos
        const countryData = data.find(item => {
          const possibleCodes = [countryIso3, countryIso2];
          
          // Usar el mapeo centralizado pero convertir a array de códigos alternativos
          const codeMapping = getCountryCodeMapping();
          
          // Convertir el mapeo a formato de arrays para mantener compatibilidad
          const codeMappingArrays: Record<string, string[]> = {};
          Object.entries(codeMapping).forEach(([iso3, iso2]) => {
            codeMappingArrays[iso3] = [iso2];
          });
          
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
            'RU': 'RUS',
            'MD': 'MDA',
            'XK': 'XKX',
            'BY': 'BLR',
            'LI': 'LIE',
            'MCO': 'MCO',
            'SM': 'SMR',
            'VA': 'VAT',
            'AD': 'AND'
          };
          
          if (countryIso3 && countryIso3.length === 3 && codeMappingArrays[countryIso3]) {
            possibleCodes.push(...codeMappingArrays[countryIso3]);
          }
          if (countryIso2 && countryIso2.length === 2) {
            if (codeMapping2to3[countryIso2]) {
              possibleCodes.push(codeMapping2to3[countryIso2]);
            }
          }
          
          const geoMatch = possibleCodes.some(code => item.geo === code);
          const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear;
          const targetCooperation = cooperationPartner || 'APPL';
          const cooperationMatch = item.coop_ptn === targetCooperation;
          const targetUnit = (patsDisplayType || 'number') === 'number' ? 'NR' : 'P_MHAB';
          const unitMatch = item.unit === targetUnit;
          
          return geoMatch && yearMatch && cooperationMatch && unitMatch;
        });
        
        // Buscar información adicional en los datos
        console.log(`[Patents Tooltip Debug] País: ${countryName}, ISO3: ${countryIso3}, geo data: ${countryData?.geo}, OBS_FLAG: ${countryData?.OBS_FLAG}, Objeto completo:`, countryData);
        
        // Debug adicional para flags
        if (countryData?.OBS_FLAG) {
          console.log(`[Patents Flag Debug] ✅ Flag encontrada para ${countryName}: ${countryData.OBS_FLAG} - ${getLabelDescription(countryData.OBS_FLAG, language)}`);
        } else {
          console.log(`[Patents Flag Debug] ❌ No se encontró flag para ${countryName}`);
        }
        
        // Obtener la bandera del país
        const flagUrl = getCountryFlagUrl(countryName, feature);
        console.log(`[Patents Tooltip Debug] Flag URL:`, flagUrl);
        
        // Verificar si es España o la UE para la visualización del tooltip
        const isSpain = countryIso2 === 'ES' || countryIso3 === 'ESP';
        const isEU = countryIso2 === 'EU' || countryData?.geo === 'EU27_2020';
        
        const euValue = !isEU ? getEUValue(data, selectedYear, patsDisplayType, cooperationPartner) : null;
        const euAverageValue = euValue !== null ? Math.round(euValue / 27) : null;
        const spainValue = !isSpain ? getSpainValue(data, selectedYear, patsDisplayType, cooperationPartner) : null;
        
        console.log(`[Patents Tooltip Debug] isSpain:`, isSpain, `isEU:`, isEU);
        console.log(`[Patents Tooltip Debug] euValue:`, euValue, `euAverageValue:`, euAverageValue);
        console.log(`[Patents Tooltip Debug] spainValue:`, spainValue);
        
        let previousYearValue = null;
        
        // Obtener el valor del año anterior para la comparación YoY - mejorar búsqueda
        if (value !== null) {
          // Intentar primero con códigos más específicos
          if (countryData?.geo) {
            previousYearValue = getPreviousYearValue(data, countryData.geo, selectedYear, patsDisplayType, cooperationPartner);
          }
          
          // Si no se encontró, intentar con ISO3 e ISO2
          if (previousYearValue === null && countryIso3) {
            previousYearValue = getPreviousYearValue(data, countryIso3, selectedYear, patsDisplayType, cooperationPartner);
          }
          
          if (previousYearValue === null && countryIso2) {
            previousYearValue = getPreviousYearValue(data, countryIso2, selectedYear, patsDisplayType, cooperationPartner);
          }
          
          // Búsqueda adicional en los datos directamente
          if (previousYearValue === null) {
            // Intentar buscar en los datos del año anterior por el nombre normalizado del país
            const normalizedCountryName = normalizarTexto(countryName);
            console.log(`[Patents YoY Debug] Intentando búsqueda por nombre: ${normalizedCountryName}`);
            
            const prevYearDirectData = data.filter(item => {
              const itemCountry = normalizarTexto(item.geo);
              const yearMatch = parseInt(item.TIME_PERIOD) === selectedYear - 1;
              
              // Verificar si contiene parte del nombre del país
              return itemCountry.includes(normalizedCountryName) && yearMatch;
            });
            
            if (prevYearDirectData.length > 0 && prevYearDirectData[0].OBS_VALUE) {
              previousYearValue = parseFloat(prevYearDirectData[0].OBS_VALUE);
              console.log(`[Patents YoY Debug] Valor encontrado por coincidencia de nombre: ${previousYearValue}`);
            }
          }
        }
        
        console.log(`[Patents Tooltip Debug] Valor actual: ${value}, Valor año anterior: ${previousYearValue}`);
        
        // Preparar HTML para la comparación YoY
        let yoyComparisonHtml = '';
        if (value !== null && previousYearValue !== null && previousYearValue !== 0) {
          const difference = value - previousYearValue;
          const percentDiff = (difference / previousYearValue) * 100;
          const formattedDiff = percentDiff.toFixed(1);
          const isPositive = difference > 0;
          console.log(`[Patents Tooltip Debug] Generando HTML de comparación YoY: diff=${difference}, percentDiff=${percentDiff}%`);
          yoyComparisonHtml = `
            <div class="${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                <path d="${isPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
              </svg>
              <span>${isPositive ? '+' : ''}${formattedDiff}% vs ${selectedYear - 1}</span>
            </div>
          `;
        } else {
          console.log(`[Patents Tooltip Debug] No se puede generar comparación YoY: value=${value}, previousYearValue=${previousYearValue}`);
          yoyComparisonHtml = `<div class="text-gray-400 flex items-center mt-1 text-xs">--</div>`;
        }
        
        // Construir comparaciones HTML
        let comparisonsHtml = '';
        
        console.log(`[Patents Tooltip Debug] Building comparisons. Value:`, value);
        
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
                  `vs Media UE (${formatPatentsValueAsInDataset(euAverageValue, patsDisplayType)}):` : 
                  `vs Avg UE (${formatPatentsValueAsInDataset(euAverageValue, patsDisplayType)}):`}</span>
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
                  `vs España (${formatPatentsValueAsInDataset(spainValue, patsDisplayType)}):` : 
                  `vs Spain (${formatPatentsValueAsInDataset(spainValue, patsDisplayType)}):`}</span>
                <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${formattedDiff}%</span>
              </div>
            `;
          }
        }

        let tooltipContent = '';
        
        console.log(`[Patents Tooltip Debug] Final variables before HTML construction:`);
        console.log(`[Patents Tooltip Debug] - rankInfo:`, rankInfo);
        console.log(`[Patents Tooltip Debug] - comparisonsHtml length:`, comparisonsHtml.length);
        console.log(`[Patents Tooltip Debug] - competitorsHtml length:`, competitorsHtml.length);
        console.log(`[Patents Tooltip Debug] - flagUrl:`, flagUrl);
        console.log(`[Patents Tooltip Debug] - countryName:`, countryName);
        console.log(`[Patents Tooltip Debug] - value:`, value);
        
        if (value === null) {
          tooltipContent = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <div class="flex items-center p-3 bg-orange-50 border-b border-orange-100">
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
          const safeValue = value;
          
          tooltipContent = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <!-- Header con el nombre del país -->
              <div class="flex items-center p-3 bg-orange-50 border-b border-orange-100">
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>${getPatentsDisplayUnit(patsDisplayType, language)}:</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-xl font-bold text-orange-700">${formatPatentsValueAsInDataset(safeValue, patsDisplayType)}</span>
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
                
                <!-- Competidores directos -->
                ${competitorsHtml}
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
        
        setTimeout(() => {
          if (tooltipRef.current) {
            positionTooltip(tooltip, event, tooltipRef.current);
          }
        }, 10);
      };

      const handleMouseMove = (event: MouseEvent) => {
        const tooltip = d3.select(tooltipRef.current!);
        if (tooltip.style('display') !== 'none' && tooltipRef.current) {
          setTimeout(() => {
            if (tooltipRef.current) {
              positionTooltip(tooltip, event, tooltipRef.current);
            }
          }, 0);
        }
      };

      const handleMouseOut = (event: MouseEvent) => {
        d3.select(event.currentTarget as SVGPathElement)
          .attr('stroke-width', '0.5')
          .attr('stroke', '#fff');
        
        const tooltip = d3.select(tooltipRef.current!);
        tooltip.classed('visible', false);
        
        setTimeout(() => {
          if (!tooltip.classed('visible')) {
            tooltip.style('display', 'none');
          }
        }, 150);
      };

      // Dibujar países con colores basados en datos
      const paths = svg.selectAll('path')
        .data(geoData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', feature => {
          const value = getCountryValue(feature);
          const color = getColorForValue(value);
          console.log("[Patents Map Render Debug] País renderizado - valor:", value, "color:", color);
          return color;
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', '0.5px')
        .style('cursor', 'pointer')
        .on('mouseover', function(event: MouseEvent, d: GeoJsonFeature) {
          handleMouseOver(event, d);
        })
        .on('mousemove', function(event: MouseEvent) {
          handleMouseMove(event);
        })
        .on('mouseout', function(event: MouseEvent) {
          handleMouseOut(event);
        });
        
      console.log("[Patents Map Render Debug] Países renderizados:", paths.size());
      
      console.log("[Patents Map Render Debug] Renderizado completado");
    };

    renderMap();
  }, [geoData, data, selectedYear, language, patsDisplayType, cooperationPartner]);



  return (
    <div className="relative w-full" style={{ height: '620px' }}>
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {getMapTitle()} · {selectedYear}
        </h3>
        <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
             style={{ backgroundColor: `${d3.color(getSectorColor())?.copy({ opacity: 0.15 })}` }}>
          {getSectorText()}
        </div>
      </div>
      
      <div className="relative" style={{ height: '540px', border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
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
              className="w-full h-full" 
              viewBox="0 0 1000 700"
              preserveAspectRatio="xMidYMid meet"
            />
            <div 
              ref={tooltipRef}
              className="patents-country-tooltip"
              style={{
                display: 'none',
                maxWidth: '350px',
                transformOrigin: 'top left'
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PatentsEuropeanMap; 