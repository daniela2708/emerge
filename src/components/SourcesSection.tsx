import React, { useState, useEffect, useRef } from 'react';

interface SourcesSectionProps {
  language: 'es' | 'en';
}

type SubTabType = 'all' | 'investment' | 'researchers' | 'patents';

const SourcesSection: React.FC<SourcesSectionProps> = ({ language }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Estilos CSS en línea para asegurar que el scroll horizontal funcione bien
  const scrollTabsStyle = {
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
    WebkitScrollbar: {
      display: 'none'
    }
  };

  // Textos en español e inglés
  const texts = {
    es: {
      title: "Fuentes de Datos",
      description: "El Observatorio de I+D en las Islas Canarias utiliza datos oficiales de diversas fuentes para garantizar la fiabilidad y verificabilidad de la información presentada.",
      
      // Sub-tabs
      allTab: "Todos los Datasets",
      investmentTab: "Inversión en I+D",
      researchersTab: "Investigadores",
      patentsTab: "Patentes",
      
      // Investment sources
      europeanInvestment: "Inversión en I+D en Europa",
      europeanInvestmentDesc: "Datos sobre el porcentaje del PIB invertido en actividades de I+D en países europeos.",
      europeanGDP: "Producto Interior Bruto en Europa",
      europeanGDPDesc: "Datos sobre el PIB a precios corrientes en países europeos, utilizados para calcular la inversión aproximada en I+D en millones de euros.",
      spanishGDP: "Producto Interior Bruto en España",
      spanishGDPDesc: "Datos sobre el PIB en comunidades y ciudades autónomas de España.",
      rdSpending: "Gasto en I+D en España y comunidades autónomas",
      rdSpendingDesc: "Datos sobre el gasto en actividades de I+D por sectores en España y las comunidades autónomas.",
      rdSpendingRecent: "Periodo 2021-2023",
      rdSpendingHistorical: "Datos históricos (2007-2020)",
      
      // Researchers sources
      europeanResearchers: "Investigadores en Europa",
      europeanResearchersDesc: "Datos sobre el personal dedicado a la investigación en países europeos.",
      spanishResearchers: "Investigadores en España y comunidades autónomas",
      spanishResearchersDesc: "Datos sobre el personal dedicado a la investigación en España y sus comunidades autónomas.",
      
      // Patents sources
      europeanPatents: "Patentes en Europa",
      europeanPatentsDesc: "Datos sobre las patentes registradas en países europeos.",
      spanishPatents: "Patentes en España",
      spanishPatentsDesc: "Datos sobre la evolución de solicitudes de patentes nacionales en España.",
      
      accessData: "Acceder a los datos",
      attribution: "Todos los datos utilizados en este observatorio son de acceso público y han sido obtenidos de fuentes oficiales."
    },
    en: {
      title: "Data Sources",
      description: "The R&D Observatory of the Canary Islands uses official data from various sources to ensure the reliability and verifiability of the information presented.",
      
      // Sub-tabs
      allTab: "All Datasets",
      investmentTab: "R&D Investment",
      researchersTab: "Researchers",
      patentsTab: "Patents",
      
      // Investment sources
      europeanInvestment: "R&D Investment in Europe",
      europeanInvestmentDesc: "Data on the percentage of GDP invested in R&D activities in European countries.",
      europeanGDP: "Gross Domestic Product in Europe",
      europeanGDPDesc: "Data on GDP at current prices in European countries, used to calculate approximate R&D investment in million euros.",
      spanishGDP: "Gross Domestic Product in Spain",
      spanishGDPDesc: "Data on GDP in Spanish autonomous communities and cities.",
      rdSpending: "R&D Spending in Spain and autonomous communities",
      rdSpendingDesc: "Data on spending on R&D activities by sectors in Spain and the autonomous communities.",
      rdSpendingRecent: "Period 2021-2023",
      rdSpendingHistorical: "Historical data (2007-2020)",
      
      // Researchers sources
      europeanResearchers: "Researchers in Europe",
      europeanResearchersDesc: "Data on research personnel in European countries.",
      spanishResearchers: "Researchers in Spain and autonomous communities",
      spanishResearchersDesc: "Data on research personnel in Spain and its autonomous communities.",
      
      // Patents sources
      europeanPatents: "Patents in Europe",
      europeanPatentsDesc: "Data on registered patents in European countries.",
      spanishPatents: "Patents in Spain",
      spanishPatentsDesc: "Data on the evolution of national patent applications in Spain.",
      
      accessData: "Access data",
      attribution: "All data used in this observatory are publicly accessible and have been obtained from official sources."
    }
  };

  const t = (key: keyof typeof texts.es) => texts[language][key];

  // Fuentes de datos organizadas por categorías
  const investmentSources = [
    {
      id: "eurostat-investment",
      title: t('europeanInvestment'),
      description: t('europeanInvestmentDesc'),
      url: "https://ec.europa.eu/eurostat/databrowser/view/tsc00001/default/table?lang=en",
      organization: "Eurostat",
      logo: "/logos/eurostat.png",
      category: "investment" as const
    },
    {
      id: "eurostat-gdp",
      title: t('europeanGDP'),
      description: t('europeanGDPDesc'),
      url: "https://ec.europa.eu/eurostat/databrowser/view/nama_10_gdp/default/table?lang=en",
      organization: "Eurostat",
      logo: "/logos/eurostat.png",
      category: "investment" as const
    },
    {
      id: "ine-gdp",
      title: t('spanishGDP'),
      description: t('spanishGDPDesc'),
      url: "https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736167628&menu=resultados&idp=1254735576581",
      organization: "INE (Instituto Nacional de Estadística)",
      logo: "/logos/ine.png",
      category: "investment" as const
    },
    {
      id: "istac-recent",
      title: `${t('rdSpending')} - ${t('rdSpendingRecent')}`,
      description: t('rdSpendingDesc'),
      url: "https://www3.gobiernodecanarias.org/istac/statistical-visualizer/visualizer/data.html?resourceType=dataset&agencyId=ISTAC&resourceId=E30057A_000002&version=~latest#visualization/table",
      organization: "ISTAC (Instituto Canario de Estadística)",
      logo: "/logos/istac.png",
      category: "investment" as const
    },
    {
      id: "istac-historical",
      title: `${t('rdSpending')} - ${t('rdSpendingHistorical')}`,
      description: t('rdSpendingDesc'),
      url: "https://www3.gobiernodecanarias.org/istac/statistical-visualizer/visualizer/data.html?resourceType=dataset&agencyId=ISTAC&resourceId=E30057A_000005&version=~latest",
      organization: "ISTAC (Instituto Canario de Estadística)",
      logo: "/logos/istac.png",
      category: "investment" as const
    }
  ];

  const researchersSources = [
    {
      id: "eurostat-researchers",
      title: t('europeanResearchers'),
      description: t('europeanResearchersDesc'),
      url: "https://ec.europa.eu/eurostat/databrowser/view/tsc00004/default/table?lang=en&category=t_scitech.t_rd",
      organization: "Eurostat",
      logo: "/logos/eurostat.png",
      category: "researchers" as const
    },
    {
      id: "istac-researchers",
      title: t('spanishResearchers'),
      description: t('spanishResearchersDesc'),
      url: "https://www3.gobiernodecanarias.org/istac/statistical-visualizer/visualizer/data.html?resourceType=dataset&agencyId=ISTAC&resourceId=E30057A_000001&version=~latest#visualization/table",
      organization: "ISTAC (Instituto Canario de Estadística)",
      logo: "/logos/istac.png",
      category: "researchers" as const
    }
  ];

  const patentsSources = [
    {
      id: "eurostat-patents",
      title: t('europeanPatents'),
      description: t('europeanPatentsDesc'),
      url: "https://ec.europa.eu/eurostat/databrowser/view/sdg_09_40/default/table?lang=en",
      organization: "Eurostat",
      logo: "/logos/eurostat.png",
      category: "patents" as const
    },
    {
      id: "oepm-patents",
      title: t('spanishPatents'),
      description: t('spanishPatentsDesc'),
      url: "https://www.oepm.es/es/sobre-OEPM/estadisticas/graficos-evolucion-mensual-de-solicitudes-nacionales/graficos-de-evolucion-de-patentes/",
      organization: "OEPM (Oficina Española de Patentes y Marcas)",
      logo: "/logos/oepm.png",
      category: "patents" as const
    }
  ];

  // Todas las fuentes combinadas
  const allSources = [...investmentSources, ...researchersSources, ...patentsSources];

  // Función para obtener las fuentes según la pestaña activa
  const getCurrentSources = () => {
    switch (activeSubTab) {
      case 'all':
        return allSources;
      case 'investment':
        return investmentSources;
      case 'researchers':
        return researchersSources;
      case 'patents':
        return patentsSources;
      default:
        return allSources;
    }
  };

  // Función para obtener el icono según la pestaña
  const getTabIcon = (tab: SubTabType) => {
    switch (tab) {
      case 'all':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
          </svg>
        );
      case 'investment':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
          </svg>
        );
      case 'researchers':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        );
      case 'patents':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        );
    }
  };

  // Función para obtener el color de la categoría
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'investment':
        return 'bg-blue-100 text-blue-800';
      case 'researchers':
        return 'bg-green-100 text-green-800';
      case 'patents':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para obtener el nombre de la categoría
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'investment':
        return language === 'es' ? 'Inversión' : 'Investment';
      case 'researchers':
        return language === 'es' ? 'Investigadores' : 'Researchers';
      case 'patents':
        return language === 'es' ? 'Patentes' : 'Patents';
      default:
        return '';
    }
  };

  // Función para obtener el nombre de la pestaña activa para el dropdown
  const getActiveTabName = () => {
    switch (activeSubTab) {
      case 'all':
        return language === 'es' ? 'Todos los Datasets' : 'All Datasets';
      case 'investment':
        return language === 'es' ? 'Inversión en I+D' : 'R&D Investment';
      case 'researchers':
        return language === 'es' ? 'Investigadores' : 'Researchers';
      case 'patents':
        return language === 'es' ? 'Patentes' : 'Patents';
      default:
        return language === 'es' ? 'Todos los Datasets' : 'All Datasets';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-h-[500px] sm:min-h-[700px]">
      {/* Introducción */}
      <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 w-full">
        <div className="flex items-start">
          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-1 sm:mb-2">
              {language === 'es' ? 'Información sobre las fuentes' : 'Information about sources'}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed">{t('description')}</p>
          </div>
        </div>
      </div>

      {/* Subpestañas */}
      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Navegación Mobile (Dropdown) */}
        <div className="sm:hidden border-b border-gray-200 bg-gray-50 p-3">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {language === 'es' ? 'Categoría:' : 'Category:'}
            </label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 text-blue-600">
                  {getTabIcon(activeSubTab)}
                </div>
                <span className="block truncate">{getActiveTabName()}</span>
              </div>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {(['all', 'investment', 'researchers', 'patents'] as SubTabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveSubTab(tab);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center ${
                      activeSubTab === tab ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <div className="w-4 h-4 mr-2">
                      {getTabIcon(tab)}
                    </div>
                    <span>
                      {tab === 'all' && (language === 'es' ? 'Todos los Datasets' : 'All Datasets')}
                      {tab === 'investment' && (language === 'es' ? 'Inversión en I+D' : 'R&D Investment')}
                      {tab === 'researchers' && (language === 'es' ? 'Investigadores' : 'Researchers')}
                      {tab === 'patents' && (language === 'es' ? 'Patentes' : 'Patents')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navegación Desktop (Tabs) */}
        <div className="hidden sm:block border-b border-gray-200 bg-gray-50">
          <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs" style={scrollTabsStyle}>
            {/* All Tab */}
            <button
              onClick={() => setActiveSubTab('all')}
              className={`group relative py-4 px-6 text-sm font-medium transition-all duration-200 flex items-center space-x-2 border-b-3 flex-shrink-0 whitespace-nowrap ${
                activeSubTab === 'all'
                  ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
              }`}
            >
              <div className="w-4 h-4">
              {getTabIcon('all')}
              </div>
              <span>{t('allTab')}</span>
            </button>

            {/* Investment Tab */}
            <button
              onClick={() => setActiveSubTab('investment')}
              className={`group relative py-4 px-6 text-sm font-medium transition-all duration-200 flex items-center space-x-2 border-b-3 flex-shrink-0 whitespace-nowrap ${
                activeSubTab === 'investment'
                  ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
              }`}
            >
              <div className="w-4 h-4">
              {getTabIcon('investment')}
              </div>
              <span>{t('investmentTab')}</span>
            </button>

            {/* Researchers Tab */}
            <button
              onClick={() => setActiveSubTab('researchers')}
              className={`group relative py-4 px-6 text-sm font-medium transition-all duration-200 flex items-center space-x-2 border-b-3 flex-shrink-0 whitespace-nowrap ${
                activeSubTab === 'researchers'
                  ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
              }`}
            >
              <div className="w-4 h-4">
              {getTabIcon('researchers')}
              </div>
              <span>{t('researchersTab')}</span>
            </button>

            {/* Patents Tab */}
            <button
              onClick={() => setActiveSubTab('patents')}
              className={`group relative py-4 px-6 text-sm font-medium transition-all duration-200 flex items-center space-x-2 border-b-3 flex-shrink-0 whitespace-nowrap ${
                activeSubTab === 'patents'
                  ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
              }`}
            >
              <div className="w-4 h-4">
              {getTabIcon('patents')}
              </div>
              <span>{t('patentsTab')}</span>
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="p-3 sm:p-6 md:p-8">
          <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full">
            {getCurrentSources().map(source => (
              <div 
                key={source.id}
                className="group bg-gradient-to-r from-white to-gray-50 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-lg hover:from-white hover:to-blue-50 hover:border-blue-200 w-full"
              >
                <div className="flex flex-col space-y-3">
                  {/* Header con título y categoria */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-grow">
                      <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 group-hover:text-blue-900 transition-colors duration-200 leading-snug">
                        {source.title}
                      </h4>
                    </div>
                      {activeSubTab === 'all' && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getCategoryColor(source.category)}`}>
                          {getCategoryName(source.category)}
                        </span>
                      )}
                    </div>
                    
                  {/* Descripción */}
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{source.description}</p>
                    
                  {/* Footer con organización y botón */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-2">
                      <div className="flex items-center">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                        <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      <p className="text-xs sm:text-sm text-gray-500">
                          <span className="font-medium text-gray-700">{source.organization}</span>
                        </p>
                      </div>
                      
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      className="group/btn inline-flex items-center justify-center px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm font-medium rounded-md sm:rounded-lg shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-md transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
                      >
                      <span className="truncate">{t('accessData')}</span>
                      <svg className="ml-1 sm:ml-1.5 w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                      </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nota de atribución */}
      <div className="text-center w-full">
        <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1.5 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs sm:text-sm text-gray-500 italic">
            {t('attribution')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SourcesSection; 