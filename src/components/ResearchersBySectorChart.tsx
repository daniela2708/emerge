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
import country_flags from '../logos/country_flags.json';

// Interfaz para los datos de investigadores
interface ResearchersData {
  sectperf: string;  // Sector of performance
  geo: string;       // Geopolitical entity (ISO code)
  TIME_PERIOD: string; // Año
  OBS_VALUE: string;   // Número de investigadores
  OBS_FLAG?: string;   // Flag de observación
  // Otros campos opcionales que podrían ser necesarios
  [key: string]: string | undefined;
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

// Interfaz para un país seleccionable
interface CountryOption {
  name: string;
  localName: string;
  code: string;
  flag?: string;
}

// Interfaz para las propiedades del componente
interface ResearchersBySectorChartProps {
  data: ResearchersData[];
  language: 'es' | 'en';
  countryCode?: string; // Código del país para mostrar los datos (default: 'ES' para España)
  onCountryChange?: (country: CountryOption) => void;
}

// Colores para las líneas de cada sector
const SECTOR_COLORS = {
  total: "#000000",     // Negro para el total
  business: "#3b82f6",  // Azul para empresas
  government: "#dc2626", // Rojo para gobierno
  education: "#10b981", // Verde para educación
  nonprofit: "#f59e0b"  // Ámbar para sin fines de lucro
};

// Lista de países europeos para filtrar
const EUROPEAN_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 
  'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'GB', 'CH', 'NO', 
  'IS', 'TR', 'ME', 'MK', 'AL', 'RS', 'BA', 'MD', 'UA', 'XK'
];

const ResearchersBySectorChart: React.FC<ResearchersBySectorChartProps> = ({
  data,
  language,
  countryCode = 'ES', // Por defecto, España
  onCountryChange
}) => {
  // Estado para los datos procesados de la línea de tiempo
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  // Estado para la comunidad seleccionada (por defecto España)
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>({
    name: 'Spain',
    localName: 'España',
    code: countryCode
  });
  // Lista de países disponibles
  const [availableCountries, setAvailableCountries] = useState<CountryOption[]>([]);
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para controlar la apertura del dropdown
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  // Referencia para detectar clics fuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Textos localizados
  const texts = {
    es: {
      title: "Evolución por sectores",
      researchersCount: "Número de investigadores",
      year: "Año",
      loading: "Cargando datos...",
      noData: "No hay datos disponibles",
      selectCountry: "Seleccionar país",
      // Sectores
      total: "Todos los sectores",
      business: "Sector empresarial",
      government: "Administración Pública",
      education: "Enseñanza Superior",
      nonprofit: "Instituciones Privadas sin Fines de Lucro"
    },
    en: {
      title: "Evolution by Sectors",
      researchersCount: "Number of researchers",
      year: "Year",
      loading: "Loading data...",
      noData: "No data available",
      selectCountry: "Select country",
      // Sectores
      total: "All sectors",
      business: "Business enterprise sector",
      government: "Government sector",
      education: "Higher education sector",
      nonprofit: "Private non-profit sector"
    }
  };

  const t = texts[language];

  // Efecto para cargar los países disponibles
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Obtener los países europeos disponibles
    const countries = data
      .filter(item => 
        // Excluir EU27_2020 y comprobar que es un país europeo
        item.geo !== 'EU27_2020' && 
        (EUROPEAN_COUNTRY_CODES.includes(item.geo) || item.geo === 'EL') && // Incluir explícitamente EL (Grecia)
        item.sectperf === 'TOTAL'
      )
      .reduce((acc: CountryOption[], item) => {
        // Evitar duplicados
        if (!acc.some(c => c.code === item.geo)) {
          // Para Grecia (EL), usar nombres específicos
          if (item.geo === 'EL') {
            acc.push({
              name: 'Greece',
              localName: 'Grecia',
              code: 'EL',
              flag: country_flags.find(f => f.code === 'GR' || f.iso3 === 'GRC')?.flag || 'https://flagcdn.com/gr.svg'
            });
          } else {
            const countryName = getCountryNameFromCode(item.geo);
            const flagUrl = country_flags.find(f => f.code === item.geo || f.iso3 === item.geo)?.flag;
            
            acc.push({
              name: language === 'en' ? countryName : getCountryNameFromCode(item.geo, 'es'),
              localName: getCountryNameFromCode(item.geo, 'es'),
              code: item.geo,
              flag: flagUrl
            });
          }
        }
        return acc;
      }, [])
      .sort((a, b) => {
        // España primero, luego ordenar alfabéticamente
        if (a.code === 'ES') return -1;
        if (b.code === 'ES') return 1;
        return language === 'es' 
          ? a.localName.localeCompare(b.localName) 
          : a.name.localeCompare(b.name);
      });
    
    setAvailableCountries(countries);
    
    // Establecer el país seleccionado basado en el countryCode
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
    }
  }, [data, language, countryCode]);

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
  
  // Efecto para procesar los datos y crear la serie temporal
  useEffect(() => {
    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Obtener años únicos y ordenarlos
      const years = Array.from(new Set(data.map(item => item.TIME_PERIOD)))
        .filter(year => !isNaN(parseInt(year)))
        .sort((a, b) => parseInt(a) - parseInt(b));

      // Mapeo de sectores a sus códigos
      const sectorMapping = {
        'total': 'TOTAL',
        'business': 'BES',
        'government': 'GOV',
        'education': 'HES',
        'nonprofit': 'PNP'
      };

      // Crear puntos de datos para cada año
      const seriesData: TimeSeriesDataPoint[] = years.map(year => {
        // Punto de datos inicial
        const dataPoint: TimeSeriesDataPoint = {
          year,
          total: null,
          business: null,
          government: null,
          education: null,
          nonprofit: null
        };

        // Buscar datos de cada sector para el país seleccionado
        Object.entries(sectorMapping).forEach(([key, sectorCode]) => {
          const sectorData = data.find(row => 
            row.TIME_PERIOD === year && 
            row.geo === selectedCountry.code && 
            row.sectperf === sectorCode
          );

          if (sectorData && sectorData.OBS_VALUE) {
            dataPoint[key] = parseFloat(sectorData.OBS_VALUE.replace(',', '.'));
          }
        });

        return dataPoint;
      });

      setTimeSeriesData(seriesData);
      setLoading(false);
    } catch (error) {
      console.error("Error processing researchers by sector data:", error);
      setLoading(false);
    }
  }, [data, selectedCountry]);

  // Función para formatear el eje Y
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  // Función para obtener el nombre del país a partir del código
  function getCountryNameFromCode(code: string, lang: 'es' | 'en' = language): string {
    // Mapeo de códigos ISO-2 a nombres de países
    const countryNames: Record<string, { es: string, en: string }> = {
      'AT': { es: 'Austria', en: 'Austria' },
      'BE': { es: 'Bélgica', en: 'Belgium' },
      'BG': { es: 'Bulgaria', en: 'Bulgaria' },
      'CY': { es: 'Chipre', en: 'Cyprus' },
      'CZ': { es: 'República Checa', en: 'Czech Republic' },
      'DE': { es: 'Alemania', en: 'Germany' },
      'DK': { es: 'Dinamarca', en: 'Denmark' },
      'EE': { es: 'Estonia', en: 'Estonia' },
      'EL': { es: 'Grecia', en: 'Greece' },
      'ES': { es: 'España', en: 'Spain' },
      'FI': { es: 'Finlandia', en: 'Finland' },
      'FR': { es: 'Francia', en: 'France' },
      'HR': { es: 'Croacia', en: 'Croatia' },
      'HU': { es: 'Hungría', en: 'Hungary' },
      'IE': { es: 'Irlanda', en: 'Ireland' },
      'IT': { es: 'Italia', en: 'Italy' },
      'LT': { es: 'Lituania', en: 'Lithuania' },
      'LU': { es: 'Luxemburgo', en: 'Luxembourg' },
      'LV': { es: 'Letonia', en: 'Latvia' },
      'MT': { es: 'Malta', en: 'Malta' },
      'NL': { es: 'Países Bajos', en: 'Netherlands' },
      'PL': { es: 'Polonia', en: 'Poland' },
      'PT': { es: 'Portugal', en: 'Portugal' },
      'RO': { es: 'Rumanía', en: 'Romania' },
      'SE': { es: 'Suecia', en: 'Sweden' },
      'SI': { es: 'Eslovenia', en: 'Slovenia' },
      'SK': { es: 'Eslovaquia', en: 'Slovakia' },
      'GB': { es: 'Reino Unido', en: 'United Kingdom' },
      'UK': { es: 'Reino Unido', en: 'United Kingdom' },
      'CH': { es: 'Suiza', en: 'Switzerland' },
      'NO': { es: 'Noruega', en: 'Norway' },
      'IS': { es: 'Islandia', en: 'Iceland' },
      'TR': { es: 'Turquía', en: 'Turkey' },
      'UA': { es: 'Ucrania', en: 'Ukraine' },
      'RS': { es: 'Serbia', en: 'Serbia' },
      'BA': { es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina' },
      'ME': { es: 'Montenegro', en: 'Montenegro' },
      'MK': { es: 'Macedonia del Norte', en: 'North Macedonia' },
      'AL': { es: 'Albania', en: 'Albania' },
      'MD': { es: 'Moldavia', en: 'Moldova' },
      'XK': { es: 'Kosovo', en: 'Kosovo' }
    };

    // Si es un país de la UE
    if (countryNames[code]) {
      return lang === 'es' ? countryNames[code].es : countryNames[code].en;
    }

    // Casos especiales
    if (code === 'EU27_2020') {
      return lang === 'es' ? 'Unión Europea' : 'European Union';
    }

    // Si no se encuentra, devolver el código
    return code;
  }

  // Función para calcular el cambio año a año (YoY)
  const calculateYoY = (currentValue: number | null, dataKey: string, currentYearIndex: number) => {
    if (currentValue === null || currentYearIndex <= 0) return null;
    
    const previousYearData = timeSeriesData[currentYearIndex - 1];
    const previousValue = previousYearData?.[dataKey] as number | null;
    
    if (previousValue === null || previousValue === 0) return null;
    
    const percentChange = ((currentValue - previousValue) / previousValue) * 100;
    return percentChange.toFixed(2);
  };

  // Componente para renderizar banderas
  const FlagImage = ({ 
    code, 
    size = 22
  }: { 
    code?: string; 
    size?: number;
  }) => {
    let flagUrl = '';
    
    // Buscar la bandera adecuada según el código
    if (code) {
      // Manejar el caso especial de Grecia (EL)
      if (code === 'EL') {
        // Buscar la bandera de Grecia usando el código estándar ISO (GR)
        const greeceFlag = country_flags.find(flag => flag.code === 'GR' || flag.iso3 === 'GRC');
        flagUrl = greeceFlag?.flag || 'https://flagcdn.com/gr.svg';
      } else {
        // Para otros países, buscar en el JSON de banderas
        const countryFlag = country_flags.find(flag => flag.code === code || flag.iso3 === code);
        flagUrl = countryFlag?.flag || '';
        
        // Si no se encuentra, usar API de banderas
        if (!flagUrl && code.length === 2) {
          flagUrl = `https://flagcdn.com/${code.toLowerCase()}.svg`;
        }
      }
    }
    
    if (!flagUrl) return null;
    
    return (
      <img 
        src={flagUrl} 
        alt=""
        width={size} 
        height={Math.round(size * 0.67)} 
        className="object-cover rounded border border-gray-400 shadow-sm"
        style={{ 
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)'
        }}
      />
    );
  };

  // Componente de tooltip personalizado
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
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    // Encontrar el índice del año actual en los datos
    const yearIndex = timeSeriesData.findIndex(data => data.year === label);
    
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
            {`${selectedCountry.localName} (${label})`}
          </p>
        </div>
        <div className="space-y-2.5">
          {sortedPayload.map((entry, index) => {
            if (entry.value === null) return null;
            
            // Obtener el nombre localizado del sector
            const sectorKey = entry.dataKey as keyof typeof t;
            const sectorName = t[sectorKey] || entry.name;
            
            // Calcular el cambio YoY
            const yoyChange = calculateYoY(entry.value, entry.dataKey, yearIndex);
            const yoyText = yoyChange !== null ? 
              `(${yoyChange.startsWith('-') ? '' : '+'}${yoyChange}%)` : '';
            
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
                      parseFloat(yoyChange) >= 0 
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
      {/* Selector de país (sin título) */}
      <div className="px-4 pt-4 pb-2 flex justify-end items-center">
        {/* Selector de país */}
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="flex items-center gap-1 px-3 py-2">
              <FlagImage code={selectedCountry.code} size={20} />
              <span className="text-sm font-medium text-gray-800 ml-2">
                {language === 'es' ? selectedCountry.localName : selectedCountry.name}
              </span>
            </div>
            <div className="p-1 px-2 border-l border-gray-200 text-gray-500">
              <ChevronDown size={16} />
            </div>
          </div>
          
          {/* Menú desplegable */}
          {dropdownOpen && (
            <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto w-48 right-0">
              {availableCountries.map(country => (
                <button
                  key={country.code}
                  className={`flex items-center w-full text-left px-3 py-2 hover:bg-gray-100 ${
                    country.code === selectedCountry.code ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedCountry(country);
                    setDropdownOpen(false);
                    if (onCountryChange) {
                      onCountryChange(country);
                    }
                  }}
                >
                  <FlagImage code={country.code} size={18} />
                  <span className="ml-2 text-sm">
                    {language === 'es' ? country.localName : country.name}
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
                    name={t.total}
                    stroke={SECTOR_COLORS.total} 
                    strokeWidth={2}
                    strokeDasharray="3 3" // Línea punteada
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.total, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector empresarial */}
                  <Line 
                    type="monotone" 
                    dataKey="business" 
                    name={t.business}
                    stroke={SECTOR_COLORS.business} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.business, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector gobierno */}
                  <Line 
                    type="monotone" 
                    dataKey="government" 
                    name={t.government}
                    stroke={SECTOR_COLORS.government} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.government, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector educación */}
                  <Line 
                    type="monotone" 
                    dataKey="education" 
                    name={t.education}
                    stroke={SECTOR_COLORS.education} 
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: SECTOR_COLORS.education, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                  
                  {/* Línea para el sector sin fines de lucro */}
                  <Line 
                    type="monotone" 
                    dataKey="nonprofit" 
                    name={t.nonprofit}
                    stroke={SECTOR_COLORS.nonprofit} 
                    strokeWidth={1.5}
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

export default ResearchersBySectorChart; 