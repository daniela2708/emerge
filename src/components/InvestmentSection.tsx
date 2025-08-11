import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { 
  RDInvestmentData, 
  getComparisonData, 
  DATA_PATHS,
  CSV_PARSER_OPTIONS,
  processSpainData,
  processCanaryData,
  processEUData,
  processCountryData,
  SpainCSVData,
  CommunitiesCSVData,
  EuropeCSVData
} from '../data/rdInvestment';
import COLORS from '../utils/colors';
import Papa from 'papaparse';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface InvestmentSectionProps {
  language: 'es' | 'en';
}

const InvestmentSection: React.FC<InvestmentSectionProps> = ({ language }) => {
  // Estado para los países/regiones seleccionados para comparar
  const [selectedEntities, setSelectedEntities] = useState<string[]>(['es', 'eu27', 'ic']);
  
  // Estado para almacenar datos procesados
  const [investmentData, setInvestmentData] = useState<RDInvestmentData[]>([]);
  
  // Estado de carga
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Años disponibles para la comparación (extraidos de los datos)
  const [years, setYears] = useState<number[]>([]);

  // Efecto para cargar los datos desde los archivos CSV
  useEffect(() => {
    const loadCSVData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Cargar datos de España
        const spainResponse = await fetch(DATA_PATHS.GDP_SPAIN);
        if (!spainResponse.ok) {
          throw new Error(`Error al cargar datos de España: ${spainResponse.status}`);
        }
        const spainCSV = await spainResponse.text();
        
        // Cargar datos de comunidades autónomas
        const communitiesResponse = await fetch(DATA_PATHS.GDP_COMMUNITIES);
        if (!communitiesResponse.ok) {
          throw new Error(`Error al cargar datos de comunidades: ${communitiesResponse.status}`);
        }
        const communitiesCSV = await communitiesResponse.text();
        
        // Cargar datos de Europa
        const europeResponse = await fetch(DATA_PATHS.GDP_EUROPE);
        if (!europeResponse.ok) {
          throw new Error(`Error al cargar datos de Europa: ${europeResponse.status}`);
        }
        const europeCSV = await europeResponse.text();
        
        // Procesar los CSV con PapaParse
        const spainResult = Papa.parse<SpainCSVData>(spainCSV, {
          header: true,
          delimiter: CSV_PARSER_OPTIONS.GDP_SPAIN.delimiter,
          skipEmptyLines: true
        });
        
        const communitiesResult = Papa.parse<CommunitiesCSVData>(communitiesCSV, {
          header: true,
          delimiter: CSV_PARSER_OPTIONS.GDP_COMMUNITIES.delimiter,
          skipEmptyLines: true
        });
        
        const europeResult = Papa.parse<EuropeCSVData>(europeCSV, {
          header: true,
          delimiter: CSV_PARSER_OPTIONS.GDP_EUROPE.delimiter,
          skipEmptyLines: true
        });
        
        // Procesar los datos obtenidos
        const spainInvestment = processSpainData(spainResult.data);
        const canaryInvestment = processCanaryData(communitiesResult.data);
        const euInvestment = processEUData(europeResult.data);
        
        // Extraer más países y regiones según necesidad
        const germanInvestment = processCountryData(europeResult.data, 'alemania');
        const franceInvestment = processCountryData(europeResult.data, 'francia');
        const finlandInvestment = processCountryData(europeResult.data, 'finlandia');
        
        // Combinar todos los datos
        const allData: RDInvestmentData[] = [
          spainInvestment,
          canaryInvestment,
          euInvestment
        ];
        
        // Añadir países adicionales si están disponibles
        if (germanInvestment) allData.push(germanInvestment);
        if (franceInvestment) allData.push(franceInvestment);
        if (finlandInvestment) allData.push(finlandInvestment);
        
        // Extraer todos los años disponibles en los datos
        const allYears = new Set<number>();
        allData.forEach(entity => {
          Object.keys(entity.values).forEach(year => {
            allYears.add(parseInt(year));
          });
        });
        
        // Ordenar los años cronológicamente
        const sortedYears = Array.from(allYears).sort((a, b) => a - b);
        
        // Actualizar estados
        setInvestmentData(allData);
        setYears(sortedYears);
        setIsLoading(false);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
        setIsLoading(false);
      }
    };
    
    loadCSVData();
  }, []);

  // Textos en español e inglés
  const texts = {
    es: {
      title: "Inversión en I+D como % del PIB",
      subtitle: "Comparativa entre España, la media europea y las Islas Canarias",
      description: "El siguiente gráfico muestra la evolución del porcentaje del Producto Interior Bruto (PIB) destinado a actividades de Investigación y Desarrollo (I+D) a lo largo de los años.",
      comparison: "España vs. Media UE",
      canaryIslands: "Islas Canarias",
      selectCountries: "Seleccionar entidades para comparar:",
      dataSource: "Fuente: Eurostat, INE, ISTAC",
      noData: "No hay datos disponibles para el período seleccionado",
      loading: "Cargando datos...",
      error: "Error al cargar los datos:"
    },
    en: {
      title: "R&D Investment as % of GDP",
      subtitle: "Comparison between Spain, the European average and the Canary Islands",
      description: "The following chart shows the evolution of the percentage of Gross Domestic Product (GDP) allocated to Research and Development (R&D) activities over the years.",
      comparison: "Spain vs. EU Average",
      canaryIslands: "Canary Islands",
      selectCountries: "Select entities to compare:",
      dataSource: "Source: Eurostat, INE, ISTAC",
      noData: "No data available for the selected period",
      loading: "Loading data...",
      error: "Error loading data:"
    }
  };

  const t = (key: keyof typeof texts.es) => texts[language][key];
  
  // Obtener datos formateados para el gráfico
  const chartData = getComparisonData(selectedEntities, years, investmentData);
  
  // Configurar colores para cada entidad
  const entityColors: {[key: string]: string} = {
    'es': COLORS.SPAIN.RED,
    'eu27': COLORS.DASHBOARD.PRIMARY,
    'ic': COLORS.CANARY.BLUE,
    'de': '#333333',
    'fr': '#6B5B95',
    'fi': '#88B04B'
  };
  
  // Opciones para el gráfico
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        title: {
          display: true,
          text: '% del PIB'
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 3,
        hoverRadius: 6
      }
    }
  };
  
  // Datos formateados para Chart.js
  const data = {
    labels: chartData.labels,
    datasets: chartData.datasets.map(dataset => ({
      label: dataset.name[language],
      data: dataset.data,
      borderColor: entityColors[dataset.id] || '#999999',
      backgroundColor: `${entityColors[dataset.id] || '#999999'}33`,
      fill: false,
      borderWidth: dataset.id === 'ic' ? 3 : 2,
      pointBackgroundColor: entityColors[dataset.id] || '#999999',
      hidden: false
    }))
  };
  
  // Toggle para seleccionar/deseleccionar entidades
  const toggleEntity = (entityId: string) => {
    if (selectedEntities.includes(entityId)) {
      if (selectedEntities.length > 1) { // No permitir deseleccionar todos
        setSelectedEntities(selectedEntities.filter(id => id !== entityId));
      }
    } else {
      setSelectedEntities([...selectedEntities, entityId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Descripción */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h3 className="text-xl font-bold text-dashboard-primary mb-3">{t('title')}</h3>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">{t('description')}</p>
        
        {/* Mostrar error si existe */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">{t('error')} {error}</p>
          </div>
        )}
        
        {/* Mostrar indicador de carga */}
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dashboard-primary"></div>
            <span className="ml-3 text-dashboard-primary">{t('loading')}</span>
          </div>
        ) : (
          <>
            {/* Selectores de países/regiones */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('selectCountries')}</p>
              <div className="flex flex-wrap gap-2">
                {investmentData.map(entity => (
                  <button
                    key={entity.id}
                    onClick={() => toggleEntity(entity.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                      selectedEntities.includes(entity.id)
                        ? `bg-${entityColors[entity.id] ? entityColors[entity.id].replace('#', '') : 'gray-500'} text-white`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedEntities.includes(entity.id) 
                        ? entityColors[entity.id] || '#6B7280' 
                        : '#F3F4F6'
                    }}
                  >
                    {entity.name[language]}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Gráfico */}
            {investmentData.length > 0 ? (
              <div className="h-72 mt-6">
                <Line data={data} options={chartOptions} />
              </div>
            ) : (
              <div className="bg-gray-50 p-8 text-center text-gray-500 rounded-lg">
                <p>{t('noData')}</p>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-4 text-right italic">{t('dataSource')}</p>
          </>
        )}
      </div>
      
      {/* Análisis de datos - Solo mostrar si hay datos */}
      {!isLoading && investmentData.length > 0 && (
        <div className="bg-gradient-to-r from-spain-red/5 to-canary-blue/5 p-6 rounded-lg border border-spain-red/10">
          <h3 className="text-lg font-bold text-spain-red mb-3">{t('comparison')}</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {language === 'es' ? 
              'Mientras que la media de la Unión Europea mantiene una inversión en I+D por encima del 2% del PIB, España se sitúa en torno al 1.5%. Las Islas Canarias muestran una inversión significativamente menor, con valores cercanos al 0.6% del PIB, lo que representa menos de la mitad del porcentaje nacional y aproximadamente un cuarto de la media europea.' :
              'While the European Union average maintains R&D investment above 2% of GDP, Spain stands at around 1.5%. The Canary Islands show significantly lower investment, with values close to 0.6% of GDP, which represents less than half the national percentage and approximately a quarter of the European average.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default InvestmentSection; 