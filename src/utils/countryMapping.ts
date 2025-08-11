/**
 * countryMapping.ts
 * Archivo de mapeo completo para normalizar los nombres de países y sus códigos ISO
 * Este archivo contiene todas las variantes de nombres de países encontrados en los datasets
 * y su mapeo a códigos ISO2 e ISO3 para asegurar consistencia en la visualización de mapas.
 */

// Interfaz para el mapeo de países
export interface CountryMapping {
  // Nombres del país en diferentes idiomas e identificaciones
  names: {
    es: string[]; // Nombres en español
    en: string[]; // Nombres en inglés
    datasets: string[]; // Nombres como aparecen en los archivos CSV
  };
  // Códigos ISO
  iso2: string;
  iso3: string;
  // URL de la bandera
  flag: string;
  // Indica si es una entidad supranacional (UE, Euro Zona, etc.)
  isSupranational?: boolean;
}

// Mapeo completo de países
export const countryMappings: Record<string, CountryMapping> = {
  // Entidades supranacionales
  "EU": {
    names: {
      es: ["Unión Europea", "Unión Europea (27 países)", "UE", "UE-27"],
      en: ["European Union", "European Union - 27 countries (from 2020)", "EU", "EU-27"],
      datasets: ["European Union - 27 countries (from 2020)", "EU27_2020", "Unión Europea (27 países)"]
    },
    iso2: "EU",
    iso3: "EUU",
    flag: "https://flagcdn.com/eu.svg",
    isSupranational: true
  },
  "EA": {
    names: {
      es: ["Zona Euro", "Zona Euro (19 países)", "Zona Euro (20 países)"],
      en: ["Euro area", "Euro area - 19 countries (2015-2022)", "Euro area – 20 countries (from 2023)"],
      datasets: ["Euro area - 19 countries  (2015-2022)", "Euro area – 20 countries (from 2023)", "EA19", "EA20", "Zona Euro (19 países)", "Zona Euro (20 países)"]
    },
    iso2: "EU",
    iso3: "EMU",
    flag: "https://flagcdn.com/eu.svg",
    isSupranational: true
  },
  
  // Países de la Unión Europea
  "BE": {
    names: {
      es: ["Bélgica"],
      en: ["Belgium"],
      datasets: ["Belgium", "BE", "Bélgica"]
    },
    iso2: "BE",
    iso3: "BEL",
    flag: "https://flagcdn.com/be.svg"
  },
  "BG": {
    names: {
      es: ["Bulgaria"],
      en: ["Bulgaria"],
      datasets: ["Bulgaria", "BG"]
    },
    iso2: "BG",
    iso3: "BGR",
    flag: "https://flagcdn.com/bg.svg"
  },
  "CZ": {
    names: {
      es: ["República Checa", "Chequia"],
      en: ["Czech Republic", "Czechia"],
      datasets: ["Czechia", "CZ", "Czech Republic", "Chequia", "República Checa"]
    },
    iso2: "CZ",
    iso3: "CZE",
    flag: "https://flagcdn.com/cz.svg"
  },
  "DK": {
    names: {
      es: ["Dinamarca"],
      en: ["Denmark"],
      datasets: ["Denmark", "DK", "Dinamarca"]
    },
    iso2: "DK",
    iso3: "DNK",
    flag: "https://flagcdn.com/dk.svg"
  },
  "DE": {
    names: {
      es: ["Alemania"],
      en: ["Germany"],
      datasets: ["Germany", "DE", "Alemania"]
    },
    iso2: "DE",
    iso3: "DEU",
    flag: "https://flagcdn.com/de.svg"
  },
  "EE": {
    names: {
      es: ["Estonia"],
      en: ["Estonia"],
      datasets: ["Estonia", "EE"]
    },
    iso2: "EE",
    iso3: "EST",
    flag: "https://flagcdn.com/ee.svg"
  },
  "IE": {
    names: {
      es: ["Irlanda"],
      en: ["Ireland"],
      datasets: ["Ireland", "IE", "Irlanda"]
    },
    iso2: "IE",
    iso3: "IRL",
    flag: "https://flagcdn.com/ie.svg"
  },
  "EL": {
    names: {
      es: ["Grecia"],
      en: ["Greece", "Hellas"],
      datasets: ["Greece", "EL", "Grecia", "Hellas"]
    },
    iso2: "EL",
    iso3: "GRC",
    flag: "https://flagcdn.com/gr.svg"
  },
  "ES": {
    names: {
      es: ["España"],
      en: ["Spain"],
      datasets: ["Spain", "ES", "España"]
    },
    iso2: "ES",
    iso3: "ESP",
    flag: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg"
  },
  "FR": {
    names: {
      es: ["Francia"],
      en: ["France"],
      datasets: ["France", "FR", "Francia"]
    },
    iso2: "FR",
    iso3: "FRA",
    flag: "https://flagcdn.com/fr.svg"
  },
  "HR": {
    names: {
      es: ["Croacia"],
      en: ["Croatia"],
      datasets: ["Croatia", "HR", "Croacia"]
    },
    iso2: "HR",
    iso3: "HRV",
    flag: "https://flagcdn.com/hr.svg"
  },
  "IT": {
    names: {
      es: ["Italia"],
      en: ["Italy"],
      datasets: ["Italy", "IT", "Italia"]
    },
    iso2: "IT",
    iso3: "ITA",
    flag: "https://flagcdn.com/it.svg"
  },
  "CY": {
    names: {
      es: ["Chipre"],
      en: ["Cyprus"],
      datasets: ["Cyprus", "CY", "Chipre"]
    },
    iso2: "CY",
    iso3: "CYP",
    flag: "https://flagcdn.com/cy.svg"
  },
  "LV": {
    names: {
      es: ["Letonia"],
      en: ["Latvia"],
      datasets: ["Latvia", "LV", "Letonia"]
    },
    iso2: "LV",
    iso3: "LVA",
    flag: "https://flagcdn.com/lv.svg"
  },
  "LT": {
    names: {
      es: ["Lituania"],
      en: ["Lithuania"],
      datasets: ["Lithuania", "LT", "Lituania"]
    },
    iso2: "LT",
    iso3: "LTU",
    flag: "https://flagcdn.com/lt.svg"
  },
  "LU": {
    names: {
      es: ["Luxemburgo"],
      en: ["Luxembourg"],
      datasets: ["Luxembourg", "LU", "Luxemburgo"]
    },
    iso2: "LU",
    iso3: "LUX",
    flag: "https://flagcdn.com/lu.svg"
  },
  "HU": {
    names: {
      es: ["Hungría"],
      en: ["Hungary"],
      datasets: ["Hungary", "HU", "Hungría"]
    },
    iso2: "HU",
    iso3: "HUN",
    flag: "https://flagcdn.com/hu.svg"
  },
  "MT": {
    names: {
      es: ["Malta"],
      en: ["Malta"],
      datasets: ["Malta", "MT"]
    },
    iso2: "MT",
    iso3: "MLT",
    flag: "https://flagcdn.com/mt.svg"
  },
  "NL": {
    names: {
      es: ["Países Bajos", "Holanda"],
      en: ["Netherlands", "Holland"],
      datasets: ["Netherlands", "NL", "Países Bajos"]
    },
    iso2: "NL",
    iso3: "NLD",
    flag: "https://flagcdn.com/nl.svg"
  },
  "AT": {
    names: {
      es: ["Austria"],
      en: ["Austria"],
      datasets: ["Austria", "AT"]
    },
    iso2: "AT",
    iso3: "AUT",
    flag: "https://flagcdn.com/at.svg"
  },
  "PL": {
    names: {
      es: ["Polonia"],
      en: ["Poland"],
      datasets: ["Poland", "PL", "Polonia"]
    },
    iso2: "PL",
    iso3: "POL",
    flag: "https://flagcdn.com/pl.svg"
  },
  "PT": {
    names: {
      es: ["Portugal"],
      en: ["Portugal"],
      datasets: ["Portugal", "PT"]
    },
    iso2: "PT",
    iso3: "PRT",
    flag: "https://flagcdn.com/pt.svg"
  },
  "RO": {
    names: {
      es: ["Rumanía", "Rumania"],
      en: ["Romania"],
      datasets: ["Romania", "RO", "Rumanía"]
    },
    iso2: "RO",
    iso3: "ROU",
    flag: "https://flagcdn.com/ro.svg"
  },
  "SI": {
    names: {
      es: ["Eslovenia"],
      en: ["Slovenia"],
      datasets: ["Slovenia", "SI", "Eslovenia"]
    },
    iso2: "SI",
    iso3: "SVN",
    flag: "https://flagcdn.com/si.svg"
  },
  "SK": {
    names: {
      es: ["Eslovaquia"],
      en: ["Slovakia"],
      datasets: ["Slovakia", "SK", "Eslovaquia"]
    },
    iso2: "SK",
    iso3: "SVK",
    flag: "https://flagcdn.com/sk.svg"
  },
  "FI": {
    names: {
      es: ["Finlandia"],
      en: ["Finland"],
      datasets: ["Finland", "FI", "Finlandia"]
    },
    iso2: "FI",
    iso3: "FIN",
    flag: "https://flagcdn.com/fi.svg"
  },
  "SE": {
    names: {
      es: ["Suecia"],
      en: ["Sweden"],
      datasets: ["Sweden", "SE", "Suecia"]
    },
    iso2: "SE",
    iso3: "SWE",
    flag: "https://flagcdn.com/se.svg"
  },
  
  // Países europeos no UE
  "GB": {
    names: {
      es: ["Reino Unido", "Gran Bretaña"],
      en: ["United Kingdom", "Great Britain", "UK"],
      datasets: ["United Kingdom", "UK", "GB", "Reino Unido"]
    },
    iso2: "GB",
    iso3: "GBR",
    flag: "https://flagcdn.com/gb.svg"
  },
  "IS": {
    names: {
      es: ["Islandia"],
      en: ["Iceland"],
      datasets: ["Iceland", "IS", "Islandia"]
    },
    iso2: "IS",
    iso3: "ISL",
    flag: "https://flagcdn.com/is.svg"
  },
  "NO": {
    names: {
      es: ["Noruega"],
      en: ["Norway"],
      datasets: ["Norway", "NO", "Noruega"]
    },
    iso2: "NO",
    iso3: "NOR",
    flag: "https://flagcdn.com/no.svg"
  },
  "CH": {
    names: {
      es: ["Suiza"],
      en: ["Switzerland"],
      datasets: ["Switzerland", "CH", "Suiza"]
    },
    iso2: "CH",
    iso3: "CHE",
    flag: "https://flagcdn.com/ch.svg"
  },
  "ME": {
    names: {
      es: ["Montenegro"],
      en: ["Montenegro"],
      datasets: ["Montenegro", "ME"]
    },
    iso2: "ME",
    iso3: "MNE",
    flag: "https://flagcdn.com/me.svg"
  },
  "MK": {
    names: {
      es: ["Macedonia del Norte"],
      en: ["North Macedonia", "Macedonia", "Rep. of North Macedonia", "Republic of North Macedonia"],
      datasets: ["North Macedonia", "MK", "Macedonia del Norte"]
    },
    iso2: "MK",
    iso3: "MKD",
    flag: "https://flagcdn.com/mk.svg"
  },
  "AL": {
    names: {
      es: ["Albania"],
      en: ["Albania", "Republic of Albania"],
      datasets: ["Albania", "AL"]
    },
    iso2: "AL",
    iso3: "ALB",
    flag: "https://flagcdn.com/al.svg"
  },
  "RS": {
    names: {
      es: ["Serbia"],
      en: ["Serbia", "Republic of Serbia"],
      datasets: ["Serbia", "RS"]
    },
    iso2: "RS",
    iso3: "SRB",
    flag: "https://flagcdn.com/rs.svg"
  },
  "BA": {
    names: {
      es: ["Bosnia y Herzegovina", "Bosnia"],
      en: ["Bosnia and Herzegovina", "Bosnia & Herzegovina", "Bosnia"],
      datasets: ["Bosnia and Herzegovina", "BA", "Bosnia y Herzegovina"]
    },
    iso2: "BA",
    iso3: "BIH",
    flag: "https://flagcdn.com/ba.svg"
  },
  "MD": {
    names: {
      es: ["Moldavia"],
      en: ["Moldova", "Republic of Moldova"],
      datasets: ["Moldova", "MD", "Moldavia"]
    },
    iso2: "MD",
    iso3: "MDA",
    flag: "https://flagcdn.com/md.svg"
  },
  "UA": {
    names: {
      es: ["Ucrania"],
      en: ["Ukraine"],
      datasets: ["Ukraine", "UA", "Ucrania"]
    },
    iso2: "UA",
    iso3: "UKR",
    flag: "https://flagcdn.com/ua.svg"
  },
  "TR": {
    names: {
      es: ["Turquía"],
      en: ["Turkey", "Türkiye"],
      datasets: ["Türkiye", "TR", "Turquía", "Turkey"]
    },
    iso2: "TR",
    iso3: "TUR",
    flag: "https://flagcdn.com/tr.svg"
  },
  
  // Otros países importantes en los datos
  "XK": {
    names: {
      es: ["Kosovo"],
      en: ["Kosovo"],
      datasets: ["Kosovo", "XK"]
    },
    iso2: "XK",
    iso3: "XKX",
    flag: "https://flagcdn.com/xk.svg"
  },
  "RU": {
    names: {
      es: ["Rusia", "Federación Rusa"],
      en: ["Russia", "Russian Federation"],
      datasets: ["Russia", "RU", "Rusia"]
    },
    iso2: "RU",
    iso3: "RUS",
    flag: "https://flagcdn.com/ru.svg"
  },
  "US": {
    names: {
      es: ["Estados Unidos"],
      en: ["United States", "USA"],
      datasets: ["United States", "US", "Estados Unidos"]
    },
    iso2: "US",
    iso3: "USA",
    flag: "https://flagcdn.com/us.svg"
  },
  "JP": {
    names: {
      es: ["Japón"],
      en: ["Japan"],
      datasets: ["Japan", "JP", "Japón"]
    },
    iso2: "JP",
    iso3: "JPN",
    flag: "https://flagcdn.com/jp.svg"
  },
  "CN": {
    names: {
      es: ["China", "China (exc. Hong Kong)"],
      en: ["China", "China except Hong Kong"],
      datasets: ["China except Hong Kong", "CN_X_HK", "China", "China (exc. Hong Kong)"]
    },
    iso2: "CN",
    iso3: "CHN",
    flag: "https://flagcdn.com/cn.svg"
  },
  "KR": {
    names: {
      es: ["Corea del Sur"],
      en: ["South Korea"],
      datasets: ["South Korea", "KR", "Corea del Sur"]
    },
    iso2: "KR",
    iso3: "KOR",
    flag: "https://flagcdn.com/kr.svg"
  }
};

/**
 * Funciones de utilidad para trabajar con el mapeo de países
 */

/**
 * Obtiene el código ISO3 de un país a partir de su nombre
 * @param countryName Nombre del país en cualquier idioma o formato
 * @returns Código ISO3 del país o undefined si no se encuentra
 */
export function getIso3FromCountryName(countryName: string): string | undefined {
  const normalizedName = countryName.toLowerCase().trim();
  
  for (const [, mapping] of Object.entries(countryMappings)) {
    // Buscar en nombres en español
    if (mapping.names.es.some(name => name.toLowerCase() === normalizedName)) {
      return mapping.iso3;
    }
    
    // Buscar en nombres en inglés
    if (mapping.names.en.some(name => name.toLowerCase() === normalizedName)) {
      return mapping.iso3;
    }
    
    // Buscar en nombres de datasets
    if (mapping.names.datasets.some(name => name.toLowerCase() === normalizedName)) {
      return mapping.iso3;
    }
  }
  
  return undefined;
}

/**
 * Obtiene el nombre localizado de un país a partir de su código ISO2 o ISO3
 * @param code Código ISO2 o ISO3 del país
 * @param language Idioma deseado ('es' o 'en')
 * @returns Nombre del país en el idioma especificado o undefined si no se encuentra
 */
export function getCountryNameFromCode(code: string, language: 'es' | 'en'): string | undefined {
  const upperCode = code.toUpperCase();
  
  // Buscar por ISO2
  if (countryMappings[upperCode]) {
    return countryMappings[upperCode].names[language][0];
  }
  
  // Buscar por ISO3
  for (const [, mapping] of Object.entries(countryMappings)) {
    if (mapping.iso3 === upperCode) {
      return mapping.names[language][0];
    }
  }
  
  return undefined;
}

/**
 * Obtiene la URL de la bandera de un país a partir de su código ISO2, ISO3 o nombre
 * @param countryIdentifier Código ISO o nombre del país
 * @returns URL de la bandera o undefined si no se encuentra
 */
export function getCountryFlag(countryIdentifier: string): string | undefined {
  // Si es ISO2
  if (countryMappings[countryIdentifier.toUpperCase()]) {
    return countryMappings[countryIdentifier.toUpperCase()].flag;
  }
  
  // Si es ISO3
  for (const [, mapping] of Object.entries(countryMappings)) {
    if (mapping.iso3 === countryIdentifier.toUpperCase()) {
      return mapping.flag;
    }
  }
  
  // Si es un nombre de país
  const iso3 = getIso3FromCountryName(countryIdentifier);
  if (iso3) {
    for (const [, mapping] of Object.entries(countryMappings)) {
      if (mapping.iso3 === iso3) {
        return mapping.flag;
      }
    }
  }
  
  return undefined;
}

/**
 * Determina si un código o nombre corresponde a una entidad supranacional
 * @param countryIdentifier Código ISO o nombre del país/entidad
 * @returns true si es una entidad supranacional, false en caso contrario
 */
export function isSupranationalEntity(countryIdentifier: string): boolean {
  // Si es ISO2
  if (countryMappings[countryIdentifier.toUpperCase()]) {
    return !!countryMappings[countryIdentifier.toUpperCase()].isSupranational;
  }
  
  // Si es ISO3
  for (const [, mapping] of Object.entries(countryMappings)) {
    if (mapping.iso3 === countryIdentifier.toUpperCase()) {
      return !!mapping.isSupranational;
    }
  }
  
  // Si es un nombre de país
  const iso3 = getIso3FromCountryName(countryIdentifier);
  if (iso3) {
    for (const [, mapping] of Object.entries(countryMappings)) {
      if (mapping.iso3 === iso3) {
        return !!mapping.isSupranational;
      }
    }
  }
  
  return false;
} 