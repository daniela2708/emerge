import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, ChevronDown } from 'lucide-react';
import Papa from 'papaparse';
import { rdSectors } from '../data/rdInvestment';
import country_flags from '../logos/country_flags.json';
import { communityFlags } from '../utils/spanishCommunitiesUtils';

// Interfaces para los datos CSV
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

type FlagCode = 'eu' | 'es' | 'canary_islands' | string;

interface RegionData {
  name: string;
  flagCode: FlagCode;
  iso3?: string;
  totalPercentage: string;
  total: number;
  data: SectorDataItem[];
}

interface CountryOption {
  name: string;
  localName: string;
  iso3: string;
}

interface FlagProps {
  code: FlagCode;
  width?: number;
  height?: number;
  className?: string;
  iso3?: string;
}

// Componente selector de banderas usando country_flags.json y el ISO3 del país
const Flag: React.FC<FlagProps> = ({ code, width = 24, height = 18, className = "", iso3 }) => {
  // Encontrar la bandera correcta basándose en el código
  let flagUrl = '';
  let extraStyles = '';
  
  // Búsqueda de banderas en los JSON
  const euFlag = country_flags.find(flag => flag.iso3 === 'EUU');
  const esFlag = country_flags.find(flag => flag.iso3 === 'ESP');
  const canaryFlag = communityFlags.find(community => community.code === 'CAN');
  const countryFlag = code === 'country' && iso3 ? country_flags.find(flag => flag.iso3 === iso3) : null;
  
  switch(code) {
    case 'eu':
      // Usar bandera de la UE
      flagUrl = euFlag?.flag || '';
      break;
    case 'es':
      // Usar bandera de España
      flagUrl = esFlag?.flag || '';
      break;
    case 'canary_islands':
      // Usar bandera de Canarias desde el utilitario compartido
      flagUrl = canaryFlag?.flag || '';
      // Agregar estilos especiales para la bandera de Canarias
      extraStyles = 'border border-gray-200 shadow-sm bg-gray-50';
      break;
    case 'country':
      // Usar bandera del país seleccionado
      flagUrl = countryFlag?.flag || '';
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
        className={`rounded ${extraStyles} ${className}`}
      />
    );
  }
  
  return null;
};

interface SectorDistributionProps {
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

// Interfaz para el orden de sectores
interface SectorOrderItem {
  id: string;
  name: string;
}

const SectorDistribution: React.FC<SectorDistributionProps> = ({ language }) => {
  const [selectedYear, setSelectedYear] = useState<string>('2023');
  const [years, setYears] = useState<string[]>([]);
  const [regionsData, setRegionsData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>({
    name: 'Spain',
    localName: 'España',
    iso3: 'ESP'
  });
  const [gdpData, setGdpData] = useState<GDPConsolidadoData[]>([]);
  const [ccaaData, setCcaaData] = useState<GastoIDComunidadesData[]>([]);
  
  // Textos localizados
  const texts = {
    es: {
      year: "Año",
      sector: "Sector",
      ofGDP: "del PIB",
      total: "Total",
      distributionTitle: "Distribución sectorial de la inversión en I+D",
      pibPercentage: "%PIB",
      country: "País",
      selectCountry: "Seleccionar país",
      changeCountry: "Cambiar país"
    },
    en: {
      year: "Year",
      sector: "Sector",
      ofGDP: "of GDP",
      total: "Total",
      distributionTitle: "R&D Investment Distribution by Sectors",
      pibPercentage: "%GDP",
      country: "Country",
      selectCountry: "Select country",
      changeCountry: "Change country"
    }
  };

  const t = texts[language];

  // Colores para cada sector
  const sectorColors: SectorColorMap = {
    'business': '#64748b',      // Sector empresarial
    'government': '#94a3b8',    // Administración Pública
    'education': '#78716c',     // Enseñanza Superior
    'nonprofit': '#84cc16'      // Instituciones Privadas sin Fines de Lucro
  };

  // Dentro del componente SectorDistribution
  // 1. Añadir una referencia al contenedor del gráfico
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Cargar datos una sola vez al montar el componente
  useEffect(() => {
    async function fetchData() {
      try {
        const gdpResponse = await fetch('/data/GDP_data/gdp_consolidado.csv');
        const gdpCsv = await gdpResponse.text();
        const parsedGdp = Papa.parse<GDPConsolidadoData>(gdpCsv, {
          header: true,
          skipEmptyLines: true
        }).data;

        const ccaaResponse = await fetch('/data/GDP_data/gasto_ID_comunidades_porcentaje_pib.csv');
        const ccaaCsv = await ccaaResponse.text();
        const parsedCcaa = Papa.parse<GastoIDComunidadesData>(ccaaCsv, {
          header: true,
          delimiter: ';',
          skipEmptyLines: true
        }).data;

        setGdpData(parsedGdp);
        setCcaaData(parsedCcaa);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Actualizar años disponibles cuando se cargan los datos
  useEffect(() => {
    if (gdpData.length === 0) return;

    const availableYears = [...new Set(gdpData.map(row => row.Year))].sort((a, b) => b.localeCompare(a));
    setYears(availableYears);

    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [gdpData]);

  // Actualizar países disponibles cuando cambia el año, idioma o los datos
  useEffect(() => {
    if (gdpData.length === 0) return;

    const availableCountries = gdpData
      .filter(row =>
        row.Year === selectedYear &&
        row.Sector === 'All Sectors' &&
        !row.Country.includes('European Union') &&
        !row.Country.includes('Euro area')
      )
      .reduce((acc: CountryOption[], row) => {
        const existingCountry = acc.find(c => c.iso3 === row.ISO3);
        if (!existingCountry) {
          acc.push({
            name: row.Country,
            localName: row.País,
            iso3: row.ISO3
          });
        }
        return acc;
      }, [])
      .sort((a, b) => {
        if (a.iso3 === 'ESP') return -1;
        if (b.iso3 === 'ESP') return 1;
        return language === 'es'
          ? a.localName.localeCompare(b.localName)
          : a.name.localeCompare(b.name);
      });

    setCountries(availableCountries);

    if (!availableCountries.some(c => c.iso3 === selectedCountry?.iso3)) {
      const defaultCountry = availableCountries.find(c => c.iso3 === 'ESP') || availableCountries[0];
      setSelectedCountry(defaultCountry);
    }
  }, [gdpData, selectedYear, language]);

  // Procesar datos cuando cambian las dependencias relevantes
  useEffect(() => {
    if (gdpData.length && ccaaData.length && selectedCountry) {
      processData(gdpData, ccaaData, selectedYear, selectedCountry.iso3);
    }
  }, [gdpData, ccaaData, selectedYear, selectedCountry, language]);

  // Procesar datos CSV - Aseguramos que siempre cargamos datos desde los CSV correctos
  const processData = (gdpData: GDPConsolidadoData[], ccaaData: GastoIDComunidadesData[], year: string, selectedCountryISO3: string = 'ESP') => {
    // Verificamos el formato de los datos para determinar si los valores ya están en porcentaje o decimal
    const sampleEUData = gdpData.find(row =>
      row.Year === year && 
      row['%GDP'] !== undefined
    );
    
    const sampleCanaryData = ccaaData.find(row =>
      row['Año'] === year &&
      row['% PIB I+D'] !== undefined
    );
    
    // Determinamos si los valores ya están en porcentaje (> 1) o en decimal (< 1)
    const euValueIsPercentage = sampleEUData && parseFloat(sampleEUData['%GDP']) > 1;
    const canaryValueIsPercentage = sampleCanaryData && parseFloat(sampleCanaryData['% PIB I+D']) > 1;
    
    // Datos para la UE desde gdp_consolidado.csv
    const euTotalData = gdpData.find(row => 
      row.Year === year && 
      row.Country === "European Union - 27 countries (from 2020)" && 
      row.Sector === "All Sectors"
    );
    
    const euSectorData = gdpData.filter(row => 
      row.Year === year && 
      row.Country === "European Union - 27 countries (from 2020)" && 
      row.Sector !== "All Sectors"
    );
    
    // Datos para el país seleccionado desde gdp_consolidado.csv
    const countryData = gdpData.filter(row => row.ISO3 === selectedCountryISO3);
    
    const countryTotalData = countryData.find(row => 
      row.Year === year && 
      row.Sector === "All Sectors"
    );
    
    const countrySectorData = countryData.filter(row => 
      row.Year === year && 
      row.Sector !== "All Sectors"
    );
    
    // Datos para Canarias desde gasto_ID_comunidades_porcentaje_pib.csv
    const canaryTotalData = ccaaData.find(row => 
      row['Año'] === year && 
      row['Comunidad Limpio'] === "Canarias" && 
      row['Sector Id'] === "(_T)"
    );
    
    const canarySectorData = ccaaData.filter(row => 
      row['Año'] === year && 
      row['Comunidad Limpio'] === "Canarias" && 
      row['Sector Id'] !== "(_T)" &&
      row['Sector Id'] !== "_T"
    );

    // Procesar datos para cada región
    const regionsProcessed: RegionData[] = [];
    
    // Almacenaremos el orden de sectores de la UE para usarlo en otras regiones
    let euSectorOrder: SectorOrderItem[] = [];
    
    // UE
    if (euTotalData && euSectorData.length > 0) {
      // Obtenemos el valor tal como viene del CSV, sin modificarlo
      const rawEuTotal = parseFloat(euTotalData['%GDP']);
      // Procesamos según formato detectado
      const euTotal = euValueIsPercentage ? rawEuTotal : rawEuTotal * 100;
      
      // Actualizar el mapeo para incluir los valores YoY en los cálculos
      const euSectorValues = euSectorData.map(row => {
        const sectorId = getSectorIdFromName(row.Sector);
        const rawValue = parseFloat(row['%GDP']);
        const value = euValueIsPercentage ? rawValue : rawValue * 100;
        
        // Calcular YoY para este sector
        const yoyChange = calculateYoYChange(gdpData, ccaaData, year, {
          name: 'Unión Europea',
          flagCode: 'eu',
          totalPercentage: euTotal.toString(),
          total: euTotal,
          data: []
        }, row.Sector);
        
        // Obtener el valor monetario real desde el archivo CSV
        let monetaryValue: number | undefined;
        
        // Primero intentamos obtener el valor directo en millones de euros
        if (row.Approx_RD_Investment_million_euro && row.Approx_RD_Investment_million_euro !== '') {
          monetaryValue = parseFloat(row.Approx_RD_Investment_million_euro.replace(',', '.'));
        }
        
        // Si no hay valor directo, intentamos calcular basado en el PIB
        if (!monetaryValue && value > 0) {
          // Buscar información del PIB de la UE - esto podría requerir datos adicionales
          // Por ahora usamos una estimación
          monetaryValue = value * 1000; // Asumimos PIB aprox. 10 billones de euros
        }
        
        // Asignar el valor total del PIB para referencia
        const totalPib = euTotal.toString();
        
        const sectorItem: SectorDataItem = {
          id: sectorId,
          name: language === 'es' ? 
            rdSectors.find(s => s.id === sectorId)?.name.es || row.Sector :
            rdSectors.find(s => s.id === sectorId)?.name.en || row.Sector,
          value,
          color: getSectorColor(sectorId),
          // La participación porcentual sobre el total
          sharePercentage: (value / euTotal) * 100,
          // Añadir valor monetario
          monetaryValue,
          // Asignar el total del PIB
          totalPib
        };
        
        // Añadir YoY si está disponible
        if (yoyChange !== null) {
          sectorItem.yoyChange = yoyChange;
        }
        
        return sectorItem;
      });
      
      // Ordenamos los sectores de mayor a menor valor
      euSectorValues.sort((a, b) => b.value - a.value);
      
      // Guardamos el orden de sectores para usarlo en otras regiones
      euSectorOrder = euSectorValues.map(s => {
        // Siempre asegurar que haya un ID válido
        const sectorId = s.id || getSectorIdFromName(s.name) || 'unknown';
        return {
          id: sectorId,
          name: s.name
        };
      });
      
      // Calculamos la suma real de los sectores para verificar
      const euSectorSum = euSectorValues.reduce((sum, item) => sum + item.value, 0);
      
      // Usamos el valor total calculado correctamente
      const euProcessed: RegionData = {
        name: language === 'es' ? 'Unión Europea' : 'European Union',
        flagCode: 'eu',
        iso3: 'EUU',
        totalPercentage: euTotal.toString(),
        total: euTotal,
        data: euSectorValues
      };
      
      // Registramos para depuración
      console.log(`UE - Total: ${euTotal.toFixed(2)}%, Suma sectores: ${euSectorSum.toFixed(2)}%`);
      
      regionsProcessed.push(euProcessed);
    }
    
    // País seleccionado
    if (countryTotalData && countrySectorData.length > 0 && euSectorOrder.length > 0) {
      // Obtenemos el valor tal como viene del CSV, sin modificarlo
      const rawCountryTotal = parseFloat(countryTotalData['%GDP']);
      // Procesamos según formato detectado
      const countryTotal = euValueIsPercentage ? rawCountryTotal : rawCountryTotal * 100;
      
      // Procesamos los datos de sectores
      const countrySectorMap = new Map<string, SectorDataItem>();
      
      // Primero creamos un mapa con todos los sectores disponibles
      countrySectorData.forEach(row => {
        const sectorId = getSectorIdFromName(row.Sector);
        const rawValue = parseFloat(row['%GDP']);
        // Si ya está en porcentaje, lo usamos directamente, sino multiplicamos por 100
        const value = euValueIsPercentage ? rawValue : rawValue * 100;
        
        // Calcular YoY para este sector
        const yoyChange = calculateYoYChange(gdpData, ccaaData, year, {
          name: countryTotalData?.Country || 'Country',
          flagCode: 'country',
          iso3: selectedCountryISO3,
          totalPercentage: countryTotal.toString(),
          total: countryTotal,
          data: []
        }, row.Sector);
        
        // Obtener el valor monetario desde el CSV
        let monetaryValue: number | undefined;
        
        // Primero intentamos obtener el valor directo en millones de euros
        if (row.Approx_RD_Investment_million_euro && row.Approx_RD_Investment_million_euro !== '') {
          monetaryValue = parseFloat(row.Approx_RD_Investment_million_euro.replace(',', '.'));
        }
        
        // Si no hay valor directo, intentamos calcular basado en el PIB
        if (!monetaryValue && value > 0) {
          // Valor aproximado
          monetaryValue = value * 500; // Asumimos PIB más pequeño que la UE
        }
        
        // Asignamos el objeto con todos los datos
        countrySectorMap.set(sectorId, {
          name: language === 'es' ? 
            rdSectors.find(s => s.id === sectorId)?.name.es || row.Sector :
            row.Sector,
          value: value,
          color: getSectorColor(sectorId),
          yoyChange: yoyChange !== null ? yoyChange : undefined,
          monetaryValue,
          totalPib: countryTotal.toString()
        });
      });
      
      // Luego ordenamos los sectores según el orden de la UE
      const countrySectorValues = euSectorOrder.map(sectorInfo => {
        // Si el sector existe en los datos del país, lo usamos
        if (countrySectorMap.has(sectorInfo.id)) {
          return countrySectorMap.get(sectorInfo.id)!;
        }
        // Si no existe, creamos un valor cero
        return {
          name: sectorInfo.name,
          value: 0,
          color: getSectorColor(sectorInfo.id)
        };
      });
      
      // Calculamos la suma real de los sectores para verificar
      const countrySectorSum = countrySectorValues.reduce((sum, item) => sum + item.value, 0);
      
      // Usamos el valor total calculado correctamente
      const countryProcessed: RegionData = {
        name: language === 'es' ? countryTotalData.País : countryTotalData.Country,
        flagCode: 'country',
        iso3: countryTotalData.ISO3,
        totalPercentage: countryTotal.toString(),
        total: countryTotal,
        data: countrySectorValues
      };
      
      // Registramos para depuración
      console.log(`${countryTotalData.Country} - Total: ${countryTotal.toFixed(2)}%, Suma sectores: ${countrySectorSum.toFixed(2)}%`);
      
      regionsProcessed.push(countryProcessed);
    }
    
    // Canarias
    if (canaryTotalData && canarySectorData.length > 0 && euSectorOrder.length > 0) {
      // Obtenemos el valor tal como viene del CSV, sin modificarlo
      const rawCanaryTotal = parseFloat(canaryTotalData['% PIB I+D']);
      
      // No multiplicamos por 100 - mantenemos el valor original para Canarias
      const canaryTotal = rawCanaryTotal;
      
      console.log(`Canarias - Valor total: ${canaryTotal}`);
      
      // Creamos un mapa para los sectores de Canarias
      const canarySectorMap = new Map<string, SectorDataItem>();
      
      // Procesamos los datos de sectores
      canarySectorData.forEach(row => {
        const sectorIdRaw = row['Sector Id'].replace(/[()]/g, '');
        const sectorId = getSectorIdFromCode(sectorIdRaw);
        const rawValue = parseFloat(row['% PIB I+D']) || 0; // Aseguramos valor numérico
        
        // No convertimos - mantenemos el valor original
        const value = rawValue;
        
        // Calcular YoY para este sector
        const yoyChange = calculateYoYChange(gdpData, ccaaData, year, {
          name: language === 'es' ? 'Islas Canarias' : 'Canary Islands',
          flagCode: 'canary_islands',
          totalPercentage: canaryTotal.toString(),
          total: canaryTotal,
          data: []
        }, row['Sector Nombre']);
        
        // Calcular el valor monetario real desde los datos
        let monetaryValue: number | undefined;
        
        // Obtener el valor en miles de euros del archivo CSV
        if (row['Gasto en I+D (Miles €)']) {
          const gastosEnMiles = parseFloat(row['Gasto en I+D (Miles €)'].replace('.', '').replace(',', '.'));
          // Convertir de miles a millones
          monetaryValue = gastosEnMiles / 1000;
        }
        
        canarySectorMap.set(sectorId, {
          name: language === 'es' ? 
            rdSectors.find(s => s.id === sectorId)?.name.es || row['Sector Nombre'] :
            rdSectors.find(s => s.id === sectorId)?.name.en || row['Sector'],
          value: value,
          color: getSectorColor(sectorId),
          yoyChange: yoyChange !== null ? yoyChange : undefined,
          monetaryValue,
          totalPib: canaryTotal.toString()
        });
      });
      
      // Ordenamos los sectores según el orden de la UE
      const canarySectorValues = euSectorOrder.map(sectorInfo => {
        // Si el sector existe en los datos de Canarias, lo usamos
        if (canarySectorMap.has(sectorInfo.id)) {
          return canarySectorMap.get(sectorInfo.id)!;
        }
        // Si no existe, creamos un valor cero
        return {
          name: sectorInfo.name,
          value: 0,
          color: getSectorColor(sectorInfo.id)
        };
      });
      
      // Calculamos la suma real de los sectores para verificar
      const canarySectorSum = canarySectorValues.reduce((sum, item) => sum + item.value, 0);
      
      // Usamos el valor total calculado correctamente
      const canaryProcessed: RegionData = {
        name: language === 'es' ? 'Islas Canarias' : 'Canary Islands',
        flagCode: 'canary_islands',
        totalPercentage: canaryTotal.toString(),
        total: canaryTotal,
        data: canarySectorValues
      };
      
      // Registramos para depuración
      console.log(`Canarias - Total procesado: ${canaryTotal.toFixed(2)}%`);
      console.log(`Canarias - Suma sectores: ${canarySectorSum.toFixed(2)}%`);
      console.log(`Canarias - Sectores encontrados: ${canarySectorValues.length}`);
      
      regionsProcessed.push(canaryProcessed);
    } else {
      console.warn('No se encontraron datos completos para Canarias en el año seleccionado');
      if (!canaryTotalData) console.warn(`  - Falta dato total para Canarias en el año ${year}`);
      if (!canarySectorData || canarySectorData.length === 0) console.warn(`  - No hay datos de sectores para Canarias en el año ${year}`);
    }
    
    // Aseguramos que los nombres están en el idioma correcto
    regionsProcessed.forEach(region => {
      region.data.forEach(sector => {
        // Actualizar el nombre según el idioma seleccionado si es necesario
        const sectorId = getSectorIdFromName(sector.name);
        if (sectorId !== 'unknown') {
          const sectorInfo = rdSectors.find(s => s.id === sectorId);
          if (sectorInfo) {
            sector.name = language === 'es' ? sectorInfo.name.es : sectorInfo.name.en;
          }
        }
      });
    });
    
    // Calcular porcentajes para cada región
    const processedWithPercentages = regionsProcessed.map(region => {
      // Calculamos la suma real de todos los valores para asegurar que el %Total sume 100%
      const actualTotal = region.data.reduce((sum, item) => sum + item.value, 0);
      
      const dataWithPercentage = region.data.map(sector => {
        // Calculamos el porcentaje basado en la suma real
        const sharePercentage = (sector.value / actualTotal) * 100;
        return { 
          ...sector, 
          sharePercentage
        };
      });
      
      return {
        ...region,
        data: dataWithPercentage
      };
    });
    
    setRegionsData(processedWithPercentages);
  };

  // Función para obtener el color del sector
  const getSectorColor = (sectorId: string): string => {
    if (sectorId === 'business' || sectorId === 'government' || sectorId === 'education' || sectorId === 'nonprofit') {
      return sectorColors[sectorId];
    }
    return '#cbd5e1'; // Color por defecto si no hay coincidencia
  };
  
  // Función para obtener el ID del sector a partir del nombre en inglés
  const getSectorIdFromName = (sectorNameEn: string): string => {
    const sector = rdSectors.find(s => s.name.en === sectorNameEn);
    return sector?.id || 'unknown';
  };
  
  // Función para obtener el ID del sector a partir del código
  const getSectorIdFromCode = (sectorCode: string): string => {
    const sector = rdSectors.find(s => s.code === sectorCode);
    return sector?.id || 'unknown';
  };

  // Obtener el valor de color sin el prefijo bg-
  const getHeaderColorValue = (code: FlagCode): string => {
    switch(code) {
      case 'eu':
        return '#4338ca'; // indigo-700
      case 'es':
      case 'country':
        return '#dc2626'; // red-600
      case 'canary_islands':
        return '#3b82f6'; // blue-500
      default:
        return '#6366f1'; // indigo-500
    }
  };

  const SectorList: React.FC<{
    data: RegionData;
  }> = ({ data }) => {
    return (
      <div className="mt-1">
        {/* Encabezados de la tabla */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-1">
          <div>{t.sector}</div>
          <div className="text-right">{t.pibPercentage}</div>
          <div className="text-right">%{t.total}</div>
        </div>
        
        {/* Filas de datos */}
        {data.data.map((sector: SectorDataItem, i: number) => (
          <div key={i} className="grid grid-cols-3 gap-2 text-xs py-1 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: sector.color }}></div>
              <div className="leading-tight">{sector.name}</div>
            </div>
            <div className="font-medium text-right">{sector.value.toFixed(2)}%</div>
            <div className="text-right text-gray-600">{sector.sharePercentage?.toFixed(2)}%</div>
          </div>
        ))}
        
        {/* Fila de totales */}
        <div className="grid grid-cols-3 gap-2 text-xs py-1 border-t border-gray-200 font-medium mt-1">
          <div>{t.total}:</div>
          <div className="text-right">{parseFloat(data.totalPercentage).toFixed(2)}%</div>
          <div className="text-right">100%</div>
        </div>
      </div>
    );
  };

  // Función para normalizar texto (para comparaciones consistentes)
  const normalizarTextoLocal = (texto: string | undefined): string => {
    if (!texto) return '';
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Función para calcular el cambio porcentual año tras año
  const calculateYoYChange = (
    gdpData: GDPConsolidadoData[],
    autonomousCommunitiesData: GastoIDComunidadesData[],
    year: string,
    region: RegionData,
    sectorName: string
  ): number | null => {
    // Si no tenemos datos o el año es el primero disponible, no podemos calcular YoY
    if (!gdpData.length || parseInt(year) <= 2000) return null;
    
    const previousYear = (parseInt(year) - 1).toString();
    const flagCode = region.flagCode;
    
    // Para depuración - imprimir los valores YoY
    console.log(`Calculando YoY para ${region.name}, sector: ${sectorName}, año: ${year}, año anterior: ${previousYear}`);
    
    // Determinar si buscamos en datos europeos o de comunidades autónomas
    if (flagCode === 'eu') {
      // Para la Unión Europea, probar con varias posibilidades de nombres
      
      // Lista de posibles nombres para la UE
      const euNames = [
        "European Union - 27 countries (from 2020)",
        "European Union",
        "EU27_2020"
      ];
      
      // Buscar por cada nombre posible
      let currentYearData = null;
      let previousYearData = null;
      
      // Intentar con cada nombre posible
      for (const euName of euNames) {
        // Intentar búsqueda exacta primero
        const currentExact = gdpData.find(row => 
          row.Year === year && 
          row.Country === euName && 
          row.Sector === sectorName
        );
        
        const previousExact = gdpData.find(row => 
          row.Year === previousYear && 
          row.Country === euName && 
          row.Sector === sectorName
        );
        
        if (currentExact && previousExact) {
          currentYearData = currentExact;
          previousYearData = previousExact;
          console.log(`Encontrados datos de UE con nombre exacto: ${euName}`);
          break;
        }
        
        // Si no se encuentra con búsqueda exacta, intentar búsqueda flexible
        const currentFlexible = gdpData.find(row => 
          row.Year === year && 
          row.Country.includes(euName) && 
          row.Sector === sectorName
        );
        
        const previousFlexible = gdpData.find(row => 
          row.Year === previousYear && 
          row.Country.includes(euName) && 
          row.Sector === sectorName
        );
        
        if (currentFlexible && previousFlexible) {
          currentYearData = currentFlexible;
          previousYearData = previousFlexible;
          console.log(`Encontrados datos de UE con nombre flexible: ${euName}`);
          break;
        }
      }
      
      // Si no encontramos con ningún método, intentar búsqueda muy flexible
      if (!currentYearData || !previousYearData) {
        currentYearData = gdpData.find(row => 
          row.Year === year && 
          normalizarTextoLocal(row.Country).includes('europe') && 
          normalizarTextoLocal(row.Country).includes('union') && 
          row.Sector === sectorName
        );
        
        previousYearData = gdpData.find(row => 
          row.Year === previousYear && 
          normalizarTextoLocal(row.Country).includes('europe') && 
          normalizarTextoLocal(row.Country).includes('union') && 
          row.Sector === sectorName
        );
        
        if (currentYearData && previousYearData) {
          console.log('Encontrados datos de UE con búsqueda flexible');
        }
      }
      
      console.log('Datos UE actual:', currentYearData);
      console.log('Datos UE anterior:', previousYearData);
      
      if (currentYearData && previousYearData) {
        const currentValue = parseFloat(currentYearData['%GDP'].replace(',', '.'));
        const previousValue = parseFloat(previousYearData['%GDP'].replace(',', '.'));
        
        console.log(`UE - Valor actual: ${currentValue}, Valor anterior: ${previousValue}`);
        
        if (previousValue > 0) {
          const yoyValue = ((currentValue - previousValue) / previousValue) * 100;
          console.log(`UE - YoY calculado exacto: ${yoyValue}`);
          
          // Devolver el valor sin redondeo a cero
          return yoyValue;
        }
      } else {
        console.log('No se encontraron datos para calcular YoY de la UE');
      }
    } else if (flagCode === 'es') {
      // Para España, buscar en gdpData
      const currentYearData = gdpData.find(row => 
        row.Year === year && 
        (normalizarTextoLocal(row.Country).includes('spain') || normalizarTextoLocal(row.País || '').includes('españa')) && 
        normalizarTextoLocal(row.Sector) === normalizarTextoLocal(sectorName)
      );
      
      const previousYearData = gdpData.find(row => 
        row.Year === previousYear && 
        (normalizarTextoLocal(row.Country).includes('spain') || normalizarTextoLocal(row.País || '').includes('españa')) && 
        normalizarTextoLocal(row.Sector) === normalizarTextoLocal(sectorName)
      );
      
      if (currentYearData && previousYearData) {
        const currentValue = parseFloat(currentYearData['%GDP'].replace(',', '.'));
        const previousValue = parseFloat(previousYearData['%GDP'].replace(',', '.'));
        
        if (previousValue > 0) {
          const yoyValue = ((currentValue - previousValue) / previousValue) * 100;
          // Devolver el valor sin redondeo a cero
          return yoyValue;
        }
      }
    } else if (flagCode === 'canary_islands') {
      // Para Canarias, buscar en autonomousCommunitiesData
      // Probar diferentes enfoques para encontrar los datos
      
      // Primero intentar por el nombre del sector
      try {
        // Buscar primero por el nombre exacto del sector
        let currentYearData = autonomousCommunitiesData.find(row => 
          row["Año"] === year && 
          normalizarTextoLocal(row["Comunidad Limpio"]) === "canarias" && 
          normalizarTextoLocal(row["Sector Nombre"] || '') === normalizarTextoLocal(sectorName)
        );
        
        let previousYearData = autonomousCommunitiesData.find(row => 
          row["Año"] === previousYear && 
          normalizarTextoLocal(row["Comunidad Limpio"]) === "canarias" && 
          normalizarTextoLocal(row["Sector Nombre"] || '') === normalizarTextoLocal(sectorName)
        );
        
        // Si no se encuentra, intentar con código de sector
        if (!currentYearData || !previousYearData) {
          // Mapear el nombre del sector a un ID
          const sectorId = getSectorIdFromName(sectorName);
          const sectorCode = sectorId.toUpperCase();
          
          console.log(`Buscando sector Canarias con código: ${sectorCode}, original: ${sectorName}`);
          
          // Buscar por código de sector
          currentYearData = autonomousCommunitiesData.find(row => 
            row["Año"] === year && 
            normalizarTextoLocal(row["Comunidad Limpio"]) === "canarias" && 
            row["Sector Id"].includes(sectorCode)
          );
          
          previousYearData = autonomousCommunitiesData.find(row => 
            row["Año"] === previousYear && 
            normalizarTextoLocal(row["Comunidad Limpio"]) === "canarias" && 
            row["Sector Id"].includes(sectorCode)
          );
        }
        
        console.log('Datos Canarias actual:', currentYearData);
        console.log('Datos Canarias anterior:', previousYearData);
        
        if (currentYearData && previousYearData) {
          const currentValue = parseFloat(currentYearData["% PIB I+D"].replace(',', '.'));
          const previousValue = parseFloat(previousYearData["% PIB I+D"].replace(',', '.'));
          
          console.log(`Canarias - Valor actual: ${currentValue}, Valor anterior: ${previousValue}`);
          
          if (previousValue > 0) {
            const yoyValue = ((currentValue - previousValue) / previousValue) * 100;
            console.log(`Canarias - YoY calculado exacto: ${yoyValue}`);
            
            // Devolver el valor sin redondeo a cero
            return yoyValue;
          }
        } else {
          console.log('No se encontraron datos completos para calcular YoY de Canarias');
        }
      } catch (error) {
        console.error(`Error calculando YoY para Canarias, sector ${sectorName}:`, error);
        return null;
      }
    } else if (flagCode === 'country') {
      // Para otros países, buscar en gdpData por ISO3
      if (!region.iso3) return null;
      
      const currentYearData = gdpData.find(row => 
        row.Year === year && 
        row.ISO3 === region.iso3 && 
        normalizarTextoLocal(row.Sector) === normalizarTextoLocal(sectorName)
      );
      
      const previousYearData = gdpData.find(row => 
        row.Year === previousYear && 
        row.ISO3 === region.iso3 && 
        normalizarTextoLocal(row.Sector) === normalizarTextoLocal(sectorName)
      );
      
      if (currentYearData && previousYearData) {
        const currentValue = parseFloat(currentYearData['%GDP'].replace(',', '.'));
        const previousValue = parseFloat(previousYearData['%GDP'].replace(',', '.'));
        
        if (previousValue > 0) {
          const yoyValue = ((currentValue - previousValue) / previousValue) * 100;
          // Devolver el valor sin redondeo a cero
          return yoyValue;
        }
      }
    }
    
    return null;
  };

  // Agregar función para formatear números con separador de miles
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('es-ES').format(value);
  };

  // Función personalizada para el contenido del tooltip
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, region }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      
      // Obtener el cambio YoY desde los datos
      const yoyChange = data.yoyChange !== undefined ? data.yoyChange : null; 
      
      // Obtener el valor monetario desde los datos
      const monetaryValue = data.monetaryValue !== undefined ? data.monetaryValue : Math.round(data.value * 100);
      
      // Obtener el total de PIB
      const totalPib = data.totalPib || parseFloat(data.value.toString()).toFixed(2);
      
      // Usar el color del sector para la línea superior
      const borderColor = data.color || '#64748b'; // Color por defecto si no hay color de sector
      
      // Determinar el color basado en si el YoY es positivo o negativo
      const yoyColor = yoyChange === null ? 'bg-gray-100 text-gray-600' : 
                       (yoyChange > 0 ? 'bg-green-100 text-green-700' : 
                        yoyChange < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600');
      
      // Determinar el icono basado en si el YoY es positivo o negativo
      const yoyIcon = yoyChange === null ? null : 
                     (yoyChange > 0 ? 
                      "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" :
                      yoyChange < 0 ?
                      "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" :
                      "M5.75 12.25H18.25M5.75 12.25L9 16M5.75 12.25L9 9");
      
      // Formatear el valor YoY para mostrar - redondear a 1 decimal siempre
      const formattedYoY = yoyChange === null ? "" : 
                          (Math.abs(yoyChange) < 0.01 ? "±0.0% YoY" : 
                          `${yoyChange > 0 ? '+' : ''}${yoyChange.toFixed(1)}% YoY`);
      
      // Determinar el estilo visual del indicador YoY
      const yoyDisplay = yoyChange === null ? "hidden" : "flex";
      
      // Valores específicos para diferentes regiones y formato especial
      let displayMonetaryValue = monetaryValue;
      let monetaryUnit = '';
      
      // Determinar la unidad monetaria según la región
      if (region === (language === 'es' ? 'Unión Europea' : 'European Union') || 
          region === (language === 'es' ? 'España' : 'Spain')) {
        // Para UE y España, mostrar en millones de euros
        monetaryUnit = language === 'es' ? 'Mill. €' : 'Mill. €';
      } else {
        // Para comunidades autónomas, mostrar en miles de euros
        monetaryUnit = language === 'es' ? 'miles €' : 'K €';
        // Convertir el valor si está en millones
        if (displayMonetaryValue < 1000) {
          displayMonetaryValue = displayMonetaryValue * 1000;
        }
      }
      
      // Formatear el valor monetario según corresponda
      const formattedMonetary = formatNumber(Math.round(displayMonetaryValue));
      
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
              <div className="text-gray-700 font-medium">{formattedMonetary} {monetaryUnit}</div>
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
      {/* Filter section - Solo con el selector de año */}
      <div className="bg-blue-50 px-4 py-3 flex flex-wrap items-center gap-4">
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
      
      {loading ? (
        <div className="flex justify-center items-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Chart grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {regionsData.map((region, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded overflow-hidden">
              {/* Region header - Con selector para el país */}
              <div className="bg-white p-3 flex items-center justify-between border-t-4" style={{ borderColor: getHeaderColorValue(region.flagCode) }}>
                <div className="flex items-center">
                  <div className="mr-3">
                    <Flag 
                      code={region.flagCode} 
                      width={24} 
                      height={18} 
                      iso3={region.flagCode === 'country' ? region.iso3 : undefined} 
                    />
                  </div>
                  
                  {region.flagCode === 'country' ? (
                    <div className="relative group">
                      <button 
                        className="font-medium text-gray-800 flex items-center border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                        onClick={() => {
                          const dropdown = document.getElementById('country-dropdown');
                          if (dropdown) {
                            dropdown.classList.toggle('hidden');
                          }
                        }}
                      >
                        <span className="mr-1 truncate max-w-[150px]">{region.name}</span>
                        <ChevronDown size={16} className="text-gray-500 ml-auto" />
                      </button>
                      
                      <div 
                        id="country-dropdown"
                        className="absolute z-10 mt-1 hidden bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto w-64"
                      >
                        <div className="py-1">
                          {countries.map(country => (
                            <button
                              key={country.iso3}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${selectedCountry?.iso3 === country.iso3 ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                setSelectedCountry(country);
                                document.getElementById('country-dropdown')?.classList.add('hidden');
                              }}
                            >
                              <div className="mr-2">
                                <Flag 
                                  code="country" 
                                  width={20} 
                                  height={15} 
                                  iso3={country.iso3} 
                                />
                              </div>
                              {language === 'es' ? country.localName : country.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <h3 className="font-medium text-gray-800">{region.name}</h3>
                  )}
                </div>
              </div>
              
              {/* Chart */}
              <div className="py-5 px-2 flex justify-center">
                <div className="relative w-48 h-48" ref={chartContainerRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={region.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        isAnimationActive={false}
                      >
                        {region.data.map((entry, i) => (
                          <Cell 
                            key={`cell-${i}`} 
                            fill={entry.color} 
                            stroke="white"
                            strokeWidth={1}
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
                </div>
              </div>
              
              {/* Data table - Usando SectorList */}
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

export default SectorDistribution; 