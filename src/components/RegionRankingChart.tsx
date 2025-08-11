import React, { memo, useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions,
  ChartEvent,
  Chart
} from 'chart.js';
import * as d3 from 'd3';
import { communityFlags, communityNameMapping } from '../utils/spanishCommunitiesUtils';
import { DataDisplayType } from './DataTypeSelector';
// Primero, importamos los colores del sector
import { SECTOR_COLORS } from '../utils/colors';

// Las banderas de las comunidades y el mapeo de nombres provienen de utilitarios compartidos

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

// Interfaz para las propiedades del componente
interface RegionRankingChartProps {
  data: AutonomousCommunityData[];
  selectedYear: number;
  language: 'es' | 'en';
  selectedSector?: string;
  dataDisplayType?: DataDisplayType;
}

// Colores para la gráfica
const CHART_PALETTE = {
  DEFAULT: '#1e88e5', // Azul por defecto
  LIGHT: '#90caf9',   // Azul claro
  HIGHLIGHT: '#ff5252', // Rojo para destacar
  TEXT: '#000000',    // Color del texto (negro) 
  BORDER: '#E5E7EB',  // Color del borde (gris suave)
  CANARIAS: '#FFD600', // Amarillo para Canarias
};

// Paleta de colores para el mapa basada en los colores de sectores
const getSectorPalette = (sectorId: string) => {
  // Normalizar el ID del sector para asegurar compatibilidad
  let normalizedId = sectorId.toLowerCase();
  
  // Transformar nombres de sectores en inglés a IDs
  if (normalizedId === 'all sectors') normalizedId = 'total';
  if (normalizedId === 'business enterprise sector') normalizedId = 'business';
  if (normalizedId === 'government sector') normalizedId = 'government';
  if (normalizedId === 'higher education sector') normalizedId = 'education';
  if (normalizedId === 'private non-profit sector') normalizedId = 'nonprofit';
  
  // Asegurar que usamos una clave válida para SECTOR_COLORS
  const validSectorId = (normalizedId in SECTOR_COLORS) ? normalizedId : 'total';
  const baseColor = SECTOR_COLORS[validSectorId as keyof typeof SECTOR_COLORS];
  
  // Crear gradiente basado en el color del sector
  return {
    NULL: '#f5f5f5',           // Gris claro para valores nulos
    ZERO: '#666666',           // Gris fuerte para regiones con 0.00%
    MIN: d3.color(baseColor)?.brighter(1.5)?.toString() || '#f5f5f5',  // Muy claro
    LOW: d3.color(baseColor)?.brighter(1)?.toString() || '#d0d0d0',    // Claro
    MID: baseColor,                                                    // Color base del sector
    HIGH: d3.color(baseColor)?.darker(0.7)?.toString() || '#909090',   // Oscuro
    MAX: d3.color(baseColor)?.darker(1.2)?.toString() || '#707070',    // Muy oscuro
  };
};

// Tabla de mapeo entre nombres de comunidades en el CSV y nombres esperados para la visualización

const RegionRankingChart: React.FC<RegionRankingChartProps> = ({ 
  data, 
  selectedYear, 
  language,
  selectedSector = 'total',
  dataDisplayType = 'percent_gdp'
}) => {
  const chartRef = useRef<Chart<'bar', number[], string>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseLeave = () => {
      console.log("Mouse salió del contenedor");
      hideGlobalTooltip();
    };

    // Definir handleScroll fuera del bloque if
    const handleScroll = () => {
      hideGlobalTooltip();
    };

    container.addEventListener('mouseleave', handleMouseLeave);
    
    // Añadir manejador de eventos de scroll para ocultar el tooltip
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      container.removeEventListener('mouseleave', handleMouseLeave);
      
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      
      // Limpiar tooltip global al desmontar
      const globalTooltip = document.getElementById('global-chart-tooltip');
      if (globalTooltip && globalTooltip.parentNode) {
        globalTooltip.parentNode.removeChild(globalTooltip);
      }
      
      // Limpiar estilos del tooltip
      const tooltipStyles = document.getElementById('tooltip-chart-styles');
      if (tooltipStyles && tooltipStyles.parentNode) {
        tooltipStyles.parentNode.removeChild(tooltipStyles);
      }
    };
  }, []);

  // Textos traducidos
  const texts = {
    es: {
      title: "Ranking de comunidades autónomas por inversión en I+D",
      axisLabel: dataDisplayType === 'percent_gdp' ? "% del PIB" : "Miles de €",
      noData: "No hay datos disponibles para este año",
      rdInvestment: "Inversión I+D",
      regionRanking: "Ranking de comunidades autónomas",
      allSectors: "Todos los sectores",
      sector_total: "Todos los sectores",
      sector_business: "Sector empresarial",
      sector_government: "Sector gubernamental", 
      sector_education: "Sector educativo superior",
      sector_nonprofit: "Sector privado sin ánimo de lucro",
      ofGDP: "del PIB",
      comparative: "Comparativa",
      vsSpain: "vs España",
      vsCanarias: "vs Canarias"
    },
    en: {
      title: "Autonomous Communities Ranking by R&D Investment",
      axisLabel: dataDisplayType === 'percent_gdp' ? "% of GDP" : "Thousand €", 
      noData: "No data available for this year",
      rdInvestment: "R&D Investment",
      regionRanking: "Autonomous Communities Ranking",
      allSectors: "All Sectors",
      sector_total: "All Sectors",
      sector_business: "Business enterprise sector",
      sector_government: "Government sector",
      sector_education: "Higher education sector",
      sector_nonprofit: "Private non-profit sector",
      ofGDP: "of GDP",
      comparative: "Comparative",
      vsSpain: "vs Spain",
      vsCanarias: "vs Canary Islands"
    }
  };

  const t = texts[language];

  // Mapeo entre ID de sector y su ID en el CSV
  const sectorIdMapping: Record<string, string> = {
    'total': '_T',
    'business': 'EMPRESAS',
    'government': 'ADMINISTRACION_PUBLICA',
    'education': 'ENSENIANZA_SUPERIOR',
    'nonprofit': 'IPSFL'
  };
  
  const csvSectorId = sectorIdMapping[selectedSector] || '_T';

  // Función para normalizar texto (eliminar acentos)
  const normalizeText = (text: string | undefined): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Funciones para manejar el tooltip global similar a SpanishRegionsMap.tsx
  const createGlobalTooltip = (): HTMLElement => {
    // Verificar si ya existe un tooltip global
    let tooltipElement = document.getElementById('global-chart-tooltip');
    
    if (!tooltipElement) {
      // Crear nuevo tooltip y agregarlo al body
      tooltipElement = document.createElement('div');
      tooltipElement.id = 'global-chart-tooltip';
      tooltipElement.className = 'chart-tooltip'; // Clase para poder aplicar estilos
      
      // Aplicar estilos base manualmente
      Object.assign(tooltipElement.style, {
        position: 'fixed',
        display: 'none',
        opacity: '0',
        zIndex: '999999',
        pointerEvents: 'none',
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        padding: '0', // No aplicamos padding aquí porque lo aplicaremos en las clases internas
        minWidth: '150px',
        maxWidth: '320px', // Aumentado de 280px a 320px para más espacio
        border: '1px solid #e2e8f0',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#333',
        transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out'
      });
      
      document.body.appendChild(tooltipElement);
      
      // Crear hoja de estilo inline para las clases de Tailwind
      const styleSheet = document.createElement('style');
      styleSheet.id = 'tooltip-chart-styles';
      styleSheet.textContent = `
        #global-chart-tooltip {
          transform-origin: center;
          transform: scale(0.95);
          transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
        }
        #global-chart-tooltip.visible {
          opacity: 1 !important;
          transform: scale(1);
        }
        #global-chart-tooltip .text-green-600 { color: #059669; }
        #global-chart-tooltip .text-red-600 { color: #DC2626; }
        #global-chart-tooltip .bg-blue-50 { background-color: #EFF6FF; }
        #global-chart-tooltip .bg-yellow-50 { background-color: #FFFBEB; }
        #global-chart-tooltip .border-blue-100 { border-color: #DBEAFE; }
        #global-chart-tooltip .border-gray-100 { border-color: #F3F4F6; }
        #global-chart-tooltip .text-gray-500 { color: #6B7280; }
        #global-chart-tooltip .text-blue-700 { color: #1D4ED8; }
        #global-chart-tooltip .text-gray-800 { color: #1F2937; }
        #global-chart-tooltip .text-gray-600 { color: #4B5563; }
        #global-chart-tooltip .text-yellow-500 { color: #F59E0B; }
        #global-chart-tooltip .rounded-lg { border-radius: 0.5rem; }
        #global-chart-tooltip .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
        #global-chart-tooltip .p-3 { padding: 0.75rem; }
        #global-chart-tooltip .p-4 { padding: 1rem; }
        #global-chart-tooltip .p-2 { padding: 0.5rem; }
        #global-chart-tooltip .pt-3 { padding-top: 0.75rem; }
        #global-chart-tooltip .mb-3 { margin-bottom: 0.75rem; }
        #global-chart-tooltip .mb-1 { margin-bottom: 0.25rem; }
        #global-chart-tooltip .mb-4 { margin-bottom: 1rem; }
        #global-chart-tooltip .mr-1 { margin-right: 0.25rem; }
        #global-chart-tooltip .mr-2 { margin-right: 0.5rem; }
        #global-chart-tooltip .mt-1 { margin-top: 0.25rem; }
        #global-chart-tooltip .mt-3 { margin-top: 0.75rem; }
        #global-chart-tooltip .text-xs { font-size: 0.75rem; }
        #global-chart-tooltip .text-sm { font-size: 0.875rem; }
        #global-chart-tooltip .text-lg { font-size: 1.125rem; }
        #global-chart-tooltip .text-xl { font-size: 1.25rem; }
        #global-chart-tooltip .font-bold { font-weight: 700; }
        #global-chart-tooltip .font-medium { font-weight: 500; }
        #global-chart-tooltip .flex { display: flex; }
        #global-chart-tooltip .items-center { align-items: center; }
        #global-chart-tooltip .justify-between { justify-content: space-between; }
        #global-chart-tooltip .w-8 { width: 2rem; }
        #global-chart-tooltip .h-6 { height: 1.5rem; }
        #global-chart-tooltip .w-36 { width: 9rem; }
        #global-chart-tooltip .w-48 { width: 12rem; }
        #global-chart-tooltip .rounded { border-radius: 0.25rem; }
        #global-chart-tooltip .rounded-md { border-radius: 0.375rem; }
        #global-chart-tooltip .overflow-hidden { overflow: hidden; }
        #global-chart-tooltip .border-t { border-top-width: 1px; }
        #global-chart-tooltip .border-b { border-bottom-width: 1px; }
        #global-chart-tooltip .space-y-2 > * + * { margin-top: 0.5rem; }
        #global-chart-tooltip .max-w-xs { max-width: 20rem; }
        #global-chart-tooltip .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
        #global-chart-tooltip .w-full { width: 100%; }
        #global-chart-tooltip .h-full { height: 100%; }
        #global-chart-tooltip img { max-width: 100%; height: 100%; object-fit: cover; }
        #global-chart-tooltip .flag-container { min-width: 2rem; min-height: 1.5rem; }
      `;
      document.head.appendChild(styleSheet);
    }
    
    return tooltipElement;
  };

  // Posicionar el tooltip global
  const positionGlobalTooltip = (event: MouseEvent, content: string): void => {
    const tooltipEl = createGlobalTooltip();
    
    // Actualizar contenido
    tooltipEl.innerHTML = content;
    
    // Aplicar estilos base
    Object.assign(tooltipEl.style, {
      position: 'fixed',
      display: 'block',
      opacity: '0',
      zIndex: '999999',
      pointerEvents: 'none',
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      borderRadius: '4px',
      padding: '0', // No aplicamos padding aquí porque lo aplicaremos en las clases internas
      minWidth: '150px',
      maxWidth: '320px', // Aumentado de 280px a 320px para más espacio
      border: '1px solid #e2e8f0',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#333',
      transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out'
    });
    
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    
    // Obtener posición del mouse
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Posicionar más cerca del elemento - menos offset
    let left = mouseX + 10; // Reducido de 15px a 10px
    let top = mouseY - (tooltipHeight / 2);
    
    // Ajustar posición si se sale de la ventana
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (left + tooltipWidth > windowWidth) {
      left = mouseX - tooltipWidth - 10; // Cambiar a la izquierda del cursor
    }
    
    if (top + tooltipHeight > windowHeight) {
      top = windowHeight - tooltipHeight - 10;
    }
    
    if (top < 10) {
      top = 10;
    }
    
    // Establecer posición y visibilidad con precisión
    tooltipEl.style.left = `${Math.floor(left)}px`;
    tooltipEl.style.top = `${Math.floor(top)}px`;
    
    // Agregar clase visible tras un pequeño delay para activar la animación
    setTimeout(() => {
      tooltipEl.classList.add('visible');
    }, 10);
  };

  // Ocultar el tooltip global
  const hideGlobalTooltip = (): void => {
    const tooltipEl = document.getElementById('global-chart-tooltip');
    if (tooltipEl) {
      // Quitar la clase visible primero para la animación
      tooltipEl.classList.remove('visible');
      
      // Después de la transición, ocultar el tooltip
      setTimeout(() => {
        if (tooltipEl) {
          tooltipEl.style.display = 'none';
          tooltipEl.style.opacity = '0';
        }
      }, 150); // Tiempo suficiente para la animación
    }
  };

  const getCommunityFlagUrl = (communityName: string): string => {
    // Normalizar el nombre de la comunidad
    const normalizedName = normalizeText(communityName);
    
    // Si estamos en inglés, primero traducir el nombre a español para buscar la bandera
    let searchName = normalizedName;
    
    // Mapa de traducciones inglés a español
    const translationsToSpanish: Record<string, string> = {
      'andalusia': 'andalucia',
      'aragon': 'aragon',
      'asturias': 'asturias',
      'balearic islands': 'islas baleares',
      'canary islands': 'canarias',
      'cantabria': 'cantabria',
      'castilla-la mancha': 'castilla-la mancha',
      'castile and león': 'castilla y leon',
      'castile and leon': 'castilla y leon',
      'catalonia': 'cataluña',
      'valencia': 'comunidad valenciana',
      'extremadura': 'extremadura',
      'galicia': 'galicia',
      'la rioja': 'la rioja',
      'madrid': 'madrid',
      'murcia': 'murcia',
      'navarre': 'navarra',
      'basque country': 'pais vasco',
      'ceuta': 'ceuta',
      'melilla': 'melilla'
    };
    
    // Si el nombre normalizado está en inglés, traducirlo a español
    if (translationsToSpanish[normalizedName]) {
      searchName = translationsToSpanish[normalizedName];
      console.log(`Nombre traducido de "${normalizedName}" a "${searchName}" para buscar bandera`);
    }
    
    // Crear un mapa de conversión específico para nombres problemáticos
    const specificNameMapping: Record<string, string> = {
      'extremadura': 'extremadura',
      'castilla y leon': 'castilla y leon',
      'castilla leon': 'castilla y leon',
      'castilla-leon': 'castilla y leon',
      'castilla-y-leon': 'castilla y leon',
      'castile and leon': 'castilla y leon',
      'islas baleares': 'illes balears / islas baleares',
      'illes balears': 'illes balears / islas baleares',
      'baleares': 'illes balears / islas baleares',
      'balearic islands': 'illes balears / islas baleares',
      'navarra': 'comunidad foral de navarra',
      'navarre': 'comunidad foral de navarra',
      'asturias': 'principado de asturias',
      'principado asturias': 'principado de asturias',
      'ceuta': 'ciudad autonoma de ceuta',
      'melilla': 'ciudad autonoma de melilla'
    };

    // Si el nombre normalizado está en el mapa de conversión específico, usar ese nombre
    const mappedName = specificNameMapping[searchName] || searchName;
    
    console.log("Ranking - Buscando bandera para: ", communityName, "normalizado a:", normalizedName, "mapeado a:", mappedName);
    
    // Intentar encontrar coincidencia exacta primero
    let matchingFlag = communityFlags.find(flag => 
      normalizeText(flag.community) === mappedName
    );
    
    // Si no hay coincidencia exacta, probar con coincidencia parcial
    if (!matchingFlag) {
      matchingFlag = communityFlags.find(flag => {
        const flagCommunityName = normalizeText(flag.community);
        
        // Verificar si la bandera contiene el nombre o viceversa
        return flagCommunityName.includes(mappedName) || 
               mappedName.includes(flagCommunityName);
      });
    }
    
    // Si aún no hay coincidencia, buscar usando mapeo de comunidades
    if (!matchingFlag) {
      // Verificar coincidencia por mapeo
      for (const key in communityNameMapping) {
        const normalizedKey = normalizeText(key);
        const normalizedValueEs = normalizeText(communityNameMapping[key].es);
        const normalizedValueEn = normalizeText(communityNameMapping[key].en);
        
        // Si el nombre normalizado coincide con la clave o los valores del mapeo
        if (normalizedKey === searchName || 
            normalizedValueEs === searchName || 
            normalizedValueEn === searchName) {
          const targetName = normalizedValueEs;
          
          // Buscar bandera que coincida con el valor del mapeo
          matchingFlag = communityFlags.find(flag => 
            normalizeText(flag.community) === targetName ||
            normalizeText(flag.community).includes(targetName) ||
            targetName.includes(normalizeText(flag.community))
          );
          
          if (matchingFlag) break;
        }
      }
    }
    
    // Si aún no se ha encontrado bandera, hacer una búsqueda más relajada por código
    if (!matchingFlag) {
      // Extraer posible código de región de la comunidad (si existe en el formato "ES-XX")
      const codeMatch = communityName.match(/ES-(\w{2})/i);
      const code = codeMatch ? codeMatch[1].toUpperCase() : '';
      
      if (code) {
        matchingFlag = communityFlags.find(flag => 
          flag.code === code
        );
      }
    }
    
    if (matchingFlag) {
      console.log("Ranking - Bandera encontrada:", matchingFlag.flag);
      return matchingFlag.flag;
    } else {
      console.log("Ranking - No se encontró bandera para:", communityName);
      
      // Intentar obtener la bandera a través de un mapeo de nombres en inglés a códigos de regiones
      const englishToCodes: Record<string, string> = {
        'andalusia': 'AND',
        'aragon': 'ARA',
        'asturias': 'AST',
        'balearic islands': 'BAL',
        'canary islands': 'CAN',
        'cantabria': 'CBR', // Ajustado para evitar conflicto con Canarias
        'castilla-la mancha': 'CLM',
        'castile and león': 'CYL',
        'catalonia': 'CAT',
        'valencia': 'VAL',
        'extremadura': 'EXT',
        'galicia': 'GAL',
        'la rioja': 'RIO',
        'madrid': 'MAD',
        'murcia': 'MUR',
        'navarre': 'NAV',
        'basque country': 'PVA',
        'ceuta': 'CEU',
        'melilla': 'MEL'
      };
      
      const regionCode = englishToCodes[normalizedName];
      if (regionCode) {
        matchingFlag = communityFlags.find(flag => flag.code === regionCode);
        if (matchingFlag) {
          console.log("Ranking - Bandera encontrada por código de región:", matchingFlag.flag);
          return matchingFlag.flag;
        }
      }
      
      // Fallback específico para Castilla-La Mancha (directo)
      if (normalizedName.includes('castilla') && normalizedName.includes('mancha') ||
          searchName.includes('castilla') && searchName.includes('mancha')) {
        console.log("Ranking - Usando URL directa para Castilla-La Mancha");
        return "https://upload.wikimedia.org/wikipedia/commons/d/d4/Bandera_de_Castilla-La_Mancha.svg";
      }
      
      // Fallback específico para Comunidad Valenciana (URL directa)
      if (normalizedName.includes('valencia') || 
          searchName.includes('valencia') || 
          communityName.includes('Com. Valenciana') ||
          communityName.includes('Valencia')) {
        console.log("Ranking - Usando URL directa para Comunidad Valenciana");
        return "https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_of_the_Valencian_Community_%282x3%29.svg";
      }
      
      return '';
    }
  };

  // Función para formatear números con separador de miles
  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    }).format(value);
  };

  // Procesamos y filtramos datos para el año y sector seleccionado
  const getFilteredData = () => {
    // Filtrar datos por año y sector
    const filteredData = data.filter(item => 
      item["Año"] === selectedYear.toString() &&
      item["Sector Id"] === `(${csvSectorId})`
    );
    
    console.log(`Datos para año ${selectedYear} y sector ${csvSectorId}:`, filteredData.length, "registros");
    
    if (filteredData.length === 0) return [];
    
    // Agrupar por comunidad autónoma (para evitar duplicados)
    const communityMap = new Map<string, {
      nameEs: string, 
      nameEn: string, 
      value: number,
      spending: number,
      gdp: number
    }>();
    
    filteredData.forEach(item => {
      const communityNameEs = item["Comunidad Limpio"];
      const communityNameEn = item["Comunidad en Inglés"];
      
      // Determinar qué valor usar según el tipo de visualización
      let rdValue: number;
      
      if (dataDisplayType === 'percent_gdp') {
        rdValue = parseFloat(item['% PIB I+D'].replace(',', '.'));
      } else {
        rdValue = parseFloat(item['Gasto en I+D (Miles €)'].replace(',', '.'));
      }
      
      if (!isNaN(rdValue)) {
        const spending = parseFloat(item['Gasto en I+D (Miles €)'].replace(',', '.'));
        const gdp = parseFloat(item['PIB (Miles €)'].replace(',', '.'));
        
        // Aplicar alias para simplificar nombres de comunidades
        let displayNameEs = communityNameEs;
        let displayNameEn = communityNameEn;
        
        // Usar mapeo si existe
        Object.keys(communityNameMapping).forEach(key => {
          if (normalizeText(key) === normalizeText(communityNameEs)) {
            displayNameEs = communityNameMapping[key].es;
            displayNameEn = communityNameMapping[key].en;
          }
        });
        
        communityMap.set(communityNameEs, {
          nameEs: displayNameEs,
          nameEn: displayNameEn,
          value: rdValue,
          spending,
          gdp
        });
      }
    });
    
    // Convertir a array y ordenar por valor (descendente)
    const sortedData = Array.from(communityMap.values())
      .sort((a, b) => b.value - a.value);
    
    return sortedData;
  };
  
  const chartData = getFilteredData();

  // Estilos para el contenedor con scroll
  const scrollContainerStyle: React.CSSProperties = {
    height: '400px', // Altura fija para el contenedor
    overflowY: 'auto', // Permitir scroll vertical
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    padding: '0 10px',
    // Estilos para el scrollbar en diferentes navegadores
    scrollbarWidth: 'thin', // Firefox
    scrollbarColor: '#d1d5db #f3f4f6', // Firefox
    // Los siguientes estilos son para Webkit (Chrome, Safari, Edge)
    // No son estándar pero mejoran la apariencia
    msOverflowStyle: 'none',
  } as React.CSSProperties;

  // Agregar estilos específicos para el scrollbar con CSS en useEffect
  useEffect(() => {
    // Crear un elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = 'custom-scrollbar-styles';
    
    // Definir estilos para el scrollbar
    styleElement.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #d1d5db;
        border-radius: 8px;
        border: 2px solid #f3f4f6;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #9ca3af;
      }
    `;
    
    // Agregar al head del documento
    document.head.appendChild(styleElement);
    
    // Limpiar al desmontar
    return () => {
      const existingStyle = document.getElementById('custom-scrollbar-styles');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);

  // Altura dinámica para el gráfico en función del número de comunidades
  const chartHeight = Math.max(400, chartData.length * 28); // Reducido para que las barras estén más juntas

  // Obtener el promedio de España
  const getSpainAverage = (): number | null => {
    // Valores para España por año según gdp_consolidado.csv (basado en "% GDP")
    const spainValues: Record<number, Record<string, number>> = {
      2013: { 'total': 1.27, 'business': 0.67, 'government': 0.24, 'education': 0.35, 'nonprofit': 0.01 },
      2014: { 'total': 1.23, 'business': 0.65, 'government': 0.23, 'education': 0.34, 'nonprofit': 0.01 },
      2015: { 'total': 1.21, 'business': 0.64, 'government': 0.23, 'education': 0.33, 'nonprofit': 0.01 },
      2016: { 'total': 1.18, 'business': 0.63, 'government': 0.22, 'education': 0.32, 'nonprofit': 0.01 },
      2017: { 'total': 1.20, 'business': 0.66, 'government': 0.21, 'education': 0.32, 'nonprofit': 0.01 },
      2018: { 'total': 1.23, 'business': 0.70, 'government': 0.21, 'education': 0.31, 'nonprofit': 0.01 },
      2019: { 'total': 1.24, 'business': 0.70, 'government': 0.21, 'education': 0.32, 'nonprofit': 0.01 },
      2020: { 'total': 1.40, 'business': 0.78, 'government': 0.24, 'education': 0.37, 'nonprofit': 0.01 },
      2021: { 'total': 1.40, 'business': 0.78, 'government': 0.24, 'education': 0.37, 'nonprofit': 0.01 },
      2022: { 'total': 1.41, 'business': 0.79, 'government': 0.24, 'education': 0.37, 'nonprofit': 0.01 },
      2023: { 'total': 1.49, 'business': 0.84, 'government': 0.24, 'education': 0.40, 'nonprofit': 0.01 }
    };
    
    // Valores del PIB de España por año (en millones de euros)
    const spainGDP: Record<number, number> = {
      2013: 1025652,
      2014: 1038949,
      2015: 1087112,
      2016: 1122967,
      2017: 1170024,
      2018: 1212276,
      2019: 1253710,
      2020: 1129214,
      2021: 1235474,
      2022: 1373629,
      2023: 1498324
    };
    
    if (selectedYear in spainValues && selectedSector in spainValues[selectedYear]) {
      if (dataDisplayType === 'percent_gdp') {
        return spainValues[selectedYear][selectedSector];
      } else if (selectedYear in spainGDP) {
        // Convertir el porcentaje a miles de euros
        return (spainValues[selectedYear][selectedSector] / 100) * spainGDP[selectedYear] * 1000;
      }
    }
    
    // Si no hay datos, calcular el promedio de las comunidades
    const filteredData = data.filter(item => 
      item["Año"] === selectedYear.toString() &&
      item["Sector Id"] === `(${csvSectorId})`
    );
    
    if (filteredData.length === 0) return null;
    
    const values = dataDisplayType === 'percent_gdp' 
      ? filteredData.map(item => parseFloat(item['% PIB I+D'].replace(',', '.')))
      : filteredData.map(item => parseFloat(item['Gasto en I+D (Miles €)'].replace(',', '.')));
    
    // Filtrar valores no válidos
    const validValues = values.filter(value => !isNaN(value));
    
    if (validValues.length === 0) return null;
    
    // Calcular promedio
    return validValues.reduce((a, b) => a + b, 0) / validValues.length;
  };

  // Obtener el valor de Canarias
  const getCanariasValue = (): number | null => {
    // Buscar Canarias en los datos
    const canariasData = data.filter(item => 
      item["Año"] === selectedYear.toString() &&
      item["Sector Id"] === `(${csvSectorId})` &&
      (
        normalizeText(item["Comunidad Limpio"]) === "canarias" ||
        normalizeText(item["Comunidad (Original)"]) === "canarias"
      )
    );
    
    if (canariasData.length === 0) return null;
    
    // Obtener el valor según el tipo de visualización
    if (dataDisplayType === 'percent_gdp') {
      return parseFloat(canariasData[0]['% PIB I+D'].replace(',', '.'));
    } else {
      return parseFloat(canariasData[0]['Gasto en I+D (Miles €)'].replace(',', '.'));
    }
  };

  // Función para obtener el valor del año anterior para una comunidad
  const getPreviousYearValue = (communityData: {
    nameEs: string,
    nameEn: string,
    value: number,
    spending: number,
    gdp: number
  }): number | null => {
    // Buscar datos de la comunidad en el año anterior
    const prevYearData = data.filter(item => 
      item["Año"] === (selectedYear - 1).toString() &&
      item["Sector Id"] === `(${csvSectorId})` &&
      (
        normalizeText(item["Comunidad Limpio"]) === normalizeText(communityData.nameEs) ||
        normalizeText(item["Comunidad en Inglés"]) === normalizeText(communityData.nameEn) ||
        normalizeText(item["Comunidad (Original)"]) === normalizeText(communityData.nameEs)
      )
    );
    
    if (prevYearData.length === 0) return null;
    
    // Obtener el valor según el tipo de visualización
    if (dataDisplayType === 'percent_gdp') {
      return parseFloat(prevYearData[0]['% PIB I+D'].replace(',', '.'));
    } else {
      return parseFloat(prevYearData[0]['Gasto en I+D (Miles €)'].replace(',', '.'));
    }
  };

  // Función para generar la configuración del gráfico
  const getChartConfig = () => {
    // Formatear etiquetas y valores
    const labels = chartData.map(item => language === 'es' ? item.nameEs : item.nameEn);
    const values = chartData.map(item => item.value);
    
    // Obtener la paleta de colores según el sector seleccionado
    const palette = getSectorPalette(selectedSector);
    
    // Generar colores (Canarias en amarillo, el resto según el sector)
    const backgroundColors = chartData.map(item => {
      const communityNameEs = item.nameEs.toLowerCase();
      const communityNameEn = item.nameEn.toLowerCase();
      
      // Detectar Canarias en ambos idiomas
      if (communityNameEs.includes('canarias') || communityNameEn.includes('canary')) {
        return CHART_PALETTE.CANARIAS; // Amarillo Canarias
      }
      
      // Detectar entidades supranacionales y España
      if (
        communityNameEs.includes('unión europea') || communityNameEn.includes('european union') ||
        communityNameEs.includes('zona euro') || communityNameEn.includes('euro area') ||
        communityNameEs.includes('españa') || communityNameEn.includes('spain')
      ) {
        // Usar colores específicos para entidades especiales
        if (communityNameEs.includes('unión europea') || communityNameEn.includes('european union')) {
          return '#4338ca'; // Índigo para UE
        }
        if (communityNameEs.includes('zona euro') || communityNameEn.includes('euro area')) {
          return '#1e40af'; // Azul oscuro para Zona Euro
        }
        if (communityNameEs.includes('españa') || communityNameEn.includes('spain')) {
          return '#dc2626'; // Rojo para España
        }
      }
      
      return palette.MID; // Color según el sector para el resto
    });
    
    // Configuración de datos para el gráfico
    const data = {
      labels,
      datasets: [{
        label: dataDisplayType === 'percent_gdp' ? 
          (language === 'es' ? '% del PIB' : '% of GDP') : 
          (language === 'es' ? 'Miles de €' : 'Thousand €'),
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => {
          if (color === CHART_PALETTE.CANARIAS) return d3.color(CHART_PALETTE.CANARIAS)?.darker(0.2)?.toString() || CHART_PALETTE.CANARIAS;
          if (color === '#4338ca') return d3.color('#4338ca')?.darker(0.2)?.toString() || '#4338ca'; // Borde UE
          if (color === '#1e40af') return d3.color('#1e40af')?.darker(0.2)?.toString() || '#1e40af'; // Borde Zona Euro
          if (color === '#dc2626') return d3.color('#dc2626')?.darker(0.2)?.toString() || '#dc2626'; // Borde España
          return d3.color(palette.MID)?.darker(0.2)?.toString() || palette.MID;
        }),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 18, // Barras gruesas
        barPercentage: 0.95, // Aumentado para reducir el espacio entre barras
        categoryPercentage: 0.97 // Aumentado para reducir el espacio entre categorías
      }]
    };
    
    // Opciones del gráfico
    const options: ChartOptions<'bar'> = {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      // Usar hover y click
      onClick: (event, elements) => {
        handleChartEvent(event, elements);
      },
      onHover: (event, elements) => {
        handleChartEvent(event, elements);
      },
      events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'mouseenter'],
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        y: {
          grid: {
            display: false,
          },
          ticks: {
            color: CHART_PALETTE.TEXT,
            font: {
              size: 11
            },
            padding: 5 // Añadir padding para mejorar la visualización
          },
          afterFit: (scaleInstance) => {
            // Asegurar que haya suficiente espacio para las etiquetas
            scaleInstance.width = Math.max(scaleInstance.width, 120);
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            display: false
          },
          title: {
            display: false
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
        }
      }
    };
    
    return { data, options };
  };

  // Función para manejar eventos de tooltip
  const handleChartEvent = (event: ChartEvent, elements: Array<unknown>) => {
    // Debug
    console.log("Evento de chart detectado:", event.type, "Elementos:", elements?.length);
    
    const chartCanvas = document.querySelector('canvas');
    if (chartCanvas) {
      chartCanvas.style.cursor = elements && elements.length ? 'pointer' : 'default';
      
      // Si no hay elementos activos, ocultar el tooltip
      if (!elements || elements.length === 0) {
        console.log("Ocultando tooltip - no hay elementos activos");
        hideGlobalTooltip();
        return;
      }

      // Obtener el elemento activo
      if (elements && elements.length > 0 && event.native) {
        // @ts-expect-error - Ignoramos errores de tipos ya que es difícil tipar esto correctamente
        const dataIndex = elements[0].index;
        
        // Comprobar si hay datos para este índice
        if (chartData[dataIndex]) {
          console.log("Mostrando tooltip para índice:", dataIndex);
          
          const communityData = chartData[dataIndex];
          const communityName = language === 'es' ? communityData.nameEs : communityData.nameEn;
          
          // Obtener la URL de la bandera
          const flagUrl = getCommunityFlagUrl(communityName);
          
          // Obtener valores adicionales para comparativas
          const spainValue = getSpainAverage();
          const canariasValue = getCanariasValue();
          
          // Obtener el rank
          const rank = dataIndex + 1;
          const total = chartData.length;
          
          // Obtener variación con respecto al año anterior
          const prevYearValue = getPreviousYearValue(communityData);
          const hasYoYData = prevYearValue !== null;
          const yoyChange = hasYoYData ? ((communityData.value - prevYearValue) / prevYearValue) * 100 : null;
          const yoyIsPositive = yoyChange !== null && yoyChange > 0;
          
          // Construir contenido del tooltip con estilos inline para mayor compatibilidad
          let tooltipContent = `
            <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <!-- Cabecera con bandera y nombre -->
              <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                ${flagUrl ? 
                  `<div class="w-8 h-6 mr-2 rounded overflow-hidden border border-gray-200">
                    <img src="${flagUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${communityName}" />
                   </div>` 
                  : ''}
                <h3 class="text-lg font-bold text-gray-800">${communityName}</h3>
              </div>
              
              <!-- Contenido principal -->
              <div class="p-4">
          `;
          
          tooltipContent += `
            <!-- Métrica principal -->
            <div class="mb-3">
              <div class="flex items-center text-gray-500 text-sm mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                <span>${t.rdInvestment}:</span>
              </div>
              <div class="flex items-center">
                <span class="text-xl font-bold text-blue-700">
                ${dataDisplayType === 'percent_gdp' 
                  ? `${communityData.value.toFixed(2)}%` 
                    : formatNumber(communityData.value, 0) + ' mil €'}
                </span>
                <span class="ml-1 text-sm text-gray-500">
                  ${dataDisplayType === 'percent_gdp' ? t.ofGDP : ''}
                </span>
              </div>
          `;
          
          // Añadir variación YoY
          if (hasYoYData && yoyChange !== null) {
          tooltipContent += `
            <div class="${yoyIsPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                <path d="${yoyIsPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
              </svg>
              <span>${yoyIsPositive ? '+' : ''}${yoyChange.toFixed(2)}% vs ${selectedYear - 1}</span>
            </div>
          `;
          } else {
            tooltipContent += `
              <div class="text-gray-500 flex items-center mt-1 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>No hay datos para ${selectedYear - 1}</span>
              </div>
            `;
          }
          
          tooltipContent += `</div>`;
          
          // Añadir ranking
          tooltipContent += `
            <!-- Ranking -->
            <div class="mb-4">
              <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                </svg>
                <span class="font-medium">Rank </span>
                <span class="font-bold text-lg mx-1">${rank}</span>
                <span class="text-gray-600">${language === 'es' ? `de ${total}` : `of ${total}`}</span>
              </div>
            </div>
          `;
          
          // Añadir comparativas
          tooltipContent += `
            <!-- Comparativas -->
            <div class="space-y-2 border-t border-gray-100 pt-3">
              <div class="text-xs text-gray-500 mb-1">${t.comparative}</div>
          `;
          
          // Comparativa con España
          if (spainValue !== null) {
            if (dataDisplayType === 'percent_gdp') {
              // Formato para modo porcentaje PIB
              const spainDiff = communityData.value - spainValue;
              const spainPercent = (spainDiff / spainValue) * 100;
              const isSpainPositive = spainDiff > 0;
              
              tooltipContent += `
                <!-- vs España -->
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-48">
                    ${t.vsSpain} (${spainValue.toFixed(2) + '%'}):
                  </span>
                  <span class="font-medium ${isSpainPositive ? 'text-green-600' : 'text-red-600'}">
                    ${isSpainPositive ? '+' : ''}${spainPercent.toFixed(1)}%
                  </span>
                </div>
              `;
            } else {
              // Para modo euros, calcular la media y cambiar el texto
              const avgSpainValue = spainValue / 19; // Dividir entre las 19 comunidades autónomas
              const spainDiffWithAvg = communityData.value - avgSpainValue;
              const spainPercentWithAvg = (spainDiffWithAvg / avgSpainValue) * 100;
              const isSpainPositive = spainDiffWithAvg > 0;
              
              tooltipContent += `
                <!-- vs Media España -->
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-48">
                    ${language === 'es' ? 'vs Media España' : 'vs Avg Spain'} (${formatNumber(avgSpainValue, 0) + ' mil €'}):
                  </span>
                  <span class="font-medium ${isSpainPositive ? 'text-green-600' : 'text-red-600'}">
                    ${isSpainPositive ? '+' : ''}${spainPercentWithAvg.toFixed(1)}%
                  </span>
                </div>
              `;
            }
          }
          
          // Comparativa con Canarias
          if (canariasValue !== null && normalizeText(communityName) !== "canarias") {
            const canariasDiff = communityData.value - canariasValue;
            const canariasPercent = (canariasDiff / canariasValue) * 100;
            const isCanariasPositive = canariasDiff > 0;
            
            tooltipContent += `
              <!-- vs Canarias -->
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-600 inline-block w-48">
                  ${t.vsCanarias} (${dataDisplayType === 'percent_gdp' ? canariasValue.toFixed(2) + '%' : formatNumber(canariasValue, 0) + ' mil €'}):
                </span>
                <span class="font-medium ${isCanariasPositive ? 'text-green-600' : 'text-red-600'}">
                  ${isCanariasPositive ? '+' : ''}${canariasPercent.toFixed(1)}%
                </span>
              </div>
            `;
          }
          
          // PIB y gasto para contextualizar (siempre mostrarlos, no solo en modo porcentaje del PIB)
          const gdpValue = communityData.gdp;
          const spendingValue = communityData.spending;
          
          if (gdpValue && spendingValue) {
            tooltipContent += `
              <!-- Datos adicionales de contexto -->
              <div class="mt-3 pt-3 border-t border-gray-100">
                <div class="text-xs text-gray-700">
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-medium">PIB:</span>
                    <span>${formatNumber(gdpValue / 1000000, 2)} ${language === 'es' ? 'mill. €' : 'M€'}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-medium">${language === 'es' ? 'Gasto I+D:' : 'R&D Spend:'}</span>
                    <span>${formatNumber(spendingValue, 0)} ${language === 'es' ? 'mil €' : 'k€'}</span>
                  </div>
                </div>
              </div>
            `;
          }
          
          tooltipContent += `
              </div>
            </div>
          </div>
          `;
          
          // Mostrar tooltip global con el contenido generado
          const nativeEvent = event.native as MouseEvent;
          
          // Ya no necesitamos ajustar el clientY, ya que clientY ya está en coordenadas de ventana
          positionGlobalTooltip(nativeEvent, tooltipContent);
        }
      }
    }
  };



  // Si no hay datos, mostrar mensaje de no disponibilidad
  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2">{t.noData}</p>
        </div>
      </div>
    );
  }

  // Configuración del gráfico
  const chartConfig = getChartConfig();

  // Función para obtener el color del sector para el título
  const getSectorColor = () => {
    // Obtener el color base del sector
    const sectorColor = SECTOR_COLORS[selectedSector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.total;
    // Usar d3 para obtener una versión más oscura del color
    return d3.color(sectorColor)?.darker(0.8)?.toString() || '#333333';
  };

  return (
    <div className="relative h-full" ref={containerRef}>
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {language === 'es' ? `Ranking de comunidades autónomas · ${selectedYear}` : `Autonomous Communities Ranking · ${selectedYear}`}
        </h3>
        <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
             style={{ backgroundColor: `${d3.color(getSectorColor())?.copy({ opacity: 0.15 })}` }}>
          {(() => {
            // Mapeo de IDs de sector a nombres localizados
            const sectorNames: Record<string, { es: string, en: string }> = {
              'total': {
                es: 'Todos los sectores',
                en: 'All sectors'
              },
              'business': {
                es: 'Empresas',
                en: 'Business enterprise'
              },
              'government': {
                es: 'Administración Pública',
                en: 'Government'
              },
              'education': {
                es: 'Enseñanza Superior',
                en: 'Higher education'
              },
              'nonprofit': {
                es: 'Instituciones sin fines de lucro',
                en: 'Non-profit institutions'
              }
            };
            
            // Obtener nombre localizado del sector
            return sectorNames[selectedSector] ? 
                  sectorNames[selectedSector][language] : 
                  (language === 'es' ? 'Todos los sectores' : 'All sectors');
          })()}
        </div>
      </div>
      
      <div style={scrollContainerStyle} ref={scrollContainerRef} className="custom-scrollbar">
        <div style={{ height: `${chartHeight}px`, width: '100%' }}>
          <Bar 
            ref={chartRef}
            data={chartConfig.data}
            options={chartConfig.options}
          />
        </div>
      </div>
      
      {/* Etiqueta del eje X centrada */}
      <div className="text-center mt-2 mb-2 text-sm font-medium text-gray-700">
        {t.axisLabel}
      </div>
    </div>
  );
};

export default memo(RegionRankingChart); 