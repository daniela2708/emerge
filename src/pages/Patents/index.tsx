import React, { useState, useEffect } from 'react';
import PatentsEuropeanMap from '../../components/PatentsEuropeanMap';
import PatentsRankingChart from '../../components/PatentsRankingChart';
import PatentsRegionalChart from '../../components/PatentsRegionalChart';
import PatentsRegionalTimelineChart from '../../components/PatentsRegionalTimelineChart';
import PatentsEuropeanTimelineChart from '../../components/PatentsEuropeanTimelineChart';
import { PatentsDataTypeSelector, PatentsDisplayType } from '../../components/DataTypeSelector';
import Papa from 'papaparse';
import PatentsKPI from '../../components/PatentsKPI';

// Definir tipo para cooperation partners
export type CooperationPartnerType = 'APPL' | 'INVT';

// Definir la interfaz para los datos de patentes
interface PatentsData {
  STRUCTURE: string;
  STRUCTURE_ID: string;
  STRUCTURE_NAME: string;
  freq: string;
  'Time frequency': string;
  coop_ptn: string;
  'Cooperation partners': string;
  unit: string;
  'Unit of measure': string;
  geo: string;
  'Geopolitical entity (reporting)': string;
  TIME_PERIOD: string;
  Time: string;
  OBS_VALUE: string;
  'Observation value': string;
  OBS_FLAG?: string;
  'Observation status (Flag) V2 structure'?: string;
  CONF_STATUS?: string;
  'Confidentiality status (flag)'?: string;
  [key: string]: string | undefined;
}

// Interfaz para los datos regionales de patentes
interface RegionalData {
  'Nuts Prov': string;
  'Provincia': string;
  '2010': string;
  '2011': string;
  '2012': string;
  '2013': string;
  '2014': string;
  '2015': string;
  '2016': string;
  '2017': string;
  '2018': string;
  '2019': string;
  '2020': string;
  '2021': string;
  '2022': string;
  '2023': string;
  '2024': string;
  'SUMA': string;
  [key: string]: string | undefined;
}

interface PatentsProps {
  language?: 'es' | 'en';
}

const Patents: React.FC<PatentsProps> = (props) => {
  const language = props.language || 'es';
  
  // Estados para los filtros
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [patsDisplayType, setPatsDisplayType] = useState<PatentsDisplayType>('number');
  const [cooperationPartner, setCooperationPartner] = useState<CooperationPartnerType>('APPL');
  
  // Estados independientes para el gráfico temporal
  const [timelinePatsDisplayType, setTimelinePatsDisplayType] = useState<PatentsDisplayType>('number');
  const [timelineCooperationPartner, setTimelineCooperationPartner] = useState<CooperationPartnerType>('APPL');
  
  // Estados para los datos
  const [patentsData, setPatentsData] = useState<PatentsData[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  
  // Estados para datos regionales
  const [regionalYear, setRegionalYear] = useState<number>(2024);
  const [regionalAvailableYears, setRegionalAvailableYears] = useState<number[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Textos localizados
  const texts = {
    es: {
      title: "Patentes por País y Región",
      subtitle: "Análisis territorial del número de solicitudes de patentes presentadas",
      year: "Año",
      sector: "Sector",
      cooperationPartner: "Tipo de colaboración",
      applicant: "Solicitante",
      inventor: "Inventor",
      loading: "Cargando datos...",
      error: "Error al cargar los datos",
      
      // Títulos de las secciones
      keyMetricsTitle: "Indicadores Clave",
      euComparisonTitle: "Comparación Europea", 
      spanishRegionsTitle: "Distribución Regional en España",
      
      // Títulos de gráficas
      geographicalDistribution: "Distribución geográfica",
      chartTitle: "Evolución temporal de patentes",
      
      // Sectores
      totalSector: "Todos los sectores",
      businessSector: "Sector empresarial",
      governmentSector: "Administración Pública",
      educationSector: "Enseñanza Superior",
      nonprofitSector: "Instituciones Privadas sin Fines de Lucro"
    },
    en: {
      title: "Patents by Country and Region", 
      subtitle: "Territorial analysis of the number of patent applications filed",
      year: "Year",
      sector: "Sector", 
      cooperationPartner: "Type of collaboration",
      applicant: "Applicant",
      inventor: "Inventor",
      loading: "Loading data...",
      error: "Error loading data",
      
      // Section titles
      keyMetricsTitle: "Key Indicators",
      euComparisonTitle: "European Comparison",
      spanishRegionsTitle: "Regional Distribution in Spain",
      
      // Chart titles
      geographicalDistribution: "Geographical distribution",
      chartTitle: "Patents timeline evolution",
      
      // Sectors
      totalSector: "All sectors",
      businessSector: "Business enterprise sector",
      governmentSector: "Government sector",
      educationSector: "Higher education sector",
      nonprofitSector: "Private non-profit sector"
    }
  };

  const t = texts[language];

  // Cargar datos de patentes
  useEffect(() => {
    const loadPatentsData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('./data/patents/patentes_europa.csv');
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const csvText = await response.text();
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });

        // Convertir los datos parseados al formato que necesitamos
        const parsedData = result.data as PatentsData[];
        setPatentsData(parsedData);

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
        }

        setError(null);
      } catch (err) {
        console.error('Error loading patents data:', err);
        setError(t.error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatentsData();
  }, [t.error]);

  // Cargar datos regionales de patentes
  useEffect(() => {
    const loadRegionalData = async () => {
      try {
        const response = await fetch('./data/patents/patentes_spain.csv');
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const csvText = await response.text();
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          delimiter: ';'
        });

        const parsedRegionalData = result.data as RegionalData[];
        setRegionalData(parsedRegionalData);

        // Extraer años disponibles para datos regionales (2010-2024)
        const regionalYears = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

        setRegionalAvailableYears(regionalYears);
        
        // Establecer 2024 como año predeterminado (más reciente)
        setRegionalYear(2024);

      } catch (err) {
        console.error('Error loading regional patents data:', err);
      }
    };

    loadRegionalData();
  }, []);

  // Handlers para cambios en los filtros
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handlePatsDisplayTypeChange = (type: PatentsDisplayType) => {
    setPatsDisplayType(type);
  };

  const handleCooperationPartnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCooperationPartner(e.target.value as CooperationPartnerType);
  };

  // Handlers para la sección regional
  const handleRegionalYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegionalYear(parseInt(e.target.value));
  };

  // Handlers independientes para el gráfico temporal
  const handleTimelinePatsDisplayTypeChange = (type: PatentsDisplayType) => {
    setTimelinePatsDisplayType(type);
  };

  const handleTimelineCooperationPartnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimelineCooperationPartner(e.target.value as CooperationPartnerType);
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-xl font-bold mb-6 mt-0 text-blue-800 border-b border-blue-100 pb-2">
      {title}
    </h2>
  );

  const SubsectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-md font-semibold mb-4 mt-8 text-blue-700 pl-2 border-l-4 border-blue-200">
      {title}
    </h3>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4 pt-3 pb-6 w-full min-h-[700px]">
      {/* Sección 1: Key Metrics */}
      <div className="mb-12 mt-[-15px]">
        <SectionTitle title={t.keyMetricsTitle} />
        <div className="mb-8">
          <SubsectionTitle title={language === 'es' ? "Estadísticas de patentes" : "Patents Statistics"} />
          
          {/* Componente de KPIs de Patentes */}
          <PatentsKPI 
            europeData={patentsData}
            spainData={regionalData}
            language={language}
          />
        </div>
      </div>
      
      {/* Sección 2: Comparación entre la UE y países */}
      <div className="mb-12">
        <SectionTitle title={t.euComparisonTitle} />
        
        {/* Subsección 2.1: Patentes por país */}
        <div className="mb-10">
          <SubsectionTitle title={t.geographicalDistribution} />
          
          {/* Descripción del dataset */}
          <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="font-medium mb-2">
              {language === 'es' 
                ? "Indicador de Patentes de la Oficina Europea de Patentes (EPO)"
                : "European Patent Office (EPO) Patents Indicator"
              }
            </p>
            <p className="mb-3">
              {language === 'es' 
                ? "Este indicador mide las solicitudes de protección de una invención presentadas ante la Oficina Europea de Patentes (EPO), independientemente de si son concedidas o no. Las solicitudes se asignan según el país de residencia del primer solicitante que aparece en el formulario de solicitud (principio del primer solicitante nombrado), así como según el país de residencia del inventor."
                : "This indicator measures requests for the protection of an invention filed with the European Patent Office (EPO) regardless of whether they are granted or not. Applications are allocated according to the country of residence of the first applicant listed on the application form (first-named applicant principle) as well as according to the country of residence of the inventor."
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
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[500px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loading}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[500px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">{error}</p>
              </div>
            </div>
          ) : (
            <div className="w-full">
              {/* Filtros */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-md border border-blue-100 mb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center flex-shrink-0">
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
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                        <label className="text-gray-700 font-medium mr-2 text-sm sm:text-base whitespace-nowrap">{t.year}</label>
                      </div>
                      <select 
                        value={selectedYear}
                        onChange={handleYearChange}
                        className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base min-w-[80px]"
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center flex-shrink-0">
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
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <label className="text-gray-700 font-medium mr-2 text-sm sm:text-base whitespace-nowrap">{t.cooperationPartner}</label>
                      </div>
                      <select 
                        value={cooperationPartner}
                        onChange={handleCooperationPartnerChange}
                        className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base min-w-[120px]"
                      >
                        <option value="APPL">{t.applicant}</option>
                        <option value="INVT">{t.inventor}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-start sm:justify-end">
                    <PatentsDataTypeSelector
                      patsDisplayType={patsDisplayType}
                      onChange={handlePatsDisplayTypeChange}
                      language={language}
                    />
                  </div>
                </div>
              </div>
              
              {/* Primera fila: Mapa y Gráfica - Mejorado para móvil */}
              <div className="flex flex-col lg:flex-row gap-6 mb-8">
                {/* Mapa de Europa */}
                <div className="w-full lg:w-1/2 bg-white border border-gray-200 rounded-lg shadow-sm p-4 order-2 lg:order-1">
                  <PatentsEuropeanMap
                    data={patentsData}
                    selectedYear={selectedYear}
                    language={language}
                    patsDisplayType={patsDisplayType}
                    cooperationPartner={cooperationPartner}
                  />
                </div>

                {/* Ranking de países */}
                <div className="w-full lg:w-1/2 bg-white border border-gray-200 rounded-lg shadow-sm p-4 order-1 lg:order-2">
                  {patentsData.length > 0 ? (
                    <div className="overflow-hidden">
                      <PatentsRankingChart
                        data={patentsData}
                        selectedYear={selectedYear}
                        language={language}
                        patsDisplayType={patsDisplayType}
                        cooperationPartner={cooperationPartner}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center">
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
                        <div className="bg-gray-50 p-4 sm:p-8 rounded-lg text-center">
                          <p className="text-gray-600 text-sm sm:text-base">
                            {language === 'es' ?
                              'Gráfico de ranking disponible en el mapa europeo' :
                              'Ranking chart available in the European map'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Subsección 2.2: Evolución temporal */}
        <div className="mb-10">
          <SubsectionTitle title={t.chartTitle} />
          
          {/* Filtros independientes para el gráfico temporal */}
          <div className="bg-blue-50 p-3 sm:p-4 rounded-md border border-blue-100 mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center flex-shrink-0">
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <label className="text-gray-700 font-medium mr-2 text-sm sm:text-base whitespace-nowrap">{t.cooperationPartner}</label>
                  </div>
                  <select 
                    value={timelineCooperationPartner}
                    onChange={handleTimelineCooperationPartnerChange}
                    className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base min-w-[120px]"
                  >
                    <option value="APPL">{t.applicant}</option>
                    <option value="INVT">{t.inventor}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-start sm:justify-end">
                <PatentsDataTypeSelector
                  patsDisplayType={timelinePatsDisplayType}
                  onChange={handleTimelinePatsDisplayTypeChange}
                  language={language}
                />
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="bg-gray-50 p-4 sm:p-8 rounded-lg border border-gray-200 min-h-[300px] sm:min-h-[400px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm sm:text-lg">{t.loading}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 p-4 sm:p-8 rounded-lg border border-gray-200 min-h-[300px] sm:min-h-[400px] flex items-center justify-center w-full">
              <div className="text-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm sm:text-lg">{error}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
              <div className="h-[350px] sm:h-[450px] lg:h-[500px]">
                <PatentsEuropeanTimelineChart
                  data={patentsData}
                  language={language}
                  patsDisplayType={timelinePatsDisplayType}
                  cooperationPartner={timelineCooperationPartner}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sección 3: Comparación por comunidades autónomas de España */}
      <div className="mb-6 mt-8 sm:mt-6">
        <SectionTitle title={t.spanishRegionsTitle} />
        
        {/* Subsección 3.1: Distribución regional */}
        <div className="mb-8">
          {/* Descripción del dataset */}
          <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p>
              {language === 'es' 
                ? "Distribución de patentes por comunidades autónomas de España. Los datos muestran el número de patentes registradas por provincia, agregadas a nivel de comunidad autónoma. Las patentes representan un indicador directo de la actividad innovadora y la capacidad de protección de la propiedad intelectual en cada territorio."
                : "Distribution of patents by Spanish autonomous communities. The data shows the number of patents registered by province, aggregated at the autonomous community level. Patents represent a direct indicator of innovative activity and intellectual property protection capacity in each territory."
              }
            </p>
            <p className="mt-2 text-xs italic">
              {language === 'es' 
                ? "Fuente: Dataset de patentes de España"
                : "Source: Spain patents dataset"
              }
            </p>
          </div>

          <SubsectionTitle title={t.geographicalDistribution} />
          
          {regionalData.length > 0 ? (
            <div className="w-full">
              {/* Filtros para la sección regional */}
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="flex items-center flex-shrink-0">
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
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                      <label className="text-gray-700 font-medium mr-2 text-sm sm:text-base whitespace-nowrap">{t.year}</label>
                    </div>
                    <select 
                      value={regionalYear}
                      onChange={handleRegionalYearChange}
                      className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base min-w-[80px]"
                    >
                      {regionalAvailableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Gráfico regional */}
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
                <div className="h-[360px] sm:h-[420px] lg:h-[520px]">
                  <PatentsRegionalChart
                    data={regionalData}
                    selectedYear={regionalYear}
                    language={language}
                  />
                </div>
              </div>

              {/* Timeline de evolución regional */}
              <div className="mt-6 sm:mt-8">
                <SubsectionTitle title={language === 'es' ? "Evolución temporal por comunidades autónomas" : "Timeline Evolution by Autonomous Communities"} />
                
                <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
                  <div className="h-[320px] sm:h-[400px] lg:h-[450px]">
                    <PatentsRegionalTimelineChart
                      data={regionalData}
                      language={language}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[300px] flex items-center justify-center w-full">
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">{t.loading}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patents;
