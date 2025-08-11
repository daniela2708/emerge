/**
 * Datos de inversión en I+D como porcentaje del PIB
 * Fuente: ISTAC, INE, Eurostat
 */

// Interfaz para la estructura de datos
export interface RDInvestmentData {
  id: string;                   // Identificador único (código de país)
  name: {                       // Nombre traducible
    es: string;
    en: string;
  };
  type: 'country' | 'region' | 'average'; // Tipo de entidad
  values: {                     // Valores por año
    [year: number]: number | null;
  };
}

// Interfaces para los datos CSV
export interface SpainCSVData {
  'País (Original)': string;
  'País Limpio': string;
  'País en Inglés': string;
  'Año': string;
  'Sector Id': string;
  'Sector': string;
  'Gasto en I+D (Miles €)': string;
  'PIB': string;
  '% PIB I+D': string;
  'Sector Nombre': string;
}

export interface CommunitiesCSVData {
  'Comunidad (Original)': string;
  'Comunidad Limpia': string;
  'Comunidad en Inglés': string;
  'Año': string;
  'Sector Id': string;
  'Sector': string;
  'Gasto en I+D (Miles €)': string;
  'PIB': string;
  'Población': string;
  'Gasto I+D per cápita': string;
  '% PIB I+D': string;
  'Sector Nombre': string;
}

// Interfaz simplificada con indexación dinámica para manejar caracteres especiales
export interface EuropeCSVData {
  'Country': string;
  'País'?: string;
  'Year': string;
  'Sector': string;
  '%GDP': string;
  'ISO3'?: string;
  'label_percent_gdp_id'?: string;
  [key: string]: string | undefined; // Permitirá acceder a cualquier columna
}

// Rutas a los archivos CSV
export const DATA_PATHS = {
  GDP_EUROPE: './data/GDP_data/gdp_consolidado.csv',
  GDP_SPAIN: './data/GDP_data/gasto_ID_porcentaje_pib_espana.csv',
  GDP_COMMUNITIES: './data/GDP_data/gasto_ID_comunidades_porcentaje_pib.csv'
};

// Sectores de I+D
export interface SectorData {
  id: string;
  name: {
    es: string;
    en: string;
  };
  code: string;
}

export const rdSectors: SectorData[] = [
  {
    id: 'total',
    name: {
      es: 'Todos los sectores',
      en: 'All sectors'
    },
    code: '_T' // Código correspondiente en los CSV
  },
  {
    id: 'business',
    name: {
      es: 'Sector empresarial',
      en: 'Business enterprise sector'
    },
    code: 'EMPRESAS' // Código correspondiente en los CSV
  },
  {
    id: 'government',
    name: {
      es: 'Administración Pública',
      en: 'Government sector'
    },
    code: 'ADMINISTRACION_PUBLICA' // Código correspondiente en los CSV
  },
  {
    id: 'education',
    name: {
      es: 'Enseñanza Superior',
      en: 'Higher education sector'
    },
    code: 'ENSENIANZA_SUPERIOR' // Código correspondiente en los CSV
  },
  {
    id: 'nonprofit',
    name: {
      es: 'Instituciones Privadas sin Fines de Lucro',
      en: 'Private non-profit sector'
    },
    code: 'IPSFL' // Código correspondiente en los CSV
  }
];

// Opciones de Parser para los diferentes archivos CSV
export const CSV_PARSER_OPTIONS = {
  GDP_SPAIN: {
    delimiter: ';',
    hasHeader: true,
    idColumn: 1, // País Limpio
    nameColumnEs: 1, // País Limpio
    nameColumnEn: 2, // País en Inglés
    yearColumn: 3, // Año
    valueColumn: 8, // % PIB I+D
    sectorColumn: 5, // Sector
    sectorNameColumn: 9 // Sector Nombre
  },
  GDP_COMMUNITIES: {
    delimiter: ';',
    hasHeader: true,
    idColumn: 1, // Comunidad Limpia
    nameColumnEs: 1, // Comunidad Limpia
    nameColumnEn: 2, // Comunidad en Inglés
    yearColumn: 3, // Año
    valueColumn: 10, // % PIB I+D
    sectorColumn: 5, // Sector
    sectorNameColumn: 11 // Sector Nombre
  },
  GDP_EUROPE: {
    delimiter: ';',
    hasHeader: true,
    idColumn: 1, // País
    nameColumnEs: 1, // País
    nameColumnEn: 0, // Country
    yearColumn: 2, // Year
    valueColumn: 4, // %GDP
    sectorColumn: 3, // Sector
  }
};

// Función auxiliar para obtener datos para gráficas
export const getComparisonData = (
  entityIds: string[], 
  years: number[], 
  data: RDInvestmentData[] = []
): { labels: number[], datasets: { id: string, name: { es: string, en: string }, data: (number | null)[] }[] } => {
  const labels = years;
  const datasets = entityIds.map(id => {
    const entity = data.find(item => item.id === id);
    if (!entity) {
      return { 
        id, 
        name: { es: id, en: id }, 
        data: years.map(() => null) 
      };
    }
    
    return {
      id: entity.id,
      name: entity.name,
      data: years.map(year => entity.values[year] || null)
    };
  });
  
  return { labels, datasets };
};

// Función para procesar datos de España por sector y año
export const processSpainData = (csvData: SpainCSVData[]): RDInvestmentData => {
  // Filtrar para obtener solo datos del sector "Todos" (_T)
  const totalSectorData = csvData.filter(row => 
    row['Sector Id'] === '(_T)' || 
    row['Sector Id'] === '_T'
  );
  
  // Crear el objeto de valores por año
  const values: {[year: number]: number | null} = {};
  totalSectorData.forEach(row => {
    const year = parseInt(row['Año']);
    const value = parseFloat(row['% PIB I+D'].replace(',', '.'));
    
    if (!isNaN(year) && !isNaN(value)) {
      values[year] = value;
    }
  });
  
  return {
    id: 'es',
    name: {
      es: 'España',
      en: 'Spain'
    },
    type: 'country',
    values
  };
};

// Función para procesar datos de Canarias por sector y año
export const processCanaryData = (csvData: CommunitiesCSVData[]): RDInvestmentData => {
  // Filtrar para obtener solo datos de Canarias y del sector "Todos" (_T)
  const totalSectorData = csvData.filter(row => 
    (row['Comunidad Limpia']?.toLowerCase() === 'canarias' || 
     row['Comunidad Limpia']?.toLowerCase() === 'islas canarias') && 
    (row['Sector Id'] === '(_T)' || 
     row['Sector Id'] === '_T')
  );
  
  // Crear el objeto de valores por año
  const values: {[year: number]: number | null} = {};
  totalSectorData.forEach(row => {
    const year = parseInt(row['Año']);
    const value = parseFloat(row['% PIB I+D'].replace(',', '.'));
    
    if (!isNaN(year) && !isNaN(value)) {
      values[year] = value;
    }
  });
  
  return {
    id: 'ic',
    name: {
      es: 'Islas Canarias',
      en: 'Canary Islands'
    },
    type: 'region',
    values
  };
};

// Función para procesar datos de la UE por sector y año
export const processEUData = (csvData: EuropeCSVData[]): RDInvestmentData => {
  // Filtrar para obtener solo datos de la UE y del sector "All Sectors"
  const totalSectorData = csvData.filter(row => 
    (row['Country']?.toLowerCase().includes('european union')) && 
    (row['Sector'] === 'All Sectors')
  );
  
  // Crear el objeto de valores por año
  const values: {[year: number]: number | null} = {};
  totalSectorData.forEach(row => {
    const year = parseInt(row['Year']);
    const value = parseFloat(row['%GDP'].replace(',', '.'));
    
    if (!isNaN(year) && !isNaN(value)) {
      values[year] = value;
    }
  });
  
  console.log("EU data processed:", totalSectorData.length, "records found", values);
  
  return {
    id: 'eu27',
    name: {
      es: 'Unión Europea - 27 países',
      en: 'European Union - 27 countries'
    },
    type: 'average',
    values
  };
};

// Extrae datos de un país específico del archivo europeo
export const processCountryData = (csvData: EuropeCSVData[], countryId: string): RDInvestmentData | null => {
  // Normalizar el ID del país para la comparación
  const normalizedCountryId = countryId.toLowerCase();
  
  // Mapeo para algunos países comunes con problemas de codificación
  const countryMapping: {[key: string]: string[]} = {
    'españa': ['spain'],
    'alemania': ['germany'],
    'francia': ['france'],
    'bélgica': ['belgium', 'belgica'],
    'hungría': ['hungary', 'hungria'],
    'polonia': ['poland'],
    'república checa': ['czechia', 'czech republic', 'republica checa'],
    'finlandia': ['finland'],
    'suecia': ['sweden'],
    'italia': ['italy'],
    'portugal': ['portugal'],
    'dinamarca': ['denmark'],
    'países bajos': ['netherlands', 'paises bajos'],
    'irlanda': ['ireland'],
    'luxemburgo': ['luxembourg'],
    'austria': ['austria'],
    'eslovaquia': ['slovakia'],
    'eslovenia': ['slovenia'],
    'grecia': ['greece'],
    'rumanía': ['romania', 'rumania'],
    'bulgaria': ['bulgaria'],
    'croacia': ['croatia'],
    'chipre': ['cyprus'],
    'malta': ['malta'],
    'estonia': ['estonia'],
    'letonia': ['latvia'],
    'lituania': ['lithuania'],
    'reino unido': ['united kingdom'],
    'noruega': ['norway'],
    'islandia': ['iceland'],
    'suiza': ['switzerland'],
    'turquía': ['turkey', 'turquia']
  };
  
  // Buscar el país usando el mapeo
  let matchingRows = [];
  
  if (countryMapping[normalizedCountryId]) {
    // Si existe en nuestro mapeo, buscamos por los nombres en inglés
    const englishNames = countryMapping[normalizedCountryId];
    matchingRows = csvData.filter(row => 
      englishNames.some(name => row['Country']?.toLowerCase() === name) &&
      row['Sector'] === 'All Sectors'
    );
  } else {
    // Si no está en el mapeo, buscamos por el ID normalizado
    matchingRows = csvData.filter(row => 
      row['Country']?.toLowerCase() === normalizedCountryId &&
      row['Sector'] === 'All Sectors'
    );
  }
  
  if (matchingRows.length === 0) return null;
  
  // Obtener el primer registro para los nombres
  const countryData = matchingRows[0];
  
  // Crear el objeto de valores por año
  const values: {[year: number]: number | null} = {};
  matchingRows.forEach(row => {
    const year = parseInt(row['Year']);
    const value = parseFloat(row['%GDP'].replace(',', '.'));
    
    if (!isNaN(year) && !isNaN(value)) {
      values[year] = value;
    }
  });
  
  console.log(`Data for ${countryId} processed:`, matchingRows.length, "records found", values);
  
  return {
    id: countryId,
    name: {
      es: countryId.charAt(0).toUpperCase() + countryId.slice(1), // Capitalizar
      en: countryData['Country'] || countryId
    },
    type: 'country',
    values
  };
};