import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import ResearchersEuropeanMap from '../../components/ResearchersEuropeanMap';
import ResearcherRankingChart from '../../components/ResearcherRankingChart';
import ResearchersTimelineChart from '../../components/ResearchersTimelineChart';
import ResearchersBySectorChart from '../../components/ResearchersBySectorChart';
import ResearchersSpanishRegionsMap from '../../components/ResearchersSpanishRegionsMap';
import ResearchersCommunityRankingChart from '../../components/ResearchersCommunityRankingChart';
import ResearchersCommunitiesTimelineChart from '../../components/ResearchersCommunitiesTimelineChart';
import ResearchersCommunitiesBySectorChart from '../../components/ResearchersCommunitiesBySectorChart';
import ResearchersKeyMetrics from '../../components/ResearchersKeyMetrics';
import Papa from 'papaparse';

interface ResearchersProps {
  language?: 'es' | 'en';
}

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

// Interfaz para los datos de investigadores por comunidades autónomas
interface ResearchersCommunityData {
  TERRITORIO: string;
  TERRITORIO_CODE: string;
  TIME_PERIOD: string;
  TIME_PERIOD_CODE: string;
  SEXO: string;
  SEXO_CODE: string;
  SECTOR_EJECUCION: string;
  SECTOR_EJECUCION_CODE: string;
  MEDIDAS: string;
  MEDIDAS_CODE: string;
  OBS_VALUE: string;
  [key: string]: string;
}

// Interfaz para un país seleccionable
interface CountryOption {
  name: string;
  localName: string;
  code: string;
  flag?: string;
}

const Researchers: React.FC<ResearchersProps> = (props) => {
  // Usar el language de props si está disponible, o del contexto si no
  const contextLanguage = useLanguage();
  const language = props.language || contextLanguage.language;

  // Estado para los datos de investigadores
  const [researchersData, setResearchersData] = useState<ResearchersData[]>([]);
  const [researchersCommunityData, setResearchersCommunityData] = useState<ResearchersCommunityData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableCommunityYears, setAvailableCommunityYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedKeyYear, setSelectedKeyYear] = useState<number>(2023);
  const [selectedCommunityYear, setSelectedCommunityYear] = useState<number>(2021); // Año por defecto para comunidades
  
  // Estados separados para cada sección
  const [mapSector, setMapSector] = useState<string>('total');
  const [timelineSector, setTimelineSector] = useState<string>('total');
  const [communitySector, setCommunitySector] = useState<string>('total');
  const [communityTimelineSector, setCommunityTimelineSector] = useState<string>('total');
  
  // Estado para el país seleccionado en la subsección "Timeline Evolution by Sectors"
  const [selectedSectorTimelineCountry, setSelectedSectorTimelineCountry] = useState<CountryOption>({
    name: 'Spain',
    localName: 'España',
    code: 'ES',
    flag: undefined
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCommunityLoading, setIsCommunityLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [communityError, setCommunityError] = useState<string | null>(null);

  // Cargar datos desde el archivo CSV de Europa
  useEffect(() => {
    const loadResearchersData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('./data/researchers/europa_researchers.csv');
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const csvText = await response.text();
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });

        // Convertir los datos parseados al formato que necesitamos
        const parsedData = result.data as ResearchersData[];
        setResearchersData(parsedData);

        // Extraer años disponibles y ordenar de más reciente a más antiguo
        const years = Array.from(new Set(parsedData.map(item => 
          parseInt(item.TIME_PERIOD)
        )))
        .filter(year => !isNaN(year))
        .sort((a, b) => b - a);

        setAvailableYears(years);
        
        // Establecer el año más reciente como predeterminado
        if (years.length > 0) {
          setSelectedYear(years[0]);
          setSelectedKeyYear(years[0]);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading researchers data:', err);
        setError(language === 'es' ? 
          'Error al cargar los datos de investigadores' : 
          'Error loading researchers data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadResearchersData();
  }, [language]);

  // Cargar datos de comunidades autónomas
  useEffect(() => {
    const loadCommunityData = async () => {
      setIsCommunityLoading(true);
      try {
        const response = await fetch('./data/researchers/researchers_comunidades_autonomas.csv');
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const csvText = await response.text();
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });

        // Convertir los datos parseados al formato que necesitamos
        const parsedData = result.data as ResearchersCommunityData[];
        
        // Depuración: imprimir en consola información sobre los datos cargados
        console.log("Datos de comunidades autónomas cargados:", parsedData.length, "registros");
        
        // Mostrar ejemplo de los primeros registros
        if (parsedData.length > 0) {
          console.log("Ejemplo de datos:", parsedData.slice(0, 3));
          
          // Extraer y mostrar todos los nombres de territorios únicos para facilitar la depuración
          const uniqueTerritories = Array.from(new Set(parsedData.map(item => item.TERRITORIO)));
          console.log("Territorios disponibles:", uniqueTerritories);
          
          // Mostrar los códigos de territorios
          const territoryCodes = Array.from(new Set(parsedData.map(item => ({
            code: item.TERRITORIO_CODE,
            name: item.TERRITORIO
          }))));
          console.log("Códigos de territorios:", territoryCodes);
        }
        
        setResearchersCommunityData(parsedData);

        // Extraer años disponibles y ordenar de más reciente a más antiguo
        const years = Array.from(new Set(parsedData.map(item => 
          parseInt(item.TIME_PERIOD)
        )))
        .filter(year => !isNaN(year))
        .sort((a, b) => b - a);

        setAvailableCommunityYears(years);
        
        // Establecer el año más reciente como predeterminado
        if (years.length > 0) {
          setSelectedCommunityYear(years[0]);
        }

        setCommunityError(null);
      } catch (err) {
        console.error('Error loading community researchers data:', err);
        setCommunityError(language === 'es' ? 
          'Error al cargar los datos de investigadores por comunidades' : 
          'Error loading researchers data by communities'
        );
      } finally {
        setIsCommunityLoading(false);
      }
    };

    loadCommunityData();
  }, [language]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedKeyYear)) {
      setSelectedKeyYear(availableYears[0]);
    }
  }, [availableYears, selectedKeyYear]);

  // Función para mapear el valor del sector al código utilizado en los datos
  const mapSectorToCode = (sector: string): string => {
    switch(sector) {
      case 'total':
        return 'total';
      case 'business':
        return 'business';
      case 'government':
        return 'government';
      case 'education':
        return 'education';
      case 'nonprofit':
        return 'nonprofit';
      default:
        return 'total';
    }
  };

  // Manejador de cambio de año
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  // Manejador de cambio de año para comunidades
  const handleCommunityYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCommunityYear(parseInt(e.target.value));
  };

  // Manejadores de cambio de sector separados
  const handleMapSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMapSector(e.target.value);
  };
  
  const handleTimelineSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimelineSector(e.target.value);
  };

  const handleCommunitySectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCommunitySector(e.target.value);
  };

  const handleCommunityTimelineSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCommunityTimelineSector(e.target.value);
  };

  // Manejador para el cambio de país en la subsección "Timeline Evolution by Sectors"
  const handleSectorTimelineCountryChange = (country: CountryOption) => {
    setSelectedSectorTimelineCountry(country);
  };

  // Componente para título de sección
  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-xl font-bold mb-6 mt-0 text-blue-800 border-b border-blue-100 pb-2">
      {title}
    </h2>
  );

  // Componente para título de subsección
  const SubsectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-md font-semibold mb-4 mt-8 text-blue-700 pl-2 border-l-4 border-blue-200">
      {title}
    </h3>
  );

  // Componente para título de subsección con bandera (para Timeline Evolution by Sectors)
  const SubsectionTitleWithFlag = ({ 
    baseTitle, 
    country, 
    language 
  }: { 
    baseTitle: string; 
    country: CountryOption; 
    language: 'es' | 'en';
  }) => {
    return (
      <div className="flex items-center mb-4 mt-8">
        <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
        <h3 className="text-md font-semibold text-blue-700 flex items-center">
          <span>{baseTitle}</span>
          <span className="mx-3 text-blue-400">•</span>
          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <span className="text-sm font-medium text-blue-800">
              {language === 'es' ? country.localName : country.name}
            </span>
          </div>
        </h3>
      </div>
    );
  };

  // Componente para título de subsección con sector (para mostrar el sector seleccionado)
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
        <h3 className="text-md font-semibold text-blue-700 flex items-center">
          <span>{baseTitle}</span>
          <span className="mx-3 text-blue-400">•</span>
          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <span className="text-sm font-medium text-blue-800">
              {getSectorDisplayName(sector, language)}
            </span>
          </div>
        </h3>
      </div>
    );
  };

  // Función para obtener el nombre del sector para mostrar
  const getSectorDisplayName = (sector: string, language: 'es' | 'en'): string => {
    switch(sector) {
      case 'total':
        return language === 'es' ? 'Todos los sectores' : 'All sectors';
      case 'business':
        return language === 'es' ? 'Sector empresarial' : 'Business enterprise sector';
      case 'government':
        return language === 'es' ? 'Administración Pública' : 'Government sector';
      case 'education':
        return language === 'es' ? 'Enseñanza Superior' : 'Higher education sector';
      case 'nonprofit':
        return language === 'es' ? 'Instituciones Privadas sin Fines de Lucro' : 'Private non-profit sector';
      default:
        return sector;
    }
  };

  // Textos localizados
  const texts = {
    es: {
      yearLabel: "Año:",
      sectorLabel: "Sector:",
      loadingData: "Cargando datos...",
      errorLoading: "Error al cargar los datos",
      totalSector: "Todos los sectores",
      businessSector: "Sector empresarial",
      governmentSector: "Administración Pública",
      educationSector: "Enseñanza Superior",
      nonprofitSector: "Instituciones Privadas sin Fines de Lucro",
      timelineTitle: "Evolución temporal de investigadores",
      sectorTimelineTitle: "Evolución temporal por sectores",
      communitySectorTimelineTitle: "Evolución sectorial por comunidades autónomas"
    },
    en: {
      yearLabel: "Year:",
      sectorLabel: "Sector:",
      loadingData: "Loading data...",
      errorLoading: "Error loading data",
      totalSector: "All sectors",
      businessSector: "Business enterprise sector",
      governmentSector: "Government sector",
      educationSector: "Higher education sector",
      nonprofitSector: "Private non-profit sector",
      timelineTitle: "Researchers Timeline Evolution",
      sectorTimelineTitle: "Timeline Evolution by Sectors",
      communitySectorTimelineTitle: "Sectoral Evolution by Autonomous Communities"
    }
  };

  const t = texts[language];
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 pt-3 pb-6 w-full min-h-[700px]">
      {/* Sección 1: Key Metrics */}
      <div className="mb-12 mt-[-15px]">
        <SectionTitle title={language === 'es' ? "Métricas clave" : "Key Metrics"} />
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
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Indicadores de investigación" : "Research Indicators"} />
          <ResearchersKeyMetrics
            researchersData={researchersData}
            communityData={researchersCommunityData}
            selectedYear={selectedKeyYear}
            language={language}
            isLoading={isLoading}
            isCommunityLoading={isCommunityLoading}
          />
        </div>
      </div>
      
      {/* Sección 2: Comparación entre la UE y países */}
      <div className="mb-12">
        <SectionTitle title={language === 'es' ? "Comparación entre la UE y países" : "EU and Countries Comparison"} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Investigadores por país" : "Researchers by Country"} />
          
          {/* Descripción del dataset */}
          <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p>
              {language === 'es' 
                ? "Número de investigadores (profesionales dedicados a la concepción/creación de nuevos conocimientos, productos, procesos, métodos y sistemas, y en la gestión de los proyectos relacionados), por sector de ejecución (empresas, gobierno, educación superior, instituciones privadas sin fines de lucro). Los datos de recuento (HC) miden el número total de investigadores que trabajan principal o parcialmente en I+D."
                : "Number of researchers (professionals engaged in the conception/creation of new knowledge, products, processes, methods and systems, and in the management of the projects concerned), by sector of performance (business, government, higher education, private non profit). Head count (HC) data measure the total number of researchers who are mainly or partly employed on R&D."
              }
            </p>
            <p className="mt-2 text-xs italic">
              {language === 'es' 
                ? "Fuente: Eurostat"
                : "Source: Eurostat"
              }
            </p>
          </div>
          
          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loadingData}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">{error}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg w-full">
              {/* Filtros - Mejorados para móvil */}
              <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto">
                    <label className="mb-1 sm:mb-0 sm:mr-2 text-sm font-medium text-gray-700">{t.yearLabel}</label>
                    <select 
                      value={selectedYear}
                      onChange={handleYearChange}
                      className="rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto min-w-[120px]"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto">
                    <label className="mb-1 sm:mb-0 sm:mr-2 text-sm font-medium text-gray-700">{t.sectorLabel}</label>
                    <select 
                      value={mapSector}
                      onChange={handleMapSectorChange}
                      className="rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto min-w-[180px]"
                    >
                      <option value="total">{t.totalSector}</option>
                      <option value="business">{t.businessSector}</option>
                      <option value="government">{t.governmentSector}</option>
                      <option value="education">{t.educationSector}</option>
                      <option value="nonprofit">{t.nonprofitSector}</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Contenedor flexible para el mapa y el gráfico - Mejorado para móvil */}
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Mapa de Europa */}
                <div className="w-full lg:w-1/2 min-h-[350px] sm:min-h-[400px] lg:min-h-[450px] bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4">
                  <div className="w-full h-full">
                    <ResearchersEuropeanMap
                      data={researchersData}
                      selectedYear={selectedYear}
                      selectedSector={mapSectorToCode(mapSector)}
                      language={language}
                    />
                  </div>
                </div>
                
                {/* Gráfico de ranking */}
                <div className="w-full lg:w-1/2 min-h-[350px] sm:min-h-[400px] lg:min-h-[450px] bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4">
                  <ResearcherRankingChart
                    data={researchersData}
                    selectedYear={selectedYear}
                    language={language}
                    selectedSector={mapSectorToCode(mapSector)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Nueva subsección: Evolución temporal */}
        <div className="mb-8">
          <SubsectionTitleWithSector
            baseTitle={t.timelineTitle}
            sector={timelineSector}
            language={language}
          />
          
          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loadingData}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">{error}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg w-full">
              {/* Filtros para la timeline */}
              <div className="mb-4 flex flex-wrap gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <label className="mr-2 text-sm font-medium text-gray-700">{t.sectorLabel}</label>
                  <select 
                    value={timelineSector}
                    onChange={handleTimelineSectorChange}
                    className="rounded-md border border-gray-300 shadow-sm py-1 px-3 bg-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="total">{t.totalSector}</option>
                    <option value="business">{t.businessSector}</option>
                    <option value="government">{t.governmentSector}</option>
                    <option value="education">{t.educationSector}</option>
                    <option value="nonprofit">{t.nonprofitSector}</option>
                  </select>
                </div>
              </div>
              
              {/* Gráfico de timeline */}
              <div className="w-full min-h-[450px] bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <ResearchersTimelineChart
                  data={researchersData}
                  language={language}
                  selectedSector={mapSectorToCode(timelineSector)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Nueva subsección: Evolución por sectores */}
        <div className="mb-8">
          <SubsectionTitleWithFlag
            baseTitle={t.sectorTimelineTitle}
            country={selectedSectorTimelineCountry}
            language={language}
          />
          
          {isLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loadingData}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">{error}</p>
              </div>
            </div>
          ) : (
            <ResearchersBySectorChart
              data={researchersData}
              language={language}
              countryCode={selectedSectorTimelineCountry.code}
              onCountryChange={handleSectorTimelineCountryChange}
            />          )}        </div>      </div>            {/* Sección 3: Análisis por comunidades autónomas de España */}      <div className="mb-6">        <SectionTitle title={language === 'es' ? "Análisis por comunidades autónomas españolas" : "Analysis by Spanish Autonomous Communities"} />        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Distribución regional de investigadores" : "Regional Distribution of Researchers"} />
          
          {/* Descripción del dataset */}
          <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="mb-2">
              <strong>
                {language === 'es' 
                  ? 'Descripción de los datos:' 
                  : 'Data description:'}
              </strong>
            </p>
            <p>
              {language === 'es'
                ? 'Personal empleado en actividades de I+D en EJC según sexos y sectores de ejecución. Resultados basados en Empresa Estadística. España y comunidades autónomas por años en Investigadores empleados en actividades de I+D, en equivalencia a jornada completa (EJC).'
                : 'Personnel employed in R&D activities in FTE by gender and performance sectors. Results based on Statistical Enterprise. Spain and autonomous communities by years in Researchers employed in R&D activities, in full-time equivalent (FTE).'}
            </p>
          </div>
          
          {isCommunityLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[400px] flex items-center justify-center w-full">
              <div className="text-center text-gray-600">
                <div className="w-12 h-12 border-2 border-t-4 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p>{t.loadingData}</p>
              </div>
            </div>
          ) : communityError ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[400px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">{communityError}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Controles para filtrar datos */}
              <div className="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <label className="mr-2 text-sm font-medium text-gray-700">{t.yearLabel}</label>
                  <select 
                    value={selectedCommunityYear}
                    onChange={handleCommunityYearChange}
                    className="rounded-md border border-gray-300 shadow-sm py-1 px-3 bg-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableCommunityYears.map((year) => (
                      <option key={`community-year-${year}`} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="mr-2 text-sm font-medium text-gray-700">{t.sectorLabel}</label>
                  <select 
                    value={communitySector}
                    onChange={handleCommunitySectorChange}
                    className="rounded-md border border-gray-300 shadow-sm py-1 px-3 bg-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="total">{t.totalSector}</option>
                    <option value="business">{t.businessSector}</option>
                    <option value="government">{t.governmentSector}</option>
                    <option value="education">{t.educationSector}</option>
                    <option value="nonprofit">{t.nonprofitSector}</option>
                  </select>
                </div>
              </div>
              
              {/* Contenedor flexible para el mapa y el ranking */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Mapa de Comunidades Autónomas */}
                <div className="w-full lg:w-1/2 min-h-[450px] bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <ResearchersSpanishRegionsMap
                    data={researchersCommunityData}
                    selectedYear={selectedCommunityYear}
                    selectedSector={mapSectorToCode(communitySector)}
                    language={language}
                  />
                </div>
                
                {/* Ranking de Comunidades Autónomas */}
                <div className="w-full lg:w-1/2 min-h-[450px] bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <ResearchersCommunityRankingChart
                    data={researchersCommunityData}
                    selectedYear={selectedCommunityYear}
                    selectedSector={mapSectorToCode(communitySector)}
                    language={language}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Nueva subsección: Evolución por comunidades */}
        <div className="mb-8">
          <SubsectionTitleWithSector
            baseTitle={language === 'es' ? "Evolución por comunidades autónomas" : "Evolution by Autonomous Communities"}
            sector={communityTimelineSector}
            language={language}
          />
          
          {isCommunityLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loadingData}</p>
              </div>
            </div>
          ) : communityError ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">{communityError}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg w-full">
              {/* Filtros para la evolución por comunidades */}
              <div className="mb-4 flex flex-wrap gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <label className="mr-2 text-sm font-medium text-gray-700">{t.sectorLabel}</label>
                  <select 
                    value={communityTimelineSector}
                    onChange={handleCommunityTimelineSectorChange}
                    className="rounded-md border border-gray-300 shadow-sm py-1 px-3 bg-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="total">{t.totalSector}</option>
                    <option value="business">{t.businessSector}</option>
                    <option value="government">{t.governmentSector}</option>
                    <option value="education">{t.educationSector}</option>
                    <option value="nonprofit">{t.nonprofitSector}</option>
                  </select>
                </div>
              </div>
              
              {/* Componente de evolución por comunidades */}
              <div className="w-full min-h-[450px] bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <ResearchersCommunitiesTimelineChart
                  data={researchersCommunityData}
                  language={language}
                  selectedSector={mapSectorToCode(communityTimelineSector)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Nueva subsección: Evolución sectorial por comunidades autónomas */}
        <div className="mb-8">
          <SubsectionTitle title={t.communitySectorTimelineTitle} />
          
          {isCommunityLoading ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loadingData}</p>
              </div>
            </div>
          ) : communityError ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">{communityError}</p>
              </div>
            </div>
          ) : (
            <ResearchersCommunitiesBySectorChart
              data={researchersCommunityData}
              language={language}
              defaultCommunity="Canarias"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Researchers;