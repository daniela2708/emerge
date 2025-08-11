import React, { useState, useEffect } from 'react';
import EuropeanRDMap from '../../components/EuropeanRDMap';
import CountryRankingChart from '../../components/CountryRankingChart';
import SectorDistribution from '../../components/SectorDistribution';
import RDComparisonChart from '../../components/RDComparisonChart';
import DataTypeSelector, { DataDisplayType } from '../../components/DataTypeSelector';
import SpanishRegionsMap from '../../components/SpanishRegionsMap';
import RegionRankingChart from '../../components/RegionRankingChart';
import Papa from 'papaparse';
import { DATA_PATHS, rdSectors } from '../../data/rdInvestment';
import CommunityDistribution from '../../components/CommunityDistribution';
import CommunityRDComparisonChart from '../../components/CommunityRDComparisonChart';
import SectorEvolutionChart from '../../components/SectorEvolutionChart';

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

// Interfaz para los datos CSV con tipado seguro para uso interno en este componente
interface ExtendedEuropeCSVData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  Value: string;
  '%GDP': string;
  ISO3?: string;
  Approx_RD_Investment_million_euro?: string;
  [key: string]: string | undefined;
}

// Interfaz compatible con GDPConsolidadoData para el componente RDComparisonChart
interface GDPConsolidadoData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  '%GDP': string;
  ISO3: string;
  Value?: string;
  Approx_RD_Investment_million_euro?: string;
}

// Interfaz para los datos de etiquetas
export interface LabelData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  Label: string;
  [key: string]: string | undefined;
}

// Textos localizados para la página de inversión
const texts = {
  es: {
    investmentTitle: "Inversión en I+D",
    investmentDescription: "Análisis comparativo de la inversión como porcentaje del PIB.",
    year: "Año:",
    sector: "Sector:",
    loading: "Cargando datos...",
    errorPrefix: "Error al cargar los datos:",
    noDataAvailable: "No hay datos disponibles para el año y sector seleccionados.",
    supranational: "Entidades supranacionales",
    euroArea19: "Zona Euro (19 países)",
    euroArea19Full: "(2015-2022)",
    euroArea20: "Zona Euro (20 países)",
    euroArea20Full: "(desde 2023)",
    europeanUnion: "Unión Europea (27 países)",
    euFull: "(desde 2020)",
    observationFlags: "Leyenda estadística",
    estimated: "Estimado",
    provisional: "Provisional",
    definitionDiffers: "Definición diferente",
    breakInTimeSeries: "Ruptura en serie temporal",
    breakInTimeSeriesDefinitionDiffers: "Ruptura en serie y definición diferente",
    definitionDiffersEstimated: "Definición diferente y estimado",
    definitionDiffersProvisional: "Definición diferente y provisional",
    estimatedProvisional: "Estimado y provisional",
    breakInTimeSeriesProvisional: "Ruptura en serie y provisional",
    lowReliability: "Baja fiabilidad",
    keyMetricsTitle: "Indicadores clave",
    euComparisonTitle: "Panorama europeo de inversión en I+D",
    spanishRegionsTitle: "Inversión en I+D por comunidades autónomas",
    countryRanking: "Ranking de países",
    noData: "No hay datos disponibles para este año"
  },
  en: {
    investmentTitle: "R&D Investment",
    investmentDescription: "Comparative analysis of investment as a percentage of GDP.",
    year: "Year:",
    sector: "Sector:",
    loading: "Loading data...",
    errorPrefix: "Error loading data:",
    noDataAvailable: "No data available for the selected year and sector.",
    supranational: "Supranational entities",
    euroArea19: "Euro Area (19)",
    euroArea19Full: "(2015-2022)",
    euroArea20: "Euro Area (20)",
    euroArea20Full: "(from 2023)",
    europeanUnion: "European Union (27)",
    euFull: "(from 2020)",
    observationFlags: "Statistical legend",
    estimated: "Estimated",
    provisional: "Provisional",
    definitionDiffers: "Different definition",
    breakInTimeSeries: "Break in time series",
    breakInTimeSeriesDefinitionDiffers: "Break in series and different definition",
    definitionDiffersEstimated: "Different definition and estimated",
    definitionDiffersProvisional: "Different definition and provisional",
    estimatedProvisional: "Estimated and provisional",
    breakInTimeSeriesProvisional: "Break in series and provisional",
    lowReliability: "Low reliability",
    keyMetricsTitle: "Key Indicators",
    euComparisonTitle: "European R&D Investment Landscape",
    spanishRegionsTitle: "R&D Investment by Autonomous Communities",
    countryRanking: "Country Ranking",
    noData: "No data available for this year"
  }
};

interface InvestmentProps {
  language: 'es' | 'en';
}

const Investment: React.FC<InvestmentProps> = ({ language }) => {
  const [europeData, setEuropeData] = useState<ExtendedEuropeCSVData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedKeyYear, setSelectedKeyYear] = useState<number>(2023);
  // Estado del selector de sector para la distribución geográfica
  const [selectedMapSector, setSelectedMapSector] = useState<string>("All Sectors");
  // Estado del selector de sector para la evolución temporal
  const [selectedEvolutionSector, setSelectedEvolutionSector] = useState<string>("All Sectors");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autonomousCommunitiesData, setAutonomousCommunitiesData] = useState<AutonomousCommunityData[]>([]);
  const [dataDisplayType, setDataDisplayType] = useState<DataDisplayType>('percent_gdp');
  
  // Nuevas variables de estado para los filtros de comunidades autónomas
  const [availableRegionYears, setAvailableRegionYears] = useState<number[]>([]);
  const [selectedRegionYear, setSelectedRegionYear] = useState<number>(2023);
  const [selectedRegionSector, setSelectedRegionSector] = useState<string>("All Sectors");

  // Función auxiliar para acceder a los textos según el idioma actual
  const t = texts[language];

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedKeyYear)) {
      setSelectedKeyYear(availableYears[0]);
    }
  }, [availableYears, selectedKeyYear]);

  // Función para obtener el nombre del sector seleccionado
  /* Esta función se mantiene por compatibilidad con posibles usos futuros */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getSectorName = (sectorValue: string): string => {
    if (sectorValue === 'All Sectors') {
      return language === 'es' ? 'Todos los sectores' : 'All sectors';
    }
    
    // Mapeo de nombres completos a nombres localizados
    const sectorNames: Record<string, { es: string, en: string }> = {
      'Business enterprise sector': {
        es: 'Sector empresarial',
        en: 'Business enterprise sector'
      },
      'Government sector': {
        es: 'Administración Pública',
        en: 'Government sector'
      },
      'Higher education sector': {
        es: 'Enseñanza Superior',
        en: 'Higher education sector'
      },
      'Private non-profit sector': {
        es: 'Instituciones Privadas sin Fines de Lucro',
        en: 'Private non-profit sector'
      }
    };
    
    // Si está en el mapeo, usar el nombre localizado
    if (sectorValue in sectorNames) {
      return sectorNames[sectorValue][language];
    }
    
    // Buscar por ID en rdSectors si no coincide con el mapeo
    const sector = rdSectors.find(s => s.id === sectorValue);
    if (sector) {
      return sector.name[language];
    }
    
    // Fallback: retornar el valor original
    return sectorValue;
  };

  // Efecto para cargar los datos desde los archivos CSV
  useEffect(() => {
    const loadCSVData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Intentando cargar datos desde:", DATA_PATHS.GDP_EUROPE);
        
        // Cargar datos de Europa
        const europeResponse = await fetch('./data/GDP_data/gdp_consolidado.csv');
        if (!europeResponse.ok) {
          throw new Error(`${t.errorPrefix} ${europeResponse.status} - ${europeResponse.statusText}`);
        }
        
        const europeText = await europeResponse.text();
        const europeResult = Papa.parse(europeText, {
          header: true,
          skipEmptyLines: true,
        });
        
        const parsedEuropeData = europeResult.data as ExtendedEuropeCSVData[];
        setEuropeData(parsedEuropeData);
        
        // Extraer los años disponibles
        const uniqueYears = Array.from(new Set(parsedEuropeData.map(item => parseInt(item.Year))))
          .filter(year => !isNaN(year))
          .sort((a, b) => b - a); // Ordenar de más reciente a más antiguo
        
        setAvailableYears(uniqueYears);
        if (uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[0]); // Establecer el año más reciente por defecto
          setSelectedKeyYear(uniqueYears[0]);
        }
        
        // Cargar datos de comunidades autónomas de España
        const autonomousResponse = await fetch('./data/GDP_data/gasto_ID_comunidades_porcentaje_pib.csv');
        if (!autonomousResponse.ok) {
          throw new Error(`${t.errorPrefix} ${autonomousResponse.status} - ${autonomousResponse.statusText}`);
        }
        
        const autonomousText = await autonomousResponse.text();
        const autonomousResult = Papa.parse(autonomousText, {
          header: true,
          delimiter: ";",
          skipEmptyLines: true,
        });
        
        const parsedAutonomousData = autonomousResult.data as AutonomousCommunityData[];
        setAutonomousCommunitiesData(parsedAutonomousData);
        
        // Extraer los años disponibles para comunidades autónomas
        const regionYears = Array.from(new Set(parsedAutonomousData.map(item => parseInt(item.Año))))
          .filter(year => !isNaN(year))
          .sort((a, b) => b - a); // Ordenar de más reciente a más antiguo
        
        setAvailableRegionYears(regionYears);
        if (regionYears.length > 0) {
          setSelectedRegionYear(regionYears[0]); // Establecer el año más reciente por defecto
        }
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCSVData();
  }, [t]); // Solo se ejecuta cuando cambia el idioma
  
  // Manejador para cambiar el sector del mapa europeo
  const handleMapSectorChange = (sectorId: string) => {
    const sectorInEnglish = rdSectors.find(s => s.id === sectorId)?.name.en || "All Sectors";
    setSelectedMapSector(sectorInEnglish);
  };

  // Manejador para cambiar el sector de la evolución temporal
  const handleEvolutionSectorChange = (sectorId: string) => {
    const sectorInEnglish = rdSectors.find(s => s.id === sectorId)?.name.en || "All Sectors";
    setSelectedEvolutionSector(sectorInEnglish);
  };

  // Nuevo manejador para cambio de sector en comunidades autónomas
  const handleRegionSectorChange = (sectorId: string) => {
    const sectorInEnglish = rdSectors.find(s => s.id === sectorId)?.name.en || "All Sectors";
    setSelectedRegionSector(sectorInEnglish);
  };
  
  const getSectorId = (sectorNameEn: string): string => {
    const sector = rdSectors.find(s => s.name.en === sectorNameEn);
    return sector ? sector.id : "_T"; // "_T" es el ID para "Todos los sectores"
  };
  
  const handleDataTypeChange = (newType: DataDisplayType) => {
    setDataDisplayType(newType);
  };
  
  const mapToGDPConsolidadoData = (data: ExtendedEuropeCSVData[]): GDPConsolidadoData[] => {
    return data.map(item => {
      const mapped: GDPConsolidadoData = {
        Country: item.Country,
        País: item.País,
        Year: item.Year,
        Sector: item.Sector,
        '%GDP': item['%GDP'],
        ISO3: item.ISO3 || '',
        Value: item.Value,
        Approx_RD_Investment_million_euro: item.Approx_RD_Investment_million_euro,
      };
      return mapped;
    });
  };
  
  const SupranationalEntities = () => {
    // Componente para mostrar las entidades supranacionales
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <h4 className="text-sm font-semibold mb-3 text-gray-700">{t.supranational}</h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center p-2 bg-blue-50 rounded border border-blue-100">
            <div className="w-4 h-4 rounded-full bg-blue-600 mr-2"></div>
            <span className="text-sm text-gray-700">{t.euroArea19}</span>
            <span className="text-xs text-gray-500 ml-1">{t.euroArea19Full}</span>
          </div>
          <div className="flex items-center p-2 bg-blue-50 rounded border border-blue-100">
            <div className="w-4 h-4 rounded-full bg-blue-700 mr-2"></div>
            <span className="text-sm text-gray-700">{t.euroArea20}</span>
            <span className="text-xs text-gray-500 ml-1">{t.euroArea20Full}</span>
          </div>
          <div className="flex items-center p-2 bg-blue-50 rounded border border-blue-100">
            <div className="w-4 h-4 rounded-full bg-blue-800 mr-2"></div>
            <span className="text-sm text-gray-700">{t.europeanUnion}</span>
            <span className="text-xs text-gray-500 ml-1">{t.euFull}</span>
          </div>
        </div>
      </div>
    );
  };
  
  const ObservationFlags = () => (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">{t.observationFlags}</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">e</span>
          <span className="text-xs text-gray-600">{t.estimated}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">p</span>
          <span className="text-xs text-gray-600">{t.provisional}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">d</span>
          <span className="text-xs text-gray-600">{t.definitionDiffers}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">b</span>
          <span className="text-xs text-gray-600">{t.breakInTimeSeries}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">bd</span>
          <span className="text-xs text-gray-600">{t.breakInTimeSeriesDefinitionDiffers}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">de</span>
          <span className="text-xs text-gray-600">{t.definitionDiffersEstimated}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">dp</span>
          <span className="text-xs text-gray-600">{t.definitionDiffersProvisional}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">ep</span>
          <span className="text-xs text-gray-600">{t.estimatedProvisional}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">bp</span>
          <span className="text-xs text-gray-600">{t.breakInTimeSeriesProvisional}</span>
        </div>
        <div className="flex items-center p-1.5">
          <span className="inline-block w-6 text-center font-bold text-xs mr-2 text-blue-800">u</span>
          <span className="text-xs text-gray-600">{t.lowReliability}</span>
        </div>
      </div>
    </div>
  );
  
  // Componente para título de sección
  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-xl font-bold mb-6 mt-0 text-blue-800 border-b border-blue-100 pb-2">
      {title}
    </h2>
  );

  // Componente para título de subsección normal (sin sector dinámico)
  const SubsectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-md font-semibold mb-4 mt-8 text-blue-700 pl-2 border-l-4 border-blue-200">
      {title}
    </h3>
  );

  // Componente para título de subsección con sector (solo para secciones específicas)
  const SubsectionTitleWithSector = ({ 
    baseTitle, 
    sector, 
    language 
  }: { 
    baseTitle: string; 
    sector: string; 
    language: 'es' | 'en';
  }) => {
    return (
      <div className="flex items-center mb-4 mt-8">
        <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
        <h3 className="text-md font-semibold text-blue-700 flex items-center flex-wrap">
          <span>{baseTitle}</span>
          <span className="mx-3 text-blue-400 hidden sm:inline">•</span>
          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mt-1 sm:mt-0">
            <span className="text-blue-600 font-medium text-sm">
              {getSectorDisplayName(sector, language)}
            </span>
          </div>
        </h3>
      </div>
    );
  };

  // Función para obtener el nombre del sector para mostrar
  const getSectorDisplayName = (sector: string, language: 'es' | 'en'): string => {
    // Primero buscar por ID en rdSectors
    const sectorObj = rdSectors.find(s => s.id === sector);
    if (sectorObj) {
      return sectorObj.name[language];
    }
    
    // Fallback para nombres completos o valores directos
    switch(sector) {
      case 'all':
      case 'total':
      case 'All Sectors':
        return language === 'es' ? 'Todos los sectores' : 'All sectors';
      case 'business':
      case 'Business enterprise sector':
        return language === 'es' ? 'Sector empresarial' : 'Business enterprise sector';
      case 'government':
      case 'Government sector':
        return language === 'es' ? 'Administración Pública' : 'Government sector';
      case 'education':
      case 'Higher education sector':
        return language === 'es' ? 'Enseñanza Superior' : 'Higher education sector';
      case 'nonprofit':
      case 'Private non-profit sector':
        return language === 'es' ? 'Instituciones Privadas sin Fines de Lucro' : 'Private non-profit sector';
      default:
        return sector;
    }
  };

  // Función para obtener datos para los indicadores clave basados en el año seleccionado
  const getFixedKeyMetricsData = () => {
    if (europeData.length === 0 || availableYears.length === 0) {
      return {
        year: 0,
        euData: null,
        spainData: null,
        previousEuData: null,
        previousSpainData: null,
        topRegionData: null,
        canariasData: null
      };
    }

    const yearToUse = selectedKeyYear;
    const yearStr = yearToUse.toString();
    const allSectorData = europeData.filter(item => item.Year === yearStr && item.Sector === 'All Sectors');

    // Datos de la Unión Europea
    const euData = allSectorData.find(item =>
      item.Country === 'European Union - 27 countries (from 2020)' ||
      item.Country === 'European Union (27)'
    );

    // Datos de España
    const spainData = allSectorData.find(item =>
      item.Country === 'Spain'
    );

    // El año anterior para comparativas
    const previousYearStr = (yearToUse - 1).toString();
    const previousYearData = europeData.filter(item =>
      item.Year === previousYearStr && item.Sector === 'All Sectors'
    );

    // Datos del año anterior para la UE
    const previousEuData = previousYearData.find(item =>
      item.Country === 'European Union - 27 countries (from 2020)' ||
      item.Country === 'European Union (27)'
    );

    // Datos del año anterior para España
    const previousSpainData = previousYearData.find(item =>
      item.Country === 'Spain'
    );

    // Datos de comunidades autónomas del año seleccionado
    const regionYearStr = yearToUse.toString();

    const regionData = autonomousCommunitiesData.filter(item =>
      item["Año"] === regionYearStr && item["Sector Id"] === "(_T)"
    );

    // Encontrar la comunidad con el valor más alto de PIB I+D
    let topRegion = null;
    let topValue = 0;
    regionData.forEach(item => {
      const value = parseFloat(item["% PIB I+D"].replace(',', '.'));
      if (!isNaN(value) && value > topValue) {
        topValue = value;
        topRegion = item;
      }
    });

    // Datos de Canarias
    const canariasData = regionData.find(item =>
      item["Comunidad Limpio"].toLowerCase() === "canarias"
    );

    return {
      year: yearToUse,
      euData,
      spainData,
      previousEuData,
      previousSpainData,
      topRegionData: topRegion,
      canariasData
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 pt-3 pb-6 w-full" style={{ width: "100%", minWidth: "100%" }}>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[700px] w-full" style={{ width: "100%" }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">{t.loading}</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700 min-h-[700px] flex items-center justify-center w-full" style={{ width: "100%" }}>
          <p>{error}</p>
        </div>
      ) : (
        <div className="w-full min-h-[700px]" style={{ width: "100%" }}>
          {/* Sección 1: Key Metrics */}
          <div className="mb-12 mt-[-15px] w-full">
            <SectionTitle title={t.keyMetricsTitle} />
              <div className="mb-4 flex items-center">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <h2 className="text-gray-700 font-medium text-sm">
                    {language === 'es' ? 'Información para el año' : 'Information for year'}
                  </h2>
                  <select
                    value={selectedKeyYear}
                    onChange={(e) => setSelectedKeyYear(parseInt(e.target.value))}
                    className="ml-2 border border-gray-300 rounded px-2 py-0.5 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Métrica 1: Media UE */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-start">
                  <div className="p-2 sm:p-3 bg-blue-50 rounded-lg mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">
                        {language === 'es' ? 'Unión Europea' : 'European Union'}
                      </h3>
                    </div>
                    <div className="flex items-baseline mt-1 flex-wrap">
                      {
                          (() => {
                          const { euData } = getFixedKeyMetricsData();
                          return (
                            <>
                              <span className="text-lg sm:text-xl font-bold text-blue-700">
                                {euData ? `${parseFloat(euData['%GDP']).toFixed(2)}%` : '--'}
                      </span>
                      <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500">
                        {language === 'es' ? 'del PIB' : 'of GDP'}
                      </span>
                            </>
                          );
                        })()
                      }
                    </div>
                    {
                      (() => {
                        const { euData, previousEuData } = getFixedKeyMetricsData();
                        if (euData && previousEuData) {
                          const currentValue = parseFloat(euData['%GDP']);
                          const previousValue = parseFloat(previousEuData['%GDP']);
                          const yoyChange = ((currentValue - previousValue) / previousValue) * 100;

                          return (
                            <div className="flex items-center mt-1.5">
                              <span className={`text-xs font-medium ${yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(2)}% {language === 'es' ? 'vs anterior' : 'vs previous'}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-center mt-1.5">
                            <span className="text-xs font-medium text-gray-400">
                              -- {language === 'es' ? 'vs anterior' : 'vs previous'}
                            </span>
                          </div>
                        );
                      })()
                    }
                  </div>
                </div>
              </div>
              
              {/* Métrica 2: España y ranking */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="p-2 sm:p-3 bg-red-50 rounded-lg flex items-center justify-center">
                      <img
                        src="/logos/spain.svg"
                        alt="Bandera de España"
                        className="w-6 h-4 sm:w-8 sm:h-6 object-cover rounded border border-gray-300 shadow-sm"
                        style={{
                          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)'
                        }}
                        onError={(e) => {
                          // Fallback al icono SVG si la imagen no carga
                          e.currentTarget.style.display = 'none';
                          const fallbackSvg = document.createElement('svg');
                          fallbackSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                          fallbackSvg.setAttribute('class', 'h-6 w-6 sm:h-8 sm:w-8 text-red-600');
                          fallbackSvg.setAttribute('fill', 'none');
                          fallbackSvg.setAttribute('viewBox', '0 0 24 24');
                          fallbackSvg.setAttribute('stroke', 'currentColor');
                          fallbackSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />';
                          e.currentTarget.parentNode?.appendChild(fallbackSvg);
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">
                        {language === 'es' ? 'España' : 'Spain'}
                      </h3>
                    </div>
                    <div className="flex items-baseline mt-1 flex-wrap">
                      {
                          (() => {
                          const { spainData } = getFixedKeyMetricsData();
                          return (
                            <>
                              <span className="text-lg sm:text-xl font-bold text-red-700">
                                {spainData ? `${parseFloat(spainData['%GDP']).toFixed(2)}%` : '--'}
                      </span>
                      <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500">
                        {language === 'es' ? 'del PIB' : 'of GDP'}
                      </span>
                            </>
                          );
                        })()
                      }
                    </div>
                    <div className="flex flex-col mt-1.5 space-y-1">
                      {
                           (() => {
                          const { euData, spainData, year } = getFixedKeyMetricsData();
                          const yearStr = year.toString();
                          
                          // Cálculo de comparativa con la UE
                          if (euData && spainData) {
                            const euValue = parseFloat(euData['%GDP']);
                            const spainValue = parseFloat(spainData['%GDP']);
                            const diffPercent = ((spainValue - euValue) / euValue) * 100;
                            
                            // Cálculo del ranking
                            let ranking = 0;
                            let totalCountries = 0;
                            if (europeData.length > 0) {
                              const yearData = europeData.filter(item =>
                                item.Year === yearStr && item.Sector === 'All Sectors'
                              );
                              
                               // Función para normalizar texto (remover acentos)
                               const normalizeText = (text: string | undefined): string => {
                                 if (!text) return '';
                                 return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                               };
                              
                               // Función para verificar si una entidad es UE, zona euro u otra entidad no país
                               const isSupranationalEntity = (name: string): boolean => {
                                 const normalizedName = normalizeText(name);
                                 return normalizedName.includes('european union') || 
                                        normalizedName.includes('euro area') ||
                                        normalizedName.includes('oecd') ||
                                        normalizedName.includes('average');
                               };
                               
                               // Filtrar solo países (no promedios ni grupos)
                               const countriesData = yearData.filter(item => 
                                 !isSupranationalEntity(item.Country)
                               );
                               
                               // Ordenar por valor de %GDP (descendente) con criterio estable
                               const sortedCountries = [...countriesData].sort((a, b) => {
                                 // Comparar primero por valor
                                 const valueDiff = parseFloat(b['%GDP']) - parseFloat(a['%GDP']);
                                 if (valueDiff !== 0) return valueDiff;

                                 // Si los valores son iguales, ordenar alfabéticamente para mantener un orden estable
                                 return a.Country.localeCompare(b.Country);
                               });

                               // Encontrar la posición de España usando exactamente el mismo nombre que en el CSV
                               const spainIndex = sortedCountries.findIndex(item =>
                                 item.Country === 'Spain'
                               );

                               ranking = spainIndex !== -1 ? spainIndex + 1 : 0;
                               totalCountries = sortedCountries.length;
                             }
                               
                                                                return (
                                  <div className="space-y-1">
                                    <div className={`text-xs font-medium ${diffPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(1)}% {language === 'es' ? 'vs UE' : 'vs EU'}
                                    </div>
                                    <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium inline-block">
                                      {language === 'es'
                                        ? `#${ranking} de ${totalCountries} UE`
                                        : `#${ranking} of ${totalCountries} EU`}
                                    </div>
                                  </div>
                                );
                             }
                             
                                                           return (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-400">
                                    -- {language === 'es' ? 'vs UE' : 'vs EU'}
                                  </div>
                                  <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium inline-block">
                                {language === 'es' ? `-- UE` : `-- EU`}
                                  </div>
                                </div>
                              );
                        })()
                         }
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Métrica 3: Mejor comunidad autónoma */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-start">
                  <div className="p-2 sm:p-3 bg-green-50 rounded-lg mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                      {language === 'es' ? 'Top Comunidad Autónoma' : 'Top Autonomous Community'}
                    </h3>
                    {
                      (() => {
                        const { year } = getFixedKeyMetricsData();
                        const regionYearStr = year.toString();
                        
                        // Obtener datos filtrados por año más reciente y sector total
                        const allRegionData = autonomousCommunitiesData.filter(item => 
                          item["Año"] === regionYearStr && item["Sector Id"] === "(_T)"
                        );
                        
                        if (allRegionData.length > 0) {
                          // Encontrar la región con mayor % PIB I+D
                          let bestRegion = allRegionData[0];
                          let bestValue = 0;
                          
                          try {
                            bestValue = parseFloat(bestRegion["% PIB I+D"].replace(',', '.'));
                            
                            for (const region of allRegionData) {
                              const regionValue = parseFloat(region["% PIB I+D"].replace(',', '.'));
                              if (regionValue > bestValue) {
                                bestValue = regionValue;
                                bestRegion = region;
                              }
                            }
                          } catch {
                            // Manejar errores de parsing
                          }
                          
                          const regionName = language === 'es' 
                            ? bestRegion["Comunidad Limpio"] 
                            : bestRegion["Comunidad en Inglés"];
                          
                            // Obtener el valor del % del PIB en I+D para la región seleccionada
                            let value = 0;
                            try {
                              value = parseFloat(bestRegion["% PIB I+D"].replace(',', '.'));
                            } catch {
                              // En caso de error, usar el valor por defecto
                            }
                        
                        return (
                          <div>
                            <div className="truncate text-sm sm:text-base font-bold text-gray-800 mb-1" title={regionName}>
                              {regionName}
                            </div>
                            <div className="flex items-baseline flex-wrap">
                              <span className="text-xl sm:text-2xl font-bold text-green-700">
                                  {value.toFixed(2)}%
                              </span>
                              <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500">
                                {language === 'es' ? 'del PIB' : 'of GDP'}
                              </span>
                            </div>
                          </div>
                        );
                        }
                        
                        return (
                      <div>
                        <div className="text-sm sm:text-base font-bold text-gray-600 mb-1">
                          {language === 'es' ? 'Sin datos' : 'No data'}
                        </div>
                        <div className="flex items-baseline flex-wrap">
                          <span className="text-lg sm:text-xl font-bold text-gray-400">--</span>
                          <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500">
                            {language === 'es' ? 'del PIB' : 'of GDP'}
                          </span>
                        </div>
                      </div>
                        );
                      })()
                    }
                  </div>
                </div>
              </div>
              
              {/* Métrica 4: Canarias */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-start">
                  <div className="p-2 sm:p-3 bg-yellow-50 rounded-lg mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="text-[11px] sm:text-xs font-medium text-gray-500 truncate">
                        {language === 'es' ? 'Canarias' : 'Canary Islands'}
                      </h3>
                    </div>
                    {
                      (() => {
                        const { canariasData, spainData, year } = getFixedKeyMetricsData();

                        if (canariasData && spainData) {
                          const canariasValue = parseFloat(canariasData["% PIB I+D"].replace(',', '.'));
                          const spainValue = parseFloat(spainData['%GDP']);

                          // Calcular diferencia porcentual contra España
                          const diff = ((canariasValue - spainValue) / spainValue) * 100;

                          // Calcular ranking de Canarias entre comunidades autónomas
                          const regionYearStr = year.toString();
                          const allRegionData = autonomousCommunitiesData.filter(item =>
                            item["Año"] === regionYearStr && item["Sector Id"] === "(_T)"
                          );
                          
                          // Extraer valores únicos por comunidad
                          const communityMap = new Map();
                          allRegionData.forEach(item => {
                            const name = item["Comunidad Limpio"];
                            const value = parseFloat(item["% PIB I+D"].replace(',', '.'));
                            if (!isNaN(value)) {
                              communityMap.set(name, value);
                            }
                          });
                          
                          // Ordenar comunidades por valor
                          const sortedCommunities = Array.from(communityMap.entries())
                            .sort((a, b) => b[1] - a[1]);
                          const totalCommunities = sortedCommunities.length;
                          
                          // Encontrar la posición de Canarias
                          const canariasIndex = sortedCommunities.findIndex(([name]) => 
                            name.toLowerCase() === "canarias"
                          );
                          
                          const canariasRank = canariasIndex !== -1 ? canariasIndex + 1 : 'N/A';
                          
                          return (
                            <div>
                              <div className="flex items-baseline mt-1 flex-wrap">
                                <span className="text-lg sm:text-xl font-bold text-yellow-700">
                                  {canariasValue.toFixed(2)}%
                                </span>
                                <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500">
                                  {language === 'es' ? 'del PIB' : 'of GDP'}
                                </span>
                              </div>
                              <div className="flex flex-col mt-1.5 space-y-1">
                                <span className={`text-xs font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {diff >= 0 ? '+' : ''}{diff.toFixed(1)}% {language === 'es' ? 'vs España' : 'vs Spain'}
                                </span>
                                <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium inline-block">
                                  {language === 'es'
                                    ? `#${canariasRank} de ${totalCommunities} Nacional`
                                    : `#${canariasRank} of ${totalCommunities} National`}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div>
                            <div className="flex items-baseline mt-1 flex-wrap">
                              <span className="text-lg sm:text-xl font-bold text-gray-400">--</span>
                              <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500">
                                {language === 'es' ? 'del PIB' : 'of GDP'}
                              </span>
                            </div>
                            <div className="flex flex-col mt-1.5 space-y-1">
                              <span className="text-xs font-medium text-gray-400">
                                -- {language === 'es' ? 'vs España' : 'vs Spain'}
                              </span>
                              <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium inline-block">
                                {language === 'es' ? 'Sin datos' : 'No data'}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección 2: Comparación entre la UE y países */}
          <div className="mb-12">
            <SectionTitle title={t.euComparisonTitle} />
            
            {/* Subsección 2.1: Mapa de Europa y ranking de países */}
            <div className="mb-10">
              <SubsectionTitle title={language === 'es' ? "Distribución geográfica de la inversión" : "Geographic Distribution of Investment"} />
              
              {/* Descripción del dataset */}
              <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="mb-2">
                  <strong>
                    {language === 'es' 
                      ? 'Descripción de los datos:' 
                      : 'Data description:'}
                  </strong>
                </p>
                <p className="mb-3">
                  {language === 'es'
                    ? 'Gastos totales en I+D como porcentaje del PIB por país. Datos extraídos de Eurostat y la OCDE.'
                    : 'Total R&D expenditure as percentage of GDP by country. Data extracted from Eurostat and OECD.'}
                </p>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                      <path d="M12 9v4"/>
                      <path d="M12 17h.01"/>
                    </svg>
                    <div>
                      <p className="text-yellow-800 font-medium text-xs">
                        {language === 'es' ? 'Nota metodológica:' : 'Methodological note:'}
                      </p>
                      <p className="text-yellow-700 text-xs mt-1">
                        {language === 'es'
                          ? 'Los valores en euros no están disponibles directamente. La información fue calculada cruzando los datos de inversión en I+D con el PIB anual de cada país.'
                          : 'Euro values are not directly available. The information was calculated by cross-referencing R&D investment data with the annual GDP of each country.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filtros - DEJAR SOLO UN CONJUNTO DE FILTROS */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-md border border-blue-100 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
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
                        className="text-blue-500 mr-2 flex-shrink-0"
                      >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                      <label className="text-gray-700 font-medium mr-2 text-sm sm:text-base">{t.year}</label>
                      <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="text-gray-700 font-medium mr-2 text-sm sm:text-base">{t.sector}</label>
                      <select 
                        value={getSectorId(selectedMapSector)}
                        onChange={(e) => handleMapSectorChange(e.target.value)}
                        className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[200px] sm:min-w-[240px] text-sm sm:text-base"
                      >
                        {rdSectors.map(sector => (
                          <option key={sector.id} value={sector.id}>
                            {sector.name[language]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Selector de tipo de datos visible */}
                  <div className="flex justify-start sm:justify-end">
                    <DataTypeSelector 
                      dataType={dataDisplayType} 
                      onChange={handleDataTypeChange} 
                      language={language} 
                    />
                  </div>
                </div>
              </div>
              
              {/* Primera fila: Mapa y Gráfica - Mejorado para móvil */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8">
                {/* Mapa de Europa */}
                <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100 order-2 xl:order-1">
                  <div className="h-[350px] sm:h-[400px] lg:h-[500px]">
                    <EuropeanRDMap 
                      data={europeData} 
                      selectedYear={selectedYear} 
                      language={language} 
                      selectedSector={selectedMapSector}
                      autonomousCommunitiesData={autonomousCommunitiesData}
                      dataDisplayType={dataDisplayType}
                    />
                  </div>
                </div>
                
                {/* Ranking de países - Eliminar título duplicado y usar directamente el componente */}
                <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100 order-1 xl:order-2">
                  <div className="h-[350px] sm:h-[400px] lg:h-[500px]">
                    {europeData.length > 0 ? (
                      <div className="h-full overflow-hidden" data-testid="country-ranking-chart">
                        <CountryRankingChart 
                          data={europeData}
                          selectedYear={selectedYear}
                          language={language}
                          selectedSector={getSectorId(selectedMapSector)}
                          autonomousCommunitiesData={autonomousCommunitiesData}
                          dataDisplayType={dataDisplayType}
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        {isLoading ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
                            <p className="mt-2 sm:mt-4 text-gray-500 text-sm sm:text-base">{t.loading}</p>
                          </div>
                        ) : error ? (
                          <div className="text-red-500 text-sm sm:text-base text-center px-4">
                            <p>{error}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm sm:text-base">{t.noData}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Segunda fila: Observation Flags y SUPRANATIONAL ENTITIES lado a lado - Mejorado para móvil */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div className="order-2 lg:order-1">
                  <ObservationFlags />
                </div>
                <div className="order-1 lg:order-2">
                  <SupranationalEntities />
                </div>
              </div>
            </div>
            
            {/* Subsección 2.2: Distribución sectorial de la inversión en I+D */}
            <div className="mb-10">
              <SubsectionTitle title={language === 'es' ? "Distribución sectorial de la inversión" : "Sectoral Distribution of Investment"} />
              
              {/* Componente SectorDistribution */}
              <SectorDistribution language={language} />
              
              {/* Sección de Tendencia histórica con RDComparisonChart */}
              {europeData.length > 0 && autonomousCommunitiesData.length > 0 && (
                <>
                  <SubsectionTitleWithSector 
                    baseTitle={language === 'es' ? "Evolución temporal de la inversión" : "Historical Investment Evolution"} 
                    sector={selectedEvolutionSector}
                    language={language}
                  />
                  
                  {/* Selector de sector encima de la gráfica */}
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
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
                          className="text-blue-500 mr-2 flex-shrink-0"
                        >
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        <label className="text-gray-700 font-medium mr-2 text-sm sm:text-base">{t.sector}</label>
                        <select 
                          value={getSectorId(selectedEvolutionSector)}
                          onChange={(e) => handleEvolutionSectorChange(e.target.value)}
                          className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[200px] sm:min-w-[240px] text-sm sm:text-base"
                        >
                          {rdSectors.map(sector => (
                            <option key={sector.id} value={sector.id}>
                              {sector.name[language]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Componente RDComparisonChart con el sector seleccionado como prop - Mejorado para móvil */}
                  <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
                    <RDComparisonChart 
                      language={language}
                      gdpData={mapToGDPConsolidadoData(europeData)}
                      autonomousCommunitiesData={autonomousCommunitiesData}
                      years={availableYears.map(year => year.toString())}
                      selectedSector={selectedEvolutionSector === 'All Sectors' ? 'total' : getSectorId(selectedEvolutionSector).toLowerCase()}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Sección 3: Comparación por comunidades autónomas de España */}
          <div className="mb-12">
            <SectionTitle title={t.spanishRegionsTitle} />
            
            {/* Subsección 3.1: Mapa y ranking de inversión en I+D por comunidades */}
            <div className="mb-10">
              <SubsectionTitle title={language === 'es' ? "Distribución regional de la inversión" : "Regional Distribution of Investment"} />
              
              {/* Descripción del dataset */}
              <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="mb-2">
                  <strong>
                    {language === 'es' 
                      ? 'Descripción de los datos:' 
                      : 'Data description:'}
                  </strong>
                </p>
                <p className="mb-3">
                  {language === 'es'
                    ? 'Gastos internos totales en actividades de I+D según sectores de ejecución. Resultados basados en Empresa Estadística. España y comunidades autónomas por años.'
                    : 'Total internal expenditure on R&D activities by performance sectors. Results based on Statistical Enterprise. Spain and autonomous communities by years.'}
                </p>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                      <path d="M12 9v4"/>
                      <path d="M12 17h.01"/>
                    </svg>
                    <div>
                      <p className="text-yellow-800 font-medium text-xs">
                        {language === 'es' ? 'Nota metodológica:' : 'Methodological note:'}
                      </p>
                      <p className="text-yellow-700 text-xs mt-1">
                        {language === 'es'
                          ? 'Los datos no se encuentran directamente en % del PIB. La información fue calculada cruzando los datos de gasto en I+D con el PIB anual de las comunidades autónomas.'
                          : 'Data is not directly available as % of GDP. The information was calculated by cross-referencing R&D expenditure data with the annual GDP of the autonomous communities.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filtros para la sección de comunidades autónomas */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-md border border-blue-100 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
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
                        className="text-blue-500 mr-2 flex-shrink-0"
                      >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                      <label className="text-gray-700 font-medium mr-2 text-sm sm:text-base">{t.year}</label>
                      <select 
                        value={selectedRegionYear}
                        onChange={(e) => setSelectedRegionYear(parseInt(e.target.value))}
                        className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                      >
                        {availableRegionYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="text-gray-700 font-medium mr-2 text-sm sm:text-base">{t.sector}</label>
                      <select 
                        value={getSectorId(selectedRegionSector)}
                        onChange={(e) => handleRegionSectorChange(e.target.value)}
                        className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[200px] sm:min-w-[240px] text-sm sm:text-base"
                      >
                        {rdSectors.map(sector => (
                          <option key={sector.id} value={sector.id}>
                            {sector.name[language]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Selector de tipo de datos */}
                  <div className="flex justify-start sm:justify-end">
                    <DataTypeSelector 
                      dataType={dataDisplayType} 
                      onChange={handleDataTypeChange} 
                      language={language} 
                    />
                  </div>
                </div>
              </div>
              
              {/* Mapa y Ranking - Mejorado para móvil */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8">
                {/* Mapa de España */}
                <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100 order-2 xl:order-1">
                  <div className="h-[350px] sm:h-[400px] lg:h-[500px]">
                    {autonomousCommunitiesData.length > 0 ? (
                      <SpanishRegionsMap 
                        data={autonomousCommunitiesData} 
                        selectedYear={selectedRegionYear} 
                        language={language} 
                        selectedSector={selectedRegionSector === 'All Sectors' ? 'total' : getSectorId(selectedRegionSector)}
                        dataDisplayType={dataDisplayType}
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500 text-sm sm:text-base">{t.noData}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Ranking de comunidades */}
                <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100 order-1 xl:order-2">
                  <div className="h-[350px] sm:h-[400px] lg:h-[500px]">
                    {autonomousCommunitiesData.length > 0 ? (
                      <div className="h-full overflow-hidden" data-testid="region-ranking-chart">
                        <RegionRankingChart 
                          data={autonomousCommunitiesData}
                          selectedYear={selectedRegionYear}
                          language={language}
                          selectedSector={selectedRegionSector === 'All Sectors' ? 'total' : getSectorId(selectedRegionSector)}
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500 text-sm sm:text-base">{t.noData}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Nueva Subsección 3.2: Distribución sectorial de la inversión en I+D */}
            <div className="mb-10">
              <SubsectionTitle title={language === 'es' ? "Análisis sectorial por comunidades" : "Sectoral Analysis by Communities"} />
              
              {/* Componente CommunityDistribution */}
              <CommunityDistribution language={language} />
              
              {/* Nuevo componente CommunityRDComparisonChart */}
              {europeData.length > 0 && autonomousCommunitiesData.length > 0 && (
                <>
                  <SubsectionTitleWithSector 
                    baseTitle={language === 'es' ? "Evolución temporal por comunidades" : "Historical Evolution by Communities"} 
                    sector={selectedRegionSector} 
                    language={language}
                  />
                  
                  {/* Selector de sector estilo light-blue encima de la gráfica */}
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
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
                          className="text-blue-500 mr-2 flex-shrink-0"
                        >
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        <label className="text-gray-700 font-medium mr-2 text-sm sm:text-base">{t.sector}</label>
                        <select 
                          value={getSectorId(selectedRegionSector)}
                          onChange={(e) => handleRegionSectorChange(e.target.value)}
                          className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[200px] sm:min-w-[240px] text-sm sm:text-base"
                        >
                          {rdSectors.map(sector => (
                            <option key={sector.id} value={sector.id}>
                              {sector.name[language]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
                    <CommunityRDComparisonChart 
                      language={language}
                      gdpData={mapToGDPConsolidadoData(europeData)}
                      autonomousCommunitiesData={autonomousCommunitiesData}
                      years={availableYears.map(year => year.toString())}
                      selectedSector={selectedRegionSector === 'All Sectors' ? 'total' : getSectorId(selectedRegionSector).toLowerCase()}
                    />
                  </div>
                </>
              )}
              
              {/* Nuevo componente SectorEvolutionChart para mostrar evolución por sectores */}
              {autonomousCommunitiesData.length > 0 && (
                <>
                  <SubsectionTitle title={language === 'es' ? "Evolución sectorial en comunidades" : "Sectoral Evolution in Communities"} />
                  <SectorEvolutionChart 
                    language={language}
                    autonomousCommunitiesData={autonomousCommunitiesData}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investment; 