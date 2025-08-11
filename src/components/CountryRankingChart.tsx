import React, { memo, useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import * as d3 from 'd3';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions,
  ChartEvent
} from 'chart.js';
import { EuropeCSVData } from '../data/rdInvestment';
import { EU_COLORS, SECTOR_COLORS } from '../utils/colors';
// Importando datos de country_flags.json en lugar del archivo eliminado country-flags.tsx
import countryFlagsData from '../logos/country_flags.json';
import { DataDisplayType } from './DataTypeSelector';
// Para usar las banderas SVG, debes importarlas del archivo logos/country-flags.tsx
// import { FlagSpain, FlagEU, FlagCanaryIslands, FlagSweden, FlagFinland } from '../logos/country-flags';

// Interfaz para los elementos del archivo country_flags.json
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
}

// Aseguramos el tipo correcto para el array de flags
const countryFlags = countryFlagsData as CountryFlag[];

// Registrar componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Interfaz para los datos de comunidades autónomas
interface AutonomousCommunityData {
  "Comunidad (Original)": string;
  "Comunidad Limpio": string;
  "Comunidad en Inglés": string;
  "Año": string;
  "Sector Id": string;
  "Sector": string;
  "Gasto en I+D (Miles €)": string;
  "PIB (Miles €)": string;
  "% PIB I+D": string;
  "Sector Nombre": string;
  [key: string]: string;
}

// Modificar la prop interface para utilizar el tipo original
interface CountryRankingChartProps {
  data: EuropeCSVData[];
  selectedYear: number;
  language: 'es' | 'en';
  selectedSector?: string;
  autonomousCommunitiesData?: AutonomousCommunityData[];
  dataDisplayType?: DataDisplayType;
}

// Colores para la gráfica
const CHART_PALETTE = {
  DEFAULT: EU_COLORS.PRIMARY_BLUE, // Azul UE principal
  LIGHT: EU_COLORS.ALT_BLUE,       // Azul UE más claro
  DARK: '#002266',                 // Variante más oscura del azul UE
  HIGHLIGHT: '#CC0000',            // Mantener el rojo para España
  TEXT: '#000000',                 // Color del texto (negro) 
  BORDER: '#E5E7EB',               // Color del borde (gris suave)
  YELLOW: EU_COLORS.PRIMARY_YELLOW, // Amarillo UE para Unión Europea
  GREEN: '#009900'                 // Verde para las zonas Euro
};

// Mapeo de etiquetas a descripciones
const labelDescriptions: Record<string, { es: string, en: string }> = {
  'e': {
    es: 'Estimado',
    en: 'Estimated'
  },
  'p': {
    es: 'Provisional',
    en: 'Provisional'
  },
  'b': {
    es: 'Ruptura en la serie',
    en: 'Break in series'
  },
  'd': {
    es: 'Definición difiere',
    en: 'Definition differs'
  },
  'u': {
    es: 'Baja fiabilidad',
    en: 'Low reliability'
  },
  'bd': {
    es: 'Ruptura en la serie y definición difiere',
    en: 'Break in series and definition differs'
  },
  'bp': {
    es: 'Ruptura en la serie y provisional',
    en: 'Break in series and provisional'
  },
  'dp': {
    es: 'Definición difiere y provisional',
    en: 'Definition differs and provisional'
  },
  'ep': {
    es: 'Estimado y provisional',
    en: 'Estimated and provisional'
  }
};

const CountryRankingChart: React.FC<CountryRankingChartProps> = ({ 
  data, 
  selectedYear, 
  language,
  selectedSector = 'total',
  autonomousCommunitiesData = [],
  dataDisplayType = 'percent_gdp'
}) => {
  const chartRef = useRef(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Textos traducidos
  const texts = {
    es: {
      title: "Ranking de países por inversión en I+D",
      axisLabel: dataDisplayType === 'percent_gdp' ? "% del PIB" : "Millones de €",
      noData: "No hay datos disponibles para este año",
      rdInvestment: "Inversión I+D",
      countryRanking: "Ranking de países",
      allSectors: "Todos los sectores",
      sector_total: "Todos los sectores",
      sector_business: "Sector empresarial",
      sector_government: "Sector gubernamental", 
      sector_education: "Sector educativo superior",
      sector_nonprofit: "Sector privado sin ánimo de lucro"
    },
    en: {
      title: "Country Ranking by R&D Investment",
      axisLabel: dataDisplayType === 'percent_gdp' ? "% of GDP" : "Million €", 
      noData: "No data available for this year",
      rdInvestment: "R&D Investment",
      countryRanking: "Country Ranking",
      allSectors: "All Sectors",
      sector_total: "All Sectors",
      sector_business: "Business enterprise sector",
      sector_government: "Government sector",
      sector_education: "Higher education sector",
      sector_nonprofit: "Private non-profit sector"
    }
  };

  const t = texts[language];

  // Mapeo entre ID de sector y nombre en inglés para consultas
  const sectorNameMapping: Record<string, string> = {
    'total': 'All Sectors',
    'business': 'Business enterprise sector',
    'government': 'Government sector',
    'education': 'Higher education sector',
    'nonprofit': 'Private non-profit sector'
  };
  
  const sectorNameEn = sectorNameMapping[selectedSector] || 'All Sectors';

  // Función para obtener la etiqueta directamente del CSV principal - MOVIDA DENTRO DEL COMPONENTE
  const getDataLabelForCountry = (country: string, year: number): string => {
    console.log('🔍 Buscando etiqueta para:', { country, year, sectorNameEn });
    
    // Buscar el registro correspondiente en los datos usando el nombre exacto
    const countryData = data.find(item => {
      // Intentar coincidir tanto por nombre en inglés como en español
      const countryMatchEn = item.Country === country;
      const countryMatchEs = item.País === country;
      const yearMatch = parseInt(item.Year) === year;
      const sectorMatch = item.Sector === sectorNameEn || 
                      (item.Sector === 'All Sectors' && sectorNameEn === 'All Sectors');
      
      const isMatch = (countryMatchEn || countryMatchEs) && yearMatch && sectorMatch;
      
      if (isMatch) {
        console.log('✅ Encontrado registro:', {
          Country: item.Country,
          País: item.País,
          Year: item.Year,
          Sector: item.Sector,
          label: item.label_percent_gdp_id
        });
      }
      
      return isMatch;
    });
    
    console.log('🏷️ Resultado búsqueda:', {
      encontrado: !!countryData,
      etiqueta: countryData?.label_percent_gdp_id || 'sin etiqueta'
    });
    
    // Retornar la etiqueta si existe, o cadena vacía si no hay etiqueta
    return countryData?.label_percent_gdp_id || '';
  };

  // Procesar y filtrar datos para el año y sector seleccionado
  const countryDataForYear = data.filter(item => 
    parseInt(item['Year']) === selectedYear &&
    (item['Sector'] === sectorNameEn || 
     item['Sector'] === 'All Sectors' && sectorNameEn === 'All Sectors')
  );
  
  console.log(`Datos para año ${selectedYear} y sector ${sectorNameEn}:`, countryDataForYear.length, "registros");

  // Función para normalizar texto (eliminar acentos)
  const normalizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Agrupar por país (para evitar duplicados)
  const countryMap = new Map<string, {value: number, nameEs: string, nameEn: string, isAvg?: boolean}>();

  // MODIFICADO: Usar directamente las columnas 'Country' o 'País' según el idioma
  countryDataForYear.forEach(item => {
    // Guardamos ambos nombres para poder cambiar de idioma en el tooltip
    const countryNameEs = item['País'] || '';
    const countryNameEn = item['Country'];
    
    // Determinar qué valor usar según el tipo de visualización
    let rdValue: number;
    let isAvgValue = false;  // Indicador para saber si es un valor promedio
    
    if (dataDisplayType === 'percent_gdp') {
      rdValue = parseFloat(item['%GDP'].replace(',', '.'));
    } else {
      rdValue = parseFloat(item['Approx_RD_Investment_million_euro'] || '0');
      
      // Aplicar promedios para UE y zonas euro en modo millones de euros
      if (countryNameEn === 'European Union - 27 countries (from 2020)') {
        // Dividir entre 27 países para la UE
        rdValue = rdValue / 27;
        isAvgValue = true;
      } else if (countryNameEn === 'Euro area – 20 countries (from 2023)') {
        // Dividir entre 20 países para la Zona Euro 2023
        rdValue = rdValue / 20;
        isAvgValue = true;
      } else if (countryNameEn === 'Euro area - 19 countries (2015-2022)' || 
                countryNameEn === 'Euro area - 19 countries  (2015-2022)') {
        // Dividir entre 19 países para la Zona Euro 2015-2022
        rdValue = rdValue / 19;
        isAvgValue = true;
      }
    }
    
    if (!isNaN(rdValue) && (countryNameEs || countryNameEn)) {
      // Aplicar alias para simplificar nombres de entidades
      let displayNameEs = countryNameEs;
      let displayNameEn = countryNameEn || '';
      
      // Mapeo de nombres largos a alias más cortos según el idioma
      const aliases: { [key: string]: { es: string, en: string } } = {
        'European Union - 27 countries (from 2020)': {
          en: 'European Union',
          es: 'Unión Europea'
        },
        'Euro area – 20 countries (from 2023)': {
          en: 'Euro area (from 2023)',
          es: 'Zona Euro (Desde 2023)'
        },
        'Euro area - 19 countries (2015-2022)': {
          en: 'Euro area (2015-2022)',
          es: 'Zona Euro (2015-2022)'
        },
        // Manejar variantes con espacios
        'Euro area - 19 countries  (2015-2022)': {
          en: 'Euro area (2015-2022)',
          es: 'Zona Euro (2015-2022)'
        }
      };
      
      // Aplicar el alias si existe para este país/entidad
      if (countryNameEn && countryNameEn in aliases) {
        displayNameEs = aliases[countryNameEn].es;
        displayNameEn = aliases[countryNameEn].en;
      }
      
      // En el mapa guardamos ambos nombres y el valor, más el indicador de promedio
      const displayKey = language === 'es' ? displayNameEs : displayNameEn;
      if (displayKey) {
        countryMap.set(displayKey, {
          value: rdValue,
          nameEs: displayNameEs || displayNameEn, // Fallback al nombre en inglés si no hay español
          nameEn: displayNameEn || displayNameEs,  // Fallback al nombre en español si no hay inglés
          isAvg: isAvgValue
        });
      }
    }
  });
  
  console.log("Países procesados:", Array.from(countryMap.entries()));
  
  // Ordenar países por valor (de mayor a menor)
  // Usar función estable de comparación para garantizar consistencia
  const sortedCountries = Array.from(countryMap.entries())
    .sort((a, b) => {
      // Comparar primero por valor
      const valueDiff = b[1].value - a[1].value;
      if (valueDiff !== 0) return valueDiff;
      
      // Si los valores son iguales, ordenar alfabéticamente para mantener un orden estable
      return a[0].localeCompare(b[0]);
    }); 
  
  // Función para verificar si una entidad es UE o zona euro (no un país)
  const isSupranationalEntity = (name: string): boolean => {
    const normalizedName = normalizeText(name);
    return normalizedName.includes('european union') || 
           normalizedName.includes('union europea') ||
           normalizedName.includes('euro area') ||
           normalizedName.includes('zona euro') ||
           normalizedName.includes('oecd') ||
           normalizedName.includes('ocde') ||
           normalizedName.includes('average') ||
           normalizedName.includes('promedio');
  };
  
  // Crear datos para el gráfico
  const chartLabels = sortedCountries.map(([country]) => country);
  const values = sortedCountries.map(([, data]) => data.value);
  
  // Almacenamos los pares de nombres para usar en tooltips
  const countryNames = sortedCountries.reduce((acc, [key, data]) => {
    acc[key] = { 
      es: data.nameEs, 
      en: data.nameEn,
      isAvg: data.isAvg || false
    };
    return acc;
  }, {} as Record<string, {es: string, en: string, isAvg?: boolean}>);
  
  // Obtener el color del sector seleccionado
  const sectorColor = SECTOR_COLORS[selectedSector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.total;
  
  // Función para verificar si es España (exactamente 'Spain')
  const isSpain = (country: string): boolean => {
    const normalizedCountry = normalizeText(country);
    return normalizedCountry === 'spain' || normalizedCountry === 'espana' || normalizedCountry === 'españa';
  };
  
  // Crear colores - España en rojo, UE en amarillo, Zona Euro en verde, y el resto con el color del sector seleccionado
  const barColors = chartLabels.map(country => {
    // Verificar si es España usando la función exacta
    if (isSpain(country) || country === 'España') {
      return CHART_PALETTE.HIGHLIGHT; // Rojo para España
    }  
    // Verificar si es exactamente la Unión Europea
    else if (country === 'European Union' || 
             country === 'European Union - 27 countries (from 2020)' ||
             country === 'Unión Europea' ||
             country === 'Unión Europea - 27 países (desde 2020)') {
      return CHART_PALETTE.YELLOW; // Amarillo para Unión Europea
    }
    // Verificar si es alguna entidad de la Zona Euro
    else if (country.includes('Euro area') || 
             country.includes('Zona Euro') ||
             country.includes('Zona euro')) {
      return CHART_PALETTE.GREEN; // Verde para Zona Euro
    }
    
    return sectorColor; // Color según el sector seleccionado para el resto de países
  });

  // Datos para el gráfico
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: values,
        backgroundColor: barColors,
        borderColor: barColors.map(color => color + '80'),
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8, // Ajuste del ancho de las barras
        categoryPercentage: 0.85 // Espacio entre grupos de barras
      }
    ]
  };

  // Opciones del gráfico
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: t.title,
        font: {
          size: 14,
          weight: 600,
          family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif"
        },
        padding: {
          top: 10,
          bottom: 20
        },
        color: CHART_PALETTE.TEXT,
        align: 'center'
      },
      tooltip: {
        enabled: false, // Desactivamos el tooltip nativo de Chart.js
        external: () => {
          // No hacemos nada aquí, ya que manejaremos todo con eventos
        }
      }
    },
    scales: {
      x: {
        display: false, // Oculta todo el eje X
        title: {
          display: false,
          text: t.axisLabel,
          font: {
            weight: 600,
            size: 13,
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif"
          },
          color: CHART_PALETTE.TEXT
        },
        grid: {
          display: false
        },
        border: {
          display: false // Oculta el borde del eje
        },
        ticks: {
          display: false // Oculta los valores numéricos del eje
        }
      },
      y: {
        title: {
          display: false
        },
        grid: {
          display: false // Eliminar líneas de cuadrícula
        },
        border: {
          color: CHART_PALETTE.BORDER // Borde de eje más suave
        },
        ticks: {
          color: CHART_PALETTE.TEXT, // Texto negro en vez de gris
          font: {
            size: 12,
            weight: 400,
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica', 'Arial', sans-serif"
          }
        }
      }
    },
    onHover: (event: ChartEvent & { native?: { clientX?: number; clientY?: number } }, chartElements) => {
      if (!event || !tooltipRef.current || !chartRef.current) return;
      
      if (chartElements && chartElements.length > 0) {
        const index = chartElements[0].index;
        const countryName = chartLabels[index] as string || '';
        const value = values[index] as number;
        
                  // Calcular el ranking solo para países (excluir UE y zonas euro)
          // Filtrar las entidades supranacionales para el cálculo del ranking
          const onlyCountries = sortedCountries.filter(([name]) => !isSupranationalEntity(name));
          
          // Encontrar la posición real en la lista de solo países
          let rank = 0;
          if (!isSupranationalEntity(countryName)) {
            const countryIndex = onlyCountries.findIndex(([name]) => name === countryName);
            rank = countryIndex >= 0 ? countryIndex + 1 : 0;
          }
          
          const totalCountries = onlyCountries.length;
        
        // Mostrar el tooltip
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.opacity = '1';
        
        // Necesitamos extraer clientX y clientY del evento nativo para pasar a handleMouseMove
        const mouseEvent = {
          clientX: event.native?.clientX || 0,
          clientY: event.native?.clientY || 0
        } as MouseEvent;
        
        // Manejar la posición del tooltip
        handleMouseMove(mouseEvent);
        
        const tooltipContentElement = tooltipRef.current.querySelector('.tooltip-content');
        
        if (tooltipContentElement) {
          // Usar el nombre del país según el idioma seleccionado
          const displayName = countryNames[countryName] 
            ? (language === 'es' ? countryNames[countryName].es : countryNames[countryName].en) 
            : countryName;
            
          // Usar la nueva función en lugar de buscar en el array de etiquetas
          const labelValue = getDataLabelForCountry(displayName, selectedYear);
          
          // Verificar si el país es la UE
          const normalizedName = normalizeText(displayName);
          const isEU = normalizedName.includes('union europea') || 
                     normalizedName.includes('european union');
          
          // Verificar si el país es España
          const isSpain = normalizedName.includes('espana') || 
                       normalizedName.includes('españa') ||
                       normalizedName.includes('spain');
                       
          // Verificar si el país es Canarias
          const isCanarias = normalizedName.includes('canarias') || 
                          normalizedName.includes('canary islands');
          
          // Obtener el valor del año anterior para comparación YoY
          const previousYearValue = getPreviousYearValue(data, displayName, selectedYear, selectedSector);
          
          // Preparar HTML para la comparación YoY
          let yoyComparisonHtml = '';
          if (previousYearValue !== null && previousYearValue > 0) {
            const difference = value - previousYearValue;
            const percentDiff = (difference / previousYearValue) * 100;
            const formattedDiff = percentDiff.toFixed(2);
            const isPositive = difference > 0;
            
            yoyComparisonHtml = `
              <div class="${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                  <path d="${isPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
                </svg>
                <span>${isPositive ? '+' : ''}${formattedDiff}% vs ${selectedYear - 1}</span>
              </div>
            `;
          }
          
          // Preparar las comparaciones
          let euComparisonHtml = '';
          let spainComparisonHtml = '';
          let canariasComparisonHtml = '';
          
          // Comparación con UE - Solo mostrar si estamos en modo porcentaje PIB
          if (!isEU) {
            const euValue = getEUValue(data, selectedYear, selectedSector);
            
            if (euValue !== null && euValue > 0) {
              const difference = value - euValue;
              
              if (dataDisplayType === 'percent_gdp') {
                const percentDiff = (difference / euValue) * 100;
                const formattedDiff = percentDiff.toFixed(1);
                const isPositive = difference > 0;
                const color = isPositive ? 'text-green-600' : 'text-red-600';
                
                euComparisonHtml = `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                      `vs Unión Europea (${euValue.toFixed(2)}%):` : 
                      `vs European Union (${euValue.toFixed(2)}%):`}</span>
                    <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                  </div>
                `;
              } else {
                // Formato para modo millones de euros (valores absolutos)
                const difference = value - euValue;
                const isPositive = difference > 0;
                const color = isPositive ? 'text-green-600' : 'text-red-600';
                
                // Variables intermedias para evitar problemas de tipado
                const isEs = language === 'es';
                const euLocale = isEs ? 'es-ES' : 'en-US';
                const labelText = isEs
                  ? `vs Media UE (${euValue.toLocaleString(euLocale, {maximumFractionDigits: 0})} M€):`
                  : `vs Avg EU (${euValue.toLocaleString(euLocale, {maximumFractionDigits: 0})} M€):`;
                
                euComparisonHtml = `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 inline-block w-44">${labelText}</span>
                    <span class="font-medium ${color}">${isPositive ? '+' : '-'}${Math.abs(difference).toLocaleString(euLocale, {maximumFractionDigits: 0})} M€</span>
                  </div>
                `;
              }
            } else if (euValue !== null && euValue === 0) {
              euComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                    (dataDisplayType === 'percent_gdp' ? 'vs Unión Europea:' : 'vs Media UE:') : 
                    (dataDisplayType === 'percent_gdp' ? 'vs European Union:' : 'vs Avg EU:')}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
          }
          
          // Comparación con España
          if (!isSpain) {
            const spainValue = getSpainValue(data, selectedYear, selectedSector);
            
            if (spainValue !== null && spainValue > 0) {
              const difference = value - spainValue;
              
              if (dataDisplayType === 'percent_gdp') {
                // Formato para modo porcentaje PIB (como estaba antes)
                const percentDiff = (difference / spainValue) * 100;
                const formattedDiff = percentDiff.toFixed(1);
                const isPositive = difference > 0;
                const color = isPositive ? 'text-green-600' : 'text-red-600';
                
                // Usar variables intermedias para evitar problemas de tipado
                const labelText = language === 'es' 
                  ? `vs España (${spainValue.toFixed(2)}%):` 
                  : `vs Spain (${spainValue.toFixed(2)}%):`;
                
                spainComparisonHtml = `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 inline-block w-44">${labelText}</span>
                    <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                  </div>
                `;
              } else {
                // Formato para modo millones de euros (valores absolutos)
                const difference = value - spainValue;
                const isPositive = difference > 0;
                const color = isPositive ? 'text-green-600' : 'text-red-600';
                
                // Variables intermedias para evitar problemas de tipado
                const isEs = language === 'es';
                const spainLocale = isEs ? 'es-ES' : 'en-US';
                const labelText = isEs
                  ? `vs España (${spainValue.toLocaleString(spainLocale, {maximumFractionDigits: 0})} M€):`
                  : `vs Spain (${spainValue.toLocaleString(spainLocale, {maximumFractionDigits: 0})} M€):`;
                
                spainComparisonHtml = `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 inline-block w-44">${labelText}</span>
                    <span class="font-medium ${color}">${isPositive ? '+' : '-'}${Math.abs(difference).toLocaleString(spainLocale, {maximumFractionDigits: 0})} M€</span>
                  </div>
                `;
              }
            } else if (spainValue !== null && spainValue === 0) {
              const noDataText = language === 'es' ? 'vs España:' : 'vs Spain:';
              spainComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-44">${noDataText}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
          }
          
          // Comparación con Canarias
          if (!isCanarias) {
            const canariasValue = getCanariasValue(autonomousCommunitiesData, selectedYear, selectedSector);
            
            if (canariasValue !== null && canariasValue > 0) {
              const difference = value - canariasValue;
              
              if (dataDisplayType === 'percent_gdp') {
                // Formato para modo porcentaje PIB (como estaba antes)
                const percentDiff = (difference / canariasValue) * 100;
                const formattedDiff = percentDiff.toFixed(1);
                const isPositive = difference > 0;
                const color = isPositive ? 'text-green-600' : 'text-red-600';
                
                // Usar variables intermedias para evitar problemas de tipado
                const labelText = language === 'es' 
                  ? `vs Islas Canarias (${canariasValue.toFixed(2)}%):`
                  : `vs Canary Islands (${canariasValue.toFixed(2)}%):`;
                
                canariasComparisonHtml = `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 inline-block w-44">${labelText}</span>
                    <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                  </div>
                `;
              } else {
                // Formato para modo millones de euros (valores absolutos)
                const difference = value - canariasValue;
                const isPositive = difference > 0;
                const color = isPositive ? 'text-green-600' : 'text-red-600';
                
                // Variables intermedias para evitar problemas de tipado
                const isEs = language === 'es';
                const canariasLocale = isEs ? 'es-ES' : 'en-US';
                const labelText = isEs
                  ? `vs Islas Canarias (${canariasValue.toLocaleString(canariasLocale, {maximumFractionDigits: 0})} M€):`
                  : `vs Canary Islands (${canariasValue.toLocaleString(canariasLocale, {maximumFractionDigits: 0})} M€):`;
                
                canariasComparisonHtml = `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 inline-block w-44">${labelText}</span>
                    <span class="font-medium ${color}">${isPositive ? '+' : '-'}${Math.abs(difference).toLocaleString(canariasLocale, {maximumFractionDigits: 0})} M€</span>
                  </div>
                `;
              }
            } else if (canariasValue !== null && canariasValue === 0) {
              const noDataText = language === 'es' ? 'vs Islas Canarias:' : 'vs Canary Islands:';
              canariasComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-44">${noDataText}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
          }
          
          // Renderizar el tooltip con el nuevo diseño y formateando correctamente según el tipo de datos
          tooltipContentElement.innerHTML = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <!-- Header con el nombre del país -->
              <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                <div class="flag-container w-8 h-6 mr-2 rounded overflow-hidden">
                  ${(() => {
                    const normalizedName = normalizeText(displayName);
                    
                    // Buscar código de país basado en el nombre normalizado
                    const getCountryCode = (normalizedName: string): string => {
                      // 1. Primero buscar en el dataset por ISO3
                      const countryItem = data.find(item => {
                        if (item.ISO3) {
                          // Buscar ese ISO3 en countryFlags
                          return countryFlags.some(flagItem => 
                            flagItem.iso3 === item.ISO3 && 
                            (normalizeText(item.Country).includes(normalizedName) || 
                             normalizeText(item.País || "").includes(normalizedName))
                          );
                        }
                        return false;
                      });
                      
                      if (countryItem?.ISO3) {
                        // Si encontramos un ISO3, buscar el código de 2 letras correspondiente
                        const flagItem = countryFlags.find(flag => flag.iso3 === countryItem.ISO3);
                        if (flagItem?.code) {
                          return flagItem.code.toLowerCase();
                        }
                      }
                      
                      // 2. Si no encontramos por ISO3, usar los casos específicos
                      // Casos especiales
                      if (normalizedName.includes('union europea') || normalizedName.includes('european union')) {
                        return 'eu'; // La UE tiene un código especial en flagcdn
                      } else if (normalizedName.includes('zona euro') || normalizedName.includes('euro area')) {
                        return 'eu'; // Usamos también la bandera de la UE para la zona euro
                      } else if (normalizedName.includes('espana') || normalizedName.includes('españa') || normalizedName.includes('spain')) {
                        return 'es';
                      } else if (normalizedName.includes('alemania') || normalizedName.includes('germany')) {
                        return 'de';
                      } else if (normalizedName.includes('francia') || normalizedName.includes('france')) {
                        return 'fr';
                      } else if (normalizedName.includes('reino unido') || normalizedName.includes('united kingdom') || normalizedName.includes('uk')) {
                        return 'gb';
                      } else if (normalizedName.includes('italia') || normalizedName.includes('italy')) {
                        return 'it';
                      } else if (normalizedName.includes('suecia') || normalizedName.includes('sweden')) {
                        return 'se';
                      } else if (normalizedName.includes('finlandia') || normalizedName.includes('finland')) {
                        return 'fi';
                      } else if (normalizedName.includes('canarias') || normalizedName.includes('canary islands')) {
                        return 'es-ct'; // Usamos un código regional para Canarias
                      }
                      // Nuevos casos específicos para países que no muestran correctamente su bandera
                      else if (normalizedName.includes('belgica') || normalizedName.includes('belgium')) {
                        return 'be';
                      } else if (normalizedName.includes('dinamarca') || normalizedName.includes('denmark')) {
                        return 'dk';
                      } else if (normalizedName.includes('islandia') || normalizedName.includes('iceland')) {
                        return 'is';
                      } else if (normalizedName.includes('noruega') || normalizedName.includes('norway')) {
                        return 'no';
                      } else if (normalizedName.includes('eslovenia') || normalizedName.includes('slovenia')) {
                        return 'si';
                      } else if (normalizedName.includes('paises bajos') || normalizedName.includes('netherlands') || normalizedName.includes('holanda')) {
                        return 'nl';
                      } else if (normalizedName.includes('republica checa') || normalizedName.includes('czech') || normalizedName.includes('czechia')) {
                        return 'cz';
                      } else if (normalizedName.includes('polonia') || normalizedName.includes('poland')) {
                        return 'pl';
                      } else if (normalizedName.includes('grecia') || normalizedName.includes('greece')) {
                        return 'gr';
                      } else if (normalizedName.includes('croacia') || normalizedName.includes('croatia')) {
                        return 'hr';
                      } else if (normalizedName.includes('hungria') || normalizedName.includes('hungary')) {
                        return 'hu';
                      } else if (normalizedName.includes('lituania') || normalizedName.includes('lithuania')) {
                        return 'lt';
                      } else if (normalizedName.includes('eslovaquia') || normalizedName.includes('slovakia')) {
                        return 'sk';
                      } else if (normalizedName.includes('luxemburgo') || normalizedName.includes('luxembourg')) {
                        return 'lu';
                      } else if (normalizedName.includes('letonia') || normalizedName.includes('latvia')) {
                        return 'lv';
                      } else if (normalizedName.includes('chipre') || normalizedName.includes('cyprus')) {
                        return 'cy';
                      } else if (normalizedName.includes('rusia') || normalizedName.includes('russia')) {
                        return 'ru';
                      } else if (normalizedName.includes('corea del sur') || normalizedName.includes('south korea')) {
                        return 'kr';
                      } else if (normalizedName.includes('japon') || normalizedName.includes('japan')) {
                        return 'jp';
                      } else if (normalizedName.includes('suiza') || normalizedName.includes('switzerland')) {
                        return 'ch';
                      } else if (normalizedName.includes('macedonia del norte') || normalizedName.includes('north macedonia')) {
                        return 'mk';
                      } else if (normalizedName.includes('turquia') || normalizedName.includes('turkiye') || normalizedName.includes('turkey')) {
                        return 'tr';
                      }
                      
                      // 3. Si aún no encontramos, buscar en el JSON de banderas por nombre
                      const countryData = countryFlags.find((country: CountryFlag) => {
                        const normalizedCountry = normalizeText(country.country);
                        return normalizedName.includes(normalizedCountry);
                      });
                      
                      return countryData?.code?.toLowerCase() || 'un'; // Devolvemos un por defecto (Naciones Unidas)
                    };
                    
                    const countryCode = getCountryCode(normalizedName);
                    return `<img src="https://flagcdn.com/${countryCode}.svg" class="w-full h-full object-cover" alt="${displayName}" />`;
                  })()}
                </div>
                <h3 class="text-lg font-bold text-gray-800">${displayName}</h3>
              </div>
              
              <!-- Contenido principal -->
              <div class="p-4">
                <!-- Métrica principal -->
                <div class="mb-3">
                  <div class="flex items-center text-gray-500 text-sm mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                    <span>${language === 'es' ? 'Inversión I+D:' : 'R&D Investment:'}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-xl font-bold text-blue-700">
                      ${dataDisplayType === 'percent_gdp' 
                        ? value.toFixed(2) 
                        : value.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {maximumFractionDigits: 0})}
                    </span>
                    <span class="ml-1 text-gray-600 text-sm">
                      ${dataDisplayType === 'percent_gdp' ? '%' : 'M€'}
                      ${dataDisplayType !== 'percent_gdp' && countryNames[displayName]?.isAvg 
                        ? (language === 'es' ? ' Media' : ' Avg') : ''}
                    </span>
                    ${labelValue ? `<span class="ml-2 text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">${labelValue}</span>` : ''}
                  </div>
                  ${yoyComparisonHtml}
                </div>
                
                ${dataDisplayType !== 'percent_gdp' && 
                  (normalizedName.includes('union europea') || 
                   normalizedName.includes('european union') || 
                   normalizedName.includes('zona euro') || 
                   normalizedName.includes('euro area')) 
                   ? `<div class="mt-1 mb-3 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                       ${(() => {
                         if (normalizedName.includes('union europea') || normalizedName.includes('european union')) {
                           return language === 'es' 
                             ? 'Valor promedio calculado dividiendo el total por 27 países'
                             : 'Average value calculated by dividing the total by 27 countries';
                         } else if ((normalizedName.includes('zona euro') || normalizedName.includes('euro area')) && normalizedName.includes('2023')) {
                           return language === 'es'
                             ? 'Valor promedio calculado dividiendo el total por 20 países'
                             : 'Average value calculated by dividing the total by 20 countries';
                         } else if ((normalizedName.includes('zona euro') || normalizedName.includes('euro area')) && (normalizedName.includes('2015') || normalizedName.includes('2015-2022'))) {
                           return language === 'es'
                             ? 'Valor promedio calculado dividiendo el total por 19 países'
                             : 'Average value calculated by dividing the total by 19 countries';
                         }
                         return '';
                       })()}
                     </div>`
                   : ''}
                
                <!-- Ranking (no mostrado para UE o zonas euro) -->
                ${!isSupranationalEntity(displayName) ? `
                <div class="mb-4">
                  <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                    <span class="font-medium">Rank </span>
                    <span class="font-bold text-lg mx-1">${rank}</span>
                    <span class="text-gray-600">${language === 'es' ? `de ${totalCountries}` : `of ${totalCountries}`}</span>
                  </div>
                </div>
                ` : ''}
                
                <!-- Comparaciones -->
                <div class="space-y-2 border-t border-gray-100 pt-3">
                  <div class="text-xs text-gray-500 mb-1">${language === 'es' ? 'Comparativa' : 'Comparative'}</div>
                  ${euComparisonHtml}
                  ${spainComparisonHtml}
                  ${canariasComparisonHtml}
                </div>
              </div>
              
              <!-- Footer -->
              ${labelValue && labelDescriptions[labelValue] ? 
                `<div class="bg-gray-50 px-3 py-2 flex items-center text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                  <span>${labelValue} - ${labelDescriptions[labelValue][language]}</span>
                </div>` 
                : ''}
            </div>
          `;
        }
      } else {
        // Usar la función de ocultar tooltip
        hideTooltip();
      }
    }
  };

  // Función para actualizar la posición del tooltip durante el movimiento del mouse
  const handleMouseMove = (event: MouseEvent) => {
    if (!tooltipRef.current || tooltipRef.current.style.display === 'none') return;
    
    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;
    
    // Obtener tamaño de la ventana
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Posiciones base (offset predeterminado desde el cursor)
    let left = event.clientX + 15;
    let top = event.clientY - 15;
    
    // Ajustar horizontal si se sale por la derecha
    if (left + tooltipWidth > windowWidth - 10) {
      left = event.clientX - tooltipWidth - 15; // Colocar a la izquierda del cursor
    }
    
    // Ajustar vertical si se sale por abajo o arriba
    if (top + tooltipHeight > windowHeight - 10) {
      if (tooltipHeight < windowHeight - 20) {
        // Si cabe en la pantalla, ajustar hacia arriba
        top = windowHeight - tooltipHeight - 10;
      } else {
        // Si es demasiado grande, colocarlo en la parte superior con scroll
        top = 10;
      }
    }
    
    // Asegurar que no se salga por arriba
    if (top < 10) {
      top = 10;
    }
    
    // Aplicar las posiciones calculadas
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  // Función para ocultar el tooltip
  const hideTooltip = () => {
    if (!tooltipRef.current) return;
    
    // Ocultar el tooltip con una transición suave
    tooltipRef.current.style.opacity = '0';
    
    // Ocultar después de la transición
    setTimeout(() => {
      if (tooltipRef.current && tooltipRef.current.style.opacity === '0') {
        tooltipRef.current.style.display = 'none';
      }
    }, 100);
  };

  // Añadir y eliminar el listener para el movimiento del mouse
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    
    // Añadir listener para ocultar el tooltip cuando el cursor sale del contenedor
    if (containerRef.current) {
      containerRef.current.addEventListener('mouseleave', hideTooltip);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mouseleave', hideTooltip);
      }
      // Asegurarse de ocultar el tooltip al desmontar
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
    };
  }, []);

  // Función para obtener el valor de inversión de España para el año y sector seleccionados
  const getSpainValue = (data: EuropeCSVData[], selectedYear: number, selectedSector: string): number | null => {
    if (!data || data.length === 0) return null;
    
    // Mapeo del sector seleccionado al nombre en inglés
    const sectorNameEn = sectorNameMapping[selectedSector] || 'All Sectors';
    
    // Buscar España en los datos
    const spainData = data.filter(item => {
      const isSpain = (
        (item.Country && normalizeText(item.Country).includes('spain')) || 
        (item.País && (normalizeText(item.País).includes('espana') || normalizeText(item.País).includes('españa')))
      );
      const yearMatch = parseInt(item.Year) === selectedYear;
      const sectorMatch = item.Sector === sectorNameEn || 
                        (item.Sector === 'All Sectors' && sectorNameEn === 'All Sectors');
      return isSpain && yearMatch && sectorMatch;
    });
    
    if (spainData.length === 0) return null;
    
    // Obtener el valor según el tipo de visualización
    if (dataDisplayType === 'percent_gdp') {
      const valueStr = spainData[0]['%GDP'] || '';
      if (!valueStr) return null;
      
      try {
        return parseFloat(valueStr.replace(',', '.'));
      } catch {
        return null;
      }
    } else {
      // Modo millones de euros
      const valueStr = spainData[0]['Approx_RD_Investment_million_euro'] || '';
      if (!valueStr) return null;
      
      try {
        return parseFloat(valueStr.replace(',', '.'));
      } catch {
        return null;
      }
    }
  };

  // Función para obtener el valor de inversión de la Unión Europea para el año y sector seleccionados
  const getEUValue = (data: EuropeCSVData[], selectedYear: number, selectedSector: string): number | null => {
    if (!data || data.length === 0) return null;
    
    // Mapeo del sector seleccionado al nombre en inglés
    const sectorNameEn = sectorNameMapping[selectedSector] || 'All Sectors';
    
    // Buscar la UE en los datos
    const euData = data.filter(item => {
      const isEU = (
        (item.Country && normalizeText(item.Country).includes('european union')) || 
        (item.País && normalizeText(item.País).includes('union europea'))
      );
      const yearMatch = parseInt(item.Year) === selectedYear;
      const sectorMatch = item.Sector === sectorNameEn || 
                        (item.Sector === 'All Sectors' && sectorNameEn === 'All Sectors');
      return isEU && yearMatch && sectorMatch;
    });
    
    if (euData.length === 0) return null;
    
    // Obtener el valor según el tipo de visualización
    if (dataDisplayType === 'percent_gdp') {
      const valueStr = euData[0]['%GDP'] || '';
      if (!valueStr) return null;
      
      try {
        return parseFloat(valueStr.replace(',', '.'));
      } catch {
        return null;
      }
    } else {
      // Modo millones de euros
      const valueStr = euData[0]['Approx_RD_Investment_million_euro'] || '';
      if (!valueStr) return null;
      
      try {
        // Aplicar promedio para la UE
        return parseFloat(valueStr.replace(',', '.')) / 27;
      } catch {
        return null;
      }
    }
  };

  // Función para obtener el valor de inversión de Canarias para el año y sector seleccionados
  const getCanariasValue = (autonomousCommunitiesData: AutonomousCommunityData[], selectedYear: number, selectedSector: string): number | null => {
    if (!autonomousCommunitiesData || autonomousCommunitiesData.length === 0) return null;
    
    // Mapeo del sector seleccionado al nombre que corresponde en el CSV de comunidades autónomas
    const sectorMapping: Record<string, string> = {
      'total': 'All Sectors',
      'business': 'Business enterprise sector',
      'government': 'Government sector',
      'education': 'Higher education sector',
      'nonprofit': 'Private non-profit sector'
    };
    
    const sectorToFind = sectorMapping[selectedSector] || 'All Sectors';
    
    // Buscar Canarias en los datos de comunidades autónomas
    const canariasData = autonomousCommunitiesData.filter(item => {
      const isCommunity = normalizeText(item["Comunidad Limpio"]) === "canarias";
      const yearMatch = parseInt(item["Año"]) === selectedYear;
      const sectorMatch = item["Sector"] === sectorToFind;
      return isCommunity && yearMatch && sectorMatch;
    });
    
    if (canariasData.length === 0) return null;
    
    if (dataDisplayType === 'percent_gdp') {
      // Obtener el valor del % PIB
      const valueStr = canariasData[0]["% PIB I+D"] || '';
      if (!valueStr) return null;
      
      try {
        return parseFloat(valueStr.replace(',', '.'));
      } catch {
        return null;
      }
    } else {
      // Modo millones de euros - convertir de miles a millones
      const valueStr = canariasData[0]["Gasto en I+D (Miles €)"] || '';
      if (!valueStr) return null;
      
      try {
        // Convertir de miles a millones dividiendo por 1000
        return parseFloat(valueStr.replace('.', '').replace(',', '.')) / 1000;
      } catch {
        return null;
      }
    }
  };

  // Añadir función para obtener el valor del año anterior con nombre exacto
  const getPreviousYearValue = (data: EuropeCSVData[], country: string, selectedYear: number, selectedSector: string): number | null => {
    if (!data || data.length === 0 || selectedYear <= 1) return null;
    
    // Mapeo del sector seleccionado al nombre en inglés
    const sectorNameEn = sectorNameMapping[selectedSector] || 'All Sectors';
    const previousYear = selectedYear - 1;
    
    // Normalizar el nombre del país para hacer comparaciones más flexibles
    const normalizedCountry = normalizeText(country);
    
    // Buscar datos del país para el año anterior
    const countryPrevYearData = data.filter(item => {
      // Verificar si coincide con el nombre del país en cualquier idioma
      const countryMatchEs = item.País && normalizeText(item.País).includes(normalizedCountry);
      const countryMatchEn = normalizeText(item.Country).includes(normalizedCountry);
      
      const yearMatch = parseInt(item.Year) === previousYear;
      const sectorMatch = item.Sector === sectorNameEn || 
                        (item.Sector === 'All Sectors' && sectorNameEn === 'All Sectors');
      
      return (countryMatchEs || countryMatchEn) && yearMatch && sectorMatch;
    });
    
    if (countryPrevYearData.length === 0) return null;
    
    // Obtener el valor según el tipo de visualización
    if (dataDisplayType === 'percent_gdp') {
      const valueStr = countryPrevYearData[0]['%GDP'] || '';
      if (!valueStr) return null;
      
      try {
        return parseFloat(valueStr.replace(',', '.'));
      } catch {
        return null;
      }
    } else {
      // Modo millones de euros
      const valueStr = countryPrevYearData[0]['Approx_RD_Investment_million_euro'] || '';
      if (!valueStr) return null;
      
      try {
        return parseFloat(valueStr.replace(',', '.'));
      } catch {
        return null;
      }
    }
  };

  // Estilos para el contenedor con scroll - altura específica para coincidir con el mapa
  const scrollContainerStyle: React.CSSProperties = {
    height: '400px',
    overflowY: 'auto',
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    padding: '0 10px'
  };

  // Altura dinámica para el gráfico en función del número de países
  const chartHeight = Math.max(400, sortedCountries.length * 25);

  // Función para obtener el título del gráfico basado en sector y año seleccionados
  const getChartTitle = () => {
    return `${language === 'es' ? 'Ranking de países por inversión en I+D' : 'Country Ranking by R&D Investment'} · ${selectedYear}`;
  };
  
  // Función para obtener el color del sector para el título
  const getSectorColor = () => {
    // Obtener el color base del sector
    const sectorColor = SECTOR_COLORS[selectedSector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.total;
    // Usar d3 para obtener una versión más oscura del color
    return d3.color(sectorColor)?.darker(0.8)?.toString() || '#333333';
  };

  return (
    <div className="w-full h-full flex flex-col" ref={containerRef}>
      {/* Título del gráfico */}
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {getChartTitle()}
        </h3>
        <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
             style={{ backgroundColor: `${d3.color(getSectorColor())?.copy({ opacity: 0.15 })}` }}>
          {(() => {
            // Obtener el nombre exacto del sector desde los datos
            const sectorMapping: Record<string, string> = {
              'total': 'All Sectors',
              'business': 'Business enterprise sector',
              'government': 'Government sector',
              'education': 'Higher education sector',
              'nonprofit': 'Private non-profit sector'
            };
            
            // Normalizar el ID del sector
            let normalizedId = selectedSector.toLowerCase();
            if (normalizedId === 'all sectors' || normalizedId === 'all' || normalizedId === 'total') normalizedId = 'total';
            if (normalizedId === 'business enterprise sector') normalizedId = 'business';
            if (normalizedId === 'government sector') normalizedId = 'government';
            if (normalizedId === 'higher education sector') normalizedId = 'education';
            if (normalizedId === 'private non-profit sector') normalizedId = 'nonprofit';
            
            // Obtener el nombre del sector en inglés
            const sectorNameEn = sectorMapping[normalizedId] || 'All Sectors';
            
            // Traducir al idioma actual
            if (language === 'es') {
              switch (sectorNameEn) {
                case 'All Sectors':
                  return 'Todos los sectores';
                case 'Business enterprise sector':
                  return 'Sector empresarial';
                case 'Government sector':
                  return 'Sector gubernamental';
                case 'Higher education sector':
                  return 'Enseñanza Superior';
                case 'Private non-profit sector':
                  return 'Instituciones privadas sin fines de lucro';
                default:
                  return sectorNameEn;
              }
            } else {
              return sectorNameEn;
            }
          })()}
        </div>
      </div>
      
      {sortedCountries.length > 0 ? (
        <>
          <div 
            ref={containerRef}
            style={scrollContainerStyle} 
            className="mb-1"
            onMouseLeave={hideTooltip}
          >
            <div style={{ height: `${chartHeight}px`, width: '100%' }}>
              <Bar 
                ref={chartRef}
                data={chartData} 
                options={{
                  ...options,
                  plugins: {
                    ...options.plugins,
                    title: {
                      ...options.plugins?.title,
                      display: false
                    }
                  }
                }} 
              />
            </div>
          </div>
          
          {/* Etiqueta del eje X centrada */}
          <div className="text-center mb-2 text-sm font-medium text-gray-700">
            {t.axisLabel}
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-64 text-gray-800 font-medium">
          {t.noData}
        </div>
      )}
      
      {/* Tooltip personalizado con nuevo diseño */}
      <div 
        ref={tooltipRef}
        className="country-tooltip absolute z-50 pointer-events-none"
        style={{
          display: 'none',
          position: 'fixed',
          opacity: 0,
          transition: 'opacity 0.1s ease-in-out',
          maxWidth: '350px'
        }}
      >
        <div className="tooltip-content"></div>
      </div>
    </div>
  );
};

// Exportar los colores para usarlos en otros componentes
export { CHART_PALETTE };

export default memo(CountryRankingChart); 