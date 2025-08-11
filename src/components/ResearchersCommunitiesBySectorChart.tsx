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
import { 
  ResearchersCommunityData, 
  getCommunityValue, 
  getNormalizedCommunityName, 
  getCommunityFlagUrl 
} from '../utils/spanishCommunitiesUtils';

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

// Interfaz para una comunidad seleccionable
interface CommunityOption {
  name: string;
  localName: string;
  code: string;
  flag?: string;
}

// Interfaz para las propiedades del componente
interface ResearchersCommunitiesBySectorChartProps {
  data: ResearchersCommunityData[];
  language: 'es' | 'en';
  defaultCommunity?: string; // Comunidad por defecto (default: 'Canarias')
}

// Colores para las líneas de cada sector
const SECTOR_COLORS = {
  total: "#000000",     // Negro para el total
  business: "#3b82f6",  // Azul para empresas
  government: "#dc2626", // Rojo para gobierno
  education: "#10b981", // Verde para educación
  nonprofit: "#f59e0b"  // Ámbar para sin fines de lucro
};

const ResearchersCommunitiesBySectorChart: React.FC<ResearchersCommunitiesBySectorChartProps> = ({
  data,
  language,
  defaultCommunity = 'Canarias' // Por defecto, Canarias
}) => {
  // Estado para los datos procesados de la línea de tiempo
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  // Estado para la comunidad seleccionada (por defecto Canarias)
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityOption>({
    name: defaultCommunity,
    localName: defaultCommunity,
    code: 'IC',
    flag: getCommunityFlagUrl(defaultCommunity, language)
  });
  // Lista de comunidades disponibles
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
      title: "Evolución sectorial por comunidades autónomas",
      researchersCount: "Número de investigadores",
      year: "Año",
      loading: "Cargando datos...",
      noData: "No hay datos disponibles",
      selectCommunity: "Seleccionar comunidad",
      // Sectores
      total: "Todos los sectores",
      business: "Sector empresarial",
      government: "Administración Pública",
      education: "Enseñanza Superior",
      nonprofit: "Instituciones Privadas sin Fines de Lucro"
    },
    en: {
      title: "Sectoral Evolution by Autonomous Communities",
      researchersCount: "Number of researchers",
      year: "Year",
      loading: "Loading data...",
      noData: "No data available",
      selectCommunity: "Select community",
      // Sectores
      total: "All sectors",
      business: "Business enterprise sector",
      government: "Government sector",
      education: "Higher education sector",
      nonprofit: "Private non-profit sector"
    }
  };

  const t = texts[language];

  // Efecto para cargar las comunidades disponibles
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Obtener las comunidades autónomas disponibles
    const communities = data
      .filter(item => 
        // Excluir España y seleccionar solo datos de investigadores EJC
        !isSpainEntry(item) && 
        item.MEDIDAS_CODE === 'INVESTIGADORES_EJC' &&
        item.SEXO_CODE === '_T' &&
        item.SECTOR_EJECUCION_CODE === '_T' // Solo total para listar comunidades
      )
      .reduce((acc: CommunityOption[], item) => {
        const normalizedName = getNormalizedCommunityName(item.TERRITORIO, language);
        
        // Evitar duplicados
        if (!acc.some(c => c.name === normalizedName)) {
          const flagUrl = getCommunityFlagUrl(normalizedName, language);
          
          acc.push({
            name: normalizedName,
            localName: normalizedName,
            code: item.TERRITORIO_CODE,
            flag: flagUrl
          });
        }
        return acc;
      }, [])
      .sort((a, b) => {
        // Canarias primero, luego ordenar alfabéticamente
        if (a.name.toLowerCase().includes('canarias')) return -1;
        if (b.name.toLowerCase().includes('canarias')) return 1;
        return a.name.localeCompare(b.name);
      });
    
    setAvailableCommunities(communities);
    
    // Establecer la comunidad seleccionada basada en defaultCommunity
    const community = communities.find(c => c.name.toLowerCase().includes(defaultCommunity.toLowerCase()));
    if (community) {
      setSelectedCommunity(community);
    } else if (communities.length > 0) {
      setSelectedCommunity(communities[0]);
    }
  }, [data, language, defaultCommunity]);

  // Función para verificar si una entrada es España
  const isSpainEntry = (item: ResearchersCommunityData): boolean => {
    const territorio = item.TERRITORIO.toLowerCase();
    const code = item.TERRITORIO_CODE;
    return (
      code === '00' || 
      code === 'ES' || 
      territorio.includes('españa') ||
      territorio.includes('spain') ||
      territorio.includes('total nacional')
    );
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
  
  // Efecto para procesar los datos y crear la serie temporal
  useEffect(() => {
    if (!data || data.length === 0 || !selectedCommunity) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Obtener años disponibles
      const availableYears = Array.from(new Set(
        data
          .filter(item => 
            item.MEDIDAS_CODE === 'INVESTIGADORES_EJC' &&
            item.SEXO_CODE === '_T'
          )
          .map(item => item.TIME_PERIOD)
      )).sort();

      // Crear puntos de datos para cada año
      const seriesData: TimeSeriesDataPoint[] = availableYears.map(year => {
        const dataPoint: TimeSeriesDataPoint = {
          year,
          total: null,
          business: null,
          government: null,
          education: null,
          nonprofit: null
        };

        // Para cada sector, obtener el valor
        const sectors = ['total', 'business', 'government', 'education', 'nonprofit'];
        
        sectors.forEach(sector => {
          const value = getCommunityValue(
            selectedCommunity.name,
            data,
            year,
            sector,
            language
          );
          dataPoint[sector] = value;
        });

        return dataPoint;
      });

      setTimeSeriesData(seriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error processing community timeline data:', error);
      setLoading(false);
    }
  }, [data, selectedCommunity, language]);

  // Función para formatear números grandes en el eje Y
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  // Función para calcular el cambio año sobre año
  const calculateYoY = (currentValue: number | null, dataKey: string, currentYearIndex: number) => {
    if (currentValue === null || currentYearIndex === 0) return null;
    
    const previousValue = timeSeriesData[currentYearIndex - 1]?.[dataKey] as number | null;
    if (previousValue === null || previousValue === 0) return null;
    
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  // Componente para mostrar la bandera
  const FlagImage = ({ 
    size = 22
  }: { 
    size?: number;
  }) => {
    const flagUrl = selectedCommunity.flag;
    
    if (!flagUrl) return null;
    
    return (
      <img 
        src={flagUrl} 
        alt="" 
        className="inline-block object-cover rounded-sm border border-gray-400 shadow-sm"
        style={{ 
          width: size, 
          height: size * 0.67,
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)'
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  };

  // Tooltip personalizado
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

    const currentYearIndex = timeSeriesData.findIndex(item => item.year === label);

    // Filtrar valores nulos y ordenar de mayor a menor
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
            {`${selectedCommunity.name} (${label})`}
          </p>
        </div>
        <div className="space-y-2.5">
          {sortedPayload.map((entry, index) => {
            if (entry.value === null) return null;
            
            // Obtener el nombre localizado del sector
            const sectorKey = entry.dataKey as keyof typeof t;
            const sectorName = t[sectorKey] || entry.name;
            
            // Calcular el cambio YoY
            const yoyChange = calculateYoY(entry.value, entry.dataKey, currentYearIndex);
            const yoyText = yoyChange !== null ? 
              `(${yoyChange >= 0 ? '+' : ''}${yoyChange.toFixed(1)}%)` : '';
            
            return (
              <div key={index} className="flex items-center justify-between py-1">
                <div className="flex items-center flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full mr-3 shadow-sm ring-1 ring-gray-200" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {sectorName}
                  </span>
                </div>
                <div className="flex items-center ml-3">
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round(entry.value).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                  </span>
                  {yoyChange !== null && (
                    <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-md ${
                      yoyChange >= 0 
                        ? 'text-emerald-700 bg-emerald-50' 
                        : 'text-red-700 bg-red-50'
                    }`}>
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Selector de comunidad (sin título) */}
      <div className="px-4 pt-4 pb-2 flex justify-end items-center">
        {/* Selector de comunidad */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-1 px-3 py-2">
              <FlagImage size={20} />
              <span className="text-sm font-medium text-gray-800 ml-2">
                {selectedCommunity.name}
              </span>
            </div>
            <div className="p-1 px-2 border-l border-gray-200 text-gray-500">
              <ChevronDown className={`h-4 w-4 transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
          
          {dropdownOpen && (
            <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto w-48 right-0">
              {availableCommunities.map((community) => (
                <button
                  key={community.code}
                  onClick={() => {
                    setSelectedCommunity(community);
                    setDropdownOpen(false);
                  }}
                  className={`flex items-center w-full text-left px-3 py-2 hover:bg-gray-100 ${
                    community.code === selectedCommunity.code ? 'bg-blue-50' : ''
                  }`}
                >
                  <img 
                    src={community.flag || ''} 
                    alt="" 
                    className="w-5 h-3 object-cover rounded-sm border border-gray-400 shadow-sm mr-3"
                    style={{
                      boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-sm text-gray-700">{community.name}</span>
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
                      value: t.researchersCount, 
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
                  
                  {/* Línea para el sector total */}
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={SECTOR_COLORS.total}
                    strokeWidth={2}
                    strokeDasharray="3 3" // Línea punteada
                    name={t.total}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.total, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector empresarial */}
                  <Line
                    type="monotone"
                    dataKey="business"
                    stroke={SECTOR_COLORS.business}
                    strokeWidth={1.5}
                    name={t.business}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.business, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector gobierno */}
                  <Line
                    type="monotone"
                    dataKey="government"
                    stroke={SECTOR_COLORS.government}
                    strokeWidth={1.5}
                    name={t.government}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.government, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector educación */}
                  <Line
                    type="monotone"
                    dataKey="education"
                    stroke={SECTOR_COLORS.education}
                    strokeWidth={1.5}
                    name={t.education}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.education, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector sin fines de lucro */}
                  <Line
                    type="monotone"
                    dataKey="nonprofit"
                    stroke={SECTOR_COLORS.nonprofit}
                    strokeWidth={1.5}
                    name={t.nonprofit}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.nonprofit, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
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

export default ResearchersCommunitiesBySectorChart; 