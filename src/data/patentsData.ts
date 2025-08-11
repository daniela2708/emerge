// Configuración de datos de patentes
export const PATENTS_DATA_CONFIG = {
  // Rutas de archivos CSV
  EUROPE_PATENTS_CSV: './data/patents/patentes_europa.csv',
  
  // Campos del CSV de patentes europeas
  CSV_FIELDS: {
    STRUCTURE: 'STRUCTURE',
    STRUCTURE_ID: 'STRUCTURE_ID', 
    STRUCTURE_NAME: 'STRUCTURE_NAME',
    FREQ: 'freq',
    TIME_FREQUENCY: 'Time frequency',
    COOP_PTN: 'coop_ptn',
    COOPERATION_PARTNERS: 'Cooperation partners',
    UNIT: 'unit',
    UNIT_OF_MEASURE: 'Unit of measure',
    GEO: 'geo',
    GEOPOLITICAL_ENTITY: 'Geopolitical entity (reporting)',
    TIME_PERIOD: 'TIME_PERIOD',
    TIME: 'Time',
    OBS_VALUE: 'OBS_VALUE',
    OBSERVATION_VALUE: 'Observation value',
    OBS_FLAG: 'OBS_FLAG',
    OBSERVATION_STATUS: 'Observation status (Flag) V2 structure',
    CONF_STATUS: 'CONF_STATUS',
    CONFIDENTIALITY_STATUS: 'Confidentiality status (flag)'
  },
  
  // Valores de filtros
  COOPERATION_TYPES: {
    APPLICANT: 'APPL',
    INVENTOR: 'INVT'
  },
  
  UNITS: {
    NUMBER: 'NR',
    PER_MILLION_INHABITANTS: 'P_MHAB'
  },
  
  // Códigos de países importantes
  COUNTRY_CODES: {
    SPAIN: 'ES',
    GERMANY: 'DE',
    FRANCE: 'FR',
    ITALY: 'IT',
    NETHERLANDS: 'NL',
    SWITZERLAND: 'CH',
    AUSTRIA: 'AT',
    BELGIUM: 'BE',
    DENMARK: 'DK',
    SWEDEN: 'SE',
    FINLAND: 'FI',
    NORWAY: 'NO'
  },
  
  // Flags de observación
  OBSERVATION_FLAGS: {
    PROVISIONAL: 'p',
    ESTIMATED: 'e',
    BREAK_IN_TIME_SERIES: 'b',
    DEFINITION_DIFFERS: 'd',
    LOW_RELIABILITY: 'u'
  }
};

// Interfaz para los datos de patentes
export interface PatentsData {
  STRUCTURE: string;
  STRUCTURE_ID: string;
  STRUCTURE_NAME: string;
  freq: string;
  'Time frequency': string;
  coop_ptn: string;
  'Cooperation partners': string;
  unit: string;
  'Unit of measure': string;
  geo: string;
  'Geopolitical entity (reporting)': string;
  TIME_PERIOD: string;
  Time: string;
  OBS_VALUE: string;
  'Observation value': string;
  OBS_FLAG?: string;
  'Observation status (Flag) V2 structure'?: string;
  CONF_STATUS?: string;
  'Confidentiality status (flag)'?: string;
  [key: string]: string | undefined;
}

// Interfaz para datos procesados
export interface ProcessedPatentsData {
  country: string;
  countryName: string;
  year: number;
  cooperationType: 'applicant' | 'inventor';
  unit: 'number' | 'per_million_inhabitants';
  value: number;
  flag?: string;
}

// Función para procesar los datos del CSV
export const processPatentsData = (rawData: PatentsData[]): ProcessedPatentsData[] => {
  return rawData
    .filter(item => {
      // Filtrar solo datos válidos
      return item.OBS_VALUE && 
             item.OBS_VALUE !== '' && 
             !isNaN(parseFloat(item.OBS_VALUE)) &&
             item.TIME_PERIOD &&
             item.geo &&
             item.coop_ptn &&
             item.unit;
    })
    .map(item => ({
      country: item.geo,
      countryName: item['Geopolitical entity (reporting)'],
      year: parseInt(item.TIME_PERIOD),
      cooperationType: item.coop_ptn === PATENTS_DATA_CONFIG.COOPERATION_TYPES.APPLICANT ? 'applicant' : 'inventor',
      unit: item.unit === PATENTS_DATA_CONFIG.UNITS.NUMBER ? 'number' : 'per_million_inhabitants',
      value: parseFloat(item.OBS_VALUE),
      flag: item.OBS_FLAG
    }));
};

// Función para obtener años disponibles
export const getAvailableYears = (data: ProcessedPatentsData[]): number[] => {
  const years = Array.from(new Set(data.map(item => item.year)))
    .filter(year => !isNaN(year))
    .sort((a, b) => b - a); // Ordenar de más reciente a más antiguo
  return years;
};

// Función para obtener países disponibles
export const getAvailableCountries = (data: ProcessedPatentsData[]): Array<{code: string, name: string}> => {
  const countryMap = new Map();
  data.forEach(item => {
    if (!countryMap.has(item.country)) {
      countryMap.set(item.country, item.countryName);
    }
  });
  
  return Array.from(countryMap.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Función para filtrar datos por criterios
export const filterPatentsData = (
  data: ProcessedPatentsData[],
  filters: {
    year?: number;
    cooperationType?: 'applicant' | 'inventor';
    unit?: 'number' | 'per_million_inhabitants';
    countries?: string[];
  }
): ProcessedPatentsData[] => {
  return data.filter(item => {
    if (filters.year && item.year !== filters.year) return false;
    if (filters.cooperationType && item.cooperationType !== filters.cooperationType) return false;
    if (filters.unit && item.unit !== filters.unit) return false;
    if (filters.countries && filters.countries.length > 0 && !filters.countries.includes(item.country)) return false;
    return true;
  });
};

// Función para obtener datos de un país específico
export const getCountryData = (
  data: ProcessedPatentsData[],
  countryCode: string,
  cooperationType: 'applicant' | 'inventor' = 'applicant',
  unit: 'number' | 'per_million_inhabitants' = 'number'
): ProcessedPatentsData[] => {
  return filterPatentsData(data, {
    countries: [countryCode],
    cooperationType,
    unit
  }).sort((a, b) => a.year - b.year);
};

// Función para obtener el ranking de países para un año específico
export const getCountryRanking = (
  data: ProcessedPatentsData[],
  year: number,
  cooperationType: 'applicant' | 'inventor' = 'applicant',
  unit: 'number' | 'per_million_inhabitants' = 'number',
  limit?: number
): ProcessedPatentsData[] => {
  const yearData = filterPatentsData(data, { year, cooperationType, unit });
  const sorted = yearData.sort((a, b) => b.value - a.value);
  return limit ? sorted.slice(0, limit) : sorted;
};

// Textos localizados para patentes
export const patentsTexts = {
  es: {
    loadingData: "Cargando datos de patentes...",
    errorLoadingData: "Error al cargar los datos de patentes",
    noDataAvailable: "No hay datos disponibles",
    yearLabel: "Año:",
    typeLabel: "Tipo:",
    totalPatents: "Total de solicitudes",
    patentsPerCapita: "Solicitudes per cápita",
    applicantData: "Por país del solicitante",
    inventorData: "Por país del inventor",
    countryRanking: "Ranking de países",
    timeEvolution: "Evolución temporal",
    sectorDistribution: "Distribución sectorial",
    observationFlags: "Leyenda estadística",
    provisional: "Provisional",
    estimated: "Estimado",
    breakInTimeSeries: "Ruptura en serie temporal",
    definitionDiffers: "Definición diferente",
    lowReliability: "Baja fiabilidad",
    datasetDescription: "Este indicador mide las solicitudes de protección de una invención presentadas ante la Oficina Europea de Patentes (EPO), independientemente de si son concedidas o no.",
    allocationPrinciple: "Las solicitudes se asignan según el país de residencia del primer solicitante listado (principio del primer solicitante nombrado) y según el país de residencia del inventor."
  },
  en: {
    loadingData: "Loading patents data...",
    errorLoadingData: "Error loading patents data",
    noDataAvailable: "No data available",
    yearLabel: "Year:",
    typeLabel: "Type:",
    totalPatents: "Total applications",
    patentsPerCapita: "Applications per capita",
    applicantData: "By applicant country",
    inventorData: "By inventor country",
    countryRanking: "Country ranking",
    timeEvolution: "Time evolution",
    sectorDistribution: "Sector distribution",
    observationFlags: "Statistical legend",
    provisional: "Provisional",
    estimated: "Estimated",
    breakInTimeSeries: "Break in time series",
    definitionDiffers: "Definition differs",
    lowReliability: "Low reliability",
    datasetDescription: "This indicator measures requests for the protection of an invention filed with the European Patent Office (EPO) regardless of whether they are granted or not.",
    allocationPrinciple: "Applications are allocated according to the country of residence of the first applicant listed (first-named applicant principle) and according to the country of residence of the inventor."
  }
}; 