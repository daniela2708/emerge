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
import {
  ResearchersCommunityData,
  getCommunityValue,
  getCommunityFlagUrl,
  getSpainAveragePerCommunity,
  getPreviousYearValue,
  formatNumber,
  getSectorId,
  isSpainEntry,
  getNormalizedCommunityName,
  validarValor
} from '../utils/spanishCommunitiesUtils';

// Registrar componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Definir colores específicos para los componentes de investigadores (igual que en ResearcherRankingChart)
const RESEARCHER_SECTOR_COLORS = {
  total: '#607D8B',        // Azul grisáceo (antes para organizaciones sin fines de lucro)
  business: '#546E7A',     // Azul grisáceo más sobrio para empresas
  government: '#795548',   // Marrón para gobierno
  education: '#7E57C2',    // Morado para educación
  nonprofit: '#5C6BC0'     // Azul índigo (antes para todos los sectores)
};

// Props del componente
interface ResearchersCommunityRankingChartProps {
  data: ResearchersCommunityData[];
  selectedYear: number;
  selectedSector: string;
  language: 'es' | 'en';
  maxItems?: number; // Número máximo de comunidades a mostrar (opcional)
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

const ResearchersCommunityRankingChart: React.FC<ResearchersCommunityRankingChartProps> = ({
  data,
  selectedYear,
  selectedSector,
  language,
  maxItems = 19, // Cambiado de 17 a 19 para incluir las 17 CCAA + 2 ciudades autónomas (Ceuta y Melilla)
}) => {
  const chartRef = useRef<Chart<'bar', number[], string>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Textos según el idioma
  const texts = {
    es: {
      title: 'Ranking de Comunidades Autónomas por número de investigadores',
      noData: 'Sin datos',
      researchersLabel: 'Investigadores',
      loading: 'Cargando...',
      researchers: 'Investigadores',
      thousands: 'miles',
      comparative: "Comparativa",
      vsSpain: "vs España",
      vsCanarias: "vs Islas Canarias"
    },
    en: {
      title: 'Ranking of Autonomous Communities by number of researchers',
      noData: 'No data',
      researchersLabel: 'Researchers',
      loading: 'Loading...',
      researchers: 'Researchers',
      thousands: 'thousands',
      comparative: "Comparative",
      vsSpain: "vs Spain",
      vsCanarias: "vs Canary Islands"
    }
  };

  const t = texts[language];

  // Mapeo de sectores para manejar diferentes formatos de entrada
  const sectorCodeMapping: Record<string, string> = {
    'Sector empresarial': 'BES',
    'Business enterprise sector': 'BES',
    'Administración Pública': 'GOV',
    'Government sector': 'GOV',
    'Enseñanza Superior': 'HES',
    'Higher education sector': 'HES',
    'Instituciones Privadas sin Fines de Lucro': 'PNP',
    'Private non-profit sector': 'PNP',
    'Todos los sectores': 'TOTAL',
    'All sectors': 'TOTAL'
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseLeave = () => {
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

  // Funciones para manejar el tooltip global
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
        padding: '0', 
        minWidth: '150px',
        maxWidth: '320px',
        border: '1px solid #e2e8f0',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#333',
        transition: 'opacity 0.15s ease-in-out'
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
        #global-chart-tooltip .text-orange-500 { color: #F97316; }
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
        #global-chart-tooltip .ml-2 { margin-left: 0.5rem; }
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
        #global-chart-tooltip .w-44 { width: 11rem; }
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
        #global-chart-tooltip .w-12 { width: 3rem; }
        #global-chart-tooltip .h-12 { height: 3rem; }
        #global-chart-tooltip .rounded-full { border-radius: 9999px; }
        #global-chart-tooltip .bg-gray-100 { background-color: #F3F4F6; }
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
    
    // Aplicar estilos
    Object.assign(tooltipEl.style, {
      position: 'fixed',
      display: 'block',
      opacity: '1',
      zIndex: '999999',
      pointerEvents: 'none',
      transition: 'opacity 0.15s'
    });
    
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    
    // Obtener posición del mouse
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Calcular posición del tooltip
    let left = mouseX + 15;
    let top = mouseY - tooltipHeight / 2;
    
    // Ajustar posición si se sale de la ventana
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (left + tooltipWidth > windowWidth) {
      left = mouseX - tooltipWidth - 15;
    }
    
    if (top + tooltipHeight > windowHeight) {
      top = mouseY - tooltipHeight - 15;
    }
    
    if (top < 0) {
      top = 15;
    }
    
    // Establecer posición y visibilidad
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  };

  // Ocultar el tooltip global
  const hideGlobalTooltip = (): void => {
    const tooltipEl = document.getElementById('global-chart-tooltip');
        if (tooltipEl) {
          tooltipEl.style.display = 'none';
          tooltipEl.style.opacity = '0';
    }
  };

  // Filtrar y procesar datos para el gráfico usando la lógica unificada
  const getChartData = () => {
    // Mapear el sector seleccionado usando lógica flexible
    const sectorCode = selectedSector.length <= 3 ? selectedSector : (sectorCodeMapping[selectedSector] || 'TOTAL');
    const sectorId = getSectorId(sectorCode);

    // Filtrar datos por año, sector, sexo (total) y medida (INVESTIGADORES_EJC)
    const filteredData = data.filter(item => 
      item.TIME_PERIOD === selectedYear.toString() &&
      item.SECTOR_EJECUCION_CODE === sectorId &&
      item.SEXO_CODE === '_T' &&
      item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
    );

    if (filteredData.length === 0) return [];

    // Crear mapa de comunidades únicas excluyendo España
    const communityMap = new Map<string, {
      originalName: string,
      displayName: string,
      value: number | null,
      code: string,
      flag: string
    }>();

    filteredData.forEach(item => {
      // Excluir España del ranking usando la función unificada
      if (isSpainEntry(item)) {
        return;
      }

      const originalName = item.TERRITORIO;
      
      // Usar la función unificada para obtener el nombre normalizado
      const displayName = getNormalizedCommunityName(originalName, language);
      
      // Usar directamente el valor del item actual en lugar de buscar nuevamente
      const value = validarValor(item.OBS_VALUE);
      
      // Obtener la bandera usando la función unificada
      const flagUrl = getCommunityFlagUrl(displayName, language);
      
      // Solo agregar si no existe ya o si el valor actual es mejor
      if (!communityMap.has(displayName) || (value !== null && (communityMap.get(displayName)?.value === null || (communityMap.get(displayName)?.value || 0) < value))) {
        communityMap.set(displayName, {
          originalName,
          displayName,
          value,
          code: item.TERRITORIO_CODE,
          flag: flagUrl
        });
      }
    });

    // Convertir el mapa a array y filtrar valores válidos
    const chartData = Array.from(communityMap.values())
      .filter(item => item.value !== null && !isNaN(item.value))
      .sort((a, b) => (b.value || 0) - (a.value || 0)) // Ordenar de mayor a menor
      .slice(0, maxItems) // Limitar número de elementos
      .map(item => ({
        name: item.displayName,
        originalName: item.originalName,
        value: item.value || 0,
        code: item.code,
        flag: item.flag
      }));

    return chartData;
  };

  const chartData = getChartData();

  // Función para manejar eventos de tooltip
  const handleChartEvent = (event: ChartEvent, elements: Array<unknown>) => {
    const chartCanvas = document.querySelector('canvas');
    if (chartCanvas) {
      chartCanvas.style.cursor = elements && elements.length ? 'pointer' : 'default';
      
      // Si no hay elementos activos, ocultar el tooltip
      if (!elements || elements.length === 0) {
        hideGlobalTooltip();
        return;
      }

      // Obtener el elemento activo
      if (elements && elements.length > 0 && event.native) {
        // @ts-expect-error - Ignoramos errores de tipos ya que es difícil tipar esto correctamente
        const dataIndex = elements[0].index;
        
        // Comprobar si hay datos para este índice
        if (chartData[dataIndex]) {
          const communityData = chartData[dataIndex];
          const communityName = communityData.name;
          const value = communityData.value;
          
          // Obtener el rank
          const rank = dataIndex + 1;
          const total = chartData.length;
          
          // Obtener valor del año anterior para cálculo YoY usando la función unificada
          const prevYearValue = getPreviousYearValue(communityData.name, data, selectedYear, selectedSector, language);
          const hasYoYData = value !== null && prevYearValue !== null;
          const yoyChange = hasYoYData ? ((value - prevYearValue) / prevYearValue) * 100 : null;
          const yoyIsPositive = yoyChange !== null && yoyChange > 0;
          
          // Obtener media de España usando la función unificada
          const spainAvg = getSpainAveragePerCommunity(data, selectedYear.toString(), selectedSector);
          
          // Obtener datos de Canarias para comparativa usando la función unificada
          const canariasValue = getCommunityValue('Canarias', data, selectedYear.toString(), selectedSector, language);
          
          // Construir contenido del tooltip con estilos inline para mayor compatibilidad
          let tooltipContent = '';
          
          if (value === 0) {
            // Si el valor es exactamente 0, mostrar un mensaje especial
            tooltipContent = `
              <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <!-- Header con el nombre del país -->
              <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                  ${communityData.flag ? `
                    <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                      <img src="${communityData.flag}" class="w-full h-full object-cover" alt="${communityName}" />
                    </div>
                  ` : ''}
                  <h3 class="text-lg font-bold text-gray-800">${communityName || 'Desconocido'}</h3>
                </div>
                
                <!-- Contenido principal -->
                <div class="p-4">
                  <!-- Métrica principal para valor cero -->
                  <div class="mb-3">
                    <div class="flex items-center text-gray-500 text-sm mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                      <span>${t.researchers}:</span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-xl font-bold text-orange-500">0</span>
                      <span class="text-xs ml-2 text-orange-500">${language === 'es' ? 'Sin investigadores' : 'No researchers'}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          } else {
            tooltipContent = `
              <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <!-- Header con el nombre del país -->
                <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                  ${communityData.flag ? `
                    <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                      <img src="${communityData.flag}" class="w-full h-full object-cover" alt="${communityName}" />
                    </div>
                  ` : ''}
                  <h3 class="text-lg font-bold text-gray-800">${communityName || 'Desconocido'}</h3>
              </div>
              
              <!-- Contenido principal -->
              <div class="p-4">
                <!-- Métrica principal -->
                <div class="mb-3">
                  <div class="flex items-center text-gray-500 text-sm mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                    <span>${t.researchers}:</span>
                  </div>
                  <div class="flex items-center">
                      <span class="text-xl font-bold text-blue-700">${formatNumber(value, language)}</span>
                  </div>
            `;
            
            // Añadir variación YoY si está disponible
            if (hasYoYData && yoyChange !== null) {
              tooltipContent += `
                <div class="${yoyIsPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                    <path d="${yoyIsPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
                          </svg>
                  <span>${yoyIsPositive ? '+' : ''}${yoyChange.toFixed(1)}% vs ${selectedYear - 1}</span>
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
                  <span>Sin datos vs ${selectedYear - 1}</span>
                </div>
              `;
            }
                
            tooltipContent += `</div>`;
            
            // Mostrar ranking
            tooltipContent += `
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
            
            // Añadir comparativas si hay datos disponibles
            let comparisonsHtml = '';
            
            // Comparativa con la media de España
            if (spainAvg !== null && value !== null) {
              const diffSpain = value - spainAvg;
              const percentDiff = (diffSpain / spainAvg) * 100;
              const isPositive = diffSpain > 0;
              
              comparisonsHtml += `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                    `vs Media Nacional (${formatNumber(spainAvg, language)}):` : 
                    `vs National Avg (${formatNumber(spainAvg, language)}):`}</span>
                  <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${!isNaN(percentDiff) ? percentDiff.toFixed(1) + '%' : t.noData}</span>
                </div>
              `;
            }
            
            // Comparativa con Islas Canarias (solo si la comunidad actual no es Canarias)
            if (canariasValue !== null && value !== null && 
                !communityName.toLowerCase().includes('canarias') && 
                !communityName.toLowerCase().includes('canary')) {
              const diffCanarias = value - canariasValue;
              const percentDiff = (diffCanarias / canariasValue) * 100;
              const isPositive = diffCanarias > 0;
              
              comparisonsHtml += `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                    `vs Islas Canarias (${formatNumber(canariasValue, language)}):` :
                    `vs Canary Islands (${formatNumber(canariasValue, language)}):`}</span>
                  <span class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : ''}${!isNaN(percentDiff) ? percentDiff.toFixed(1) + '%' : t.noData}</span>
                </div>
              `;
            }
            
            // Añadir sección de comparativas si hay datos
            if (comparisonsHtml) {
              tooltipContent += `
                <div class="space-y-2 border-t border-gray-100 pt-3">
                  <div class="text-xs text-gray-500 mb-1">Comparativa</div>
                  ${comparisonsHtml}
                </div>
              `;
            }
          }
          
          tooltipContent += `
              </div>
            </div>
          `;
          
          // Mostrar tooltip global con el contenido generado
          const nativeEvent = event.native as MouseEvent;
          positionGlobalTooltip(nativeEvent, tooltipContent);
        }
      }
    }
  };

  // Estilos para el contenedor con scroll
  const scrollContainerStyle: React.CSSProperties = {
    height: '400px', // Cambiado de 500px a 400px para coincidir exactamente con ResearchersSpanishRegionsMap
    overflowY: 'auto',
    border: '1px solid #e5e7eb', // Cambiado a #e5e7eb para coincidir con border-gray-200
    borderRadius: '8px',
    backgroundColor: 'white', // Añadido fondo blanco
    padding: '0 10px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#d1d5db #f3f4f6',
    msOverflowStyle: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', // Añadida sombra consistente
  } as React.CSSProperties;

  // Agregar estilos específicos para el scrollbar con CSS en useEffect
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.id = 'custom-scrollbar-styles';
    
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
    
    document.head.appendChild(styleElement);
    
    return () => {
      const existingStyle = document.getElementById('custom-scrollbar-styles');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);

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

  // Altura dinámica para el gráfico en función del número de comunidades
  const chartHeight = Math.max(400, chartData.length * 28);

  // Configuración del gráfico
  const getChartConfig = () => {
    const labels = chartData.map(item => item.name);
    const values = chartData.map(item => item.value);
    
    // Obtener el color del sector seleccionado usando normalización
    const getSectorColor = (): string => {
      let normalizedId = selectedSector.toLowerCase();
      
      // Mapear sectores a IDs
      if (normalizedId === 'total' || normalizedId === 'todos los sectores' || normalizedId === 'all sectors' || normalizedId === 'all') 
        normalizedId = 'total';
      if (normalizedId === 'bes' || normalizedId === 'business' || normalizedId === 'sector empresarial' || normalizedId === 'business enterprise sector') 
        normalizedId = 'business';
      if (normalizedId === 'gov' || normalizedId === 'government' || normalizedId === 'administración pública' || normalizedId === 'government sector') 
        normalizedId = 'government';
      if (normalizedId === 'hes' || normalizedId === 'education' || normalizedId === 'enseñanza superior' || normalizedId === 'higher education sector') 
        normalizedId = 'education';
      if (normalizedId === 'pnp' || normalizedId === 'nonprofit' || normalizedId === 'instituciones privadas sin fines de lucro' || normalizedId === 'private non-profit sector') 
        normalizedId = 'nonprofit';
      
      return RESEARCHER_SECTOR_COLORS[normalizedId as keyof typeof RESEARCHER_SECTOR_COLORS] || RESEARCHER_SECTOR_COLORS.total;
    };
    
    const sectorColor = getSectorColor();
    
    // Generar colores (Canarias en amarillo, el resto según el color del sector)
    const backgroundColors = chartData.map(item => {
      const communityName = item.name.toLowerCase();
      return communityName.includes('canarias') || 
             communityName.includes('canary') ? 
             CHART_PALETTE.CANARIAS : sectorColor;
    });
    
    const data = {
      labels,
      datasets: [{
        label: t.researchers,
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => {
          return d3.color(color)?.darker(0.2)?.toString() || color;
        }),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 18,
        barPercentage: 0.95,
        categoryPercentage: 0.97
      }]
    };
    
    const options: ChartOptions<'bar'> = {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
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
            padding: 5
          },
          afterFit: (scaleInstance) => {
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

  const chartConfig = getChartConfig();
  
  // Función para obtener el color del sector para el título
  const getSectorTitleColor = (): string => {
    let normalizedId = selectedSector.toLowerCase();
    
    // Mapear sectores a IDs (misma lógica que getSectorColor)
    if (normalizedId === 'total' || normalizedId === 'todos los sectores' || normalizedId === 'all sectors' || normalizedId === 'all') 
      normalizedId = 'total';
    if (normalizedId === 'bes' || normalizedId === 'business' || normalizedId === 'sector empresarial' || normalizedId === 'business enterprise sector') 
      normalizedId = 'business';
    if (normalizedId === 'gov' || normalizedId === 'government' || normalizedId === 'administración pública' || normalizedId === 'government sector') 
      normalizedId = 'government';
    if (normalizedId === 'hes' || normalizedId === 'education' || normalizedId === 'enseñanza superior' || normalizedId === 'higher education sector') 
      normalizedId = 'education';
    if (normalizedId === 'pnp' || normalizedId === 'nonprofit' || normalizedId === 'instituciones privadas sin fines de lucro' || normalizedId === 'private non-profit sector') 
      normalizedId = 'nonprofit';
    
    return RESEARCHER_SECTOR_COLORS[normalizedId as keyof typeof RESEARCHER_SECTOR_COLORS] || RESEARCHER_SECTOR_COLORS.total;
  };

  // Función para mapear el sector a su nombre localizado
  const getSectorName = () => {
    // Normalizar el sector para obtener el nombre correcto
    let normalizedSector = selectedSector.toLowerCase();
    
    // Normalizar códigos y nombres a IDs estándar
    if (normalizedSector === 'total' || normalizedSector === 'todos los sectores' || normalizedSector === 'all sectors' || normalizedSector === 'all') 
      normalizedSector = 'total';
    if (normalizedSector === 'bes' || normalizedSector === 'business' || normalizedSector === 'sector empresarial' || normalizedSector === 'business enterprise sector') 
      normalizedSector = 'business';
    if (normalizedSector === 'gov' || normalizedSector === 'government' || normalizedSector === 'administración pública' || normalizedSector === 'government sector') 
      normalizedSector = 'government';
    if (normalizedSector === 'hes' || normalizedSector === 'education' || normalizedSector === 'enseñanza superior' || normalizedSector === 'higher education sector') 
      normalizedSector = 'education';
    if (normalizedSector === 'pnp' || normalizedSector === 'nonprofit' || normalizedSector === 'instituciones privadas sin fines de lucro' || normalizedSector === 'private non-profit sector') 
      normalizedSector = 'nonprofit';
    
    // Usar terminología exacta de los selectores de la página
    const sectorNames: Record<string, { es: string, en: string }> = {
      'total': {
        es: 'Todos los sectores',
        en: 'All sectors'
      },
      'business': {
        es: 'Sector empresarial',
        en: 'Business enterprise sector'
      },
      'government': {
        es: 'Administración Pública',
        en: 'Government sector'
      },
      'education': {
        es: 'Enseñanza Superior',
        en: 'Higher education sector'
      },
      'nonprofit': {
        es: 'Instituciones Privadas sin Fines de Lucro',
        en: 'Private non-profit sector'
      }
    };
    
    return sectorNames[normalizedSector] ? 
            sectorNames[normalizedSector][language] : 
            (language === 'es' ? 'Todos los sectores' : 'All sectors');
  };

  return (
    <div className="relative h-full" ref={containerRef}>
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {language === 'es' ? `Ranking de investigadores por comunidades autónomas · ${selectedYear}` : `Researchers Ranking by Autonomous Communities · ${selectedYear}`}
        </h3>
        <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
             style={{ backgroundColor: `${d3.color(getSectorTitleColor())?.copy({ opacity: 0.15 })}` }}>
          {getSectorName()}
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
        {t.researchers}
      </div>
    </div>
  );
};

export default memo(ResearchersCommunityRankingChart);