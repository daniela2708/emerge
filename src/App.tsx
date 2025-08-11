import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import './index.css'; // Asegúrate de que este archivo importa correctamente los estilos de Tailwind
import OverviewPage from './pages/Overview'; // Importar el componente de la página Overview
import Investment from './pages/Investment';
import Researchers from './pages/Researchers'; // Importar el componente de la página Researchers
import Patents from './pages/Patents'; // Importar el componente de la página Patents
import SourcesSection from './components/SourcesSection';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import i18n from './i18n/i18n';

// Definir tipos
type TabType = 'overview' | 'investment' | 'researchers' | 'patents' | 'sources';
type Language = 'es' | 'en';

const App: FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview'); // Cambiando a 'overview' para mostrar primero la visión general
  const [language, setLanguage] = useState<Language>(() => {
    const lang = i18n.language as Language;
    return (lang === 'es' || lang === 'en') ? lang : 'es';
  });
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const texts = {
    es: {
      title: "Observatorio de I+D de las Islas Canarias",
      subtitle: "Análisis comparativo e histórico de indicadores de investigación, desarrollo e innovación",
      overview: "Visión General",
      investment: "Inversión en I+D",
      researchers: "Investigadores",
      patents: "Patentes",
      patentsDescription: "Análisis de las solicitudes de patentes presentadas ante la Oficina Europea de Patentes (EPO) como indicador de la capacidad innovadora del territorio, con datos comparativos regionales y sectoriales.",
      overviewDescription: "Panorama general del ecosistema de I+D+i en las Islas Canarias con indicadores clave, contexto institucional y comparativas con el entorno español y europeo.",
      investmentDescription: "Análisis del esfuerzo financiero en I+D como porcentaje del PIB, distribución sectorial y evolución temporal comparada.",
      researchersDescription: "Capital humano dedicado a la investigación y desarrollo por sectores de actividad, con análisis territorial y evolución temporal. Datos en equivalencia a tiempo completo (ETC).",
      sources: "Fuentes de datos",
      footerText: "Desarrollado por EMERGE - Asociación Canaria de Startups",
      menu: "Menú"
    },
    en: {
      title: "Canary Islands R&D Observatory",
      subtitle: "Comparative and historical analysis of research, development and innovation indicators",
      overview: "Overview",
      investment: "R&D Investment",
      researchers: "Researchers",
      patents: "Patents",
      patentsDescription: "Analysis of patent applications filed with the European Patent Office (EPO) as an indicator of territorial innovation capacity, with regional and sectoral comparative data.",
      overviewDescription: "General overview of the R&D&I ecosystem in the Canary Islands with key indicators, institutional context and comparisons with the Spanish and European environment.",
      investmentDescription: "Analysis of financial effort in R&D as a percentage of GDP, sectoral distribution and comparative temporal evolution.",
      researchersDescription: "Human capital dedicated to research and development by activity sectors, with territorial analysis and temporal evolution. Data in full-time equivalent (FTE).",
      sources: "Data Sources",
      footerText: "Developed by EMERGE - Canary Islands Startup Association",
      menu: "Menu"
    }
  };

  const t = (key: keyof typeof texts.es) => {
    const currentTexts = texts[language];
    if (currentTexts && currentTexts[key]) {
      return currentTexts[key];
    }
    return texts.es[key] || key;
  };

  // Referencia para el contenido principal
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Efecto para desplazarse al inicio cuando cambie la pestaña activa
  useEffect(() => {
    if (contentRef.current) {
      // Desplazar el contenido al inicio
      contentRef.current.scrollTop = 0;
      // También desplazar la ventana al inicio
      window.scrollTo(0, 0);
    }
    // Cerrar menú móvil al cambiar de pestaña
    setIsMobileMenuOpen(false);
  }, [activeTab]); // Ejecutar este efecto cuando cambie activeTab

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'es' ? 'en' : 'es'));
    setShowLangDropdown(false);
  };

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col w-full">
      {/* Contenedor para elementos fijos */}
      <div className="fixed top-0 left-0 right-0 z-30 w-full">
        {/* Header con logo integrado */}
        <header className="bg-white py-3 md:py-4 px-4 md:px-6 shadow-md border-b border-gray-200 relative flex items-center justify-between w-full">
          {/* Logo en el lado izquierdo, perfectamente centrado verticalmente */}
          <div className="flex-shrink-0">
            <img src="/emerge_logo.svg" alt="EMERGE Logo" className="h-8 md:h-12" />
          </div>
          
          <div className="flex-grow text-center px-2">
            <h1 className="text-sm md:text-xl font-bold mb-0 md:mb-1" style={{ color: '#006480' }}>{t('title')}</h1>
            <p className="text-xxs md:text-xs text-gray-600 font-normal hidden sm:block">{t('subtitle')}</p>
          </div>
          
          {/* Controles del lado derecho */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Botón de menú móvil */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label={t('menu')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Selector de idioma */}
            <div className="relative">
              <button 
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="px-2 md:px-3 py-1.5 border border-gray-300 rounded-full bg-white text-gray-700 text-xs md:text-sm font-medium hover:bg-gray-50 flex items-center shadow-sm transition-all"
              >
                <svg className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-1.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                {language === 'es' ? 'ES' : 'EN'}
              </button>
              
              {showLangDropdown && (
                <div className="absolute right-0 mt-1 w-16 md:w-20 bg-white border border-gray-200 rounded shadow-md ring-1 ring-black ring-opacity-5 z-50">
                  <button 
                    onClick={toggleLanguage}
                    className="block w-full text-center px-2 py-1.5 text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors duration-150"
                  >
                    {language === 'es' ? 'EN' : 'ES'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Navigation - Desktop */}
        <nav style={{ backgroundColor: '#006480' }} className="shadow-sm w-full border-b py-0.5 hidden md:block" >
          <div className="max-w-7xl mx-auto" style={{ minWidth: "100%" }}>
            <ul className="flex pt-2 px-2 justify-center" style={{ minWidth: "100%" }}>
              <li 
                className={`cursor-pointer py-2.5 px-4 text-center transition-all duration-200 rounded-t-md flex-none w-[180px] ${activeTab === 'overview' ? 'bg-white border-l border-r border-t border-white font-medium' : 'text-white hover:bg-opacity-80'}`}
                style={{ color: activeTab === 'overview' ? '#006480' : 'white' }}
                onClick={() => setActiveTab('overview')}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <svg 
                    className={`w-5 h-5 mr-2 flex-shrink-0`}
                    style={{ color: activeTab === 'overview' ? '#006480' : 'white' }} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('overview')}</span>
                </div>
              </li>
              <li
                className={`cursor-pointer py-2.5 px-4 text-center transition-all duration-200 rounded-t-md flex-none w-[180px] mx-1 ${activeTab === 'investment' ? 'bg-white border-l border-r border-t border-white font-medium' : 'text-white hover:bg-opacity-80'}`}
                style={{ color: activeTab === 'investment' ? '#006480' : 'white' }}
                onClick={() => setActiveTab('investment')}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <svg
                    className={`w-5 h-5 mr-2 flex-shrink-0`}
                    style={{ color: activeTab === 'investment' ? '#006480' : 'white' }}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M3 17h2v-7H3v7zm4 0h2V7H7v10zm4 0h2V3h-2v14zm4 0h2v-9h-2v9zm4 0h2v-5h-2v5z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('investment')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer py-2.5 px-4 text-center transition-all duration-200 rounded-t-md flex-none w-[180px] mx-1 ${activeTab === 'researchers' ? 'bg-white border-l border-r border-t border-white font-medium' : 'text-white hover:bg-opacity-80'}`}
                style={{ color: activeTab === 'researchers' ? '#006480' : 'white' }}
                onClick={() => setActiveTab('researchers')}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <svg 
                    className={`w-5 h-5 mr-2 flex-shrink-0`}
                    style={{ color: activeTab === 'researchers' ? '#006480' : 'white' }} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('researchers')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer py-2.5 px-4 text-center transition-all duration-200 rounded-t-md flex-none w-[180px] mx-1 ${activeTab === 'patents' ? 'bg-white border-l border-r border-t border-white font-medium' : 'text-white hover:bg-opacity-80'}`}
                style={{ color: activeTab === 'patents' ? '#006480' : 'white' }}
                onClick={() => setActiveTab('patents')}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <svg 
                    className={`w-5 h-5 mr-2 flex-shrink-0`}
                    style={{ color: activeTab === 'patents' ? '#006480' : 'white' }} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('patents')}</span>
                </div>
              </li>
              <li 
                className={`cursor-pointer py-2.5 px-4 text-center transition-all duration-200 rounded-t-md flex-none w-[180px] ${activeTab === 'sources' ? 'bg-white border-l border-r border-t border-white font-medium' : 'text-white hover:bg-opacity-80'}`}
                style={{ color: activeTab === 'sources' ? '#006480' : 'white' }}
                onClick={() => setActiveTab('sources')}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                  <svg 
                    className={`w-5 h-5 mr-2 flex-shrink-0`}
                    style={{ color: activeTab === 'sources' ? '#006480' : 'white' }} 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('sources')}</span>
                </div>
              </li>
            </ul>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 shadow-lg z-40">
            <nav className="px-4 py-2">
              <div className="space-y-1">
                {(['overview', 'investment', 'researchers', 'patents', 'sources'] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center ${
                      activeTab === tab 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm">{t(tab)}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Content - con margen superior para evitar que quede debajo de los elementos fijos */}
      <div ref={contentRef} className="pt-20 md:pt-32 max-w-7xl mx-auto px-3 md:px-6 pb-6 flex-grow w-full">
        {activeTab === 'overview' && (
          <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-lg shadow-md p-3 md:p-6 border border-gray-100 min-h-[500px] md:min-h-[700px] w-full flex-grow flex flex-col transition-all duration-300" style={{ width: "100%", minWidth: "100%" }}>
            <div className="flex items-center mb-4 md:mb-6">
              <svg className="w-5 md:w-6 h-5 md:h-6 text-blue-600 mr-2 md:mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                {t('overview')}
              </h2>
            </div>
            
            <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Componente de la página Overview */}
              <OverviewPage language={language} />
            </div>
          </div>
        )}
        
        {activeTab === 'investment' && (
          <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-lg shadow-md p-3 md:p-6 border border-gray-100 min-h-[500px] md:min-h-[700px] w-full flex-grow flex flex-col transition-all duration-300" style={{ width: "100%", minWidth: "100%" }}>
            <div className="flex items-center mb-4 md:mb-6">
              <svg
                className="w-5 md:w-6 h-5 md:h-6 text-blue-600 mr-2 md:mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 17h2v-7H3v7zm4 0h2V7H7v10zm4 0h2V3h-2v14zm4 0h2v-9h-2v9zm4 0h2v-5h-2v5z" />
              </svg>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                {t('investment')}
              </h2>
            </div>
            
            <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Componente modular para la sección de Inversión */}
              <Investment language={language} />
            </div>
          </div>
        )}
        
        {activeTab === 'researchers' && (
          <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-lg shadow-md p-3 md:p-6 border border-gray-100 min-h-[500px] md:min-h-[700px] w-full flex-grow flex flex-col transition-all duration-300" style={{ width: "100%", minWidth: "100%" }}>
            <div className="flex items-center mb-4 md:mb-6">
              <svg className="w-5 md:w-6 h-5 md:h-6 text-blue-600 mr-2 md:mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                {t('researchers')}
              </h2>
            </div>
            
            <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Componente de la página Researchers */}
              <Researchers language={language} />
            </div>
          </div>
        )}
        
        {activeTab === 'patents' && (
          <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-lg shadow-md p-3 md:p-6 border border-gray-100 min-h-[500px] md:min-h-[700px] w-full flex-grow flex flex-col transition-all duration-300" style={{ width: "100%", minWidth: "100%" }}>
            <div className="flex items-center mb-4 md:mb-6">
              <svg className="w-5 md:w-6 h-5 md:h-6 text-blue-600 mr-2 md:mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                {t('patents')}
              </h2>
            </div>
            
            {/* Anuncio sobre diferencias entre fuentes de datos */}
            <div className="mb-4 md:mb-6 text-xs md:text-sm bg-yellow-50 p-3 md:p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start">
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
                  className="text-yellow-600 mr-2 md:mr-3 mt-0.5 flex-shrink-0 md:w-5 md:h-5"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <path d="M12 9v4"/>
                  <path d="m12 17 .01 0"/>
                </svg>
                <div className="text-yellow-800">
                  <p className="font-medium mb-1 md:mb-2">
                    {language === 'es' 
                      ? "Importante: Diferencias entre fuentes de datos"
                      : "Important: Differences between data sources"
                    }
                  </p>
                  <p className="text-xxs md:text-xs leading-relaxed">
                    {language === 'es' 
                      ? "Los datos de patentes mostrados en este dashboard provienen de diferentes fuentes oficiales que utilizan metodologías y criterios de clasificación diversos. Los indicadores europeos se basan en datos de la Oficina Europea de Patentes (EPO), mientras que los datos nacionales y regionales provienen del registro español, desagregados por provincias y reagrupados por comunidades autónomas. Estas diferencias pueden resultar en variaciones entre las métricas presentadas."
                      : "The patent data shown in this dashboard comes from different official sources that use various methodologies and classification criteria. European indicators are based on data from the European Patent Office (EPO), while national and regional data comes from the Spanish registry, disaggregated by provinces and regrouped by autonomous communities. These differences may result in variations between the metrics presented."
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Componente de la página Patents */}
              <Patents language={language} />
            </div>
          </div>
        )}
        
        {activeTab === 'sources' && (
          <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-lg shadow-md p-3 md:p-6 border border-gray-100 min-h-[500px] md:min-h-[700px] w-full flex-grow flex flex-col transition-all duration-300" style={{ width: "100%", minWidth: "100%" }}>
            <div className="flex items-center mb-4 md:mb-6">
              <svg className="w-5 md:w-6 h-5 md:h-6 text-blue-600 mr-2 md:mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                {t('sources')}
              </h2>
            </div>
            
            <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Componente modular para la sección de Fuentes de Datos */}
              <SourcesSection language={language} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full bg-slate-50 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="text-center">
            <p className="text-xs md:text-sm text-gray-600">
              © {new Date().getFullYear()} EMERGE - {language === 'es' ? 'Todos los derechos reservados' : 'All rights reserved'}
            </p>
          </div>
        </div>
      </footer>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt language={language} />
    </div>
  );
};

export default App;