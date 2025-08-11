import autonomous_communities_flags from '../logos/autonomous_communities_flags.json';

// Interfaz para los datos de investigadores por comunidades autónomas
export interface ResearchersCommunityData {
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

// Interfaz para las banderas de comunidades autónomas
export interface CommunityFlag {
  community: string;
  code: string;
  flag: string;
}

// Tabla de mapeo entre nombres de comunidades en el CSV y nombres normalizados
export const communityNameMapping: { [key: string]: { es: string, en: string } } = {
  'Andalucía': { es: 'Andalucía', en: 'Andalusia' },
  'Andalucia': { es: 'Andalucía', en: 'Andalusia' },
  'Aragón': { es: 'Aragón', en: 'Aragon' },
  'Aragon': { es: 'Aragón', en: 'Aragon' },
  'Principado de Asturias': { es: 'Asturias', en: 'Asturias' },
  'Asturias': { es: 'Asturias', en: 'Asturias' },
  'Illes Balears / Islas Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Islas Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Illes Balears': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Baleares': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Balearic Islands': { es: 'Islas Baleares', en: 'Balearic Islands' },
  'Canarias': { es: 'Islas Canarias', en: 'Canary Islands' },
  'Islas Canarias': { es: 'Islas Canarias', en: 'Canary Islands' },
  'Canary Islands': { es: 'Islas Canarias', en: 'Canary Islands' },
  'Cantabria': { es: 'Cantabria', en: 'Cantabria' },
  'Castilla - La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla-La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla La Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla-la Mancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castillalamancha': { es: 'Castilla-La Mancha', en: 'Castilla–La Mancha' },
  'Castilla y León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla y Leon': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla-León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castilla-Leon': { es: 'Castilla y León', en: 'Castile and León' },
  'Castile and León': { es: 'Castilla y León', en: 'Castile and León' },
  'Castile and Leon': { es: 'Castilla y León', en: 'Castile and León' },
  'Cataluña': { es: 'Cataluña', en: 'Catalonia' },
  'Cataluna': { es: 'Cataluña', en: 'Catalonia' },
  'Catalunya': { es: 'Cataluña', en: 'Catalonia' },
  'Catalonia': { es: 'Cataluña', en: 'Catalonia' },
  'Comunidad Valenciana': { es: 'Com. Valenciana', en: 'Valencia' },
  'C. Valenciana': { es: 'Com. Valenciana', en: 'Valencia' },
  'Valencia': { es: 'Com. Valenciana', en: 'Valencia' },
  'Valencian Community': { es: 'Com. Valenciana', en: 'Valencia' },
  'Extremadura': { es: 'Extremadura', en: 'Extremadura' },
  'Galicia': { es: 'Galicia', en: 'Galicia' },
  'La Rioja': { es: 'La Rioja', en: 'La Rioja' },
  'Rioja': { es: 'La Rioja', en: 'La Rioja' },
  'Comunidad de Madrid': { es: 'Madrid', en: 'Madrid' },
  'Madrid': { es: 'Madrid', en: 'Madrid' },
  'Región de Murcia': { es: 'Murcia', en: 'Murcia' },
  'Region de Murcia': { es: 'Murcia', en: 'Murcia' },
  'Murcia': { es: 'Murcia', en: 'Murcia' },
  'Comunidad Foral de Navarra': { es: 'Navarra', en: 'Navarre' },
  'Navarra': { es: 'Navarra', en: 'Navarre' },
  'Navarre': { es: 'Navarra', en: 'Navarre' },
  'País Vasco': { es: 'País Vasco', en: 'Basque Country' },
  'Pais Vasco': { es: 'País Vasco', en: 'Basque Country' },
  'Euskadi': { es: 'País Vasco', en: 'Basque Country' },
  'Basque Country': { es: 'País Vasco', en: 'Basque Country' },
  'Ciudad Autónoma de Ceuta': { es: 'Ceuta', en: 'Ceuta' },
  'Ceuta': { es: 'Ceuta', en: 'Ceuta' },
  'Ciudad Autónoma de Melilla': { es: 'Melilla', en: 'Melilla' },
  'Melilla': { es: 'Melilla', en: 'Melilla' }
};

// Asegurar el tipo correcto para el array de flags
export const communityFlags = autonomous_communities_flags as CommunityFlag[];

// Función para normalizar texto (remover acentos y caracteres especiales)
export function normalizarTexto(texto: string | undefined): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Función para mapear el sector seleccionado al código del sector en el CSV
export function getSectorId(selectedSector: string): string {
  switch (selectedSector.toLowerCase()) {
    case 'total':
      return '_T';
    case 'business':
      return 'EMPRESAS';
    case 'government':
      return 'ADMINISTRACION_PUBLICA';
    case 'education':
      return 'ENSENIANZA_SUPERIOR';
    case 'nonprofit':
      return 'IPSFL';
    default:
      return '_T'; // Total por defecto
  }
}

// Función para validar valores numéricos
export function validarValor(valor: string | undefined): number | null {
  if (valor === undefined || valor === null) {
    return null;
  }
  
  const trimmedValue = valor.trim();
  if (trimmedValue === '') {
    return null;
  }
  
  const numero = parseFloat(trimmedValue);
  if (Number.isNaN(numero)) {
    return null;
  }
  
  return numero;
}

// Función unificada para obtener el valor de investigadores para una comunidad
export function getCommunityValue(
  communityName: string,
  data: ResearchersCommunityData[],
  year: string,
  selectedSector: string,
  language: 'es' | 'en'
): number | null {
  try {
    if (!communityName) return null;
    
    // Convertir a normalizado para comparar
    const normalizedCommunityName = normalizarTexto(communityName);
    
    // Mapear el sector seleccionado al código del sector en el CSV
    const sectorId = getSectorId(selectedSector);
    
    // Filtrar datos por año, sector y sexo (total)
    const filteredData = data.filter(item => {
      return item.TIME_PERIOD === year &&
             item.SECTOR_EJECUCION_CODE === sectorId &&
             item.SEXO_CODE === '_T' &&
             item.MEDIDAS_CODE === 'INVESTIGADORES_EJC';
    });
    
    if (filteredData.length === 0) {
      return null;
    }
    
    // 1. Buscar por nombre exacto
    const communityMatch = filteredData.find(item => {
      const itemCommunityName = normalizarTexto(item.TERRITORIO);
      return itemCommunityName === normalizedCommunityName;
    });
    
    if (communityMatch) {
      const valor = validarValor(communityMatch.OBS_VALUE);
      if (valor !== null) {
        return valor;
      }
      return null;
    }
    
    // 2. Buscar a través del mapeo de nombres
    for (const key in communityNameMapping) {
      const keyNormalized = normalizarTexto(key);
      const valueInCurrentLanguage = language === 'es' ? 
        communityNameMapping[key].es : 
        communityNameMapping[key].en;
      const valueNormalized = normalizarTexto(valueInCurrentLanguage);
      
      if (normalizedCommunityName === keyNormalized || normalizedCommunityName === valueNormalized) {
        const possibleNames = [
          key,
          communityNameMapping[key].es,
          communityNameMapping[key].en
        ];
        
        for (const name of possibleNames) {
          const match = filteredData.find(item => 
            normalizarTexto(item.TERRITORIO) === normalizarTexto(name)
          );
          
          if (match) {
            const parsedValue = validarValor(match.OBS_VALUE);
            if (parsedValue !== null) {
              return parsedValue;
            }
            return null;
          }
        }
      }
    }
    
    // 3. Búsqueda por contención
    const matchByContains = filteredData.find(item => {
      const itemName = normalizarTexto(item.TERRITORIO);
      return itemName.includes(normalizedCommunityName) || normalizedCommunityName.includes(itemName);
    });
    
    if (matchByContains) {
      const parsedValue = validarValor(matchByContains.OBS_VALUE);
      if (parsedValue !== null) {
        return parsedValue;
      }
      return null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error al obtener valor para ${communityName}:`, error);
    return null;
  }
}

// Función unificada para obtener la bandera de una comunidad
export function getCommunityFlagUrl(communityName: string, language: 'es' | 'en'): string {
  if (!communityName) return "https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg";
  
  const possibleNames = [communityName];
  
  // Obtener también el nombre en español para buscar banderas cuando está en inglés
  let spanishCommunityName = communityName;
  if (language === 'en') {
    for (const key in communityNameMapping) {
      const mappedName = communityNameMapping[key];
      if (mappedName.en === communityName) {
        spanishCommunityName = mappedName.es;
        if (!possibleNames.includes(spanishCommunityName)) {
          possibleNames.push(spanishCommunityName);
        }
        break;
      }
    }
  }
  
  // Agregar variaciones de nombres para mejorar la búsqueda
  const normalizedInput = normalizarTexto(communityName);
  
  // Casos especiales para Castilla-La Mancha
  if (normalizedInput.includes('castilla') && normalizedInput.includes('mancha')) {
    possibleNames.push('Castilla - La Mancha', 'Castilla-La Mancha', 'Castilla La Mancha');
  }
  
  // Casos especiales para Comunidad Valenciana
  if (normalizedInput.includes('valencia') || normalizedInput.includes('valencian')) {
    possibleNames.push('Comunidad Valenciana', 'Com. Valenciana', 'Valencia');
  }
  
  // Buscar en las banderas disponibles con lógica mejorada
  const flagObj = communityFlags.find(flag => {
    const flagCommunityNormalized = normalizarTexto(flag.community);
    
    return possibleNames.some(name => {
      const nameNormalized = normalizarTexto(name);
      
      // Búsqueda exacta
      if (flagCommunityNormalized === nameNormalized) return true;
      
      // Búsqueda por inclusión
      if (flagCommunityNormalized.includes(nameNormalized) || nameNormalized.includes(flagCommunityNormalized)) return true;
      
      // Casos especiales específicos
      if (nameNormalized.includes('mancha') && flagCommunityNormalized.includes('mancha')) return true;
      if (nameNormalized.includes('valencia') && flagCommunityNormalized.includes('valencia')) return true;
      if (nameNormalized.includes('vasco') && flagCommunityNormalized.includes('vasco')) return true;
      
      return false;
    });
  });
  
  // URLs directas para banderas problemáticas
  if (!flagObj) {
    const directFlagUrls: Record<string, string> = {
      // Nombres en español
      'Andalucía': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Flag_of_Andaluc%C3%ADa.svg',
      'Aragón': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Flag_of_Aragon.svg',
      'Asturias': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Flag_of_Asturias.svg',
      'Cantabria': 'https://upload.wikimedia.org/wikipedia/commons/d/df/Flag_of_Cantabria.svg',
      'Castilla-La Mancha': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_Castile-La_Mancha.svg',
      'Castilla - La Mancha': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_Castile-La_Mancha.svg',
      'Castilla y León': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Flag_of_Castile_and_Le%C3%B3n.svg',
      'Cataluña': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Catalonia.svg',
      'Extremadura': 'https://upload.wikimedia.org/wikipedia/commons/4/48/Flag_of_Extremadura_%28with_coat_of_arms%29.svg',
      'Galicia': 'https://upload.wikimedia.org/wikipedia/commons/6/64/Flag_of_Galicia.svg',
      'Islas Baleares': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Flag_of_the_Balearic_Islands.svg',
      'Canarias': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Flag_of_the_Canary_Islands.svg',
      'La Rioja': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_La_Rioja.svg',
      'Madrid': 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Flag_of_the_Community_of_Madrid.svg',
      'Murcia': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Flag_of_Murcia.svg',
      'Navarra': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Flag_of_Navarre.svg',
      'País Vasco': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Flag_of_the_Basque_Country.svg',
      'Com. Valenciana': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_of_the_Valencian_Community_%282x3%29.svg',
      'Comunidad Valenciana': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_of_the_Valencian_Community_%282x3%29.svg',
      'Ceuta': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Flag_of_Ceuta.svg',
      'Melilla': 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Flag_of_Melilla.svg',
      
      // Nombres en inglés
      'Andalusia': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Flag_of_Andaluc%C3%ADa.svg',
      'Aragon': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Flag_of_Aragon.svg',
      'Castilla–La Mancha': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_Castile-La_Mancha.svg',
      'Castile and León': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Flag_of_Castile_and_Le%C3%B3n.svg',
      'Catalonia': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Catalonia.svg',
      'Balearic Islands': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Flag_of_the_Balearic_Islands.svg',
      'Canary Islands': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Flag_of_the_Canary_Islands.svg',
      'Navarre': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Flag_of_Navarre.svg',
      'Basque Country': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Flag_of_the_Basque_Country.svg',
      'Valencia': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Flag_of_the_Valencian_Community_%282x3%29.svg',
    };
    
    // Buscar directamente por el nombre actual y nombres posibles
    for (const name of possibleNames) {
      if (directFlagUrls[name]) {
        return directFlagUrls[name];
      }
    }
    
    // Búsqueda por fragmentos clave si no se encuentra directamente
    const normalizedName = normalizarTexto(communityName);
    if (normalizedName.includes('mancha') || (normalizedName.includes('castilla') && normalizedName.includes('la'))) return directFlagUrls['Castilla-La Mancha'];
    if (normalizedName.includes('valen') || normalizedName.includes('valencia')) return directFlagUrls['Com. Valenciana'];
    if (normalizedName.includes('vasco') || normalizedName.includes('basque') || normalizedName.includes('euskadi')) return directFlagUrls['País Vasco'];
    if (normalizedName.includes('andalu')) return directFlagUrls['Andalucía'];
    if (normalizedName.includes('astur')) return directFlagUrls['Asturias'];
    if (normalizedName.includes('cantabr')) return directFlagUrls['Cantabria'];
    if (normalizedName.includes('aragon')) return directFlagUrls['Aragón'];
    if (normalizedName.includes('catal')) return directFlagUrls['Cataluña'];
    if (normalizedName.includes('extrem')) return directFlagUrls['Extremadura'];
    if (normalizedName.includes('galicia')) return directFlagUrls['Galicia'];
    if (normalizedName.includes('balear')) return directFlagUrls['Islas Baleares'];
    if (normalizedName.includes('canar')) return directFlagUrls['Canarias'];
    if (normalizedName.includes('rioja')) return directFlagUrls['La Rioja'];
    if (normalizedName.includes('madrid')) return directFlagUrls['Madrid'];
    if (normalizedName.includes('murcia')) return directFlagUrls['Murcia'];
    if (normalizedName.includes('navarr')) return directFlagUrls['Navarra'];
    if (normalizedName.includes('ceuta')) return directFlagUrls['Ceuta'];
    if (normalizedName.includes('melilla')) return directFlagUrls['Melilla'];
    if (normalizedName.includes('leon') || normalizedName.includes('castilla')) return directFlagUrls['Castilla y León'];
  }
  
  // Si encontramos la bandera en el archivo JSON, usarla
  if (flagObj && flagObj.flag) {
    return flagObj.flag;
  }
  
  // Fallback: bandera de España
  return "https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg";
}

// Función para obtener el valor de España (total nacional)
export function getSpainValue(data: ResearchersCommunityData[], year: string, sector: string): number | null {
  const sectorId = getSectorId(sector);
  
  // Buscar el valor total para España en los datos
  const spainData = data.find(item => 
    (normalizarTexto(item.TERRITORIO) === 'espana' || 
     normalizarTexto(item.TERRITORIO) === 'spain' ||
     normalizarTexto(item.TERRITORIO) === 'total nacional' ||
     item.TERRITORIO_CODE === '00' || 
     item.TERRITORIO_CODE === 'ES') && 
    item.TIME_PERIOD === year && 
    item.SECTOR_EJECUCION_CODE === sectorId && 
    item.SEXO_CODE === '_T' &&
    item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
  );
  
  if (!spainData) {
    return null;
  }
  
  const totalResearchersInSpain = parseFloat(spainData.OBS_VALUE);
  if (isNaN(totalResearchersInSpain)) {
    return null;
  }
  
  return totalResearchersInSpain;
}

// Función para obtener la media por comunidad
export function getSpainAveragePerCommunity(data: ResearchersCommunityData[], year: string, sector: string): number | null {
  const spainValue = getSpainValue(data, year, sector);
  if (spainValue === null) return null;
  
  const sectorId = getSectorId(sector);
  
  // Contar el número de comunidades autónomas con datos (excluyendo España)
  const communitiesData = data.filter(item => 
    !(normalizarTexto(item.TERRITORIO) === 'espana' || 
      normalizarTexto(item.TERRITORIO) === 'spain' ||
      normalizarTexto(item.TERRITORIO) === 'total nacional' ||
      item.TERRITORIO_CODE === '00' || 
      item.TERRITORIO_CODE === 'ES') && 
    item.TIME_PERIOD === year && 
    item.SECTOR_EJECUCION_CODE === sectorId && 
    item.SEXO_CODE === '_T' &&
    item.MEDIDAS_CODE === 'INVESTIGADORES_EJC'
  );
  
  const numberOfCommunities = communitiesData.length;
  
  if (numberOfCommunities === 0) {
    return null;
  }
  
  return spainValue / numberOfCommunities;
}

// Función para obtener el valor del año anterior
export function getPreviousYearValue(
  communityName: string,
  data: ResearchersCommunityData[],
  currentYear: number,
  selectedSector: string,
  language: 'es' | 'en'
): number | null {
  const prevYear = currentYear - 1;
  return getCommunityValue(communityName, data, prevYear.toString(), selectedSector, language);
}

// Función para formatear números con separador de miles
export function formatNumber(value: number, language: 'es' | 'en', decimals: number = 0): string {
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  }).format(value);
}

// Función para verificar si una entrada es España (para excluirla de rankings)
export function isSpainEntry(item: ResearchersCommunityData): boolean {
  return item.TERRITORIO_CODE === '00' || 
         item.TERRITORIO_CODE === 'ES' || 
         normalizarTexto(item.TERRITORIO) === 'espana' ||
         normalizarTexto(item.TERRITORIO) === 'spain' ||
         normalizarTexto(item.TERRITORIO) === 'total nacional';
}

// Función para obtener el nombre normalizado de una comunidad según el idioma
export function getNormalizedCommunityName(originalName: string, language: 'es' | 'en'): string {
  const normalizedName = Object.keys(communityNameMapping).find(key => 
    normalizarTexto(key) === normalizarTexto(originalName)
  );
  
  return normalizedName 
    ? (language === 'es' ? communityNameMapping[normalizedName].es : communityNameMapping[normalizedName].en)
    : originalName;
} 