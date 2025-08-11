import React, { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Customized
} from 'recharts';
// Importando datos de country_flags.json
import countryFlagsData from '../logos/country_flags.json';

// Definir la interfaz para los datos de patentes
interface PatentsData {
  sectperf: string;  // Sector of performance
  geo: string;       // Geopolitical entity (ISO code)
  TIME_PERIOD: string; // Año
  OBS_VALUE: string;   // Número de patentes
  OBS_FLAG?: string;   // Flag de observación
  // Otros campos opcionales que podrían ser necesarios
  [key: string]: string | undefined;
}

// Interfaz para los puntos de datos de la serie temporal
interface TimeSeriesDataPoint {
  year: string;
  eu: number | null;
  es: number | null;
  country: number | null;
  [key: string]: string | number | null;
}

// Interfaz para las opciones de países
interface CountryOption {
  name: string;
  localName: string;
  code: string;
  flag?: string;
}

// Interfaz para las props del componente
interface PatentsTimelineChartProps {
  data: PatentsData[];
  language: 'es' | 'en';
  selectedSector: string;
  onCountryChange?: (country: CountryOption) => void;
}

// Interfaz para los textos localizados
interface LocalizedTexts {
  title: string;
  euAverage: string;
  spain: string;
  country: string;
  patentsCount: string;
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

// Interfaz para las escalas de los ejes
interface AxisScale {
  scale: (value: unknown) => number;
}

// Asegurar el tipo correcto para el array de flags
const countryFlags = countryFlagsData as Array<{
  country: string;
  code: string;
  iso3: string;
  flag: string;
}>;

// Constantes para el diseño
const FLAG_SIZE = 20;

// Componente personalizado para mostrar banderas en el gráfico
const FlagsCustomComponent = (props: {
  yAxisMap?: AxisScale[];
  xAxisMap?: AxisScale[];
  data?: TimeSeriesDataPoint[];
  selectedCountry?: CountryOption | null;
  [key: string]: unknown;
}) => {
  const { yAxisMap, xAxisMap, data, selectedCountry } = props;
  
  if (!yAxisMap || !xAxisMap || !data || data.length === 0) {
    return null;
  }

  const getFlagUrl = (type: 'eu' | 'es' | 'country', code?: string) => {
    if (type === 'eu') {
      return 'https://flagcdn.com/eu.svg';
    }
    if (type === 'es') {
      return 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg';
    }
    if (type === 'country' && code) {
      // Buscar en el archivo de banderas
      const foundFlag = countryFlags.find(flag => 
        flag.code.toUpperCase() === code.toUpperCase() ||
        flag.iso3.toUpperCase() === code.toUpperCase()
      );
      
      if (foundFlag) {
        return foundFlag.flag;
      }
      
      // Fallback: usar flagcdn con código en minúsculas
      const lowerCode = code.toLowerCase();
      
      // Mapeo especial para códigos que no coinciden
      const codeMapping: Record<string, string> = {
        'el': 'gr',  // Grecia
        'uk': 'gb'   // Reino Unido
      };
      
      const mappedCode = codeMapping[lowerCode] || lowerCode;
      return `https://flagcdn.com/${mappedCode}.svg`;
    }
    return '';
  };

  // Obtener el último punto de datos válido para cada línea
  const getLastValidPoint = (dataKey: string) => {
    for (let i = data.length - 1; i >= 0; i--) {
      const point = data[i];
      const value = point[dataKey] as number | null;
      if (value !== null && value !== undefined && !isNaN(value)) {
        return { point, value, index: i };
      }
    }
    return null;
  };

  const euPoint = getLastValidPoint('eu');
  const esPoint = getLastValidPoint('es');
  const countryPoint = selectedCountry ? getLastValidPoint('country') : null;

  const renderFlag = (
    point: { point: TimeSeriesDataPoint; value: number; index: number },
    type: 'eu' | 'es' | 'country',
    color: string,
    code?: string
  ) => {
    const xScale = xAxisMap[0]?.scale;
    const yScale = yAxisMap[0]?.scale;
    
    if (!xScale || !yScale) return null;

    const x = xScale(point.point.year);
    const y = yScale(point.value);
    
    if (isNaN(x) || isNaN(y)) return null;

    const flagUrl = getFlagUrl(type, code);
    const flagWidth = FLAG_SIZE;
    const flagHeight = Math.round(FLAG_SIZE * 0.67);
    
    return (
      <g key={`flag-${type}`}>
        {/* Fondo blanco con borde rectangular */}
        <rect
          x={x - flagWidth / 2 - 2}
          y={y - flagHeight / 2 - 2}
          width={flagWidth + 4}
          height={flagHeight + 4}
          fill="white"
          stroke={color}
          strokeWidth={1}
          rx={4}
          ry={4}
        />
        {/* Bandera */}
        <foreignObject
          x={x - flagWidth / 2}
          y={y - flagHeight / 2}
          width={flagWidth}
          height={flagHeight}
        >
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={flagUrl}
              alt={`${type} flag`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <g>
      {euPoint && renderFlag(euPoint, 'eu', '#3B82F6')}
      {esPoint && renderFlag(esPoint, 'es', '#EF4444')}
      {countryPoint && selectedCountry && renderFlag(countryPoint, 'country', '#10B981', selectedCountry.code)}
    </g>
  );
};

const PatentsTimelineChart: React.FC<PatentsTimelineChartProps> = ({
  data,
  language,
  selectedSector,
  onCountryChange
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Textos localizados
  const texts: LocalizedTexts = {
    es: {
      title: "Evolución temporal de patentes",
      euAverage: "Media UE",
      spain: "España",
      country: "País seleccionado",
      patentsCount: "Patentes",
      year: "Año",
      loading: "Cargando...",
      noData: "Sin datos disponibles",
      selectCountry: "Seleccionar país",
      total: "Todos los sectores",
      business: "Sector empresarial",
      government: "Administración Pública",
      education: "Enseñanza Superior",
      nonprofit: "Instituciones Privadas sin Fines de Lucro"
    },
    en: {
      title: "Patents Timeline Evolution",
      euAverage: "EU Average",
      spain: "Spain",
      country: "Selected Country",
      patentsCount: "Patents",
      year: "Year",
      loading: "Loading...",
      noData: "No data available",
      selectCountry: "Select country",
      total: "All sectors",
      business: "Business enterprise sector",
      government: "Government sector",
      education: "Higher education sector",
      nonprofit: "Private non-profit sector"
    }
  }[language];

  // Mapeo de códigos de país a nombres
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
    'NO': {es: 'Noruega', en: 'Norway'},
    'CH': {es: 'Suiza', en: 'Switzerland'},
    'IS': {es: 'Islandia', en: 'Iceland'},
    'TR': {es: 'Turquía', en: 'Turkey'}
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Obtener países disponibles
  const getAvailableCountries = (): CountryOption[] => {
    const countryCodes = new Set<string>();
    
    data.forEach(item => {
      if (item.geo && item.geo !== 'EU27_2020' && item.geo !== 'ES') {
        countryCodes.add(item.geo);
      }
    });

    return Array.from(countryCodes)
      .map(code => {
        const mapping = countryCodeMapping[code];
        if (mapping) {
          // Manejo especial para códigos que no coinciden con los estándares ISO
          let flagInfo;
          if (code === 'UK') {
            // Para Reino Unido, buscar con código GB
            flagInfo = countryFlags.find(flag => 
              flag.code.toUpperCase() === 'GB' ||
              flag.iso3.toUpperCase() === 'GBR'
            );
          } else if (code === 'EL') {
            // Para Grecia, buscar con código GR
            flagInfo = countryFlags.find(flag => 
              flag.code.toUpperCase() === 'GR' ||
              flag.iso3.toUpperCase() === 'GRC'
            );
          } else {
            // Para otros países, búsqueda normal
            flagInfo = countryFlags.find(flag => 
              flag.code.toUpperCase() === code.toUpperCase() ||
              flag.iso3.toUpperCase() === code.toUpperCase()
            );
          }
          
          return {
            name: mapping.en,
            localName: mapping[language],
            code: code,
            flag: flagInfo?.flag
          } as CountryOption;
        }
        return null;
      })
      .filter((country): country is CountryOption => country !== null)
      .sort((a, b) => a.localName.localeCompare(b.localName));
  };

  const availableCountries = getAvailableCountries();

  // Mapear sector seleccionado al código correcto
  const getSectorCode = (selectedSector: string): string => {
    const sectorMapping: Record<string, string> = {
      'total': 'TOTAL',
      'business': 'BES',
      'government': 'GOV',
      'education': 'HES',
      'nonprofit': 'PNP',
      'TOTAL': 'TOTAL',
      'BES': 'BES',
      'GOV': 'GOV',
      'HES': 'HES',
      'PNP': 'PNP'
    };
    return sectorMapping[selectedSector] || 'TOTAL';
  };

  const sectorCode = getSectorCode(selectedSector);

  // Efecto para establecer el país con más patentes como selección por defecto
  useEffect(() => {
    if (availableCountries.length > 0 && !selectedCountry) {
      // Encontrar el país con más patentes en el último año disponible
      const lastYear = Math.max(...data.map(item => parseInt(item.TIME_PERIOD)).filter(year => !isNaN(year)));
      
      let maxPatents = 0;
      let countryWithMostPatents: CountryOption | undefined = undefined;
      
      availableCountries.forEach(country => {
        const countryData = data.find(item => 
          item.geo === country.code && 
          item.TIME_PERIOD === lastYear.toString() && 
          item.sectperf === sectorCode
        );
        
        if (countryData && countryData.OBS_VALUE) {
          const patents = parseFloat(countryData.OBS_VALUE);
          if (!isNaN(patents) && patents > maxPatents) {
            maxPatents = patents;
            countryWithMostPatents = country;
          }
        }
      });
      
      // Si no se encuentra ningún país con datos, usar Alemania por defecto
      if (!countryWithMostPatents) {
        countryWithMostPatents = availableCountries.find(c => c.code === 'DE') || availableCountries[0];
      }
      
      if (countryWithMostPatents) {
        setSelectedCountry(countryWithMostPatents);
        if (onCountryChange) {
          onCountryChange(countryWithMostPatents);
        }
      }
    }
  }, [availableCountries, data, sectorCode, selectedCountry, onCountryChange]);

  // Formatear números en el eje Y
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Preparar datos para el gráfico
  const prepareTimeSeriesData = (): TimeSeriesDataPoint[] => {
    // Obtener todos los años únicos
    const years = Array.from(new Set(data.map(item => item.TIME_PERIOD)))
      .filter(year => year && !isNaN(parseInt(year)))
      .sort();

    return years.map(year => {
      const yearData: TimeSeriesDataPoint = {
        year,
        eu: null,
        es: null,
        country: null
      };

      // Obtener datos de la UE (promedio)
      const euData = data.find(item => 
        item.geo === 'EU27_2020' && 
        item.TIME_PERIOD === year && 
        item.sectperf === sectorCode
      );
      if (euData && euData.OBS_VALUE) {
        const euValue = parseFloat(euData.OBS_VALUE);
        yearData.eu = !isNaN(euValue) ? Math.round(euValue / 27) : null;
      }

      // Obtener datos de España
      const esData = data.find(item => 
        item.geo === 'ES' && 
        item.TIME_PERIOD === year && 
        item.sectperf === sectorCode
      );
      if (esData && esData.OBS_VALUE) {
        const esValue = parseFloat(esData.OBS_VALUE);
        yearData.es = !isNaN(esValue) ? esValue : null;
      }

      // Obtener datos del país seleccionado
      if (selectedCountry) {
        const countryData = data.find(item => 
          item.geo === selectedCountry.code && 
          item.TIME_PERIOD === year && 
          item.sectperf === sectorCode
        );
        if (countryData && countryData.OBS_VALUE) {
          const countryValue = parseFloat(countryData.OBS_VALUE);
          yearData.country = !isNaN(countryValue) ? countryValue : null;
        }
      }

      return yearData;
    });
  };

  const timeSeriesData = prepareTimeSeriesData();

  // Calcular variación interanual
  const calculateYoY = (currentValue: number | null, dataKey: string, currentYearIndex: number) => {
    if (currentValue === null || currentYearIndex === 0) return null;
    
    const previousValue = timeSeriesData[currentYearIndex - 1]?.[dataKey] as number | null;
    if (previousValue === null || previousValue === 0) return null;
    
    return ((currentValue - previousValue) / previousValue) * 100;
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
    if (active && payload && payload.length) {
      const currentYearIndex = timeSeriesData.findIndex(d => d.year === label);
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{`${texts.year}: ${label}`}</p>
          {payload.map((entry, index) => {
            const yoyChange = calculateYoY(entry.value, entry.dataKey, currentYearIndex);
            
            return (
              <div key={index} className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}:</span>
                </div>
                <div className="text-right ml-4">
                  <span className="font-medium text-gray-800">
                    {new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(entry.value)}
                  </span>
                  {yoyChange !== null && (
                    <div className={`text-xs ${yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Componente para mostrar banderas
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
      const euFlag = countryFlags.find(flag => flag.code === 'EU' || flag.iso3 === 'EUU');
      flagUrl = euFlag?.flag || "https://flagcdn.com/eu.svg";
    } else if (type === 'es') {
      // Bandera de España
      const esFlag = countryFlags.find(flag => flag.code === 'ES' || flag.iso3 === 'ESP');
      flagUrl = esFlag?.flag || "https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg";
    } else if (type === 'country' && code) {
      // Manejar casos especiales
      if (code === 'EL') {
        // Buscar la bandera de Grecia usando el código estándar ISO (GR)
        const greeceFlag = countryFlags.find(flag => flag.code === 'GR' || flag.iso3 === 'GRC');
        flagUrl = greeceFlag?.flag || 'https://flagcdn.com/gr.svg';
      } else if (code === 'UK') {
        // Buscar la bandera de Reino Unido usando el código estándar ISO (GB)
        const ukFlag = countryFlags.find(flag => flag.code === 'GB' || flag.iso3 === 'GBR');
        flagUrl = ukFlag?.flag || 'https://flagcdn.com/gb.svg';
      } else {
        // Para otros países, buscar en el JSON de banderas
        const countryFlag = countryFlags.find(flag => flag.code === code || flag.iso3 === code);
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

  // Verificar si hay datos disponibles
  const hasData = timeSeriesData.some(d => d.eu !== null || d.es !== null || d.country !== null);

  if (!hasData) {
    return (
      <div className="flex justify-center items-center bg-gray-50 rounded-lg border border-gray-200" style={{ height: '400px' }}>
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2">{texts.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="mb-4 flex justify-end items-center">
        {/* Selector de país estilo bandera */}
        <div className="flex-shrink-0 relative" ref={dropdownRef}>
          <div 
            className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="flex items-center gap-1 px-2 py-1">
              {selectedCountry && (
                <FlagImage 
                  type="country" 
                  code={selectedCountry.code} 
                  size={20} 
                  strokeColor="rgba(229, 231, 235, 0.5)"
                />
              )}
              <span className="text-sm font-medium text-gray-800">
                {selectedCountry ? (language === 'es' ? selectedCountry.localName : selectedCountry.name) : texts.selectCountry}
              </span>
            </div>
            <div className="p-1 px-2 border-l border-gray-200 text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Menú desplegable */}
          {isDropdownOpen && (
            <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto w-48 right-0">
              {availableCountries
                .filter(country => country.code !== 'ES') // Excluir España del selector
                .map(country => (
                  <button
                    key={country.code}
                    className={`flex items-center w-full text-left px-3 py-1.5 hover:bg-gray-100 ${
                      selectedCountry && country.code === selectedCountry.code ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedCountry(country);
                      setIsDropdownOpen(false);
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

      {/* Gráfico */}
      <div className="h-80 bg-white rounded-lg border border-gray-100 p-2 shadow-sm relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={timeSeriesData}
            margin={{ top: 20, right: 60, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              tick={{ fill: '#4b5563', fontSize: 10 }}
              tickLine={{ stroke: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              label={{ 
                value: texts.patentsCount, 
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
              stroke="#4338ca"
              strokeWidth={2.5}
              dot={false}
              name={texts.euAverage}
              connectNulls={false}
              activeDot={{ r: 6, stroke: "#4338ca", strokeWidth: 1, fill: '#fff' }}
              isAnimationActive={false}
            />
            
            {/* Línea para España */}
            <Line
              type="linear"
              dataKey="es"
              stroke="#dc2626"
              strokeWidth={2.5}
              dot={false}
              name={texts.spain}
              connectNulls={false}
              activeDot={{ r: 6, stroke: "#dc2626", strokeWidth: 1, fill: '#fff' }}
              isAnimationActive={false}
            />
            
            {/* Línea para el país seleccionado */}
            {selectedCountry && selectedCountry.code !== 'ES' && (
              <Line
                type="linear"
                dataKey="country"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                name={selectedCountry.localName}
                connectNulls={false}
                activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 1, fill: '#fff' }}
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
                />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Leyenda en la parte inferior central */}
      <div className="flex flex-wrap items-center justify-center mt-4 gap-x-8 gap-y-3">
        {/* UE */}
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#4338ca" }}></div>
          <span className="text-sm font-medium text-gray-700">{texts.euAverage}</span>
        </div>
        
        {/* España */}
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#dc2626" }}></div>
          <span className="text-sm font-medium text-gray-700">{texts.spain}</span>
        </div>
        
        {/* País seleccionado */}
        {selectedCountry && selectedCountry.code !== 'ES' && (
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#3b82f6" }}></div>
            <span className="text-sm font-medium text-gray-700">
              {language === 'es' ? selectedCountry.localName : selectedCountry.name}
            </span>
          </div>
        )}
      </div>
      
      {/* Nota inferior */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>
          {language === 'es' 
            ? `Sector visualizado: ${texts[selectedSector as keyof typeof texts] || texts.total}`
            : `Visualized sector: ${texts[selectedSector as keyof typeof texts] || texts.total}`
          }
        </p>
      </div>
    </div>
  );
};

export default PatentsTimelineChart; 