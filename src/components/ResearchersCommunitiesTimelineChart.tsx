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
import { ChevronDown } from 'lucide-react';
import country_flags from '../logos/country_flags.json';
import { communityFlags } from '../utils/spanishCommunitiesUtils';
import {
  ResearchersCommunityData,
  getCommunityValue,
  getCommunityFlagUrl,
  getSpainValue,
  formatNumber,
  getSectorId,
  isSpainEntry,
  getNormalizedCommunityName
} from '../utils/spanishCommunitiesUtils';

// Interfaz para los datos de la línea de tiempo
interface TimeSeriesDataPoint {
  year: string;
  spainAverage: number | null;
  canarias: number | null;
  community: number | null;
}

// Interfaz para las opciones de comunidad
interface CommunityOption {
  name: string;
  localName: string;
  code: string;
  flag?: string;
}

// Interfaz para los textos de localización
interface LocalizedTexts {
  noData: string;
  researchersCount: string;
  loading: string;
  spainAverage: string;
  canarias: string;
  selectCommunity: string;
}

// Interfaz para las escalas de Recharts
interface AxisScale {
  scale: (value: unknown) => number;
}

// Props del componente
interface ResearchersCommunitiesTimelineChartProps {
  data: ResearchersCommunityData[];
  language: 'es' | 'en';
  selectedSector: string;
}

// Interfaz para payload del tooltip
interface TooltipPayload {
  color: string;
  name: string;
  value: number | null;
}

// Colores para las líneas
const LINE_COLORS = {
  spainAverage: "#dc2626",  // Rojo para la media de España
  canarias: "#3b82f6",      // Azul para Canarias (cambiado de amarillo a azul)
  community: "#059669"      // Verde para la comunidad seleccionada (cambiado para diferenciarse)
};

// Parámetros para las banderas
const FLAG_SIZE = 20;
const FLAG_MARGIN = 6; // Separación del último punto
const MIN_GAP = 24; // Mínima separación vertical entre banderas

// Componente para renderizar banderas
const FlagImage = ({ 
  type, 
  code,
  strokeColor,
  size = FLAG_SIZE
}: { 
  type: 'country' | 'community'; 
  code?: string;
  strokeColor: string;
  size?: number;
}) => {
  let flagUrl = '';
  
  if (type === 'country' && code === 'ES') {
    // Bandera de España
    const esFlag = country_flags.find(flag => flag.code === 'ES' || flag.iso3 === 'ESP');
    flagUrl = esFlag?.flag || 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg';
  } else if (type === 'community' && code) {
    // Buscar bandera de comunidad
    if (code === 'canarias') {
      const canaryFlag = communityFlags.find(flag => flag.code === 'CAN');
      flagUrl = canaryFlag?.flag || '';
    } else {
      // Buscar por nombre de comunidad
      const communityFlag = communityFlags.find(flag =>
        flag.community.toLowerCase().includes(code.toLowerCase()) ||
        flag.code.toLowerCase() === code.toLowerCase()
      );
      flagUrl = communityFlag?.flag || '';
    }
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
  [key: string]: unknown;
}) => {
  const { yAxisMap, xAxisMap, data, selectedCommunity, texts } = props;
  
  if (!data || !data.length || !yAxisMap || !xAxisMap || !selectedCommunity || !texts) return null;

  const xScale = xAxisMap[0]?.scale;
  const yScale = yAxisMap[0]?.scale;
  
  if (!xScale || !yScale) return null;

  // Obtener el último punto de datos
  const lastDataPoint = data[data.length - 1];
  const lastX = xScale(lastDataPoint.year);

  // Función para obtener URL de bandera
  const getFlagUrl = (type: 'country' | 'community', code?: string) => {
    if (type === 'country' && code === 'ES') {
      const esFlag = country_flags.find(flag => flag.code === 'ES' || flag.iso3 === 'ESP');
      return esFlag?.flag || 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg';
    } else if (type === 'community' && code) {
      if (code === 'canarias') {
        const canaryFlag = communityFlags.find(flag => flag.code === 'CAN');
        return canaryFlag?.flag || '';
      } else {
        const communityFlag = communityFlags.find(flag =>
          flag.community.toLowerCase().includes(code.toLowerCase()) ||
          flag.code.toLowerCase() === code.toLowerCase()
        );
        return communityFlag?.flag || '';
      }
    }
    return '';
  };

  // Preparar puntos de banderas
  const flagPoints = [];

  // España
  if (lastDataPoint.spainAverage !== null) {
    flagPoints.push({
      key: 'spain',
      x: lastX + FLAG_MARGIN,
      y: yScale(lastDataPoint.spainAverage),
      originalY: yScale(lastDataPoint.spainAverage),
      flagUrl: getFlagUrl('country', 'ES'),
      color: LINE_COLORS.spainAverage,
      label: texts.spainAverage
    });
  }

  // Canarias
  if (lastDataPoint.canarias !== null) {
    flagPoints.push({
      key: 'canarias',
      x: lastX + FLAG_MARGIN,
      y: yScale(lastDataPoint.canarias),
      originalY: yScale(lastDataPoint.canarias),
      flagUrl: getFlagUrl('community', 'canarias'),
      color: LINE_COLORS.canarias,
      label: texts.canarias
    });
  }

  // Comunidad seleccionada
  if (selectedCommunity && lastDataPoint.community !== null) {
    flagPoints.push({
      key: 'community',
      x: lastX + FLAG_MARGIN,
      y: yScale(lastDataPoint.community),
      originalY: yScale(lastDataPoint.community),
      flagUrl: getFlagUrl('community', selectedCommunity.name.toLowerCase()),
      color: LINE_COLORS.community,
      label: selectedCommunity.name
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

const ResearchersCommunitiesTimelineChart: React.FC<ResearchersCommunitiesTimelineChartProps> = ({
  data,
  language,
  selectedSector,
}) => {
  // Estado para los datos procesados de la línea de tiempo
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para la comunidad seleccionada internamente (Madrid por defecto)
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityOption>({
    name: 'Madrid',
    localName: 'Madrid',
    code: 'MAD',
    flag: getCommunityFlagUrl('Madrid', language)
  });
  // Lista de comunidades disponibles
  const [availableCommunities, setAvailableCommunities] = useState<CommunityOption[]>([]);
  // Estado para controlar la apertura del dropdown
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  // Referencia para detectar clics fuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Referencia para el componente
  const chartRef = useRef<HTMLDivElement>(null);
  // Referencia para el contenedor de la gráfica
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Textos según el idioma
  const texts = {
    es: {
      noData: 'Sin datos',
      researchersCount: 'Número de investigadores',
      loading: 'Cargando...',
      spainAverage: 'Media España',
      canarias: 'Canarias',
      selectCommunity: 'Seleccionar comunidad'
    },
    en: {
      noData: 'No data',
      researchersCount: 'Number of researchers',
      loading: 'Loading...',
      spainAverage: 'Spain Average',
      canarias: 'Canary Islands',
      selectCommunity: 'Select community'
    }
  };

  const t = texts[language];

  // Efecto para manejar clics fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Efecto para cargar las comunidades disponibles
  useEffect(() => {
    if (!data || data.length === 0) return;

    const sectorId = getSectorId(selectedSector);
    
    // Obtener las comunidades autónomas disponibles (excluyendo España y Canarias)
    const communities = data
      .filter(item => 
        !isSpainEntry(item) && // Excluir España
        !item.TERRITORIO.toLowerCase().includes('canarias') && // Excluir Canarias
        item.SECTOR_EJECUCION_CODE === sectorId &&
        item.SEXO_CODE === '_T' &&
        item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
      )
      .reduce((acc: CommunityOption[], item) => {
        const originalName = item.TERRITORIO;
        const displayName = getNormalizedCommunityName(originalName, language);
        
        // Evitar duplicados
        if (!acc.some(c => c.name === displayName)) {
          const flagUrl = getCommunityFlagUrl(displayName, language);
          
          acc.push({
            name: displayName,
            localName: displayName, // Para comunidades es lo mismo
            code: item.TERRITORIO_CODE,
            flag: flagUrl
          });
        }
        return acc;
      }, [])
      .sort((a, b) => {
        // Madrid primero, luego ordenar alfabéticamente
        if (a.name === 'Madrid') return -1;
        if (b.name === 'Madrid') return 1;
        return a.name.localeCompare(b.name);
      });

    setAvailableCommunities(communities);

    // Establecer Madrid como comunidad por defecto si está disponible
    const madrid = communities.find(c => c.name === 'Madrid');
    if (madrid) {
      setSelectedCommunity(madrid);
    } else if (communities.length > 0) {
      setSelectedCommunity(communities[0]);
    }
  }, [data, selectedSector, language]);

  // Efecto para procesar los datos de la serie temporal
  useEffect(() => {
    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const sectorId = getSectorId(selectedSector);

      // Obtener años disponibles
      const availableYears = Array.from(new Set(
        data
          .filter(item => 
            item.SECTOR_EJECUCION_CODE === sectorId &&
            item.SEXO_CODE === '_T' &&
            item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
          )
          .map(item => item.TIME_PERIOD)
      )).sort();

      // Crear puntos de datos para cada año
      const seriesData: TimeSeriesDataPoint[] = availableYears.map(year => {
        // Punto de datos inicial
        const dataPoint: TimeSeriesDataPoint = {
          year,
          spainAverage: null,
          canarias: null,
          community: null
        };

        // 1. Calcular la media de España (total dividido por número de comunidades)
        const spainValue = getSpainValue(data, year, selectedSector);
        if (spainValue !== null) {
          // Contar comunidades autónomas para calcular la media
          const communitiesCount = data.filter(item => 
            !isSpainEntry(item) &&
            item.TIME_PERIOD === year && 
            item.SECTOR_EJECUCION_CODE === sectorId && 
            item.SEXO_CODE === '_T' &&
            item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
          ).length;
          
          if (communitiesCount > 0) {
            dataPoint.spainAverage = spainValue / communitiesCount;
          }
        }

        // 2. Buscar datos de Canarias
        const canariasData = data.find(item => 
          item.TERRITORIO.toLowerCase().includes('canarias') && 
          item.TIME_PERIOD === year && 
          item.SECTOR_EJECUCION_CODE === sectorId && 
          item.SEXO_CODE === '_T' &&
          item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
        );

        if (canariasData && canariasData.OBS_VALUE) {
          dataPoint.canarias = parseFloat(canariasData.OBS_VALUE.replace(',', '.'));
        }

        // 3. Buscar datos de la comunidad seleccionada
        if (selectedCommunity) {
          const communityValue = getCommunityValue(
            selectedCommunity.name,
            data,
            year,
            selectedSector,
            language
          );
          dataPoint.community = communityValue;
        }

        return dataPoint;
      });

      setTimeSeriesData(seriesData);
      setLoading(false);
    } catch (error) {
      console.error("Error processing communities timeline data:", error);
      setLoading(false);
    }
  }, [data, selectedSector, selectedCommunity, language]);

  // Función para formatear el eje Y
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  // Función para calcular el cambio año a año (YoY)
  const calculateYoY = (currentValue: number | null, dataKey: string, currentYearIndex: number) => {
    if (currentValue === null || currentYearIndex === 0) return null;
    
    const previousDataPoint = timeSeriesData[currentYearIndex - 1];
    const previousValue = previousDataPoint[dataKey as keyof TimeSeriesDataPoint] as number | null;
    
    if (previousValue === null || previousValue === 0) return null;
    
    const yoyChange = ((currentValue - previousValue) / previousValue) * 100;
    return yoyChange.toFixed(2);
  };

  // Componente personalizado para el tooltip
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean; 
    payload?: TooltipPayload[]; 
    label?: string 
  }) => {
    if (active && payload && payload.length) {
      // Encontrar el índice del año actual para calcular YoY
      const currentYearIndex = timeSeriesData.findIndex(d => d.year === label);
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-800 mb-2">{label}</p>
          {payload.map((entry: TooltipPayload, index: number) => {
            if (entry.value === null) return null;
            
            // Calcular YoY para esta entrada
            const yoyChange = calculateYoY(entry.value, entry.name === t.spainAverage ? 'spainAverage' : 
                                         entry.name === t.canarias ? 'canarias' : 'community', currentYearIndex);
            
            const yoyText = yoyChange !== null ? 
              `(${parseFloat(yoyChange) >= 0 ? '+' : ''}${yoyChange}%)` : '';
            
            return (
              <div key={index} className="flex items-center mb-1">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600 mr-2">{entry.name}:</span>
                <span className="text-sm font-medium text-gray-800">
                  {formatNumber(entry.value, language, 0)}
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
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg">{t.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={chartRef} className="w-full h-full">
      {/* Selector de comunidad alineado a la derecha, sin título */}
      <div className="mb-4 flex justify-end items-center">
        {/* Selector de comunidad */}
        <div className="flex-shrink-0 relative" ref={dropdownRef}>
          <div 
            className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="flex items-center gap-1 px-2 py-1">
              <FlagImage 
                type="community" 
                code={selectedCommunity.name.toLowerCase()} 
                size={20} 
                strokeColor="rgba(229, 231, 235, 0.5)"
              />
              <span className="text-sm font-medium text-gray-800">
                {selectedCommunity ? selectedCommunity.name : t.selectCommunity}
              </span>
            </div>
            <div className="p-1 px-2 border-l border-gray-200 text-gray-500">
              <ChevronDown size={16} />
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto w-48 right-0">
              {availableCommunities.map(community => (
                <button
                  key={community.code}
                  className={`flex items-center w-full text-left px-3 py-1.5 hover:bg-gray-100 ${
                    community.code === selectedCommunity?.code ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedCommunity(community);
                    setDropdownOpen(false);
                  }}
                >
                  <FlagImage 
                    type="community" 
                    code={community.name.toLowerCase()} 
                    size={18} 
                    strokeColor="rgba(229, 231, 235, 0.5)"
                  />
                  <span className="ml-2 text-sm">{community.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gráfica de líneas */}
      <div ref={chartContainerRef} className="h-80 bg-white rounded-lg border border-gray-100 p-2 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={timeSeriesData}
            margin={{ top: 20, right: 60, left: 20, bottom: 10 }}
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
            
            {/* Línea para la media de España */}
            <Line 
              type="linear" 
              dataKey="spainAverage" 
              name={t.spainAverage}
              stroke={LINE_COLORS.spainAverage} 
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, stroke: LINE_COLORS.spainAverage, strokeWidth: 1, fill: '#fff' }}
              isAnimationActive={false}
            />
            
            {/* Línea para Canarias */}
            <Line 
              type="linear" 
              dataKey="canarias" 
              name={t.canarias}
              stroke={LINE_COLORS.canarias} 
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, stroke: LINE_COLORS.canarias, strokeWidth: 1, fill: '#fff' }}
              isAnimationActive={false}
            />
            
            {/* Línea para la comunidad seleccionada */}
            {selectedCommunity && (
              <Line 
                type="linear" 
                dataKey="community" 
                name={selectedCommunity.name}
                stroke={LINE_COLORS.community} 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, stroke: LINE_COLORS.community, strokeWidth: 1, fill: '#fff' }}
                isAnimationActive={false}
              />
            )}
            
            {/* Banderas renderizadas dentro del SVG */}
            <Customized
              component={(rechartProps: Record<string, unknown>) => (
                <FlagsCustomComponent
                  {...rechartProps}
                  data={timeSeriesData}
                  selectedCommunity={selectedCommunity}
                  texts={t}
                />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Leyenda en la parte inferior central */}
      <div className="flex flex-wrap items-center justify-center mt-4 gap-x-8 gap-y-3">
        {/* Media de España */}
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: LINE_COLORS.spainAverage }}></div>
          <span className="text-sm font-medium text-gray-700">{t.spainAverage}</span>
        </div>
        
        {/* Canarias */}
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: LINE_COLORS.canarias }}></div>
          <span className="text-sm font-medium text-gray-700">{t.canarias}</span>
        </div>
        
        {/* Comunidad seleccionada */}
        {selectedCommunity && (
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: LINE_COLORS.community }}></div>
            <span className="text-sm font-medium text-gray-700">{selectedCommunity.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchersCommunitiesTimelineChart; 