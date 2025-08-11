import React, { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Customized
} from 'recharts';
import countryFlagsData from '../logos/country_flags.json';
import { EUROPEAN_COUNTRY_CODES } from '../utils/europeanCountries';
import { PatentsDisplayType } from './DataTypeSelector';

// Definir la interfaz para los datos de patentes (igual que en la página principal)
interface PatentsData {
  STRUCTURE?: string;
  STRUCTURE_ID?: string;
  STRUCTURE_NAME?: string;
  freq?: string;
  'Time frequency'?: string;
  coop_ptn?: string;
  'Cooperation partners'?: string;
  unit?: string;
  'Unit of measure'?: string;
  geo: string;       // Código del país (AL, AT, BE, etc.)
  'Geopolitical entity (reporting)'?: string;
  TIME_PERIOD: string; // Año
  Time?: string;
  OBS_VALUE: string;   // Número de patentes
  'Observation value'?: string;
  OBS_FLAG?: string;   // Flag de observación (ej: 'p' para provisional)
  'Observation status (Flag) V2 structure'?: string;
  CONF_STATUS?: string;
  'Confidentiality status (flag)'?: string;
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
interface PatentsEuropeanTimelineChartProps {
  data: PatentsData[];
  language: 'es' | 'en';
  patsDisplayType?: PatentsDisplayType;
  cooperationPartner?: 'APPL' | 'INVT';
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
            />
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <g>
      {euPoint && renderFlag(euPoint, 'eu', '#2563EB')}
      {esPoint && renderFlag(esPoint, 'es', '#EF4444')}
      {countryPoint && selectedCountry && renderFlag(countryPoint, 'country', '#10B981', selectedCountry.code)}
    </g>
  );
};

const PatentsEuropeanTimelineChart: React.FC<PatentsEuropeanTimelineChartProps> = ({
  data,
  language,
  patsDisplayType = 'number',
  cooperationPartner = 'APPL'
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Textos localizados
  const texts = {
    es: {
      title: "Evolución temporal de patentes",
      euAverage: "Media UE",
      spain: "España",
      country: "País seleccionado",
      patentsCount: patsDisplayType === 'number' ? "Patentes" : "Patentes por millón hab.",
      year: "Año",
      loading: "Cargando...",
      noData: "Sin datos disponibles",
      selectCountry: "Seleccionar país"
    },
    en: {
      title: "Patents Timeline Evolution",
      euAverage: "EU Average",
      spain: "Spain",
      country: "Selected Country",
      patentsCount: patsDisplayType === 'number' ? "Patents" : "Patents per million inhab.",
      year: "Year",
      loading: "Loading...",
      noData: "No data available",
      selectCountry: "Select country"
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
    
    const targetUnit = patsDisplayType === 'number' ? 'NR' : 'P_MHAB';
    
    data.forEach(item => {
      if (item.geo && 
          item.geo !== 'EU27_2020' && 
          item.geo !== 'ES' && 
          item.coop_ptn === cooperationPartner &&
          item.unit === targetUnit &&
          EUROPEAN_COUNTRY_CODES.includes(item.geo)) {
        countryCodes.add(item.geo);
      }
    });

    return Array.from(countryCodes)
      .map(code => {
        const mapping = countryCodeMapping[code];
        if (mapping) {
          let flagInfo;
          if (code === 'UK') {
            flagInfo = countryFlags.find(flag => 
              flag.code.toUpperCase() === 'GB' ||
              flag.iso3.toUpperCase() === 'GBR'
            );
          } else if (code === 'EL') {
            flagInfo = countryFlags.find(flag => 
              flag.code.toUpperCase() === 'GR' ||
              flag.iso3.toUpperCase() === 'GRC'
            );
          } else {
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

  // Efecto para establecer el país con más patentes como selección por defecto
  useEffect(() => {
    if (availableCountries.length > 0 && !selectedCountry) {
      // Establecer Alemania por defecto si está disponible, si no el primero de la lista
      const defaultCountry = availableCountries.find(c => c.code === 'DE') || availableCountries[0];
      if (defaultCountry) {
        setSelectedCountry(defaultCountry);
      }
    }
  }, [availableCountries, selectedCountry]);

  // Formatear eje Y
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  };

  // Preparar datos de la serie temporal
  const prepareTimeSeriesData = (): TimeSeriesDataPoint[] => {
    if (!data || data.length === 0) return [];

    const targetUnit = patsDisplayType === 'number' ? 'NR' : 'P_MHAB';
    
    // Obtener todos los años disponibles
    const years = Array.from(new Set(
      data
        .filter(item => 
          item.coop_ptn === cooperationPartner && 
          item.unit === targetUnit
        )
        .map(item => parseInt(item.TIME_PERIOD))
    )).filter(year => !isNaN(year)).sort((a, b) => a - b);

    return years.map(year => {
      const yearStr = year.toString();
      
      // Datos UE
      const euRecord = data.find(item => 
        item.geo === 'EU27_2020' && 
        item.TIME_PERIOD === yearStr && 
        item.coop_ptn === cooperationPartner &&
        item.unit === targetUnit
      );
      let euValue = euRecord ? parseFloat(euRecord.OBS_VALUE) : null;
      if (euValue !== null && !isNaN(euValue)) {
        // Para la UE, mostrar el promedio por país
        euValue = Math.round(euValue / 27);
      } else {
        euValue = null;
      }
      
      // Datos España
      const esRecord = data.find(item => 
        item.geo === 'ES' && 
        item.TIME_PERIOD === yearStr && 
        item.coop_ptn === cooperationPartner &&
        item.unit === targetUnit
      );
      const esValue = esRecord ? parseFloat(esRecord.OBS_VALUE) : null;
      
      // Datos del país seleccionado
      let countryValue = null;
      if (selectedCountry) {
        const countryRecord = data.find(item => 
          item.geo === selectedCountry.code && 
          item.TIME_PERIOD === yearStr && 
          item.coop_ptn === cooperationPartner &&
          item.unit === targetUnit
        );
        countryValue = countryRecord ? parseFloat(countryRecord.OBS_VALUE) : null;
      }
      
      return {
        year: yearStr,
        eu: euValue !== null && !isNaN(euValue) ? euValue : null,
        es: esValue !== null && !isNaN(esValue) ? esValue : null,
        country: countryValue !== null && !isNaN(countryValue) ? countryValue : null
      };
    });
  };

  const timeSeriesData = prepareTimeSeriesData();

  // Calcular cambio año a año
  const calculateYoY = (currentValue: number | null, dataKey: string, currentYearIndex: number) => {
    if (currentValue === null || currentYearIndex === 0) return null;
    
    const previousPoint = timeSeriesData[currentYearIndex - 1];
    const previousValue = previousPoint[dataKey] as number | null;
    
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
    if (!active || !payload || !label) return null;
    
    const currentYearIndex = timeSeriesData.findIndex(d => d.year === label);
    
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="font-semibold text-gray-800 mb-2">{`${texts.year}: ${label}`}</p>
        {payload.map((entry, index) => {
          const yoyChange = calculateYoY(entry.value, entry.dataKey, currentYearIndex);
          const formattedValue = patsDisplayType === 'number' 
            ? entry.value.toLocaleString() 
            : entry.value.toFixed(1);
            
          return (
            <div key={index} className="mb-1 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-700">{entry.name}:</span>
                </div>
                <span className="font-medium text-gray-900">{formattedValue}</span>
              </div>
              {yoyChange !== null && (
                <div className="text-xs text-gray-500 ml-5">
                  {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}% vs año anterior
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Componente de imagen de bandera
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
    const getFlagUrl = (type: 'eu' | 'es' | 'country', code?: string) => {
      if (type === 'eu') return 'https://flagcdn.com/eu.svg';
      if (type === 'es') return 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg';
      if (type === 'country' && code) {
        const foundFlag = countryFlags.find(flag =>
          flag.code.toUpperCase() === code.toUpperCase() ||
          flag.iso3.toUpperCase() === code.toUpperCase()
        );
        
        if (foundFlag) return foundFlag.flag;
        
        const lowerCode = code.toLowerCase();
        const codeMapping: Record<string, string> = {
          'el': 'gr',
          'uk': 'gb'
        };
        
        const mappedCode = codeMapping[lowerCode] || lowerCode;
        return `https://flagcdn.com/${mappedCode}.svg`;
      }
      return '';
    };
    
    const flagUrl = getFlagUrl(type, code);
    
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
        {availableCountries.length > 0 && (
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
        )}
      </div>

      {/* Gráfico */}
      <div className="h-80 bg-white rounded-lg border border-gray-100 p-2 shadow-sm relative">
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
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={false}
              name={texts.euAverage}
              connectNulls={false}
              activeDot={{ r: 6, stroke: "#2563EB", strokeWidth: 1, fill: '#fff' }}
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
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                name={selectedCountry.localName}
                connectNulls={false}
                activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 1, fill: '#fff' }}
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
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#2563EB" }}></div>
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
            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#10B981" }}></div>
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
            ? `Tipo de colaboración: ${cooperationPartner === 'APPL' ? 'Solicitante' : 'Inventor'} · Unidad: ${patsDisplayType === 'number' ? 'Número de patentes' : 'Patentes por millón de habitantes'}`
            : `Collaboration type: ${cooperationPartner === 'APPL' ? 'Applicant' : 'Inventor'} · Unit: ${patsDisplayType === 'number' ? 'Number of patents' : 'Patents per million inhabitants'}`
          }
        </p>
      </div>
    </div>
  );
};

export default PatentsEuropeanTimelineChart; 