// Definimos los tipos de pestañas disponibles
export type TabType = 'overview' | 'investment' | 'researchers' | 'patents' | 'sources';

// Definir las claves de traducción disponibles
export type TranslationKey =
  | 'title'
  | 'subtitle'
  | 'developedFor'
  | 'overview'
  | 'investment' // Cambiado de 'gdp'
  | 'researchers'
  | 'patents'
  | 'changeLanguage'
  | 'overviewDescription'
  | 'investmentDescription' // Cambiado de 'gdpDescription'
  | 'researchersDescription'
  | 'patentsDescription'
  | 'chartPlaceholder'
  | 'publicSector'
  | 'privateSector';

// Definir los idiomas disponibles
export type Language = 'es' | 'en';