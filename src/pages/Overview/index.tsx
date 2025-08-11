import React, { useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface OverviewProps {
  language?: 'es' | 'en';
}

const Overview: React.FC<OverviewProps> = (props) => {
  // Usar el language de props si está disponible, o del contexto si no
  const contextLanguage = useLanguage();
  const language = props.language || contextLanguage.language;

  // Efecto para animación de entrada
  useEffect(() => {
    const sections = document.querySelectorAll('.animate-section');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    sections.forEach(section => {
      observer.observe(section);
    });

    return () => {
      sections.forEach(section => {
        observer.unobserve(section);
      });
    };
  }, []);

  // Componente para título de sección
  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-lg font-bold mb-4 mt-2 text-blue-800 pb-2 border-b-2 border-blue-200 flex items-center group">
      <span className="inline-block w-1.5 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-sm mr-2.5 group-hover:w-2 transition-all duration-300"></span>
      <span className="relative">
        {title}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
      </span>
    </h2>
  );

  // Objeto de textos para manejar la traducción
  const texts = {
    es: {
      pageTitle: "Reporte de Métricas de I+D para EMERGE",
      aboutEmerge: "Sobre EMERGE",
      emergeDescription1: "La Asociación Canaria de Startups, Empresas de Base Tecnológica e Inversores Ángeles (EMERGE) es una organización sin ánimo de lucro constituida en marzo de 2015 por iniciativa de emprendedores tecnológicos canarios. EMERGE tiene como objetivo primordial la creación de empresas innovadoras de base tecnológica de rápido crecimiento o startups.",
      emergeDescription2: "EMERGE es un agente facilitador del ecosistema de emprendimiento e innovación de Canarias que trabaja hacia un modelo de desarrollo económico sostenible e inclusivo basado en el talento, en la diversificación de recursos y en las oportunidades que ofrece la economía del conocimiento.",
      emergeTeam: "La organización está compuesta por una Junta Directiva formada por empresas o emprendedores de base tecnológica e inversores ángeles, y un equipo técnico encargado de la gestión diaria de la Asociación y de los proyectos que desarrolla, compuesto por un Director-Gerente, Responsable de Innovación y Responsable de Administración. EMERGE dispone además de un equipo de voluntarios especializado en distintas áreas (Digital Economy, Talent & International Networks; Innovation, Technology and Environment; Global Business, Entrepreneurship, Programming) y una extensa red internacional de mentores y expertos que colaboran de forma activa en los proyectos.",
      emergeSpaces: "EMERGE gestiona dos espacios de innovación de referencia en Las Palmas de Gran Canaria:",
      marineTitle: "Marine Park:",
      marineDesc: "Orientado a tecnologías marinas y marítimas, ubicado en la Playa de las Alcaravaneras tras la cesión de un local por parte del Ayuntamiento de Las Palmas GC.",
      paletexpressTitle: "Paletexpress-Cajasiete:",
      paletexpressDesc: "Marca refundada tras la reapertura de Paletexpress en las instalaciones de la Sociedad para el Desarrollo Económico de Canarias (SODECAN) del Gobierno de Canarias con el patrocinio de la institución financiera Cajasiete.",
      emergeObjectives: "Los objetivos de la Asociación están ligados a la creación de un tejido productivo competitivo y a la atracción de inversión y talento a las islas, en colaboración con instituciones públicas y privadas, pero siempre con el emprendedor en el centro de la acción. EMERGE está fuertemente comprometida con el desarrollo económico e inclusivo de la región y con los Objetivos de Desarrollo Sostenible de Naciones Unidas.",
      reportPurpose: "Propósito de este Observatorio",
      purposeDescription1: "Este observatorio presenta un análisis comparativo e histórico de los principales indicadores de Investigación, Desarrollo e Innovación (I+D+i) en las Islas Canarias, posicionándolos en el contexto español y europeo.",
      purposeDescription2: "A través de datos oficiales actualizados y visualizaciones interactivas, este observatorio permite:",
      purposeList1: "Comparar la posición de Canarias con otras comunidades autónomas españolas y países europeos",
      purposeList2: "Analizar la evolución temporal de los indicadores clave de I+D+i",
      purposeList3: "Identificar fortalezas y oportunidades de mejora en el ecosistema innovador canario",
      purposeList4: "Acceder a datos actualizados para la toma de decisiones informadas",
      reportContent: "Indicadores Disponibles",
      contentDescription: "El observatorio estructura la información en torno a tres dimensiones fundamentales del ecosistema de I+D+i:",
      investmentTitle: "Inversión en I+D",
      investmentDescription: "Analiza el esfuerzo financiero dedicado a actividades de I+D como porcentaje del Producto Interior Bruto. Incluye comparativas temporales desde 2010 hasta 2022, distribución por sectores (empresas, administración pública, enseñanza superior e instituciones privadas sin fines de lucro) y posicionamiento de Canarias respecto a España, UE27 y países líderes como Alemania y Países Bajos.",
      researchersTitle: "Capital Humano Investigador",
      researchersDescription: "Examina el personal dedicado a I+D medido en equivalencia a tiempo completo (ETC) por cada mil habitantes de la población activa. Los datos abarcan desde 2010 hasta 2022, con desagregación sectorial y análisis comparativo territorial que permite evaluar la capacidad investigadora de Canarias en el contexto nacional e internacional.",
      patentsTitle: "Actividad de Patentamiento",
      patentsDescription: "Evalúa la capacidad innovadora a través de dos fuentes complementarias: solicitudes ante la Oficina Europea de Patentes (EPO) por país/región, y registros del sistema español de patentes con desagregación por comunidades autónomas. Incluye análisis temporal, comparativas territoriales y métricas tanto absolutas como relativas a la población.",
      additionalFeatures: "El observatorio ofrece funcionalidades interactivas como filtros temporales, selección de territorios, cambio de unidades de medida (valores absolutos/relativos) y alternancia entre español e inglés. Todas las visualizaciones permiten exploración detallada de los datos de interés.",
      updateInfo: "Los datos se actualizan periódicamente según la disponibilidad de nuevas estadísticas oficiales de Eurostat, INE, ISTAC y otras fuentes institucionales.",
      dataSources: "Fuentes de Datos", 
      eurostat: "Eurostat",
      eurodescription: "Oficina Europea de Estadística, que proporciona datos oficiales a nivel europeo.",
      ine: "INE",
      inedescription: "Instituto Nacional de Estadística de España, fuente oficial de datos estadísticos a nivel nacional.",
      istac: "ISTAC",
      istacdescription: "Instituto Canario de Estadística, que ofrece datos específicos para las Islas Canarias.",
      exploreData: "Explorar Datos",
      investmentLink: "Ver análisis de inversión en I+D",
      researchersLink: "Explorar datos sobre investigadores",
      patentsLink: "Analizar registros de patentes"
    },
    en: {
      pageTitle: "R&D Metrics Observatory for EMERGE",
      aboutEmerge: "About EMERGE",
      emergeDescription1: "The Canary Islands Association of Startups, Technology-Based Companies and Angel Investors (EMERGE) is a non-profit organization established in March 2015 by Canarian technology entrepreneurs. EMERGE's primary objective is the creation of fast-growing innovative technology-based companies or startups.",
      emergeDescription2: "EMERGE is a facilitating agent of the Canary Islands' entrepreneurship and innovation ecosystem that works towards a sustainable and inclusive economic development model based on talent, resource diversification, and the opportunities offered by the knowledge economy.",
      emergeTeam: "The organization consists of a Board of Directors formed by technology-based companies or entrepreneurs and angel investors, and a technical team responsible for the daily management of the Association and the projects it develops, composed of a Director-Manager, Head of Innovation, and Head of Administration. EMERGE also has a team of volunteers specialized in different areas (Digital Economy, Talent & International Networks; Innovation, Technology and Environment; Global Business, Entrepreneurship, Programming) and an extensive international network of mentors and experts who actively collaborate on projects.",
      emergeSpaces: "EMERGE manages two leading innovation spaces in Las Palmas de Gran Canaria:",
      marineTitle: "Marine Park:",
      marineDesc: "Focused on marine and maritime technologies, located at Las Alcaravaneras Beach after the assignment of premises by the Las Palmas GC City Council.",
      paletexpressTitle: "Paletexpress-Cajasiete:",
      paletexpressDesc: "Brand refounded after the reopening of Paletexpress in the facilities of the Society for the Economic Development of the Canary Islands (SODECAN) of the Canary Islands Government with the sponsorship of the financial institution Cajasiete.",
      emergeObjectives: "The Association's objectives are linked to creating a competitive productive fabric and attracting investment and talent to the islands, in collaboration with public and private institutions, but always with the entrepreneur at the center of the action. EMERGE is strongly committed to the economic and inclusive development of the region and to the United Nations Sustainable Development Goals.",
      reportPurpose: "Purpose of this Observatory",
      purposeDescription1: "This observatory presents a comparative and historical analysis of the main Research, Development and Innovation (R&D&I) indicators in the Canary Islands, positioning them within the Spanish and European context.",
      purposeDescription2: "Through updated official data and interactive visualizations, this observatory enables users to:",
      purposeList1: "Compare the position of the Canary Islands with other Spanish autonomous communities and European countries",
      purposeList2: "Analyze the temporal evolution of key R&D&I indicators",
      purposeList3: "Identify strengths and improvement opportunities in the Canarian innovation ecosystem",
      purposeList4: "Access updated data for informed decision-making",
      reportContent: "Available Indicators",
      contentDescription: "The observatory structures information around three fundamental dimensions of the R&D&I ecosystem:",
      investmentTitle: "R&D Investment",
      investmentDescription: "Analyzes the financial effort dedicated to R&D activities as a percentage of Gross Domestic Product. Includes temporal comparisons from 2010 to 2022, sectoral distribution (business enterprise, government, higher education and private non-profit institutions) and positioning of the Canary Islands with respect to Spain, EU27 and leading countries such as Germany and the Netherlands.",
      researchersTitle: "Research Human Capital",
      researchersDescription: "Examines personnel dedicated to R&D measured in full-time equivalent (FTE) per thousand inhabitants of the active population. Data spans from 2010 to 2022, with sectoral breakdown and territorial comparative analysis that enables evaluation of the research capacity of the Canary Islands within the national and international context.",
      patentsTitle: "Patent Activity",
      patentsDescription: "Evaluates innovative capacity through two complementary sources: applications to the European Patent Office (EPO) by country/region, and records from the Spanish patent system with breakdown by autonomous communities. Includes temporal analysis, territorial comparisons and both absolute and population-relative metrics.",
      additionalFeatures: "The observatory offers interactive functionalities such as temporal filters, territory selection, measurement unit changes (absolute/relative values) and language switching between Spanish and English. All visualizations allow detailed exploration of data of interest.",
      updateInfo: "Data is updated periodically according to the availability of new official statistics from Eurostat, INE, ISTAC and other institutional sources.",
      dataSources: "Data Sources", 
      eurostat: "Eurostat",
      eurodescription: "European Statistical Office, which provides official data at the European level.",
      ine: "INE",
      inedescription: "National Institute of Statistics of Spain, official source of statistical data at the national level.",
      istac: "ISTAC",
      istacdescription: "Canary Islands Institute of Statistics, which provides specific data for the Canary Islands.",
      exploreData: "Explore Data",
      investmentLink: "View R&D investment analysis",
      researchersLink: "Explore researcher data",
      patentsLink: "Analyze patent records"
    }
  };

  // Acceso a los textos según el idioma
  const t = (key: keyof typeof texts.es) => {
    if (language === 'es') {
      return texts.es[key];
    }
    return texts.en[key];
  };
  
  return (
    <div className="bg-white rounded-lg p-5 pt-3 pb-6 w-full min-h-[700px] overflow-y-auto">
      {/* Contenedor principal */}
      <div className="max-w-full mx-auto">
        {/* Sección Sobre EMERGE */}
        <div className="mb-8 bg-white p-5 rounded-lg border border-gray-200 animate-section opacity-0 translate-y-4 transition-all duration-700">
          <SectionTitle title={t('aboutEmerge')} />
          
          <div className="prose prose-blue max-w-none">
            <div className="mb-4 text-gray-700 leading-relaxed">
              <p className="mb-3 text-base">{t('emergeDescription1')}</p>
              <p className="text-base">{t('emergeDescription2')}</p>
            </div>
            
            <div className="mb-4 text-gray-700 leading-relaxed">
              <p className="mb-3 text-base">{t('emergeTeam')}</p>
              <div className="flex items-center my-3 text-blue-800 ml-2">
                <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                <span className="font-semibold text-base">{t('emergeSpaces')}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 transition-all duration-300 group">
              <div className="font-semibold text-blue-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-base">{t('marineTitle')}</span>
              </div>
              <p className="text-gray-700 text-sm">{t('marineDesc')}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 transition-all duration-300 group">
              <div className="font-semibold text-blue-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2H4v-1h16v1h-1z" clipRule="evenodd" />
                </svg>
                <span className="text-base">{t('paletexpressTitle')}</span>
              </div>
              <p className="text-gray-700 text-sm">{t('paletexpressDesc')}</p>
            </div>
          </div>
          
          <div className="mt-3 mb-2 text-gray-700 leading-relaxed text-base p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p>{t('emergeObjectives')}</p>
          </div>
        </div>

        {/* Propósito del observatorio */}
        <div className="mb-8 animate-section opacity-0 translate-y-4 transition-all duration-700">
          <SectionTitle title={t('reportPurpose')} />
          
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <p className="mb-3 text-gray-700 leading-relaxed text-base">{t('purposeDescription1')}</p>
            <p className="mb-4 text-gray-700 leading-relaxed text-base">{t('purposeDescription2')}</p>
            
            <ul className="space-y-3 text-gray-700 mb-3">
              {[
                t('purposeList1'),
                t('purposeList2'),
                t('purposeList3'),
                t('purposeList4')
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 flex h-6 items-center">
                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <span className="ml-3 text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contenido del observatorio */}
        <div className="mb-5 animate-section opacity-0 translate-y-4 transition-all duration-700">
          <SectionTitle title={t('reportContent')} />
          
          <div className="mb-5 p-5 bg-white rounded-lg border border-gray-200">
            <p className="mb-6 text-gray-700 leading-relaxed text-base">{t('contentDescription')}</p>
            
            <div className="space-y-6">
              {/* Inversión en I+D Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start mb-2">
                  <div className="flex-shrink-0 bg-blue-100 p-2.5 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-blue-800">{t('investmentTitle')}</h4>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm">{t('investmentDescription')}</p>
              </div>
              
              {/* Actividad investigadora Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start mb-2">
                  <div className="flex-shrink-0 bg-blue-100 p-2.5 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-blue-800">{t('researchersTitle')}</h4>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm">{t('researchersDescription')}</p>
              </div>
              
              {/* Producción de patentes Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start mb-2">
                  <div className="flex-shrink-0 bg-blue-100 p-2.5 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-blue-800">{t('patentsTitle')}</h4>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm">{t('patentsDescription')}</p>
              </div>
            </div>
            
            {/* Sección de fuentes de datos */}
            <div className="mt-8">
              <h3 className="text-base font-semibold mb-4 text-blue-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                {t('dataSources')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Eurostat */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-blue-800 mb-1 flex items-center text-sm">
                    <span className="inline-block w-1 h-1 bg-blue-600 rounded-full mr-2"></span>
                    {t('eurostat')}
                  </h4>
                  <p className="text-gray-700 text-xs">{t('eurodescription')}</p>
                </div>
                
                {/* INE */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-blue-800 mb-1 flex items-center text-sm">
                    <span className="inline-block w-1 h-1 bg-blue-600 rounded-full mr-2"></span>
                    {t('ine')}
                  </h4>
                  <p className="text-gray-700 text-xs">{t('inedescription')}</p>
                </div>
                
                {/* ISTAC */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-blue-800 mb-1 flex items-center text-sm">
                    <span className="inline-block w-1 h-1 bg-blue-600 rounded-full mr-2"></span>
                    {t('istac')}
                  </h4>
                  <p className="text-gray-700 text-xs">{t('istacdescription')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-700 text-sm">{t('additionalFeatures')}</p>
            </div>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-gray-700 text-sm">{t('updateInfo')}</p>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .animate-section.animated {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default Overview;