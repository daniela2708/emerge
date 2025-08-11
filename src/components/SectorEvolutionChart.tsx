import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { communityFlags, communityNameMapping } from '../utils/spanishCommunitiesUtils';

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

// Interfaz para un punto de datos en la serie temporal
interface TimeSeriesDataPoint {
  year: string;
  total: number | null;
  business: number | null;
  government: number | null;
  education: number | null;
  nonprofit: number | null;
  [key: string]: string | number | null;
}

// Interfaz para las propiedades del componente
interface SectorEvolutionChartProps {
  language: 'es' | 'en';
  autonomousCommunitiesData: GastoIDComunidadesData[];
}

// Tabla de mapeo entre nombres de comunidades en el CSV y nombres en español/inglés

const SectorEvolutionChart: React.FC<SectorEvolutionChartProps> = ({
  language,
  autonomousCommunitiesData
}) => {
  // Estado para la comunidad seleccionada (por defecto Canarias)
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityOption>({
    name: 'Canary Islands',
    localName: 'Canarias',
    code: 'CAN'
  });
  
  // Estado para los datos de la serie temporal
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  
  // Estado para las comunidades disponibles
  const [availableCommunities, setAvailableCommunities] = useState<CommunityOption[]>([]);
  
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado para controlar la apertura del dropdown
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  
  // Referencia para detectar clics fuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Textos localizados
  const texts = {
    es: {
      title: "Evolución por sectores I+D (% PIB)",
      selectCommunity: "Seleccionar comunidad",
      percentGDP: "% del PIB",
      year: "Año",
      loading: "Cargando datos...",
      noData: "No hay datos disponibles",
      // Sectores
      total: "Todos los Sectores",
      business: "Sector empresarial",
      government: "Administración Pública",
      education: "Enseñanza Superior",
      nonprofit: "Inst. Privadas sin Fines de Lucro"
    },
    en: {
      title: "R&D Evolution by Sectors (% GDP)",
      selectCommunity: "Select community",
      percentGDP: "% of GDP",
      year: "Year",
      loading: "Loading data...",
      noData: "No data available",
      // Sectores
      total: "Total (all sectors)",
      business: "Business enterprise sector",
      government: "Government sector",
      education: "Higher education sector",
      nonprofit: "Private non-profit sector"
    }
  };
  
  const t = texts[language];
  
  // Colores para las líneas de cada sector
  const sectorColors = {
    total: "#000000", // Negro para el total
    business: "#3b82f6", // Azul para empresarial
    government: "#ef4444", // Rojo para gobierno
    education: "#f59e0b", // Naranja para educación
    nonprofit: "#10b981", // Verde para sin fines de lucro
  };
  
  // Efecto para cargar las comunidades autónomas disponibles
  useEffect(() => {
    if (!autonomousCommunitiesData || autonomousCommunitiesData.length === 0) return;
    
    // Extraer comunidades únicas
    const communities = autonomousCommunitiesData
      .filter(row => 
        row["Sector Id"] === "(_T)" // Total
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
        
        // Evitar duplicados y comunidades sin datos relevantes
        if (!acc.some(c => normalizeText(c.name) === normalizeText(standardizedName.en)) &&
            !normalizeText(communityName).includes('total nacional') &&
            !normalizeText(communityName).includes('españa')) {
          acc.push({
            name: standardizedName.en,
            localName: standardizedName.es,
            code: code
          });
        }
        return acc;
      }, [])
      .sort((a, b) => {
        // Poner Madrid primero, luego ordenar alfabéticamente
        if (a.code === 'MAD') return -1;
        if (b.code === 'MAD') return 1;
        return language === 'es' 
          ? a.localName.localeCompare(b.localName) 
          : a.name.localeCompare(b.name);
      });
    
    setAvailableCommunities(communities);
  }, [autonomousCommunitiesData, language]);
  
  // Efecto para procesar los datos y crear la serie temporal
  useEffect(() => {
    if (!autonomousCommunitiesData || autonomousCommunitiesData.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Función para obtener el ID de sector a partir del código en el CSV
    const getSectorId = (sectorCode: string): string => {
      if (sectorCode === "(_T)") return "total";
      if (sectorCode === "(EMPRESAS)") return "business";
      if (sectorCode === "(ADMINISTRACION_PUBLICA)") return "government";
      if (sectorCode === "(ENSENIANZA_SUPERIOR)") return "education";
      if (sectorCode === "(IPSFL)") return "nonprofit";
      return "unknown";
    };
    
    // Extraer todos los años disponibles, empezando desde 2007
    const years = [...new Set(autonomousCommunitiesData
      .map(row => row["Año"])
      .filter(year => parseInt(year) >= 2007)
    )].sort();
    
    // Crear puntos de datos para cada año
    const seriesData: TimeSeriesDataPoint[] = years.map(year => {
      // Punto de datos inicial para el año
      const dataPoint: TimeSeriesDataPoint = {
        year,
        total: null,
        business: null,
        government: null,
        education: null,
        nonprofit: null
      };
      
      // Buscar datos para la comunidad seleccionada en el año actual
      const yearData = autonomousCommunitiesData.filter(row => {
        const isCorrectYear = row["Año"] === year;
        
        // Verificar si es la comunidad seleccionada usando el mapeo estandarizado
        const isSelectedCommunity = (() => {
          const communityCleanName = row["Comunidad Limpio"];
          const communityEnglishName = row["Comunidad en Inglés"];
          const communityOriginalName = row["Comunidad (Original)"];
          
          // Caso directo: coincide con el nombre en el idioma adecuado
          if (language === 'es' && 
              normalizeText(communityCleanName) === normalizeText(selectedCommunity.localName)) {
            return true;
          }
          
          if (language === 'en' && 
              normalizeText(communityEnglishName) === normalizeText(selectedCommunity.name)) {
            return true;
          }
          
          // Caso especial para Madrid
          if ((normalizeText(communityCleanName).includes('madrid') ||
               normalizeText(communityOriginalName).includes('madrid')) && 
              normalizeText(selectedCommunity.localName).includes('madrid')) {
            return true;
          }
          
          // Buscar en el mapeo
          for (const key in communityNameMapping) {
            const mappedName = communityNameMapping[key];
            
            if ((normalizeText(mappedName.es) === normalizeText(selectedCommunity.localName) &&
                 normalizeText(key) === normalizeText(communityCleanName)) ||
                (normalizeText(mappedName.en) === normalizeText(selectedCommunity.name) &&
                 normalizeText(key) === normalizeText(communityCleanName))) {
              return true;
            }
          }
          
          return false;
        })();
        
        return isCorrectYear && isSelectedCommunity;
      });
      
      // Procesar cada sector para este año
      yearData.forEach(row => {
        const sectorId = getSectorId(row["Sector Id"]);
        if (sectorId !== "unknown" && sectorId in dataPoint) {
          try {
            // Convertir el valor del % PIB a número
            const valueStr = row["% PIB I+D"].replace(',', '.');
            const value = parseFloat(valueStr);
            
            if (!isNaN(value)) {
              // Añadir el valor al punto de datos
              dataPoint[sectorId] = value;
            }
          } catch (error) {
            console.error(`Error parsing value for ${sectorId} in ${year}:`, error);
          }
        }
      });
      
      return dataPoint;
    });
    
    // Ordenar por año ascendente
    seriesData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    setTimeSeriesData(seriesData);
    setLoading(false);
  }, [autonomousCommunitiesData, selectedCommunity, language]);
  
  // Función para normalizar texto (eliminar acentos y convertir a minúsculas)
  const normalizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };
  
  // Función para obtener código de comunidad a partir del nombre
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
  
  // Efecto para cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Formateador para el eje Y para agregar símbolo de porcentaje
  const formatYAxis = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  // Función para calcular el cambio año a año (YoY)
  const calculateYoY = (
    currentValue: number | null,
    sectorId: string,
    currentYearIndex: number
  ): number | null => {
    if (currentValue === null || currentYearIndex <= 0) return null;

    const previousYearData = timeSeriesData[currentYearIndex - 1];
    const previousValue = previousYearData?.[sectorId] as number | null;

    if (previousValue === null || previousValue === 0) return null;

    const percentChange = ((currentValue - previousValue) / previousValue) * 100;
    return percentChange;
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
      dataKey: string;
      color: string;
    }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;

      // Encontrar el índice del año actual en los datos
      const yearIndex = timeSeriesData.findIndex(data => data.year === label);
      
      // Filtrar valores nulos y ordenarlos
      const sortedPayload = [...payload]
        .filter(entry => entry.value !== null)
        .sort((a, b) => {
          // Mostrar "total" primero, luego ordenar por valor
          if (a.dataKey === 'total') return -1;
          if (b.dataKey === 'total') return 1;
          return b.value - a.value;
        });
      
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200/60 shadow-xl rounded-xl max-w-xs">
          <div className="border-b border-gray-100 pb-2 mb-3">
            <p className="text-sm font-semibold text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              {`${language === 'es' ? selectedCommunity.localName : selectedCommunity.name} (${label})`}
            </p>
          </div>
          <div className="space-y-2.5">
            {sortedPayload.map((entry, index) => {
              // Traducir el nombre del sector
              const sectorName = t[entry.dataKey as keyof typeof t] || entry.name;

              // Calcular el cambio YoY
              const yoyChange = calculateYoY(entry.value, entry.dataKey, yearIndex);
              const yoyText = yoyChange !== null
                ? `(${yoyChange >= 0 ? '+' : ''}${yoyChange.toFixed(1)}%)`
                : '';

              return (
                <div key={index} className="flex items-center justify-between py-1">
                  <div className="flex items-center flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full mr-3 shadow-sm ring-1 ring-gray-200"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700 whitespace-normal break-words">
                      {sectorName}
                    </span>
                  </div>
                  <div className="flex items-center ml-3">
                    <span className="text-sm font-bold text-gray-900">
                      {entry.value.toFixed(2)}%
                    </span>
                    {yoyChange !== null && (
                      <span
                        className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-md ${
                          yoyChange >= 0
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-red-700 bg-red-50'
                        }`}
                      >
                        {yoyText}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
  };
  
  // Componente para mostrar la bandera de la comunidad
  const CommunityFlag = ({ code }: { code: string }) => {
    const flag = communityFlags.find(f => f.code === code);
    
    if (!flag) return null;
    
    return (
      <img 
        src={flag.flag} 
        alt="" 
        className="w-5 h-4 object-cover rounded shadow-sm"
        style={{
          border: '1px solid #d1d5db',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}
      />
    );
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Selector de comunidad autónoma */}
      <div className="mb-4 px-4 flex justify-end">
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="flex items-center gap-1 px-3 py-2">
              <CommunityFlag code={selectedCommunity.code} />
              <span className="text-sm font-medium text-gray-800 ml-2">
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
                  className={`flex items-center w-full text-left px-3 py-2 hover:bg-gray-100 ${
                    community.code === selectedCommunity.code ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedCommunity(community);
                    setDropdownOpen(false);
                  }}
                >
                  <CommunityFlag code={community.code} />
                  <span className="ml-2 text-sm">
                    {language === 'es' ? community.localName : community.name}
                  </span>
                </button>
              ))}
            </div>
          )}
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
            <div className="h-80 bg-white rounded-lg border border-gray-100 p-2 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
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
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  
                  {/* Línea para el total (punteada) */}
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name={t.total}
                    stroke={sectorColors.total} 
                    strokeWidth={2}
                    strokeDasharray="3 3" // Línea punteada
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Línea para el sector empresarial */}
                  <Line 
                    type="monotone" 
                    dataKey="business" 
                    name={t.business}
                    stroke={sectorColors.business} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Línea para el sector gobierno */}
                  <Line 
                    type="monotone" 
                    dataKey="government" 
                    name={t.government}
                    stroke={sectorColors.government} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Línea para el sector educación */}
                  <Line 
                    type="monotone" 
                    dataKey="education" 
                    name={t.education}
                    stroke={sectorColors.education} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  
                  {/* Línea para el sector sin fines de lucro */}
                  <Line 
                    type="monotone" 
                    dataKey="nonprofit" 
                    name={t.nonprofit}
                    stroke={sectorColors.nonprofit} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectorEvolutionChart; 