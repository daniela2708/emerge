import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Customized
} from 'recharts';
import {
  ChevronDown
} from 'lucide-react';
import country_flags from '../logos/country_flags.json';
import { communityFlags, communityNameMapping } from '../utils/spanishCommunitiesUtils';

// Interfaz para los datos de PIB y gasto en I+D
interface GDPConsolidadoData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  '%GDP': string;
  ISO3: string;
  Value?: string; // Valor monetario opcional
  Approx_RD_Investment_million_euro?: string; // Inversión aproximada en millones de euros
}

// Interfaz para los datos de comunidades autónomas
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
}

// Interfaz para los datos del selector de comunidades
interface CommunityOption {
  name: string;
  localName: string;
  code: string;
}

// Interfaz para las propiedades del componente
interface CommunityRDComparisonChartProps {
  language: 'es' | 'en';
  gdpData: GDPConsolidadoData[];
  autonomousCommunitiesData: GastoIDComunidadesData[];
  years: string[];
  selectedSector: string;
}

// Interfaz para un punto de datos en la serie temporal
interface TimeSeriesDataPoint {
  year: string;
  spain: number | null;
  canary: number | null;
  community: number | null;
  [key: string]: string | number | null; // Para poder agregar dinámicamente la comunidad seleccionada
}

// Interfaz para representar un sector
interface SectorOption {
  id: string;
  name: {
    es: string;
    en: string;
  };
}

// Interfaz para los textos de localización
interface LocalizedTexts {
  title: string;
  canary: string;
  spain: string;
  selectSector: string;
  selectCommunity: string;
  allSectors: string;
  percentGDP: string;
  year: string;
  loading: string;
  noData: string;
  business: string;
  government: string;
  education: string;
  nonprofit: string;
}

// Interfaz para las escalas de Recharts
interface AxisScale {
  scale: (value: unknown) => number;
}

// Tabla de mapeo entre nombres de comunidades en el CSV y nombres en español/inglés

// Parámetros para las banderas
const FLAG_SIZE = 20;
const FLAG_MARGIN = 6; // Separación del último punto
const MIN_GAP = 24; // Mínima separación vertical entre banderas

// Componente principal de la gráfica de comparación
const CommunityRDComparisonChart: React.FC<CommunityRDComparisonChartProps> = ({ 
  language, 
  gdpData,
  autonomousCommunitiesData,
  years,
  selectedSector
}) => {
  // Estado para la comunidad seleccionada (por defecto Madrid)
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityOption>({
    name: 'Madrid',
    localName: 'Madrid',
    code: 'MAD'
  });
  
  // Estado para la lista de comunidades disponibles
  const [availableCommunities, setAvailableCommunities] = useState<CommunityOption[]>([]);
  
  // Estado para los datos de la serie temporal
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado para controlar la apertura del dropdown
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  
  // Referencia para detectar clics fuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Textos localizados
  const texts = {
    es: {
      title: "Comparativa de Inversión en I+D",
      canary: "Islas Canarias",
      spain: "España",
      selectSector: "Sector",
      selectCommunity: "Seleccionar comunidad",
      allSectors: "Todos los sectores",
      percentGDP: "% del PIB",
      year: "Año",
      loading: "Cargando datos...",
      noData: "No hay datos disponibles",
      // Sectores
      business: "Sector empresarial",
      government: "Administración Pública",
      education: "Enseñanza Superior",
      nonprofit: "Instituciones Privadas sin Fines de Lucro"
    },
    en: {
      title: "R&D Investment Comparison",
      canary: "Canary Islands",
      spain: "Spain",
      selectSector: "Sector",
      selectCommunity: "Select community",
      allSectors: "All sectors",
      percentGDP: "% of GDP",
      year: "Year",
      loading: "Loading data...",
      noData: "No data available",
      // Sectors
      business: "Business enterprise sector",
      government: "Government sector",
      education: "Higher education sector",
      nonprofit: "Private non-profit sector"
    }
  };
  
  const t = texts[language];
  
  // Colores para las líneas
  const lineColors = {
    spain: "#dc2626", // Rojo para España
    canary: "#3b82f6", // Azul para Canarias
    community: "#4338ca", // Índigo para la comunidad seleccionada
  };
  
  // Efecto para cargar las comunidades autónomas disponibles
  useEffect(() => {
    if (!autonomousCommunitiesData || autonomousCommunitiesData.length === 0) return;
    
    // Filtrar las comunidades autónomas únicas (excluyendo Canarias que será línea fija)
    const communities = autonomousCommunitiesData
      .filter(row => 
        row["Sector Id"] === "(_T)" && 
        normalizeText(row["Comunidad Limpio"]) !== "canarias"
      )
      .reduce((acc: CommunityOption[], row) => {
        const communityName = row["Comunidad Limpio"];
        const englishName = row["Comunidad en Inglés"];
        const originalName = row["Comunidad (Original)"];
        
        // Buscar nombre estandarizado usando communityNameMapping
        let standardizedName = {
          es: communityName,
          en: englishName
        };
        
        // Buscar en el mapeo para nombres estandarizados
        for (const key in communityNameMapping) {
          if (normalizeText(key) === normalizeText(communityName) || 
              normalizeText(key) === normalizeText(originalName)) {
            standardizedName = communityNameMapping[key];
            break;
          }
        }
        
        // Caso especial para Madrid: asegurarse de usar el nombre estandarizado
        if (normalizeText(communityName).includes('madrid') || 
            normalizeText(originalName).includes('madrid')) {
          standardizedName = { es: 'Madrid', en: 'Madrid' };
        }
        
        // Buscar la comunidad en el objeto de banderas
        const flag = communityFlags.find(f =>
          normalizeText(f.community) === normalizeText(communityName) || 
          f.community.includes(originalName.replace(/\(ES\d+\)\s/, ''))
        );
        
        // Extraer código de comunidad
        const code = flag?.code || getCommunityCodeFromName(communityName);
        
        // Evitar duplicados - usar el nombre estandarizado para comparaciones
        if (!acc.some(c => normalizeText(c.name) === normalizeText(standardizedName.en))) {
          acc.push({
            name: standardizedName.en,
            localName: standardizedName.es,
            code: code
          });
        }
        return acc;
      }, [])
      .sort((a, b) => {
        // Poner Madrid primero, luego ordenar alfabéticamente según el idioma
        if (a.code === 'MAD') return -1;
        if (b.code === 'MAD') return 1;
        return language === 'es' 
          ? a.localName.localeCompare(b.localName) 
          : a.name.localeCompare(b.name);
      });
    
    setAvailableCommunities(communities);
  }, [autonomousCommunitiesData, language]);
  
  // Función para normalizar texto (para comparaciones)
  const normalizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };
  
  // Función para obtener un código de comunidad a partir del nombre
  const getCommunityCodeFromName = (name: string): string => {
    const nameMap: {[key: string]: string} = {
      'madrid': 'MAD',
      'cataluña': 'CAT',
      'andalucía': 'AND',
      'comunidad valenciana': 'VAL',
      'castilla y león': 'CYL',
      'país vasco': 'PVA',
      'galicia': 'GAL',
      'castilla - la mancha': 'CLM',
      'aragón': 'ARA',
      'extremadura': 'EXT',
      'principado de asturias': 'AST',
      'región de murcia': 'MUR',
      'islas baleares': 'BAL',
      'cantabria': 'CAN',
      'la rioja': 'RIO',
      'comunidad foral de navarra': 'NAV'
    };
    
    const normalized = normalizeText(name);
    return nameMap[normalized] || 'COM'; // COM como código genérico
  };
  
  // Efecto para procesar los datos y crear la serie temporal
  useEffect(() => {
    if (!gdpData || !autonomousCommunitiesData || years.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Mapeo del sector seleccionado al código en el CSV
    const getSectorCode = (sectorId: string): string => {
      switch(sectorId) {
        case 'total': return "(_T)";
        case 'business': return "(EMPRESAS)";
        case 'government': return "(ADMINISTRACION_PUBLICA)";
        case 'education': return "(ENSENIANZA_SUPERIOR)";
        case 'nonprofit': return "(IPSFL)";
        default: return "(_T)";
      }
    };
    
    // Mapeo del sector seleccionado al nombre en el CSV para datos nacionales
    const getSectorName = (sectorId: string): string => {
      switch(sectorId) {
        case 'total': return 'All Sectors';
        case 'business': return 'Business enterprise sector';
        case 'government': return 'Government sector';
        case 'education': return 'Higher education sector';
        case 'nonprofit': return 'Private non-profit sector';
        default: return 'All Sectors';
      }
    };
    
    // Obtener el código del sector para la búsqueda
    const sectorCode = getSectorCode(selectedSector);
    const sectorName = getSectorName(selectedSector);
    
    // Crear puntos de datos para cada año
    const seriesData: TimeSeriesDataPoint[] = years.map(year => {
      // Punto de datos inicial
      const dataPoint: TimeSeriesDataPoint = {
        year,
        spain: null,
        canary: null,
        community: null
      };
      
      // 1. Buscar datos de España
      const spainData = gdpData.find(row => 
        row.Year === year && 
        row.Country === "Spain" && 
        row.Sector === sectorName
      );
      
      if (spainData) {
        dataPoint.spain = parseFloat(spainData['%GDP'].replace(',', '.'));
      }
      
      // 2. Buscar datos de Canarias
      const canaryData = autonomousCommunitiesData.find(row => 
        row["Año"] === year && 
        normalizeText(row["Comunidad Limpio"]) === "canarias" && 
        row["Sector Id"] === sectorCode
      );
      
      if (canaryData) {
        dataPoint.canary = parseFloat(canaryData["% PIB I+D"].replace(',', '.'));
      }
      
      // 3. Buscar datos de la comunidad seleccionada utilizando el mapeo estandarizado
      let communityData = autonomousCommunitiesData.find(row => {
        const isCorrectYear = row["Año"] === year;
        const isCorrectSector = row["Sector Id"] === sectorCode;
        
        // Verificar si es la comunidad seleccionada usando diferentes campos
        const isSelectedCommunity = 
          normalizeText(row["Comunidad Limpio"]) === normalizeText(selectedCommunity.localName) ||
          normalizeText(row["Comunidad en Inglés"]) === normalizeText(selectedCommunity.name) ||
          row["Comunidad (Original)"].includes(selectedCommunity.localName);
        
        return isCorrectYear && isSelectedCommunity && isCorrectSector;
      });
      
      // Si no encontramos datos con el enfoque directo, intentamos con el mapeo
      if (!communityData) {
        for (const key in communityNameMapping) {
          // Verificar si la comunidad seleccionada coincide con alguna entrada del mapeo
          if (normalizeText(communityNameMapping[key].es) === normalizeText(selectedCommunity.localName) ||
              normalizeText(communityNameMapping[key].en) === normalizeText(selectedCommunity.name) ||
              normalizeText(key) === normalizeText(selectedCommunity.localName) ||
              normalizeText(key) === normalizeText(selectedCommunity.name)) {
            
            // Buscar en los datos usando todas las posibles formas del nombre
            communityData = autonomousCommunitiesData.find(row => 
              row["Año"] === year && 
              (normalizeText(row["Comunidad Limpio"]) === normalizeText(key) ||
               normalizeText(row["Comunidad Limpio"]) === normalizeText(communityNameMapping[key].es) ||
               normalizeText(row["Comunidad en Inglés"]) === normalizeText(communityNameMapping[key].en)) && 
              row["Sector Id"] === sectorCode
            );
            
            if (communityData) break;
          }
        }
      }
      
      if (communityData) {
        dataPoint.community = parseFloat(communityData["% PIB I+D"].replace(',', '.'));
      }
      
      return dataPoint;
    });
    
    // Ordenar por año ascendente para la gráfica
    seriesData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    setTimeSeriesData(seriesData);
    setLoading(false);
  }, [gdpData, autonomousCommunitiesData, selectedCommunity, selectedSector, years, language]);
  
  // Efecto para cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    // Agregar el event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Limpiar el event listener
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Función para generar las opciones del selector de sectores
  const getSectorOptions = (): SectorOption[] => {
    return [
      { id: 'total', name: { es: 'Todos los sectores', en: 'All sectors' } },
      { id: 'business', name: { es: 'Sector empresarial', en: 'Business enterprise' } },
      { id: 'government', name: { es: 'Administración Pública', en: 'Government' } },
      { id: 'education', name: { es: 'Enseñanza Superior', en: 'Higher education' } },
      { id: 'nonprofit', name: { es: 'Instituciones Privadas sin Fines de Lucro', en: 'Private non-profit' } }
    ];
  };
  
  // Función para obtener el nombre localizado del sector seleccionado
  const getSelectedSectorName = (): string => {
    const sectorOption = getSectorOptions().find(option => option.id === selectedSector);
    return sectorOption ? sectorOption.name[language] : t.allSectors;
  };
  
  // Formateador para el eje Y para agregar símbolo de porcentaje
  const formatYAxis = (value: number) => {
    return `${value}%`;
  };
  
  // Función para calcular el cambio año a año (YoY)
  const calculateYoY = (currentValue: number | null, dataKey: string, currentYearIndex: number) => {
    if (currentValue === null || currentYearIndex <= 0) return null;
    
    const previousYearData = timeSeriesData[currentYearIndex - 1];
    const previousValue = previousYearData?.[dataKey] as number | null;
    
    if (previousValue === null || previousValue === 0) return null;
    
    const percentChange = ((currentValue - previousValue) / previousValue) * 100;
    return percentChange.toFixed(2);
  };
  
  // Componente de tooltip personalizado para la gráfica
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean; 
    payload?: Array<{
      value: number;
      name: string;
      color: string;
      dataKey: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      // Encontrar el índice del año actual en los datos
      const yearIndex = timeSeriesData.findIndex(data => data.year === label);
      
      // Filtrar valores nulos y ordenar de mayor a menor
      const sortedPayload = [...payload]
        .filter(entry => entry.value !== null)
        .sort((a, b) => b.value - a.value);
      
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
          <p className="font-medium text-gray-700">{`${t.year}: ${label}`}</p>
          <div className="space-y-1 mt-2">
            {sortedPayload.map((entry, index) => {
              // Obtener nombre estandarizado según el idioma
              let displayName = entry.name;
              
              // Convertir "Spain" o "España" al nombre localizado
              if (normalizeText(displayName).includes('spain') || normalizeText(displayName).includes('espana')) {
                displayName = language === 'es' ? 'España' : 'Spain';
              } 
              // Convertir "Canary Islands" o "Canarias" al nombre localizado
              else if (normalizeText(displayName).includes('canary') || normalizeText(displayName).includes('canarias')) {
                displayName = language === 'es' ? 'Canarias' : 'Canary Islands';
              }
              // Caso especial para Madrid
              else if (normalizeText(displayName).includes('madrid')) {
                displayName = 'Madrid';
              }
              // Para otras comunidades, buscar en el mapeo
              else {
                for (const key in communityNameMapping) {
                  if (normalizeText(key) === normalizeText(displayName) || 
                      normalizeText(communityNameMapping[key].es) === normalizeText(displayName) ||
                      normalizeText(communityNameMapping[key].en) === normalizeText(displayName)) {
                    displayName = language === 'es' ? 
                                 communityNameMapping[key].es : 
                                 communityNameMapping[key].en;
                    break;
                  }
                }
              }
              
              // Calcular el cambio YoY
              const yoyChange = calculateYoY(entry.value, entry.dataKey, yearIndex);
              const yoyText = yoyChange !== null ? 
                `(${yoyChange.startsWith('-') ? '' : '+'}${yoyChange}%)` : '';
              
              return (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm">
                    <span className="font-medium">{displayName}: </span>
                    <span>{entry.value} {t.percentGDP}</span>
                    {yoyChange !== null && (
                      <span className={`ml-1.5 text-xs ${parseFloat(yoyChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {yoyText}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Componente mejorado para renderizar banderas (España, Canarias, y comunidades) - para el selector
  const FlagImage = ({ 
    type, 
    code, 
    strokeColor,
    size = 20
  }: { 
    type: 'spain' | 'canary' | 'community'; 
    code?: string; 
    strokeColor: string;
    size?: number;
  }) => {
    let flagUrl = '';
    
    // Buscar la bandera adecuada según el tipo
    if (type === 'spain') {
      const spainFlag = country_flags.find(flag => flag.iso3 === 'ESP');
      flagUrl = spainFlag?.flag || '';
    } else if (type === 'canary') {
      const canaryFlag = communityFlags.find(flag => flag.code === 'CAN');
      flagUrl = canaryFlag?.flag || '';
    } else if (type === 'community' && code) {
      const communityFlag = communityFlags.find(flag => flag.code === code);
      flagUrl = communityFlag?.flag || '';
    }
    
    if (!flagUrl) return null;
    
    return (
      <img 
        src={flagUrl} 
        alt=""
        width={size} 
        height={Math.round(size * 0.67)} 
        style={{ 
          objectFit: 'cover',
          border: `1px solid ${strokeColor}`,
          borderRadius: 4,
          boxShadow: '0 0 0 0.5px rgba(0,0,0,.02)'
        }}
      />
    );
  };
  
  // Componente para renderizar banderas dentro del SVG
  const FlagsCustomComponent = (props: {
    yAxisMap?: AxisScale[];
    xAxisMap?: AxisScale[];
    data?: TimeSeriesDataPoint[];
    selectedCommunity?: CommunityOption;
    texts?: LocalizedTexts;
    lineColors?: typeof lineColors;
    [key: string]: unknown;
  }) => {
    const { yAxisMap, xAxisMap, data, selectedCommunity, texts, lineColors } = props;
    
    if (!data || !data.length || !yAxisMap || !xAxisMap || !selectedCommunity || !texts || !lineColors) return null;

    const xScale = xAxisMap[0]?.scale;
    const yScale = yAxisMap[0]?.scale;
    
    if (!xScale || !yScale) return null;

    // Obtener el último punto de datos
    const lastDataPoint = data[data.length - 1];
    const lastX = xScale(lastDataPoint.year);

    // Función para obtener URL de bandera
    const getFlagUrl = (type: 'spain' | 'canary' | 'community', code?: string) => {
      if (type === 'spain') {
        const spainFlag = country_flags.find(flag => flag.iso3 === 'ESP');
        return spainFlag?.flag || '';
      } else if (type === 'canary') {
        const canaryFlag = communityFlags.find(flag => flag.code === 'CAN');
        return canaryFlag?.flag || '';
      } else if (type === 'community' && code) {
        const communityFlag = communityFlags.find(flag => flag.code === code);
        return communityFlag?.flag || '';
      }
      return '';
    };

    // Preparar puntos de banderas
    const flagPoints = [];

    // España
    if (lastDataPoint.spain !== null) {
      flagPoints.push({
        key: 'spain',
        x: lastX + FLAG_MARGIN,
        y: yScale(lastDataPoint.spain),
        originalY: yScale(lastDataPoint.spain),
        flagUrl: getFlagUrl('spain'),
        color: lineColors.spain,
        label: texts.spain
      });
    }

    // Comunidad seleccionada
    if (lastDataPoint.community !== null) {
      flagPoints.push({
        key: 'community',
        x: lastX + FLAG_MARGIN,
        y: yScale(lastDataPoint.community),
        originalY: yScale(lastDataPoint.community),
        flagUrl: getFlagUrl('community', selectedCommunity.code),
        color: lineColors.community,
        label: selectedCommunity.name
      });
    }

    // Canarias
    if (lastDataPoint.canary !== null) {
      flagPoints.push({
        key: 'canary',
        x: lastX + FLAG_MARGIN,
        y: yScale(lastDataPoint.canary),
        originalY: yScale(lastDataPoint.canary),
        flagUrl: getFlagUrl('canary'),
        color: lineColors.canary,
        label: texts.canary
      });
    }

    // Lógica de anti-solape: ordenar por Y y ajustar posiciones
    flagPoints.sort((a, b) => a.originalY - b.originalY);
    
    for (let i = 1; i < flagPoints.length; i++) {
      const currentFlag = flagPoints[i];
      const previousFlag = flagPoints[i - 1];
      
      if (currentFlag.y - previousFlag.y < MIN_GAP) {
        currentFlag.y = previousFlag.y + MIN_GAP;
      }
    }

    return (
      <g>
        {flagPoints.map(point => {
          if (!point.flagUrl) return null;
          
          return (
            <g key={point.key}>
              {/* Línea conectora si la bandera se movió de su posición original */}
              {Math.abs(point.y - point.originalY) > 2 && (
                <line
                  x1={point.x - 2}
                  y1={point.originalY}
                  x2={point.x - 2}
                  y2={point.y}
                  stroke={point.color}
                  strokeWidth={1}
                  strokeDasharray="2,2"
                  opacity={0.5}
                />
              )}
              
              {/* Bandera */}
              <image
                href={point.flagUrl}
                x={point.x}
                y={point.y - FLAG_SIZE / 2}
                width={FLAG_SIZE}
                height={FLAG_SIZE * 0.67}
                style={{ 
                  cursor: 'pointer',
                  filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.1))`
                }}
              />
              
              {/* Borde de la bandera */}
              <rect
                x={point.x}
                y={point.y - FLAG_SIZE / 2}
                width={FLAG_SIZE}
                height={FLAG_SIZE * 0.67}
                fill="none"
                stroke={point.color}
                strokeWidth={1}
                rx={2}
              />
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Filtros - Selector de comunidad autónoma más visible */}
      <div className="mb-6 px-4 pt-4">
        <div className="flex justify-between items-center">
          {/* Selector de comunidad autónoma */}
          <div className="flex-shrink-0 relative" ref={dropdownRef}>
            <div 
              className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="flex items-center gap-1 px-2 py-1">
                <FlagImage 
                  type="community" 
                  code={selectedCommunity.code} 
                  size={20} 
                  strokeColor="rgba(229, 231, 235, 0.5)"
                />
                <span className="text-sm font-medium text-gray-800">
                  {language === 'es' ? selectedCommunity.localName : selectedCommunity.name}
                </span>
              </div>
              <div className="p-1 px-2 border-l border-gray-200 text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>
            
            {/* Menú desplegable */}
            {dropdownOpen && (
              <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto w-48 right-0">
                {availableCommunities.map(community => (
                  <button
                    key={community.code}
                    className={`flex items-center w-full text-left px-3 py-1.5 hover:bg-gray-100 ${
                      community.code === selectedCommunity.code ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedCommunity(community);
                      setDropdownOpen(false);
                    }}
                  >
                    <FlagImage 
                      type="community" 
                      code={community.code} 
                      size={18} 
                      strokeColor="rgba(229, 231, 235, 0.5)"
                    />
                    <span className="ml-2 text-sm">
                      {language === 'es' ? community.localName : community.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Contenido de la gráfica */}
      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">{t.loading}</span>
          </div>
        ) : timeSeriesData.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <span className="text-gray-500">{t.noData}</span>
          </div>
        ) : (
          <div>
            {/* Gráfica de líneas */}
            <div className="h-80 bg-white rounded-lg border border-gray-100 p-2 shadow-sm relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 20, right: 60, left: 20, bottom: 10 }}
                >
                  {/* Eliminada la cuadrícula (CartesianGrid) */}
                  <XAxis 
                    dataKey="year" 
                    tick={{ fill: '#4b5563', fontSize: 10 }}
                    tickLine={{ stroke: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    label={{ 
                      value: t.percentGDP, 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 10 }
                    }}
                    tick={{ fill: '#4b5563', fontSize: 10 }}
                    tickLine={{ stroke: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={formatYAxis}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Línea para España */}
                  <Line 
                    type="linear" 
                    dataKey="spain" 
                    name={t.spain}
                    stroke={lineColors.spain} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: lineColors.spain, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para Canarias */}
                  <Line 
                    type="linear" 
                    dataKey="canary" 
                    name={t.canary}
                    stroke={lineColors.canary} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: lineColors.canary, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para la comunidad seleccionada */}
                  <Line 
                    type="linear" 
                    dataKey="community" 
                    name={language === 'es' ? selectedCommunity.localName : selectedCommunity.name}
                    stroke={lineColors.community} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: lineColors.community, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Banderas renderizadas dentro del SVG */}
                  <Customized
                    component={(rechartProps: Record<string, unknown>) => (
                      <FlagsCustomComponent
                        {...rechartProps}
                        data={timeSeriesData}
                        selectedCommunity={selectedCommunity}
                        texts={t}
                        lineColors={lineColors}
                      />
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Nueva leyenda en la parte inferior central */}
            <div className="flex flex-wrap items-center justify-center mt-4 gap-x-8 gap-y-3">
              {/* España */}
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: lineColors.spain }}></div>
                <span className="text-sm font-medium text-gray-700">{t.spain}</span>
              </div>
              
              {/* Canarias */}
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: lineColors.canary }}></div>
                <span className="text-sm font-medium text-gray-700">{t.canary}</span>
              </div>
              
              {/* Comunidad seleccionada */}
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: lineColors.community }}></div>
                <span className="text-sm font-medium text-gray-700">
                  {language === 'es' ? selectedCommunity.localName : selectedCommunity.name}
                </span>
              </div>
            </div>
            
            {/* Nota inferior */}
            <div className="mt-4 text-xs text-gray-500 text-center">
              <p>
                {language === 'es' 
                  ? `Sector visualizado: ${getSelectedSectorName()}`
                  : `Visualized sector: ${getSelectedSectorName()}`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityRDComparisonChart; 