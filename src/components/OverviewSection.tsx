import React from 'react';

interface OverviewSectionProps {
  language: 'es' | 'en';
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ language }) => {
  // Textos en español e inglés
  const texts = {
    es: {
      title: "Observatorio de I+D en Canarias",
      subtitle: "Análisis comparativo e histórico de indicadores de innovación",
      summary: "Resumen Ejecutivo",
      
      // Highlights generales
      highlightTitle: "Aspectos destacados",
      highlight1: "Canarias invierte el 0.58% de su PIB en I+D, frente al 1.49% de España y el 2.22% de la UE",
      highlight2: "La inversión en I+D en Canarias ha crecido un 7.4% en el último año",
      highlight3: "El sector público lidera el esfuerzo en I+D, con una participación del 71% del total",
      
      // Secciones
      sectionsTitle: "Explora las secciones",
      
      // Inversión
      investmentTitle: "Inversión en I+D",
      investmentDesc: "Análisis de la inversión en I+D como porcentaje del PIB, comparativa con España y Europa, y distribución por sectores.",
      investmentHighlight: "Canarias destina menos de la mitad del porcentaje que España a I+D respecto al PIB",
      
      // Investigadores
      researchersTitle: "Investigadores",
      researchersDesc: "Distribución y evolución de investigadores por sectores, áreas de conocimiento y comparativa territorial.",
      researchersHighlight: "El 68% de los investigadores en Canarias pertenecen al sector público",
      
      // Patentes
      patentsTitle: "Patentes",
      patentsDesc: "Evolución y distribución sectorial de patentes registradas, con comparativas nacionales e internacionales.",
      patentsHighlight: "Las solicitudes de patentes se han incrementado un 12% en el último año",
      
      developed: "Desarrollado para EMERGE - Asociación Canaria de Startups",
      callToAction: "Selecciona una sección para explorar en detalle"
    },
    en: {
      title: "R&D Observatory of the Canary Islands",
      subtitle: "Comparative and historical analysis of innovation indicators",
      summary: "Executive Summary",
      
      // General highlights
      highlightTitle: "Key Highlights",
      highlight1: "Canary Islands invests 0.58% of its GDP in R&D, compared to 1.49% in Spain and 2.22% in the EU",
      highlight2: "R&D investment in the Canary Islands has grown 7.4% in the last year",
      highlight3: "The public sector leads the R&D effort, with a 71% share of the total",
      
      // Sections
      sectionsTitle: "Explore the sections",
      
      // Investment
      investmentTitle: "R&D Investment",
      investmentDesc: "Analysis of R&D investment as a percentage of GDP, comparison with Spain and Europe, and distribution by sectors.",
      investmentHighlight: "Canary Islands allocates less than half the percentage that Spain does to R&D relative to GDP",
      
      // Researchers
      researchersTitle: "Researchers",
      researchersDesc: "Distribution and evolution of researchers by sectors, knowledge areas, and territorial comparison.",
      researchersHighlight: "68% of researchers in the Canary Islands belong to the public sector",
      
      // Patents
      patentsTitle: "Patents",
      patentsDesc: "Evolution and sectoral distribution of registered patents, with national and international comparisons.",
      patentsHighlight: "Patent applications have increased by 12% in the last year",
      
      developed: "Developed for EMERGE - Canary Islands Startup Association",
      callToAction: "Select a section to explore in detail"
    }
  };

  const t = (key: keyof typeof texts.es) => texts[language][key];

  return (
    <div className="space-y-8">
      {/* Cabecera de resumen ejecutivo */}
      <div className="bg-gradient-to-br from-white to-dashboard-bg rounded-xl border border-dashboard-primary/10 shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-dashboard-primary mb-2">{t('summary')}</h2>
          <p className="text-gray-600 mb-6 max-w-3xl">{t('subtitle')}</p>
          
          {/* Indicadores principales en tarjetas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {/* Indicador de inversión comparativa */}
            <div className="bg-white rounded-lg shadow-sm border border-dashboard-primary/10 overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="bg-dashboard-primary/5 px-4 py-3 border-b border-dashboard-primary/10">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 text-dashboard-primary mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                  Inversión en I+D
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-3">{t('highlight1')}</p>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-10 bg-blue-100 rounded-t-sm relative flex justify-center">
                      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm" style={{ height: '26%' }}></div>
                      <span className="absolute bottom-1 text-xs font-bold text-white">0.58%</span>
                    </div>
                    <span className="text-xs font-medium mt-1 text-gray-600">Canarias</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-10 bg-red-100 rounded-t-sm relative flex justify-center">
                      <div className="absolute bottom-0 w-full bg-red-500 rounded-t-sm" style={{ height: '67%' }}></div>
                      <span className="absolute bottom-1 text-xs font-bold text-white">1.49%</span>
                    </div>
                    <span className="text-xs font-medium mt-1 text-gray-600">España</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-10 bg-indigo-100 rounded-t-sm relative flex justify-center">
                      <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-sm" style={{ height: '100%' }}></div>
                      <span className="absolute bottom-1 text-xs font-bold text-white">2.22%</span>
                    </div>
                    <span className="text-xs font-medium mt-1 text-gray-600">UE</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Indicador de crecimiento */}
            <div className="bg-white rounded-lg shadow-sm border border-dashboard-primary/10 overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="bg-dashboard-primary/5 px-4 py-3 border-b border-dashboard-primary/10">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 text-dashboard-success mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  Crecimiento
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-3">{t('highlight2')}</p>
                <div className="flex justify-center items-center">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-24 h-24" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="#ecfdf5" />
                      <path 
                        d="M50 5 A 45 45 0 0 1 95 50" 
                        stroke="#10b981" 
                        strokeWidth="10" 
                        fill="none"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-bold text-dashboard-success">+7.4%</span>
                      <span className="text-xs text-gray-500">último año</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Indicador de sectores */}
            <div className="bg-white rounded-lg shadow-sm border border-dashboard-primary/10 overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="bg-dashboard-primary/5 px-4 py-3 border-b border-dashboard-primary/10">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 text-emerge mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                  </svg>
                  Distribución
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-3">{t('highlight3')}</p>
                <div className="flex justify-center items-center">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="45" fill="#f3f4f6" />
                      <path 
                        d="M50 5 A 45 45 0 1 1 14.6 79.9" 
                        stroke="#8b5cf6" 
                        strokeWidth="10" 
                        fill="none" 
                      />
                      <path 
                        d="M50 5 A 45 45 0 0 0 14.6 79.9" 
                        stroke="#d1d5db" 
                        strokeWidth="10" 
                        fill="none" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-emerge">71%</span>
                      <span className="text-xs text-gray-500">sector público</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones del dashboard */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
          <svg className="w-5 h-5 text-dashboard-primary mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {t('sectionsTitle')}
        </h3>

        {/* Tarjetas de secciones con mejoras visuales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inversión */}
          <div className="bg-gradient-to-br from-white to-red-50 rounded-lg shadow-md border border-red-200 overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
            <div className="p-5 border-b border-red-100">
              <div className="flex items-center">
                <div className="bg-red-500 rounded-full p-2 mr-3 shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-gray-800">{t('investmentTitle')}</h4>
              </div>
              <div className="mt-4 bg-white p-3 rounded-md border border-red-200 shadow-sm">
                <p className="text-sm text-red-600 font-medium">{t('investmentHighlight')}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">{t('investmentDesc')}</p>
            </div>
          </div>

          {/* Investigadores */}
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-lg shadow-md border border-purple-200 overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
            <div className="p-5 border-b border-purple-100">
              <div className="flex items-center">
                <div className="bg-purple-500 rounded-full p-2 mr-3 shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-gray-800">{t('researchersTitle')}</h4>
              </div>
              <div className="mt-4 bg-white p-3 rounded-md border border-purple-200 shadow-sm">
                <p className="text-sm text-purple-600 font-medium">{t('researchersHighlight')}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">{t('researchersDesc')}</p>
            </div>
          </div>

          {/* Patentes */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-md border border-blue-200 overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
            <div className="p-5 border-b border-blue-100">
              <div className="flex items-center">
                <div className="bg-blue-500 rounded-full p-2 mr-3 shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-gray-800">{t('patentsTitle')}</h4>
              </div>
              <div className="mt-4 bg-white p-3 rounded-md border border-blue-200 shadow-sm">
                <p className="text-sm text-blue-600 font-medium">{t('patentsHighlight')}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">{t('patentsDesc')}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="bg-gradient-to-r from-dashboard-primary/10 to-dashboard-bg p-5 rounded-lg border border-dashboard-primary/20 text-center shadow-sm">
        <p className="text-base text-gray-800 font-medium">{t('callToAction')}</p>
      </div>

      {/* Firma */}
      <div className="flex justify-end">
        <p className="text-xs text-gray-500 italic">{t('developed')}</p>
      </div>
    </div>
  );
};

export default OverviewSection; 