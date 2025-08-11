import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  ChartData 
} from 'chart.js';
import { rdSectors } from '../data/rdInvestment';
import countryFlagsData from '../logos/country_flags.json';

// Registrar componentes necesarios de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Colores para los sectores
const SECTOR_COLORS = [
  'rgba(54, 162, 235, 0.8)',   // Azul - Sector empresarial
  'rgba(255, 99, 132, 0.8)',   // Rojo - Sector gubernamental
  'rgba(255, 206, 86, 0.8)',   // Amarillo - Educación superior
  'rgba(75, 192, 192, 0.8)',   // Verde - Sector no lucrativo
  'rgba(153, 102, 255, 0.8)',  // Morado - Total (todos los sectores)
];

// Interfaces
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
}

interface EuropeCSVData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  Value: string;
  '%GDP': string;
  ISO3?: string;
  [key: string]: string | undefined;
}

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

interface SectorDistributionChartsProps {
  europeData: EuropeCSVData[];
  autonomousCommunitiesData: AutonomousCommunityData[];
  selectedYear: number;
  language: 'es' | 'en';
  onYearChange: (year: number) => void;
}

const SectorDistributionCharts: React.FC<SectorDistributionChartsProps> = ({
  europeData,
  autonomousCommunitiesData,
  selectedYear,
  language,
  onYearChange
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("Spain");
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [euChartData, setEuChartData] = useState<ChartData<'doughnut'> | null>(null);
  const [countryChartData, setCountryChartData] = useState<ChartData<'doughnut'> | null>(null);
  const [canaryChartData, setCanaryChartData] = useState<ChartData<'doughnut'> | null>(null);

  // Textos localizados
  const texts = {
    es: {
      title: "Composición de la inversión por sectores",
      euTitle: "Unión Europea",
      countryTitle: "País",
      canaryTitle: "Islas Canarias",
      selectCountry: "Seleccionar país",
      noData: "No hay datos disponibles",
      businessSector: "Sector empresarial",
      governmentSector: "Sector gubernamental",
      educationSector: "Educación superior",
      nonProfitSector: "Sector no lucrativo",
      year: "Año"
    },
    en: {
      title: "Investment composition by sectors",
      euTitle: "European Union",
      countryTitle: "Country",
      canaryTitle: "Canary Islands",
      selectCountry: "Select country",
      noData: "No data available",
      businessSector: "Business enterprise sector",
      governmentSector: "Government sector",
      educationSector: "Higher education sector",
      nonProfitSector: "Private non-profit sector",
      year: "Year"
    }
  };

  const t = texts[language];

  // Obtener la lista de países disponibles
  useEffect(() => {
    if (europeData.length > 0) {
      const countries = new Set<string>();
      
      europeData.forEach(item => {
        // Solo incluir países reales, no entidades como UE o zona euro
        if (item.Country && !item.Country.includes('Euro') && !item.Country.includes('EU') && !item.Country.includes('European')) {
          countries.add(item.Country);
        }
      });
      
      const sortedCountries = Array.from(countries).sort();
      setAvailableCountries(sortedCountries);

      // Asegurar que España esté seleccionada por defecto si está disponible
      if (sortedCountries.includes('Spain')) {
        setSelectedCountry('Spain');
      } else if (sortedCountries.length > 0) {
        setSelectedCountry(sortedCountries[0]);
      }
    }
  }, [europeData]);

  // Generar datos para los gráficos
  useEffect(() => {
    if (europeData.length === 0) return;

    // Función para obtener el color del sector
    const getSectorColor = (sectorId: string): string => {
      const colorMap: Record<string, string> = {
        'business': SECTOR_COLORS[0],
        'government': SECTOR_COLORS[1],
        'education': SECTOR_COLORS[2],
        'nonprofit': SECTOR_COLORS[3]
      };
      
      return colorMap[sectorId] || SECTOR_COLORS[4];
    };

    // Datos para UE
    const euData = europeData.filter(item => 
      item.Country === 'European Union 27' && 
      item.Year === selectedYear.toString() &&
      item.Sector !== 'All Sectors' // Excluir el total para no duplicar
    );

    if (euData.length > 0) {
      const labels: string[] = [];
      const values: number[] = [];
      const colors: string[] = [];

      for (const sector of rdSectors) {
        if (sector.id === 'total') continue; // Excluir el total
        
        const sectorData = euData.find(item => {
          const sectorMapping: Record<string, string> = {
            'business': 'Business enterprise sector',
            'government': 'Government sector',
            'education': 'Higher education sector',
            'nonprofit': 'Private non-profit sector'
          };
          
          return item.Sector === sectorMapping[sector.id];
        });

        if (sectorData) {
          labels.push(sector.name[language]);
          values.push(parseFloat(sectorData['%GDP'] || '0'));
          colors.push(getSectorColor(sector.id));
        }
      }

      setEuChartData({
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }]
      });
    } else {
      setEuChartData(null);
    }

    // Datos para el país seleccionado
    const countryData = europeData.filter(item => 
      (item.Country === selectedCountry || (language === 'es' && item.País === selectedCountry)) && 
      item.Year === selectedYear.toString() &&
      item.Sector !== 'All Sectors' // Excluir el total para no duplicar
    );

    if (countryData.length > 0) {
      const labels: string[] = [];
      const values: number[] = [];
      const colors: string[] = [];

      for (const sector of rdSectors) {
        if (sector.id === 'total') continue; // Excluir el total
        
        const sectorData = countryData.find(item => {
          const sectorMapping: Record<string, string> = {
            'business': 'Business enterprise sector',
            'government': 'Government sector',
            'education': 'Higher education sector',
            'nonprofit': 'Private non-profit sector'
          };
          
          return item.Sector === sectorMapping[sector.id];
        });

        if (sectorData) {
          labels.push(sector.name[language]);
          values.push(parseFloat(sectorData['%GDP'] || '0'));
          colors.push(getSectorColor(sector.id));
        }
      }

      setCountryChartData({
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }]
      });
    } else {
      setCountryChartData(null);
    }

    // Datos para Islas Canarias
    const canaryData = autonomousCommunitiesData.filter(item => 
      (item["Comunidad Limpio"] === "Canarias" || item["Comunidad en Inglés"] === "Canary Islands") && 
      item["Año"] === selectedYear.toString()
    );

    if (canaryData.length > 0) {
      const labels: string[] = [];
      const values: number[] = [];
      const colors: string[] = [];
      
      // Agrupar por sector
      const sectorGroups: Record<string, AutonomousCommunityData[]> = {};
      
      canaryData.forEach(item => {
        const sectorId = item["Sector Id"];
        if (!sectorGroups[sectorId]) {
          sectorGroups[sectorId] = [];
        }
        sectorGroups[sectorId].push(item);
      });
      
      for (const sector of rdSectors) {
        if (sector.id === 'total') continue; // Excluir el total
        
        const sectorItems = sectorGroups[sector.id];
        if (sectorItems && sectorItems.length > 0) {
          // Usar el primer elemento para cada sector
          const item = sectorItems[0];
          labels.push(sector.name[language]);
          
          // Convertir a número y usar % PIB si está disponible
          const value = parseFloat(item["% PIB I+D"].replace(',', '.') || '0');
          values.push(value);
          
          colors.push(getSectorColor(sector.id));
        }
      }

      setCanaryChartData({
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }]
      });
    } else {
      setCanaryChartData(null);
    }

  }, [europeData, autonomousCommunitiesData, selectedYear, selectedCountry, language]);

  // Opciones comunes para los gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value.toFixed(2)}% PIB`;
          }
        }
      }
    }
  };

  // Obtener la bandera del país seleccionado
  const getCountryFlag = (countryName: string): string => {
    const flags = countryFlagsData as CountryFlag[];
    
    // Buscar primero por nombre exacto
    const flag = flags.find(f => 
      f.country === countryName || 
      (language === 'es' ? f.country === countryName : false)
    );
    
    return flag?.flag || '';
  };

  // Componente para cada gráfico donut
  const DonutChart = ({ 
    title, 
    data, 
    icon 
  }: { 
    title: string; 
    data: ChartData<'doughnut'> | null;
    icon?: string; 
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-center mb-4">
        {icon && (
          <img 
            src={icon} 
            alt="" 
            className="h-6 w-auto mr-2" 
          />
        )}
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      </div>
      
      <div className="h-[280px] flex items-center justify-center">
        {data ? (
          <Doughnut data={data} options={chartOptions} />
        ) : (
          <div className="text-gray-500">{t.noData}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mb-10">
      {/* Filtro de año */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-blue-500 mr-2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <label className="text-gray-700 font-medium mr-2">{t.year}</label>
          <select 
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {Array.from({ length: 2022 - 2015 + 1 }, (_, i) => 2015 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Gráficos Donut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gráfico UE */}
        <DonutChart 
          title={t.euTitle} 
          data={euChartData} 
          icon="https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg" 
        />
        
        {/* Gráfico País (con selector) */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {selectedCountry && getCountryFlag(selectedCountry) && (
                <img 
                  src={getCountryFlag(selectedCountry)} 
                  alt="" 
                  className="h-6 w-auto mr-2" 
                />
              )}
              <h3 className="text-base font-semibold text-gray-800">{t.countryTitle}</h3>
            </div>
            
            <select 
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {availableCountries.map(country => (
                <option key={country} value={country}>{language === 'es' ? 
                  europeData.find(item => item.Country === country)?.País || country : 
                  country}
                </option>
              ))}
            </select>
          </div>
          
          <div className="h-[280px] flex items-center justify-center">
            {countryChartData ? (
              <Doughnut data={countryChartData} options={chartOptions} />
            ) : (
              <div className="text-gray-500">{t.noData}</div>
            )}
          </div>
        </div>
        
        {/* Gráfico Islas Canarias */}
        <DonutChart 
          title={t.canaryTitle} 
          data={canaryChartData} 
          icon="https://upload.wikimedia.org/wikipedia/commons/b/be/Flag_of_the_Canary_Islands.svg" 
        />
      </div>
    </div>
  );
};

export default SectorDistributionCharts; 