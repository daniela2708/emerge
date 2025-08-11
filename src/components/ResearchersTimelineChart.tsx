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
import { SPAIN_FLAG } from '../utils/spainFlag';

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
  eu: number | null;
  es: number | null;
  country: number | null;
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
interface ResearchersTimelineChartProps {
  data: ResearchersData[];
  language: 'es' | 'en';
  selectedSector: string;
  onCountryChange?: (country: CountryOption) => void;
}

// Interfaz para los textos de localización
interface LocalizedTexts {
  title: string;
  euAverage: string;
  spain: string;
  country: string;
  researchersCount: string;
  year: string;
  loading: string;
  noData: string;
  selectCountry: string;
  total: string;
  business: string;
  government: string;
  education: string;
  nonprofit: string;
}

// Interfaz para las escalas de Recharts
interface AxisScale {
  scale: (value: unknown) => number;
}

// Colores para las líneas
const LINE_COLORS = {
  eu: "#4338ca",    // Índigo para UE
  es: "#dc2626",    // Rojo para España
  country: "#3b82f6" // Azul para el país seleccionado
};

// Parámetros para las banderas
const FLAG_SIZE = 22;
const FLAG_MARGIN = 6; // Separación del último punto
const MIN_GAP = 24; // Mínima separación vertical entre banderas

// Lista de países europeos para filtrar
const EUROPEAN_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 
  'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'GB', 'CH', 'NO', 
  'IS', 'TR', 'ME', 'MK', 'AL', 'RS', 'BA', 'MD', 'UA', 'XK'
];

// Componente para renderizar banderas dentro del SVG
const FlagsCustomComponent = (props: {
  yAxisMap?: AxisScale[];
  xAxisMap?: AxisScale[];
  data?: TimeSeriesDataPoint[];
  selectedCountry?: CountryOption;
  texts?: LocalizedTexts;
  [key: string]: unknown;
}) => {
  const { yAxisMap, xAxisMap, data, selectedCountry, texts } = props;
  
  if (!data || !data.length || !yAxisMap || !xAxisMap || !selectedCountry || !texts) return null;

  const xScale = xAxisMap[0]?.scale;
  const yScale = yAxisMap[0]?.scale;
  
  if (!xScale || !yScale) return null;

  // Obtener el último punto de datos
  const lastDataPoint = data[data.length - 1];
  const lastX = xScale(lastDataPoint.year);

  // Función para obtener URL de bandera
  const getFlagUrl = (type: 'eu' | 'es' | 'country', code?: string) => {
    if (type === 'eu') {
      const euFlag = country_flags.find(flag => flag.code === 'EU' || flag.iso3 === 'EUU');
      return euFlag?.flag || "https://flagcdn.com/eu.svg";
    } else if (type === 'es') {
      const esFlag = country_flags.find(flag => flag.code === 'ES' || flag.iso3 === 'ESP');
      return esFlag?.flag || SPAIN_FLAG;
    } else if (type === 'country' && code) {
      if (code === 'EL') {
        const greeceFlag = country_flags.find(flag => flag.code === 'GR' || flag.iso3 === 'GRC');
        return greeceFlag?.flag || 'https://flagcdn.com/gr.svg';
      } else {
        const countryFlag = country_flags.find(flag => flag.code === code || flag.iso3 === code);
        return countryFlag?.flag || `https://flagcdn.com/${code.toLowerCase()}.svg`;
      }
    }
    return '';
  };

  // Preparar puntos de banderas
  const flagPoints = [];

  // UE
  if (lastDataPoint.eu !== null) {
    flagPoints.push({
      key: 'eu',
      x: lastX + FLAG_MARGIN,
      y: yScale(lastDataPoint.eu),
      originalY: yScale(lastDataPoint.eu),
      flagUrl: getFlagUrl('eu'),
      color: LINE_COLORS.eu,
      label: texts.euAverage
    });
  }

  // España
  if (lastDataPoint.es !== null) {
    flagPoints.push({
      key: 'es',
      x: lastX + FLAG_MARGIN,
      y: yScale(lastDataPoint.es),
      originalY: yScale(lastDataPoint.es),
      flagUrl: getFlagUrl('es'),
      color: LINE_COLORS.es,
      label: texts.spain
    });
  }

  // País seleccionado (solo si no es España)
  if (selectedCountry.code !== 'ES' && lastDataPoint.country !== null) {
    flagPoints.push({
      key: 'country',
      x: lastX + FLAG_MARGIN,
      y: yScale(lastDataPoint.country),
      originalY: yScale(lastDataPoint.country),
      flagUrl: getFlagUrl('country', selectedCountry.code),
      color: LINE_COLORS.country,
      label: selectedCountry.name
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

const ResearchersTimelineChart: React.FC<ResearchersTimelineChartProps> = ({
  data,
  language,
  selectedSector,
  onCountryChange
}) => {
  // Estado para los datos procesados de la línea de tiempo
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para el país seleccionado internamente
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>({
    name: 'Germany',
    localName: 'Alemania',
    code: 'DE',
    flag: country_flags.find(f => f.code === 'DE')?.flag
  });
  // Lista de países disponibles
  const [availableCountries, setAvailableCountries] = useState<CountryOption[]>([]);
  // Estado para controlar la apertura del dropdown
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  // Referencia para detectar clics fuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Referencia para el componente
  const chartRef = useRef<HTMLDivElement>(null);
  // Referencia para el contenedor de la gráfica
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Textos localizados
  const texts = {
    es: {
      title: "Evolución temporal",
      euAverage: "Media UE",
      spain: "España",
      country: selectedCountry ? (language === 'es' ? selectedCountry.localName : selectedCountry.name) : "País seleccionado",
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
      title: "Timeline Evolution",
      euAverage: "Avg EU",
      spain: "Spain",
      country: selectedCountry ? (language === 'es' ? selectedCountry.localName : selectedCountry.name) : "Selected Country",
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

    // Obtener el sector seleccionado
    const sectorMapping = {
      'total': 'TOTAL',
      'business': 'BES',
      'government': 'GOV',
      'education': 'HES',
      'nonprofit': 'PNP'
    };
    
    const sectorId = sectorMapping[selectedSector as keyof typeof sectorMapping] || 'TOTAL';
    
    // Obtener los países europeos disponibles
    const countries = data
      .filter(item => 
        // Excluir EU27_2020 y comprobar que es un país europeo
        item.geo !== 'EU27_2020' && 
        (EUROPEAN_COUNTRY_CODES.includes(item.geo) || item.geo === 'EL') && // Incluir explícitamente EL (Grecia)
        item.sectperf === sectorId
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
    
    // Si aún no hay país seleccionado o el seleccionado no está disponible,
    // seleccionar el primero disponible (que no sea España)
    if (countries.length > 0) {
      const nonSpainCountry = countries.find(c => c.code !== 'ES');
      if (nonSpainCountry && (!selectedCountry || !countries.some(c => c.code === selectedCountry.code))) {
        setSelectedCountry(nonSpainCountry);
      }
    }
  }, [data, selectedSector, language]);
  
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

      // Verificar el sector seleccionado
      const sectorMapping = {
        'total': 'TOTAL',
        'business': 'BES',
        'government': 'GOV',
        'education': 'HES',
        'nonprofit': 'PNP'
      };

      const sectorId = sectorMapping[selectedSector as keyof typeof sectorMapping] || 'TOTAL';

      // Crear puntos de datos para cada año
      const seriesData: TimeSeriesDataPoint[] = years.map(year => {
        // Punto de datos inicial
        const dataPoint: TimeSeriesDataPoint = {
          year,
          eu: null,
          es: null,
          country: null
        };

        // 1. Buscar datos de la UE
        const euData = data.find(row => 
          row.TIME_PERIOD === year && 
          row.geo === 'EU27_2020' && 
          row.sectperf === sectorId
        );

        if (euData && euData.OBS_VALUE) {
          // Dividir el valor de la UE entre 27 para obtener la media por país
          dataPoint.eu = parseFloat(euData.OBS_VALUE.replace(',', '.')) / 27;
        }

        // 2. Buscar datos de España
        const esData = data.find(row => 
          row.TIME_PERIOD === year && 
          row.geo === 'ES' && 
          row.sectperf === sectorId
        );

        if (esData && esData.OBS_VALUE) {
          dataPoint.es = parseFloat(esData.OBS_VALUE.replace(',', '.'));
        }

        // 3. Buscar datos del país seleccionado
        if (selectedCountry && selectedCountry.code !== 'ES') {
          const countryData = data.find(row => 
            row.TIME_PERIOD === year && 
            row.geo === selectedCountry.code && 
            row.sectperf === sectorId
          );

          if (countryData && countryData.OBS_VALUE) {
            dataPoint.country = parseFloat(countryData.OBS_VALUE.replace(',', '.'));
          }
        }

        return dataPoint;
      });

      setTimeSeriesData(seriesData);
      setLoading(false);
    } catch (error) {
      console.error("Error processing researchers timeline data:", error);
      setLoading(false);
    }
  }, [data, selectedSector, selectedCountry]);

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
    
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
        <p className="text-sm font-medium mb-2">{`${t.year}: ${label}`}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => {
            if (entry.value === null) return null;
            
            let name = '';
            if (entry.dataKey === 'eu') {
              name = t.euAverage;
            } else if (entry.dataKey === 'es') {
              name = t.spain;
            } else if (entry.dataKey === 'country' && selectedCountry) {
              name = language === 'es' ? selectedCountry.localName : selectedCountry.name;
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
                  <span className="font-medium">{name}: </span>
                  <span>{Math.round(entry.value).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}</span>
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
  };

  // Componente para renderizar banderas
  const FlagImage = ({ 
    type, 
    code, 
    strokeColor,
    size = FLAG_SIZE
  }: { 
    type: 'eu' | 'es' | 'country'; 
    code?: string; 
    strokeColor: string;
    size?: number;
  }) => {
    let flagUrl = '';
    
    // Buscar la bandera adecuada según el tipo
    if (type === 'eu') {
      // Bandera de la UE
      const euFlag = country_flags.find(flag => flag.code === 'EU' || flag.iso3 === 'EUU');
      flagUrl = euFlag?.flag || "https://flagcdn.com/eu.svg";
    } else if (type === 'es') {
      // Bandera de España
      const esFlag = country_flags.find(flag => flag.code === 'ES' || flag.iso3 === 'ESP');
      flagUrl = esFlag?.flag || SPAIN_FLAG;
    } else if (type === 'country' && code) {
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
        style={{ 
          objectFit: 'cover',
          border: `1px solid ${strokeColor}`,
          borderRadius: 4,
          boxShadow: '0 0 0 0.5px rgba(0,0,0,.02)'
        }}
      />
    );
  };

  return (
    <div ref={chartRef} className="w-full h-full">
      <div className="mb-4 flex justify-end items-center">
        {/* Selector de país estilo bandera */}
        <div className="flex-shrink-0 relative" ref={dropdownRef}>
          <div 
            className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="flex items-center gap-1 px-2 py-1">
              <FlagImage 
                type="country" 
                code={selectedCountry.code} 
                size={20} 
                strokeColor="rgba(229, 231, 235, 0.5)"
              />
              <span className="text-sm font-medium text-gray-800">
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
              {availableCountries
                .filter(country => country.code !== 'ES') // Excluir España del selector
                .map(country => (
                  <button
                    key={country.code}
                    className={`flex items-center w-full text-left px-3 py-1.5 hover:bg-gray-100 ${
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
                    <FlagImage 
                      type="country" 
                      code={country.code} 
                      size={18} 
                      strokeColor="rgba(229, 231, 235, 0.5)"
                    />
                    <span className="ml-2 text-sm">
                      {language === 'es' ? country.localName : country.name}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">{t.loading}</p>
          </div>
        </div>
      ) : timeSeriesData.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center">
          <p className="text-gray-500">{t.noData}</p>
        </div>
      ) : (
        <div>
          {/* Gráfica de líneas */}
          <div ref={chartContainerRef} className="h-80 bg-white rounded-lg border border-gray-100 p-2 shadow-sm relative">
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
                
                {/* Línea para la UE */}
                <Line 
                  type="linear" 
                  dataKey="eu" 
                  name={t.euAverage}
                  stroke={LINE_COLORS.eu} 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, stroke: LINE_COLORS.eu, strokeWidth: 1, fill: '#fff' }}
                  isAnimationActive={false}
                />
                
                {/* Línea para España */}
                <Line 
                  type="linear" 
                  dataKey="es" 
                  name={t.spain}
                  stroke={LINE_COLORS.es} 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, stroke: LINE_COLORS.es, strokeWidth: 1, fill: '#fff' }}
                  isAnimationActive={false}
                />
                
                {/* Línea para el país seleccionado */}
                {selectedCountry && selectedCountry.code !== 'ES' && (
                  <Line 
                    type="linear" 
                    dataKey="country" 
                    name={t.country}
                    stroke={LINE_COLORS.country} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: LINE_COLORS.country, strokeWidth: 1, fill: '#fff' }}
                    isAnimationActive={false}
                  />
                )}
                
                {/* Banderas renderizadas dentro del SVG */}
                <Customized
                  component={(rechartProps: Record<string, unknown>) => (
                    <FlagsCustomComponent
                      {...rechartProps}
                      data={timeSeriesData}
                      selectedCountry={selectedCountry}
                      texts={t}
                    />
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Nueva leyenda en la parte inferior central */}
          <div className="flex flex-wrap items-center justify-center mt-4 gap-x-8 gap-y-3">
            {/* UE */}
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: LINE_COLORS.eu }}></div>
              <span className="text-sm font-medium text-gray-700">{t.euAverage}</span>
            </div>
            
            {/* España */}
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: LINE_COLORS.es }}></div>
              <span className="text-sm font-medium text-gray-700">{t.spain}</span>
            </div>
            
            {/* País seleccionado */}
            {selectedCountry && selectedCountry.code !== 'ES' && (
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: LINE_COLORS.country }}></div>
                <span className="text-sm font-medium text-gray-700">
                  {t.country}
                </span>
              </div>
            )}
          </div>
          
          {/* Nota inferior */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              {language === 'es' 
                ? `Sector visualizado: ${t[selectedSector as keyof typeof t] || t.total}`
                : `Visualized sector: ${t[selectedSector as keyof typeof t] || t.total}`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchersTimelineChart;