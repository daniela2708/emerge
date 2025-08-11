import React, { createContext, useContext, useState } from 'react';

type Language = 'es' | 'en';

// Definir la estructura de las traducciones
type Translations = {
  [key in Language]: {
    [key in string]: string;
  };
};

// Diccionario de traducciones
const translations: Translations = {
  es: {
    title: "Observatorio de I+D en Canarias",
    subtitle: "Análisis comparativo e histórico de indicadores de innovación",
    developedFor: "Desarrollado para la Asociación Canaria de Startups (EMERGE)",
    overview: "Visión General",
    gdp: "PIB",
    researchers: "Investigadores",
    patents: "Patentes",
    changeLanguage: "Change to English",
    overviewDescription: "Resumen de actividades de I+D en las Islas Canarias",
    gdpDescription: "Evolución del Producto Interior Bruto (PIB) dedicado a la investigación y desarrollo en las Islas Canarias",
    researchersDescription: "Datos sobre investigadores y personal de I+D en las Islas Canarias",
    patentsDescription: "Información sobre patentes y propiedad intelectual generadas en las Islas Canarias",
    investment: "Inversión",
    investmentDescription: "Datos sobre la inversión en I+D en las Islas Canarias, tanto pública como privada",
    chartPlaceholder: "Gráfico de",
    publicSector: "Sector Público",
    privateSector: "Sector Privado",
    developedBy: "Desarrollado por"
  },
  en: {
    title: "R&D Observatory of Canary Islands",
    subtitle: "Comparative and historical analysis of innovation indicators",
    developedFor: "Developed for the Canary Islands Startup Association (EMERGE)",
    overview: "Overview",
    gdp: "GDP",
    researchers: "Researchers",
    patents: "Patents",
    changeLanguage: "Cambiar a Español",
    overviewDescription: "Summary of R&D activities in the Canary Islands",
    gdpDescription: "Evolution of Gross Domestic Product (GDP) dedicated to research and development in the Canary Islands",
    researchersDescription: "Data on researchers and R&D personnel in the Canary Islands",
    patentsDescription: "Information on patents and intellectual property generated in the Canary Islands",
    investment: "Investment",
    investmentDescription: "Data on R&D investment in the Canary Islands, both public and private",
    chartPlaceholder: "Chart of",
    publicSector: "Public Sector",
    privateSector: "Private Sector",
    developedBy: "Developed by"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  changeLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => {},
  changeLanguage: () => {},
  t: () => ''
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.es] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);