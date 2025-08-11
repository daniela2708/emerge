import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, ChevronDown } from 'lucide-react';
import Papa from 'papaparse';
import autonomous_communities_flags from '../logos/autonomous_communities_flags.json';
import { SPAIN_FLAG } from '../utils/spainFlag';

// Definición de los sectores de I+D
const rdSectors = [
  {
    id: 'total',
    code: '_T',
    name: {
      es: 'Total',
      en: 'Total'
    }
  },
  {
    id: 'business',
    code: 'BES',
    name: {
      es: 'Sector empresarial',
      en: 'Business enterprise sector'
    }
  },
  {
    id: 'government',
    code: 'GOV',
    name: {
      es: 'Administración Pública',
      en: 'Government sector'
    }
  },
  {
    id: 'education',
    code: 'HES',
    name: {
      es: 'Enseñanza Superior',
      en: 'Higher education sector'
    }
  },
  {
    id: 'nonprofit',
    code: 'PNP',
    name: {
      es: 'Instituciones privadas sin fines de lucro',
      en: 'Private non-profit institutions'
    }
  }
];

// Interfaces para los datos
interface GastoIDComunidadesData {
  'Comunidad (Original)': string;
  'Comunidad Limpio': string;
  'Comunidad en Inglés': string;
  'Año': string;
  'Sector Id': string;
  'Sector': string;
  'Gasto en I+D (Miles €)': string;
  'PIB (Miles €)': string;
  '% PIB I+D': string;
  'Sector Nombre': string;
  'ValorMonetarioMill'?: number;
  // Campos adicionales para datos del CSV de gdp_consolidado
  'Country'?: string;
  'Year'?: string;
  'Approx_RD_Investment_million_euro'?: string;
  'GDP Current prices, million euro'?: string;
  '%GDP'?: string;
}

interface GDPConsolidadoData {
  Country?: string;
  País?: string;
  Year?: string;
  Sector?: string;
  'Approx_RD_Investment_million_euro'?: string;
  'GDP Current prices, million euro'?: string;
  '%GDP'?: string;
}

// Interfaz para resultados de Papa.parse
interface PapaParseResults<T> {
  data: T[];
  errors: Array<{type: string; code: string; message: string; row?: number}>;
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields?: string[];
  };
}

// Interfaces para los datos procesados
interface SectorDataItem {
  name: string;
  value: number;
  color: string;
  sharePercentage?: number;
  regionName?: string;
  totalPib?: string;
  yoyChange?: number;
  monetaryValue?: number; // Valor monetario en millones de euros
  id?: string; // ID del sector
}

type FlagCode = 'es' | 'community' | 'canary_islands' | string;

interface RegionData {
  name: string;
  flagCode: FlagCode;
  code?: string;
  totalPercentage: string;
  total: number;
  data: SectorDataItem[];
}

interface CommunityOption {
  name: string;
  code: string;
  flag: string;
  originalName?: string;
}

interface FlagProps {
  code: FlagCode;
  width?: number;
  height?: number;
  className?: string;
  communityCode?: string;
}

// Componente para mostrar la bandera de la comunidad
const Flag: React.FC<FlagProps> = ({ code, width = 24, height = 18, className = "", communityCode }) => {
  // Encontrar la bandera correcta basándose en el código
  let flagUrl = '';
  let extraStyles = '';
  
  // Búsqueda de banderas en el JSON
  const esFlag = SPAIN_FLAG;
  const canaryFlag = autonomous_communities_flags.find(community => community.code === 'CAN');
  const communityFlag = code === 'community' && communityCode ? 
    autonomous_communities_flags.find(community => community.code === communityCode) : null;
  
  switch(code) {
    case 'es':
      // Usar bandera de España
      flagUrl = esFlag;
      break;
    case 'canary_islands':
      // Usar bandera de Canarias
      flagUrl = canaryFlag?.flag || '';
      extraStyles = 'bg-gray-50';
      break;
    case 'community':
      // Usar bandera de la comunidad seleccionada
      flagUrl = communityFlag?.flag || '';
      break;
    default:
      return null;
  }
  
  // Renderizar la imagen de la bandera si se encontró una URL
  if (flagUrl) {
    return (
      <img 
        src={flagUrl} 
        alt={code} 
        width={width} 
        height={height} 
        className={`rounded border border-gray-300 shadow-sm ${extraStyles} ${className}`}
      />
    );
  }
  
  return null;
};

interface CommunityDistributionProps {
  language: 'es' | 'en';
}

// Añadimos un tipo para el mapa de colores de sectores
type SectorColorMap = {
  [key in 'business' | 'government' | 'education' | 'nonprofit']: string;
};

// Definimos un tipo para los datos del tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: SectorDataItem;
  }>;
  region: string;
}

// Tabla de mapeo entre nombres de comunidades en el CSV y nombres en español/inglés
const communityNameMapping: { [key: string]: { es: string, en: string } } = {
  'Andalucía': { es: 'Andalucía', en: 'Andalusia' },
  'Andalucia': { es: 'Andalucía', en: 'Andalusia' },
  'Aragón': { es: 'Aragón', en: 'Aragon' },
  'Aragon': { es: 'Aragón', en: 'Aragon' },
  'Principado de Asturias': { es: 'Asturias', en: 'Asturias' },
  'Asturias': { es: 'Asturias', en: 'Asturias' },
  'Illes Balears / Islas Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Islas Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Illes Balears': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Balearic Islands': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Canarias': { es: 'Canarias', en: 'Canary Islands' },
  'Islas Canarias': { es: 'Canarias', en: 'Canary Islands' },
  'Canary Islands': { es: 'Canarias', en: 'Canary Islands' },
  'Cantabria': { es: 'Cantabria', en: 'Cantabria' },
  'Castilla - La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla-La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla-la Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castillalamancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla y León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla y Leon': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla-León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla-Leon': { es: 'Castilla y León', en: 'Castile and León' },
  'Castile and León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castile and Leon': { es: 'Castilla y León', en: 'Castile and León' },
  'Cataluña': { es: 'Cataluña', en: 'Catalonia' },
  'Cataluna': { es: 'Cataluña', en: 'Catalonia' },
  'Catalunya': { es: 'Cataluña', en: 'Catalonia' },
  'Catalonia': { es: 'Cataluña', en: 'Catalonia' },
  'Comunidad Valenciana': { es: 'Com. Valenciana', en: 'Valencia' },
  'C. Valenciana': { es: 'Com. Valenciana', en: 'Valencia' },
  'Valencia': { es: 'Com. Valenciana', en: 'Valencia' },
  'Valencian Community': { es: 'Com. Valenciana', en: 'Valencia' },
  'Extremadura': { es: 'Extremadura', en: 'Extremadura' },
  'Galicia': { es: 'Galicia', en: 'Galicia' },
  'La Rioja': { es: 'La Rioja', en: 'La Rioja' },
  'Rioja': { es: 'La Rioja', en: 'La Rioja' },
  'Comunidad de Madrid': { es: 'Madrid', en: 'Madrid' },
  'Madrid': { es: 'Madrid', en: 'Madrid' },
  'Región de Murcia': { es: 'Murcia', en: 'Murcia' },
  'Region de Murcia': { es: 'Murcia', en: 'Murcia' },
  'Murcia': { es: 'Murcia', en: 'Murcia' },
  'Comunidad Foral de Navarra': { es: 'Navarra', en: 'Navarre' },
  'Navarra': { es: 'Navarra', en: 'Navarre' },
  'Navarre': { es: 'Navarra', en: 'Navarre' },
  'País Vasco': { es: 'País Vasco', en: 'Basque Country' },
  'Pais Vasco': { es: 'País Vasco', en: 'Basque Country' },
  'Euskadi': { es: 'País Vasco', en: 'Basque Country' },
  'Basque Country': { es: 'País Vasco', en: 'Basque Country' },
  'Ciudad Autónoma de Ceuta': { es: 'Ceuta', en: 'Ceuta' },
  'Ceuta': { es: 'Ceuta', en: 'Ceuta' },
  'Ciudad Autónoma de Melilla': { es: 'Melilla', en: 'Melilla' },
  'Melilla': { es: 'Melilla', en: 'Melilla' }
};

const CommunityDistribution: React.FC<CommunityDistributionProps> = ({ language }) => {
  const [selectedYear, setSelectedYear] = useState<string>('2023');
  const selectedSector = 'total'; // Sector fijo en 'total'
  const [years, setYears] = useState<string[]>([]);
  const [regionsData, setRegionsData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityOption>({
    name: language === 'es' ? 'Madrid' : 'Madrid',
    code: 'MAD',
    flag: autonomous_communities_flags.find(f => f.code === 'MAD')?.flag || ''
  });
  const [availableCommunities, setAvailableCommunities] = useState<CommunityOption[]>([]);
  const [ccaaData, setCcaaData] = useState<GastoIDComunidadesData[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [sectorOrder, setSectorOrder] = useState<string[]>([]);
  
  // Textos localizados
  const texts = {
    es: {
      year: "Año",
      sector: "Sector",
      ofGDP: "del PIB",
      total: "Total",
      distributionTitle: "Distribución sectorial de la inversión en I+D",
      pibPercentage: "%PIB",
      community: "Comunidad",
      selectCommunity: "Seleccionar comunidad",
      changeCommunity: "Cambiar comunidad"
    },
    en: {
      year: "Year",
      sector: "Sector",
      ofGDP: "of GDP",
      total: "Total",
      distributionTitle: "R&D Investment Distribution by Sectors",
      pibPercentage: "%GDP",
      community: "Community",
      selectCommunity: "Select community",
      changeCommunity: "Change community"
    }
  };

  const t = texts[language];

  // Colores para cada sector - usamos colores más distintivos
  const sectorColors: SectorColorMap = {
    'business': '#3b82f6',      // Sector empresarial - Azul
    'government': '#ef4444',    // Administración Pública - Rojo
    'education': '#f59e0b',     // Enseñanza Superior - Naranja
    'nonprofit': '#10b981'      // Instituciones Privadas sin Fines de Lucro - Verde
  };

  // Mover la declaración de spainHistoricalValues para estar disponible en toda la clase
  const spainHistoricalValues: Record<string, Record<string, number>> = {
    '2013': { 'total': 1.27, 'business': 0.67, 'government': 0.24, 'education': 0.35, 'nonprofit': 0.01 },
    '2014': { 'total': 1.23, 'business': 0.65, 'government': 0.23, 'education': 0.34, 'nonprofit': 0.01 },
    '2015': { 'total': 1.21, 'business': 0.64, 'government': 0.23, 'education': 0.33, 'nonprofit': 0.01 },
    '2016': { 'total': 1.18, 'business': 0.63, 'government': 0.22, 'education': 0.32, 'nonprofit': 0.01 },
    '2017': { 'total': 1.20, 'business': 0.66, 'government': 0.21, 'education': 0.32, 'nonprofit': 0.01 },
    '2018': { 'total': 1.23, 'business': 0.70, 'government': 0.21, 'education': 0.31, 'nonprofit': 0.01 },
    '2019': { 'total': 1.24, 'business': 0.70, 'government': 0.21, 'education': 0.32, 'nonprofit': 0.01 },
    '2020': { 'total': 1.40, 'business': 0.78, 'government': 0.24, 'education': 0.37, 'nonprofit': 0.01 },
    '2021': { 'total': 1.40, 'business': 0.78, 'government': 0.24, 'education': 0.37, 'nonprofit': 0.01 },
    '2022': { 'total': 1.41, 'business': 0.79, 'government': 0.24, 'education': 0.37, 'nonprofit': 0.01 },
    '2023': { 'total': 1.49, 'business': 0.84, 'government': 0.27, 'education': 0.38, 'nonprofit': 0.00 }
  };

  // Definir historicalSpainData para el procesamiento
  type HistoricalSpainData = {
    year: string;
    total: number;
    business: number;
    government: number;
    education: number;
    nonprofit: number;
  };

  const historicalSpainData: HistoricalSpainData[] = Object.entries(spainHistoricalValues).map(([year, values]) => ({
    year,
    total: values.total,
    business: values.business,
    government: values.government,
    education: values.education,
    nonprofit: values.nonprofit
  }));

  // Función para obtener el valor total del PIB para España en un año determinado
  const getHistoricalSpainTotal = (year: string): number => {
    return year in spainHistoricalValues ? spainHistoricalValues[year].total : 0;
  };

  // Función para detectar el formato de los datos de PIB (porcentaje o decimal)
  const detectPIBFormat = (data: GastoIDComunidadesData[]): { type: string } => {
    // Verificamos el formato de los datos para determinar si los valores ya están en porcentaje o decimal
    const sampleData = data.find(row => 
      row['% PIB I+D'] !== undefined
    );
    
    if (sampleData && sampleData['% PIB I+D']) {
      const value = parseFloat(sampleData['% PIB I+D'].replace(',', '.'));
      return { type: value > 1 ? 'Porcentaje (>1)' : 'Decimal (<1)' };
    }
    
    return { type: 'Desconocido' };
  };

  // Cargar datos desde archivos CSV una sola vez
  useEffect(() => {
    async function fetchData() {
      try {
        const gastoIDContent = await fetch('/data/GDP_data/gasto_ID_comunidades_porcentaje_pib.csv').then(r => r.text());
        const gdpConsolidadoContent = await fetch('/data/GDP_data/gdp_consolidado.csv').then(r => r.text());

        let dataConsolidada: GastoIDComunidadesData[] = Papa.parse<GastoIDComunidadesData>(gastoIDContent, {
          header: true,
          delimiter: ';',
          skipEmptyLines: true
        }).data;

        const spainData = Papa.parse<GDPConsolidadoData>(gdpConsolidadoContent, {
          header: true,
          delimiter: ',',
          skipEmptyLines: true
        }).data.filter(row => row.Country === 'Spain' || row.País === 'España');

        const spainFormattedData = spainData.map(row => {
          let rdInvestmentValue = 0;
          if (row.Approx_RD_Investment_million_euro) {
            rdInvestmentValue = parseFloat(String(row.Approx_RD_Investment_million_euro).replace(/,/g, '.'));
          }
          let gdpValue = 0;
          if (row['GDP Current prices, million euro']) {
            gdpValue = parseFloat(String(row['GDP Current prices, million euro']).replace(/,/g, '.'));
          }

          return {
            'Comunidad (Original)': 'España',
            'Comunidad Limpio': 'España',
            'Comunidad en Inglés': 'Spain',
            'Año': row.Year || '',
            'Sector Id': row.Sector === 'All Sectors' ? '(_T)' :
                         row.Sector === 'Business enterprise sector' ? '(EMPRESAS)' :
                         row.Sector === 'Government sector' ? '(ADMINISTRACION_PUBLICA)' :
                         row.Sector === 'Higher education sector' ? '(ENSENIANZA_SUPERIOR)' :
                         row.Sector === 'Private non-profit sector' ? '(IPSFL)' : '',
            'Sector': row.Sector || '',
            'ValorMonetarioMill': !isNaN(rdInvestmentValue) ? rdInvestmentValue : 0,
            'Gasto en I+D (Miles €)': !isNaN(rdInvestmentValue) ? (rdInvestmentValue * 1000).toString() : '',
            'PIB (Miles €)': !isNaN(gdpValue) ? (gdpValue * 1000).toString() : '',
            '% PIB I+D': row['%GDP'] ? row['%GDP'].toString().replace(/,/g, '.') : '',
            'Sector Nombre': row.Sector === 'Business enterprise sector' ? 'Empresas' :
                             row.Sector === 'Government sector' ? 'Administración Pública' :
                             row.Sector === 'Higher education sector' ? 'Enseñanza Superior' :
                             row.Sector === 'Private non-profit sector' ? 'Instituciones Privadas sin Fines de Lucro' :
                             row.Sector === 'All Sectors' ? 'Total' : row.Sector,
            'Country': row.Country,
            'Year': row.Year,
            'Approx_RD_Investment_million_euro': row.Approx_RD_Investment_million_euro,
            'GDP Current prices, million euro': row['GDP Current prices, million euro'],
            '%GDP': row['%GDP']
          } as GastoIDComunidadesData;
        });

        dataConsolidada = [...dataConsolidada, ...spainFormattedData];
        setCcaaData(dataConsolidada);

        const years = [...new Set(dataConsolidada.map(row => row['Año']))].sort((a, b) => b.localeCompare(a));
        setYears(years);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);
  
  // Actualizar comunidades disponibles y datos procesados cuando cambian los filtros
  useEffect(() => {
    if (ccaaData.length === 0) return;

    const uniqueCommunities = new Set<string>();
    const communitiesData: CommunityOption[] = [];

    const filteredData = ccaaData.filter(item =>
      item['Año'] === selectedYear &&
      item['Sector Id'] === '(_T)' &&
      item['Comunidad Limpio'] !== 'Total nacional' &&
      item['Comunidad Limpio'] !== 'España'
    );

    filteredData.forEach(item => {
      const communityName = item['Comunidad Limpio'];
      if (!uniqueCommunities.has(communityName)) {
        uniqueCommunities.add(communityName);

        let displayName = communityName;
        let code = '';
        let flagUrl = '';

        for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
          if (normalizeText(originalName) === normalizeText(communityName)) {
            displayName = language === 'es' ? mappedNames.es : mappedNames.en;
            break;
          }
        }

        const communityFlag = autonomous_communities_flags.find(flag =>
          normalizeText(flag.community).includes(normalizeText(communityName)) ||
          normalizeText(communityName).includes(normalizeText(flag.community))
        );

        if (communityFlag) {
          code = communityFlag.code;
          flagUrl = communityFlag.flag;
        }

        if (code !== 'CAN' && !normalizeText(communityName).includes('canarias')) {
          communitiesData.push({
            name: displayName,
            originalName: communityName,
            code,
            flag: flagUrl
          });
        }
      }
    });

    const sortedCommunities = communitiesData.sort((a, b) => {
      if (a.code === 'MAD') return -1;
      if (b.code === 'MAD') return 1;
      return a.name.localeCompare(b.name, language === 'es' ? 'es' : 'en');
    });

    setAvailableCommunities(sortedCommunities);

    if (!sortedCommunities.some(c => c.code === selectedCommunity.code) && sortedCommunities.length > 0) {
      setSelectedCommunity(sortedCommunities[0]);
    }

    const processed = processData(ccaaData, selectedYear, selectedSector);
    if (processed.length > 0 && processed[0].name === (language === 'es' ? 'España' : 'Spain')) {
      const spainSectorsOrder = processed[0].data
        .sort((a: SectorDataItem, b: SectorDataItem) => b.value - a.value)
        .map((sector: SectorDataItem) => sector.id || '');
      setSectorOrder(spainSectorsOrder);
    }

    setRegionsData(processed);
  }, [ccaaData, selectedYear, selectedSector, language, selectedCommunity]);

  // Función para normalizar texto (eliminar acentos)
  const normalizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Función para calcular el cambio porcentual año tras año (YoY)
  const calculateYoYChange = (
    year: string,
    region: string,
    sectorId: string,
    sectorName: string
  ): number | undefined => {
    // Si el año es el primero disponible o no hay datos, no podemos calcular YoY
    if (!ccaaData.length || parseInt(year) <= 2013) return undefined;
    
    const previousYear = (parseInt(year) - 1).toString();
    
    console.log(`Calculando YoY para ${region}, sector: ${sectorName}, año: ${year}, año anterior: ${previousYear}`);
    
    // Para España, primero intentar datos históricos
    if (region === 'España' || region === 'Spain') {
      try {
        // Primero, verificar si tenemos datos históricos de referencia
        if (year in spainHistoricalValues && previousYear in spainHistoricalValues &&
            sectorId in spainHistoricalValues[year] && sectorId in spainHistoricalValues[previousYear]) {
          
          const currentValue = spainHistoricalValues[year][sectorId];
          const previousValue = spainHistoricalValues[previousYear][sectorId];
          
          if (previousValue > 0) {
            const yoyValue = ((currentValue - previousValue) / previousValue) * 100;
            console.log(`España (valores históricos) - YoY calculado: ${yoyValue.toFixed(2)}%`);
            return yoyValue;
          }
        }
        
        // Si no hay históricos, buscar en los datos del CSV
        const currentYearData = ccaaData.find(row => 
          row['Año'] === year && 
          (normalizeText(row['Comunidad Limpio']) === 'españa' || normalizeText(row['Comunidad Limpio']) === 'total nacional') && 
          getSectorIdFromCode(row['Sector Id'].replace(/[()]/g, '')) === sectorId
        );
        
        const previousYearData = ccaaData.find(row => 
          row['Año'] === previousYear && 
          (normalizeText(row['Comunidad Limpio']) === 'españa' || normalizeText(row['Comunidad Limpio']) === 'total nacional') && 
          getSectorIdFromCode(row['Sector Id'].replace(/[()]/g, '')) === sectorId
        );
        
        // Si encontramos datos para ambos años, calculamos el YoY
        if (currentYearData && previousYearData) {
          const currentRawValue = parseFloat(currentYearData['% PIB I+D'].replace(',', '.'));
          const previousRawValue = parseFloat(previousYearData['% PIB I+D'].replace(',', '.'));
          
          // Verificar que ambos valores sean válidos
          if (!isNaN(currentRawValue) && !isNaN(previousRawValue) && previousRawValue > 0) {
            const yoyValue = ((currentRawValue - previousRawValue) / previousRawValue) * 100;
            console.log(`España (datos CSV) - YoY calculado: ${yoyValue.toFixed(2)}%`);
            return yoyValue;
          }
        }
      } catch (error) {
        console.error(`Error calculando YoY para España, sector ${sectorName}:`, error);
      }
    } 
    // Para otras comunidades, buscar en los datos del CSV
    else {
      try {
        const normalizedRegionName = normalizeText(region);
        
        // Buscar datos actuales y previos
        let currentYearData = ccaaData.find(row => 
          row['Año'] === year && 
          normalizeText(row['Comunidad Limpio']) === normalizedRegionName && 
          getSectorIdFromCode(row['Sector Id'].replace(/[()]/g, '')) === sectorId
        );
        
        let previousYearData = ccaaData.find(row => 
          row['Año'] === previousYear && 
          normalizeText(row['Comunidad Limpio']) === normalizedRegionName && 
          getSectorIdFromCode(row['Sector Id'].replace(/[()]/g, '')) === sectorId
        );
        
        // Si no encontramos datos directamente, intentar búsqueda más flexible
        if (!currentYearData || !previousYearData) {
          // Intentar búsqueda por mapeo de nombres
          for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
            if (normalizeText(mappedNames.es) === normalizedRegionName || 
                normalizeText(mappedNames.en) === normalizedRegionName ||
                normalizeText(originalName) === normalizedRegionName) {
              
              // Buscar usando el nombre original
              if (!currentYearData) {
                currentYearData = ccaaData.find(row => 
                  row['Año'] === year && 
                  normalizeText(row['Comunidad Limpio']) === normalizeText(originalName) && 
                  getSectorIdFromCode(row['Sector Id'].replace(/[()]/g, '')) === sectorId
                );
              }
              
              if (!previousYearData) {
                previousYearData = ccaaData.find(row => 
                  row['Año'] === previousYear && 
                  normalizeText(row['Comunidad Limpio']) === normalizeText(originalName) && 
                  getSectorIdFromCode(row['Sector Id'].replace(/[()]/g, '')) === sectorId
                );
              }
              
              if (currentYearData && previousYearData) break;
            }
          }
          
          // Intentar búsqueda por coincidencia parcial
          if (!currentYearData || !previousYearData) {
            if (!currentYearData) {
              currentYearData = ccaaData.find(row => 
                row['Año'] === year && 
                (normalizeText(row['Comunidad Limpio']).includes(normalizedRegionName) || 
                 normalizedRegionName.includes(normalizeText(row['Comunidad Limpio']))) && 
                getSectorIdFromCode(row['Sector Id'].replace(/[()]/g, '')) === sectorId
              );
            }
            
            if (!previousYearData) {
              previousYearData = ccaaData.find(row => 
                row['Año'] === previousYear && 
                (normalizeText(row['Comunidad Limpio']).includes(normalizedRegionName) || 
                 normalizedRegionName.includes(normalizeText(row['Comunidad Limpio']))) && 
                getSectorIdFromCode(row['Sector Id'].replace(/[()]/g, '')) === sectorId
              );
            }
          }
        }
        
        // Si encontramos datos para ambos años, calculamos el YoY
        if (currentYearData && previousYearData) {
          const currentRawValue = parseFloat(currentYearData['% PIB I+D'].replace(',', '.'));
          const previousRawValue = parseFloat(previousYearData['% PIB I+D'].replace(',', '.'));
          
          // Verificar que ambos valores sean válidos
          if (!isNaN(currentRawValue) && !isNaN(previousRawValue) && previousRawValue > 0) {
            const yoyValue = ((currentRawValue - previousRawValue) / previousRawValue) * 100;
            console.log(`${region} - YoY calculado: ${yoyValue.toFixed(2)}%`);
            return yoyValue;
          }
        }
      } catch (error) {
        console.error(`Error calculando YoY para ${region}, sector ${sectorName}:`, error);
      }
    }
    
    // Si no se pudo calcular, retornar undefined
    return undefined;
  };

  // Procesar datos CSV - Modificar para que retorne RegionData[] completo
  const processData = (ccaaData: GastoIDComunidadesData[], year: string, sector: string): RegionData[] => {
    // Array para almacenar los datos procesados
    const regionsProcessed: RegionData[] = [];
    
    // Detectar el formato de los datos de PIB
    const pibFormat = detectPIBFormat(ccaaData);
    console.log(`Formato detectado: ${pibFormat.type}`);
    
    // Determinar si los valores ya están en porcentaje (> 1) o en decimal (< 1)
    const dataIsPercentage = pibFormat.type === 'Porcentaje (>1)';
    
    // Procesar datos de España
    if (sector === 'total') {
      // Si estamos viendo el total, usar los datos históricos para España
      const spainTotalValue = getHistoricalSpainTotal(year);
      console.log(`Usando valor histórico para España: ${spainTotalValue}% para año ${year} y sector ${sector}`);
      
      // Crear los sectores para España mediante la función dedicada
      const spainSectors = processSpainData(year);
      
      // Ordenar sectores de mayor a menor valor
      const sortedSpainSectors = spainSectors.sort((a, b) => b.value - a.value);
      
      regionsProcessed.push({
        name: language === 'es' ? 'España' : 'Spain',
        flagCode: 'es',
        code: 'ESP',
        totalPercentage: spainTotalValue.toString(),
        total: spainTotalValue,
        data: sortedSpainSectors
      });
    }
    
    // Función mejorada para encontrar datos de una comunidad
    const findCommunityData = (communityCode: string, communityName?: string, originalName?: string) => {
      // Intentar diferentes estrategias para encontrar los datos de la comunidad
      // 1. Si tenemos nombre original, usarlo primero
      if (originalName) {
        const communityData = ccaaData.find(row => 
          row['Año'] === year &&
          (row['Sector Id'] === `(${sector.toUpperCase()})` || 
          (sector === 'total' && row['Sector Id'] === "(_T)")) &&
          normalizeText(row['Comunidad Limpio']) === normalizeText(originalName)
        );
        
        if (communityData) return communityData;
      }

      // 2. Usar el nombre proporcionado o obtenerlo del código
      const searchName = communityName || communityCode;
      
      // 3. Buscar en los datos por nombre normalizado
      let communityData = ccaaData.find(row => 
        row['Año'] === year &&
        (row['Sector Id'] === `(${sector.toUpperCase()})` || 
        (sector === 'total' && row['Sector Id'] === "(_T)")) &&
        normalizeText(row['Comunidad Limpio']) === normalizeText(searchName)
      );
      
      // 4. Si no se encuentra, buscar usando los mapeos de nombres
      if (!communityData) {
        for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
          const normalizedOriginal = normalizeText(originalName);
          const normalizedMappedEs = normalizeText(mappedNames.es);
          
          // Normalizar el nombre de búsqueda
          const normalizedSearchName = normalizeText(searchName);
          
          // Verificar coincidencias con los nombres mapeados
          if (normalizedOriginal === normalizedSearchName || 
              normalizedMappedEs === normalizedSearchName) {
            
            // Buscar en los datos usando este nombre mapeado
            communityData = ccaaData.find(row => 
              row['Año'] === year &&
              (row['Sector Id'] === `(${sector.toUpperCase()})` || 
               (sector === 'total' && row['Sector Id'] === "(_T)")) &&
              (normalizeText(row['Comunidad Limpio']) === normalizedOriginal ||
               normalizeText(row['Comunidad Limpio']) === normalizedMappedEs)
            );
            
            if (communityData) break;
          }
        }
      }
      
      // 5. Intento adicional: buscar coincidencia parcial
      if (!communityData) {
        communityData = ccaaData.find(row => 
          row['Año'] === year &&
          (row['Sector Id'] === `(${sector.toUpperCase()})` || 
           (sector === 'total' && row['Sector Id'] === "(_T)")) &&
          (normalizeText(row['Comunidad Limpio']).includes(normalizeText(searchName)) ||
           normalizeText(searchName).includes(normalizeText(row['Comunidad Limpio'])))
        );
      }
      
      // 6. Último recurso: buscar por código específico para Ceuta y Melilla
      if (!communityData && (communityCode === 'CEU' || communityCode === 'MEL')) {
        const specialName = communityCode === 'CEU' ? 'ceuta' : 'melilla';
        communityData = ccaaData.find(row => 
          row['Año'] === year &&
          (row['Sector Id'] === `(${sector.toUpperCase()})` || 
           (sector === 'total' && row['Sector Id'] === "(_T)")) &&
          normalizeText(row['Comunidad Limpio']).includes(specialName)
        );
      }
      
      return communityData;
    };
    
    // Función para obtener datos de sectores para una comunidad
    const getSectorData = (communityName: string): SectorDataItem[] => {
      // Buscar datos de sectores para la comunidad
      let sectorDataFilter: GastoIDComunidadesData[] = [];
      
      // Normalizar el nombre de la comunidad para búsquedas
      const normalizedCommunityName = normalizeText(communityName);
      console.log(`Buscando datos de sectores para: "${communityName}"`);
      
      if (communityName === 'España' || communityName === 'Total nacional' || normalizedCommunityName === 'espana') {
        // Para España, usar los valores históricos
        if (year in spainHistoricalValues) {
          return [
            {
              id: 'business',
              name: language === 'es' ? 'Sector empresarial' : 'Business enterprise sector',
              value: spainHistoricalValues[year]['business'],
              color: sectorColors.business,
              sharePercentage: (spainHistoricalValues[year]['business'] / spainHistoricalValues[year]['total']) * 100,
              monetaryValue: calculateMonetaryValueForSpain('business'),
              yoyChange: calculateYoYChange(year, communityName, 'business', language === 'es' ? 'Sector empresarial' : 'Business enterprise sector')
            },
            {
              id: 'government',
              name: language === 'es' ? 'Administración Pública' : 'Government sector',
              value: spainHistoricalValues[year]['government'],
              color: sectorColors.government,
              sharePercentage: (spainHistoricalValues[year]['government'] / spainHistoricalValues[year]['total']) * 100,
              monetaryValue: calculateMonetaryValueForSpain('government'),
              yoyChange: calculateYoYChange(year, communityName, 'government', language === 'es' ? 'Administración Pública' : 'Government sector')
            },
            {
              id: 'education',
              name: language === 'es' ? 'Enseñanza Superior' : 'Higher education sector',
              value: spainHistoricalValues[year]['education'],
              color: sectorColors.education,
              sharePercentage: (spainHistoricalValues[year]['education'] / spainHistoricalValues[year]['total']) * 100,
              monetaryValue: calculateMonetaryValueForSpain('education'),
              yoyChange: calculateYoYChange(year, communityName, 'education', language === 'es' ? 'Enseñanza Superior' : 'Higher education sector')
            },
            {
              id: 'nonprofit',
              name: language === 'es' ? 'Instituciones privadas sin fines de lucro' : 'Private non-profit institutions',
              value: spainHistoricalValues[year]['nonprofit'],
              color: sectorColors.nonprofit,
              sharePercentage: (spainHistoricalValues[year]['nonprofit'] / spainHistoricalValues[year]['total']) * 100,
              monetaryValue: calculateMonetaryValueForSpain('nonprofit'),
              yoyChange: calculateYoYChange(year, communityName, 'nonprofit', language === 'es' ? 'Instituciones privadas sin fines de lucro' : 'Private non-profit institutions')
            }
          ];
        }
        
        // Para España, buscamos por 'Total nacional' o 'España' en cualquiera de los campos de comunidad
        sectorDataFilter = ccaaData.filter(row => 
          row["Año"] === year && 
          (normalizeText(row['Comunidad Limpio']) === 'total nacional' || 
           normalizeText(row['Comunidad Limpio']) === 'espana' || 
           normalizeText(row['Comunidad (Original)']) === 'total nacional' || 
           normalizeText(row['Comunidad (Original)']) === 'espana') && 
          row['Sector Id'] !== "(_T)" && 
          row['Sector Id'] !== "_T"
        );
      } else {
        // Para otras comunidades, buscar por nombre de comunidad
        sectorDataFilter = ccaaData.filter(row => 
          row["Año"] === year && 
          (normalizeText(row['Comunidad Limpio']) === normalizedCommunityName ||
           normalizeText(row['Comunidad (Original)']) === normalizedCommunityName ||
           normalizeText(row['Comunidad en Inglés']) === normalizedCommunityName) && 
          row['Sector Id'] !== "(_T)" && 
          row['Sector Id'] !== "_T"
        );
        
        // Si no se encuentra, intentar con los mapeos de comunidades
        if (sectorDataFilter.length === 0) {
          for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
            const normalizedOriginal = normalizeText(originalName);
            const normalizedMappedEs = normalizeText(mappedNames.es);
            const normalizedMappedEn = normalizeText(mappedNames.en);
            
            if (normalizedOriginal === normalizedCommunityName ||
                normalizedMappedEs === normalizedCommunityName ||
                normalizedMappedEn === normalizedCommunityName) {
              
              // Buscar usando estos nombres mapeados
              sectorDataFilter = ccaaData.filter(row => 
                row["Año"] === year && 
                (normalizeText(row['Comunidad Limpio']) === normalizedOriginal ||
                  normalizeText(row['Comunidad Limpio']) === normalizedMappedEs) && 
                row['Sector Id'] !== "(_T)" && 
                row['Sector Id'] !== "_T"
              );
              
              if (sectorDataFilter.length > 0) {
                console.log(`Encontrados ${sectorDataFilter.length} sectores para "${communityName}" usando mapeo`);
                break;
              }
            }
          }
        }
        
        // Para casos especiales como Ceuta y Melilla, intentar búsqueda por coincidencia parcial
        if (sectorDataFilter.length === 0) {
          if (normalizedCommunityName.includes('ceuta')) {
            sectorDataFilter = ccaaData.filter(row => 
              row["Año"] === year && 
              normalizeText(row['Comunidad Limpio']).includes('ceuta') && 
              row['Sector Id'] !== "(_T)" && 
              row['Sector Id'] !== "_T"
            );
            console.log(`Búsqueda especial para Ceuta: ${sectorDataFilter.length} sectores encontrados`);
          } else if (normalizedCommunityName.includes('melilla')) {
            sectorDataFilter = ccaaData.filter(row => 
              row["Año"] === year && 
              normalizeText(row['Comunidad Limpio']).includes('melilla') && 
              row['Sector Id'] !== "(_T)" && 
              row['Sector Id'] !== "_T"
            );
            console.log(`Búsqueda especial para Melilla: ${sectorDataFilter.length} sectores encontrados`);
          } else {
            // Último recurso: búsqueda por coincidencia parcial para otras comunidades
            sectorDataFilter = ccaaData.filter(row => 
              row["Año"] === year && 
              (normalizeText(row['Comunidad Limpio']).includes(normalizedCommunityName) || 
               normalizedCommunityName.includes(normalizeText(row['Comunidad Limpio']))) && 
              row['Sector Id'] !== "(_T)" && 
              row['Sector Id'] !== "_T"
            );
          }
        }
      }
      
      // Si no hay datos para la comunidad seleccionada, devolver un array vacío
      if (sectorDataFilter.length === 0) {
        console.log(`No se encontraron datos de sectores para la comunidad: ${communityName}`);
        return [];
      }
      
      // Obtener el total de la comunidad para calcular porcentajes
      let totalValue = 0;
      
      // Método 1: Buscar el total directamente
      let totalData;
      
      if (communityName === 'España' || communityName === 'Total nacional' || normalizedCommunityName === 'espana') {
        totalData = ccaaData.find(row => 
          row["Año"] === year && 
          (normalizeText(row['Comunidad Limpio']) === 'total nacional' || 
           normalizeText(row['Comunidad Limpio']) === 'espana' || 
           normalizeText(row['Comunidad (Original)']) === 'total nacional' || 
           normalizeText(row['Comunidad (Original)']) === 'espana') && 
          row['Sector Id'] === "(_T)"
        );
      } else {
        totalData = ccaaData.find(row => 
          row["Año"] === year && 
          (normalizeText(row['Comunidad Limpio']) === normalizedCommunityName ||
           normalizeText(row['Comunidad (Original)']) === normalizedCommunityName ||
           normalizeText(row['Comunidad en Inglés']) === normalizedCommunityName) && 
          row['Sector Id'] === "(_T)"
        );
        
        // Si no encontramos datos totales, intentar búsqueda con los mapeos
        if (!totalData) {
          for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
            if (normalizeText(originalName) === normalizedCommunityName ||
                normalizeText(mappedNames.es) === normalizedCommunityName ||
                normalizeText(mappedNames.en) === normalizedCommunityName) {
              
              totalData = ccaaData.find(row => 
                row["Año"] === year && 
                (normalizeText(row['Comunidad Limpio']) === normalizeText(originalName) ||
                 normalizeText(row['Comunidad Limpio']) === normalizeText(mappedNames.es)) && 
                row['Sector Id'] === "(_T)"
              );
              
              if (totalData) break;
            }
          }
        }
        
        // Para casos especiales, intentar búsqueda por coincidencia parcial
        if (!totalData) {
          if (normalizedCommunityName.includes('ceuta')) {
            totalData = ccaaData.find(row => 
              row["Año"] === year && 
              normalizeText(row['Comunidad Limpio']).includes('ceuta') && 
              row['Sector Id'] === "(_T)"
            );
          } else if (normalizedCommunityName.includes('melilla')) {
            totalData = ccaaData.find(row => 
              row["Año"] === year && 
              normalizeText(row['Comunidad Limpio']).includes('melilla') && 
              row['Sector Id'] === "(_T)"
            );
          }
        }
      }
      
      // Método 2: Si no hay datos totales, calcular la suma de sectores
      if (totalData) {
        totalValue = parseFloat(totalData['% PIB I+D'].replace(',', '.'));
      } else {
        // Sumar los valores de todos los sectores
        totalValue = sectorDataFilter.reduce((sum, row) => {
          const sectorValue = parseFloat(row['% PIB I+D'].replace(',', '.')) || 0;
          return sum + sectorValue;
        }, 0);
      }
      
      // Si aún no tenemos valor total, usar el valor de España
      if (totalValue <= 0) {
        totalValue = getHistoricalSpainTotal(year);
      }
      
      // Mapear los sectores a SectorDataItem
      return sectorDataFilter.map(row => {
        const sectorId = getSectorIdFromCode(row['Sector Id'].replace(/[()]/g, ''));
        
        // Procesar valor numérico con manejo seguro de errores
        let rawValue = 0;
        try {
          // Asegurar que se use el punto como separador decimal
          const cleanedValue = row['% PIB I+D'].replace(',', '.');
          const parsedValue = parseFloat(cleanedValue);
          // Aplicar formato según lo detectado (porcentaje o decimal)
          rawValue = dataIsPercentage ? parsedValue : parsedValue;
          
          if (isNaN(rawValue)) rawValue = 0;
        } catch (e) {
          console.error(`Error al parsear % PIB I+D: ${row['% PIB I+D']}`, e);
          rawValue = 0;
        }
        
        // Obtener el valor monetario con manejo seguro de errores
        let monetaryValue: number | undefined = undefined;
        try {
          if (row['Gasto en I+D (Miles €)']) {
            // Mantener el valor en miles de euros (no dividir por 1000)
            const cleanedMonetary = row['Gasto en I+D (Miles €)'].replace('.', '').replace(',', '.');
            monetaryValue = parseFloat(cleanedMonetary);
            if (isNaN(monetaryValue)) monetaryValue = undefined;
          } else if (row['PIB (Miles €)'] && rawValue > 0) {
            // Si no hay valor directo, calcularlo a partir del porcentaje y el PIB
            const cleanedPIB = row['PIB (Miles €)'].replace('.', '').replace(',', '.');
            const pib = parseFloat(cleanedPIB);
            if (!isNaN(pib)) {
              monetaryValue = (pib * rawValue / 100);
              if (isNaN(monetaryValue)) monetaryValue = undefined;
            }
          }
        } catch (e) {
          console.error(`Error al calcular valor monetario para sector ${sectorId}`, e);
          monetaryValue = undefined;
        }
        
        // Calcular el porcentaje de participación respecto al total
        const sharePercentage = totalValue > 0 ? (rawValue / totalValue) * 100 : 0;
        
        // Calcular YoY
        const yoyChangeValue = calculateYoYChange(year, communityName, sectorId, row['Sector Nombre']);
        
        return {
          id: sectorId,
          name: language === 'es' ? 
            rdSectors.find(s => s.id === sectorId)?.name.es || row['Sector Nombre'] :
            rdSectors.find(s => s.id === sectorId)?.name.en || row['Sector'],
          value: rawValue,
          color: sectorColors[sectorId as keyof typeof sectorColors] || '#cbd5e1',
          sharePercentage: sharePercentage,
          monetaryValue,
          yoyChange: yoyChangeValue
        };
      });
    };
    
    // Datos para la comunidad seleccionada
    const selectedCommunityData = findCommunityData(
      selectedCommunity.code, 
      selectedCommunity.name,
      selectedCommunity.originalName
    );
    
    // Datos para Canarias
    const canaryData = ccaaData.filter(row => 
      row['Año'] === year && 
      normalizeText(row['Comunidad Limpio']) === "canarias" &&
      (row['Sector Id'] === `(${sector.toUpperCase()})` || 
       (sector === 'total' && row['Sector Id'] === "(_T)"))
    );
    
    // Procesar Comunidad seleccionada
    if (selectedCommunityData) {
      // Asegurar que se use el punto como separador decimal
      const cleanedValue = selectedCommunityData['% PIB I+D'].replace(',', '.');
      const parsedValue = parseFloat(cleanedValue);
      // Aplicar formato según lo detectado (porcentaje o decimal)
      const totalValue = dataIsPercentage ? parsedValue : parsedValue;
      
      const communitySectors = getSectorData(selectedCommunityData['Comunidad Limpio']);
      
      // Ordenar sectores de mayor a menor valor
      const sortedCommunitySectors = communitySectors.sort((a, b) => b.value - a.value);
      
      // Obtener el nombre correcto de la comunidad usando el mapeo
      let displayName = selectedCommunityData['Comunidad Limpio'];
      
      // Buscar en el mapeo para usar nombres consistentes con los otros componentes
      for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
        if (normalizeText(originalName) === normalizeText(displayName)) {
          displayName = language === 'es' ? mappedNames.es : mappedNames.en;
          break;
        }
      }
      
      regionsProcessed.push({
        name: displayName,
        flagCode: 'community',
        code: selectedCommunity.code,
        totalPercentage: totalValue.toFixed(2),
        total: totalValue,
        data: sortedCommunitySectors
      });
    } else if (selectedCommunity) {
      console.log(`No se encontraron datos para la comunidad seleccionada: ${selectedCommunity.name}`);
      
      // Si no tenemos datos pero tenemos una comunidad seleccionada, 
      // mostrar un gráfico vacío pero con el nombre correcto
      
      // Buscar el nombre correcto en el mapeo
      let displayName = selectedCommunity.name;
      
      // Para comunidades especiales como Ceuta y Melilla, usar nombres consistentes
      if (selectedCommunity.code === 'CEU') {
        displayName = language === 'es' ? 'Ceuta' : 'Ceuta';
      } else if (selectedCommunity.code === 'MEL') {
        displayName = language === 'es' ? 'Melilla' : 'Melilla';
      } else {
        // Buscar en el mapeo para usar nombres consistentes
        for (const [originalName, mappedNames] of Object.entries(communityNameMapping)) {
          if (normalizeText(originalName) === normalizeText(displayName) ||
              normalizeText(mappedNames.es) === normalizeText(displayName) ||
              normalizeText(mappedNames.en) === normalizeText(displayName)) {
            
            displayName = language === 'es' ? mappedNames.es : mappedNames.en;
            break;
          }
        }
      }
      
      // Buscar algún dato para esta comunidad en cualquier otro año para aproximar
      const anyYearData = ccaaData.find(row => 
        (normalizeText(row['Comunidad Limpio']) === normalizeText(selectedCommunity.name) ||
         normalizeText(row['Comunidad (Original)']) === normalizeText(selectedCommunity.name) ||
         (selectedCommunity.code === 'CEU' && normalizeText(row['Comunidad Limpio']).includes('ceuta')) ||
         (selectedCommunity.code === 'MEL' && normalizeText(row['Comunidad Limpio']).includes('melilla'))) &&
        row['Sector Id'] === "(_T)"
      );
      
      const defaultValue = anyYearData ? parseFloat(anyYearData['% PIB I+D'].replace(',', '.')) : 0;
      // Si es formato decimal, no multiplicar por 100
      const adjustedValue = dataIsPercentage ? defaultValue : defaultValue;
      
      regionsProcessed.push({
        name: displayName,
        flagCode: 'community',
        code: selectedCommunity.code,
        totalPercentage: adjustedValue.toFixed(2),
        total: adjustedValue,
        data: [] // Sin datos de sectores
      });
    }
    
    // Canarias
    if (canaryData.length > 0) {
      const canaryTotalData = canaryData[0];
      // Asegurar que se use el punto como separador decimal
      const cleanedValue = canaryTotalData['% PIB I+D'].replace(',', '.');
      const parsedValue = parseFloat(cleanedValue);
      // Aplicar formato según lo detectado (porcentaje o decimal)
      const totalValue = dataIsPercentage ? parsedValue : parsedValue;
      
      const canarySectors = getSectorData('Canarias');
      
      // Ordenar sectores de mayor a menor valor
      const sortedCanarySectors = canarySectors.sort((a, b) => b.value - a.value);
      
      regionsProcessed.push({
        name: language === 'es' ? 'Canarias' : 'Canary Islands',
        flagCode: 'canary_islands',
        code: 'CAN',
        totalPercentage: totalValue.toFixed(2),
        total: totalValue,
        data: sortedCanarySectors
      });
    }
    
    // Verificar que las sumas sectoriales correspondan aproximadamente al total
    regionsProcessed.forEach(region => {
      const sectorSum = region.data.reduce((total, sector) => total + sector.value, 0);
      console.log(`${region.name} - Total declarado: ${region.total.toFixed(2)}%, Suma sectores: ${sectorSum.toFixed(2)}%`);
      
      // Si hay una discrepancia grande, ajustar los porcentajes sectoriales
      if (Math.abs(sectorSum - region.total) > 0.1 && sectorSum > 0) {
        console.log(`  Ajustando porcentajes sectoriales para ${region.name}`);
        const adjustmentFactor = region.total / sectorSum;
        
        region.data.forEach(sector => {
          // Ajustar el valor para que la suma coincida con el total
          sector.value = sector.value * adjustmentFactor;
          
          // Recalcular sharePercentage basado en los valores ajustados
          sector.sharePercentage = (sector.value / region.total) * 100;
        });
      }
    });
    
    return regionsProcessed;
  };

  // Añadir una función dedicada para procesar los datos de España
  const processSpainData = (year: string) => {
    // Leer los datos históricos para crear la distribución sectorial
    const spainData = historicalSpainData.find(item => item.year === year);
    
    if (!spainData) {
      console.warn(`No hay datos históricos para España en el año ${year}`);
      return [];
    }
    
    // Valores monetarios según el sector (para debugging)
    const businessValue = calculateMonetaryValueForSpain('business');
    const governmentValue = calculateMonetaryValueForSpain('government');
    const educationValue = calculateMonetaryValueForSpain('education');
    const nonprofitValue = calculateMonetaryValueForSpain('nonprofit');
    
    // Crear los sectores basados en los datos históricos
    const sectors: SectorDataItem[] = [
      {
              name: language === 'es' ? 'Sector empresarial' : 'Business enterprise sector',
        value: spainData.business,
              color: sectorColors.business,
        sharePercentage: (spainData.business / spainData.total) * 100,
        monetaryValue: businessValue,
        yoyChange: calculateYoYChange(year, 'España', 'business', 'Empresas'),
        id: 'business'
      },
      {
              name: language === 'es' ? 'Administración Pública' : 'Government sector',
        value: spainData.government,
              color: sectorColors.government,
        sharePercentage: (spainData.government / spainData.total) * 100,
        monetaryValue: governmentValue,
        yoyChange: calculateYoYChange(year, 'España', 'government', 'Administración Pública'),
        id: 'government'
      },
      {
              name: language === 'es' ? 'Enseñanza Superior' : 'Higher education sector',
        value: spainData.education,
              color: sectorColors.education,
        sharePercentage: (spainData.education / spainData.total) * 100,
        monetaryValue: educationValue,
        yoyChange: calculateYoYChange(year, 'España', 'education', 'Enseñanza Superior'),
        id: 'education'
      },
      {
              name: language === 'es' ? 'Instituciones privadas sin fines de lucro' : 'Private non-profit institutions',
        value: spainData.nonprofit,
              color: sectorColors.nonprofit,
        sharePercentage: (spainData.nonprofit / spainData.total) * 100,
        monetaryValue: nonprofitValue,
        yoyChange: calculateYoYChange(year, 'España', 'nonprofit', 'Instituciones Privadas sin Fines de Lucro'),
        id: 'nonprofit'
      }
    ];
    
    // Guardar el orden de los sectores para usarlo en otras regiones
    setSectorOrder(sectors.map(s => s.id || ''));
    
    return sectors;
  };
  
  // Función para obtener el ID del sector a partir del código
  const getSectorIdFromCode = (sectorCode: string): string => {
    // Mapeo directo basado en los códigos del CSV
    if (sectorCode === 'EMPRESAS' || sectorCode === 'BES') return 'business';
    if (sectorCode === 'ADMINISTRACION_PUBLICA' || sectorCode === 'GOV') return 'government';
    if (sectorCode === 'ENSENIANZA_SUPERIOR' || sectorCode === 'HES') return 'education';
    if (sectorCode === 'IPSFL' || sectorCode === 'PNP') return 'nonprofit';
    
    const sector = rdSectors.find(s => s.code === sectorCode);
    return sector?.id || 'unknown';
  };

  // Obtener el valor de color sin el prefijo bg-
  const getHeaderColorValue = (code: FlagCode): string => {
    switch(code) {
      case 'es':
        return '#dc2626'; // red-600
      case 'community':
        return '#0ea5e9'; // sky-500
      case 'canary_islands':
        return '#3b82f6'; // blue-500
      default:
        return '#6366f1'; // indigo-500
    }
  };

  // Componente para mostrar la lista de sectores
  const SectorList: React.FC<{
    data: RegionData;
  }> = ({ data }) => {
    // Si no hay datos, mostrar mensaje
    if (data.data.length === 0) {
      return (
        <div className="mt-1 text-center py-4">
          <p className="text-sm text-gray-500">{language === 'es' ? 'No hay datos sectoriales disponibles' : 'No sector data available'}</p>
        </div>
      );
    }
    
    // Ordenar los sectores según el orden establecido por España
    const sortedData = [...data.data];
    
    if (sectorOrder.length > 0) {
      // Ordenar según el orden de España si está disponible
      sortedData.sort((a, b) => {
        const indexA = sectorOrder.indexOf(a.id || '');
        const indexB = sectorOrder.indexOf(b.id || '');
        
        // Si ambos sectores están en el orden, usar ese orden
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // Si solo uno está en el orden, priorizar el que está
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // Si ninguno está en el orden, ordenar por valor
        return b.value - a.value;
      });
    } else {
      // Fallback: ordenar por valor si no hay orden establecido
      sortedData.sort((a, b) => b.value - a.value);
    }
    
    return (
      <div className="mt-1">
        {/* Encabezados de la tabla */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-1">
          <div>{t.sector}</div>
          <div className="text-right">{t.pibPercentage}</div>
          <div className="text-right">%{t.total}</div>
        </div>
        
        {/* Filas de datos */}
        {sortedData.map((sector: SectorDataItem, i: number) => (
          <div key={i} className="grid grid-cols-3 gap-2 text-xs py-1 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: sector.color, border: '1px solid rgba(0,0,0,0.1)' }}></div>
              <div className="leading-tight">{sector.name}</div>
            </div>
            <div className="font-medium text-right">{sector.value.toFixed(2)}%</div>
            <div className="text-right text-gray-600">{sector.sharePercentage?.toFixed(2)}%</div>
          </div>
        ))}
        
        {/* Fila de totales */}
        <div className="grid grid-cols-3 gap-2 text-xs py-1 border-t border-gray-200 font-medium mt-1">
          <div>{t.total}:</div>
          <div className="text-right">{data.total.toFixed(2)}%</div>
          <div className="text-right">100%</div>
        </div>
      </div>
    );
  };

  // Añadir una función para calcular el valor monetario para España basado en gdp_consolidado.csv
  const calculateMonetaryValueForSpain = (sectorId: string): number => {
    // Valores fijos exactos para cada sector en millones de euros
    if (selectedYear === '2023') {
      const valores2023: Record<string, number> = {
        'total': 22325,
        'business': 12586,
        'government': 4045,
        'education': 5694,
        'nonprofit': 0
      };
      
      if (sectorId in valores2023) {
        return valores2023[sectorId];
      }
    }
    
    // Valores para 2022 si se necesitan
    if (selectedYear === '2022') {
      const valores2022: Record<string, number> = {
        'total': 21035,
        'business': 11836,
        'government': 3595,
        'education': 5544,
        'nonprofit': 60
      };
      
      if (sectorId in valores2022) {
        return valores2022[sectorId];
      }
    }
    
    // Si no se encuentra un valor válido, devolver 0
    return 0;
  };

  // Agregar una función para formatear números con separador de miles
  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    }).format(value);
  };



  // Función personalizada para el contenido del tooltip
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, region }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      
      // Obtener el valor monetario desde los datos
      const monetaryValue = data.monetaryValue !== undefined ? data.monetaryValue : 0;
      
      // Obtener el cambio YoY desde los datos
      const yoyChange = data.yoyChange;
      
      // Obtener el total de PIB
      // Para España, debemos mostrar siempre el valor total correcto
      const totalPib = data.totalPib || parseFloat(data.value.toString()).toFixed(2);
      
      // Usar el color del sector para la línea superior
      const borderColor = data.color || '#64748b'; // Color por defecto si no hay color de sector
      
      // Determinar el color basado en si el YoY es positivo o negativo
      const yoyColor = yoyChange === undefined ? 'bg-gray-100 text-gray-600' : 
                      (yoyChange > 0 ? 'bg-green-100 text-green-700' : 
                      yoyChange < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600');
      
      // Determinar el icono basado en si el YoY es positivo o negativo
      const yoyIcon = yoyChange === undefined ? null : 
                     (yoyChange > 0 ? 
                      "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" :
                      yoyChange < 0 ?
                      "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" :
                      "M5.75 12.25H18.25M5.75 12.25L9 16M5.75 12.25L9 9");
      
      // Formatear el valor YoY para mostrar - redondear a 1 decimal siempre
      const formattedYoY = yoyChange === undefined ? "" : 
                          (Math.abs(yoyChange) < 0.01 ? "±0.0% YoY" : 
                          `${yoyChange > 0 ? '+' : ''}${yoyChange.toFixed(1)}% YoY`);
      
      // Determinar el estilo visual del indicador YoY
      const yoyDisplay = yoyChange === undefined ? "hidden" : "flex";
      
      // Valores específicos para sectores de España y formato especial
      let displayMonetaryValue = monetaryValue;
      let monetaryUnit = '';
      
      if (region === (language === 'es' ? 'España' : 'Spain')) {
        // Para España, mantener en millones de euros
        if (selectedYear === '2023') {
          const sectorName = data.name;
          if (sectorName === (language === 'es' ? 'Administración Pública' : 'Government sector')) {
            displayMonetaryValue = 4045;
          } else if (sectorName === (language === 'es' ? 'Sector empresarial' : 'Business enterprise sector')) {
            displayMonetaryValue = 12586;
          } else if (sectorName === (language === 'es' ? 'Enseñanza Superior' : 'Higher education sector')) {
            displayMonetaryValue = 5694;
          } else if (sectorName === (language === 'es' ? 'Instituciones privadas sin fines de lucro' : 'Private non-profit sector')) {
            displayMonetaryValue = 0;
          }
        } else if (selectedYear === '2022') {
          const sectorName = data.name;
          if (sectorName === (language === 'es' ? 'Administración Pública' : 'Government sector')) {
            displayMonetaryValue = 3595;
          } else if (sectorName === (language === 'es' ? 'Sector empresarial' : 'Business enterprise sector')) {
            displayMonetaryValue = 11836;
          } else if (sectorName === (language === 'es' ? 'Enseñanza Superior' : 'Higher education sector')) {
            displayMonetaryValue = 5544;
          } else if (sectorName === (language === 'es' ? 'Instituciones privadas sin fines de lucro' : 'Private non-profit sector')) {
            displayMonetaryValue = 60;
          }
        }
        monetaryUnit = language === 'es' ? 'Mill. €' : 'Mill. €';
      } else {
        // Para comunidades autónomas, mostrar en miles de euros
        monetaryUnit = language === 'es' ? 'miles €' : 'K €';
      }
      
      // Formatear el valor monetario según corresponda
      const formattedMonetary = (displayMonetaryValue !== undefined && !isNaN(displayMonetaryValue))
        ? formatNumber(displayMonetaryValue, 0)
        : '0';
      
      return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ width: "240px", boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
          {/* Línea superior de color */}
          <div className="h-1" style={{ backgroundColor: borderColor }}></div>
          
          {/* Contenido principal */}
          <div className="p-4">
            {/* Cabecera con sector y región */}
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 rounded-full mr-2" style={{ backgroundColor: data.color }}></div>
              <div>
                <div className="text-sm font-bold text-gray-900">{data.name}</div>
                <div className="text-xs text-gray-500">{region}</div>
              </div>
            </div>
            
            {/* Valores principales */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-2xl font-bold text-gray-900">{data.value.toFixed(2)}%</div>
                <div className="text-xs text-gray-500">{t.ofGDP}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">{data.sharePercentage?.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">del total</div>
              </div>
            </div>
            
            {/* Indicador YoY - solo se muestra si hay datos disponibles */}
            <div className={`justify-end mb-3 ${yoyDisplay}`}>
              <div className={`inline-flex items-center px-2 py-0.5 ${yoyColor} text-xs rounded-full`}>
                {yoyIcon && (
                  <svg 
                    className="h-3 w-3 mr-0.5" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d={yoyIcon}
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {formattedYoY}
              </div>
            </div>
            
            {/* Información adicional */}
            <div className="flex justify-between items-center text-xs">
              <div className="text-gray-700 font-medium">
                {formattedMonetary} {monetaryUnit}
              </div>
              <div className="text-blue-600 font-medium">Total: {totalPib}% {t.ofGDP}</div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Filter section */}
      <div className="bg-blue-50 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Selector de año */}
          <div className="flex items-center">
            <Calendar size={18} className="text-blue-600 mr-2" />
            <label htmlFor="year-select" className="text-gray-700 font-medium mr-2">{t.year}:</label>
            <select 
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Chart grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {regionsData.map((region, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded overflow-hidden">
              {/* Region header */}
              <div className="bg-white p-3 flex items-center justify-between border-t-4" style={{ borderColor: getHeaderColorValue(region.flagCode) }}>
                <div className="flex items-center">
                  <div className="mr-3">
                    <Flag 
                      code={region.flagCode} 
                      width={24} 
                      height={18} 
                      communityCode={region.code} 
                    />
                  </div>
                  
                  {/* Si es la segunda tarjeta (índice 1) y es una comunidad, agregar selector */}
                  {index === 1 && region.flagCode === 'community' ? (
                    <div className="relative">
                      <button 
                        className="font-medium text-gray-800 flex items-center border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                      >
                        <span className="mr-1 truncate max-w-[150px]">{region.name}</span>
                        <ChevronDown size={16} className="text-gray-500 ml-auto" />
                      </button>
                      
                      {dropdownOpen && (
                        <div 
                          className="absolute z-10 mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto w-64"
                          style={{ maxHeight: '300px' }}
                        >
                          <div className="py-1">
                            {availableCommunities.map(community => (
                              <button
                                key={community.code}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${selectedCommunity?.code === community.code ? 'bg-blue-50' : ''}`}
                                onClick={() => {
                                  setSelectedCommunity(community);
                                  setDropdownOpen(false);
                                }}
                              >
                                <div className="mr-2">
                                  {community.flag ? (
                                    <img 
                                      src={community.flag} 
                                      alt={community.name} 
                                      width={20} 
                                      height={15} 
                                      className="rounded border border-gray-300 shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-5 h-4 bg-gray-200 rounded border border-gray-300"></div>
                                  )}
                                </div>
                                {community.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                  <h3 className="font-medium text-gray-800">{region.name}</h3>
                  )}
                </div>
              </div>
              
              {/* Chart */}
              <div className="py-5 px-2 flex justify-center">
                <div className="relative w-48 h-48">
                  {region.data.length > 0 ? (
                    <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          // Ordenar los datos según el orden establecido por España
                          const sortedData = [...region.data];
                          if (sectorOrder.length > 0) {
                            sortedData.sort((a, b) => {
                              const indexA = sectorOrder.indexOf(a.id || '');
                              const indexB = sectorOrder.indexOf(b.id || '');
                              
                              if (indexA !== -1 && indexB !== -1) {
                                return indexA - indexB;
                              }
                              if (indexA !== -1) return -1;
                              if (indexB !== -1) return 1;
                              return b.value - a.value;
                            });
                          } else {
                            sortedData.sort((a, b) => b.value - a.value);
                          }
                          return sortedData;
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        isAnimationActive={true}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {(() => {
                          // Ordenar los datos según el orden establecido por España
                          const sortedData = [...region.data];
                          if (sectorOrder.length > 0) {
                            sortedData.sort((a, b) => {
                              const indexA = sectorOrder.indexOf(a.id || '');
                              const indexB = sectorOrder.indexOf(b.id || '');
                              
                              if (indexA !== -1 && indexB !== -1) {
                                return indexA - indexB;
                              }
                              if (indexA !== -1) return -1;
                              if (indexB !== -1) return 1;
                              return b.value - a.value;
                            });
                          } else {
                            sortedData.sort((a, b) => b.value - a.value);
                          }
                          return sortedData;
                        })().map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.color} 
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={<CustomTooltip region={region.name} />}
                        wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
                        cursor={false}
                        position={{ x: 0, y: 0 }}
                        offset={20}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-800">{parseFloat(region.totalPercentage).toFixed(2)}%</span>
                    <span className="text-sm text-gray-500">{t.ofGDP}</span>
                  </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 rounded-full border-2 border-gray-200 flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">{language === 'es' ? 'No hay datos disponibles' : 'No data available'}</p>
                      <p className="text-xs text-gray-400">{language === 'es' ? 'para el año seleccionado' : 'for the selected year'}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Data table */}
              <div className="px-4 pb-4">
                <SectorList data={region} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityDistribution; 