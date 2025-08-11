import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { Feature, Geometry } from 'geojson';
import { SECTOR_COLORS } from '../utils/colors';
// Importando datos de country_flags.json
import countryFlagsData from '../logos/country_flags.json';
import { DataDisplayType } from './DataTypeSelector';
// Importar las funciones de mapeo de países
import { getIso3FromCountryName, isSupranationalEntity as isSupranationalFromMapping } from '../utils/countryMapping';
// Para usar las banderas SVG, debes importarlas del archivo logos/country-flags.tsx
// import { FlagSpain, FlagEU, FlagCanaryIslands, FlagSweden, FlagFinland } from '../logos/country-flags';

// Interfaz para los elementos del archivo country_flags.json
interface CountryFlag {
  country: string;
  code: string;
  iso3: string;
  flag: string;
}

// Aseguramos el tipo correcto para el array de flags
const countryFlags = countryFlagsData as CountryFlag[];

// Definir la interfaz para los datos de entrada
interface EuropeCSVData {
  Country: string;
  País?: string;
  Year: string;
  Sector: string;
  '%GDP': string;
  ISO3?: string;
  Value?: string;
  label_percent_gdp_id?: string;
  Approx_RD_Investment_million_euro?: string;
  [key: string]: string | undefined;
}

// Definición de tipos más estrictos para propiedades
type GeoJsonProperties = {
  NAME?: string;
  NAME_EN?: string;
  ADMIN?: string;
  CNTRY_NAME?: string;
  iso_a3?: string;
  iso_a2?: string;
  [key: string]: string | number | undefined;
};

// Tipo para las características GeoJSON
type GeoJsonFeature = Feature<Geometry, GeoJsonProperties>;

interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

// Interfaz para los datos de etiquetas
interface LabelData {
  Country: string;
  País: string;
  Year: string;
  Sector: string;
  Label: string;
}

// Interfaz para los datos de comunidades autónomas
interface AutonomousCommunityData {
  "Comunidad (Original)": string;
  "Comunidad Limpio": string;
  "Comunidad en Inglés": string;
  "Año": string;
  "Sector Id": string;
  "Sector": string;
  "Gasto en I+D (Miles €)": string;
  "PIB (Miles €)": string;
  "% PIB I+D": string;
  "Sector Nombre": string;
  [key: string]: string;
}

interface EuropeanRDMapProps {
  data: EuropeCSVData[];
  selectedYear: number;
  selectedSector: string;
  language: 'es' | 'en';
  onClick?: (country: string) => void;
  labels?: LabelData[]; // Añadir la propiedad de etiquetas
  autonomousCommunitiesData?: AutonomousCommunityData[]; // Datos de comunidades autónomas
  dataDisplayType?: DataDisplayType;
}

// URL del archivo GeoJSON de Europa
const EUROPE_GEOJSON_URL = '/data/geo/europe.geojson';

  // Paleta de colores para el mapa basada en los colores de sectores
const getSectorPalette = (sectorId: string) => {
  // Normalizar el ID del sector para asegurar compatibilidad
  let normalizedId = sectorId.toLowerCase();
  
  // Transformar nombres de sectores en inglés a IDs
  if (normalizedId === 'all sectors' || normalizedId === 'all' || normalizedId === 'total') normalizedId = 'total';
  if (normalizedId === 'business enterprise sector') normalizedId = 'business';
  if (normalizedId === 'government sector') normalizedId = 'government';
  if (normalizedId === 'higher education sector') normalizedId = 'education';
  if (normalizedId === 'private non-profit sector') normalizedId = 'nonprofit';
  
  // Asegurar que usamos una clave válida para SECTOR_COLORS
  const validSectorId = (normalizedId in SECTOR_COLORS) ? normalizedId : 'total';
  const baseColor = SECTOR_COLORS[validSectorId as keyof typeof SECTOR_COLORS];
  
  // Crear gradiente basado en el color del sector
  return {
    NULL: '#f5f5f5',           // Gris claro para valores nulos
    ZERO: '#666666',           // Gris fuerte para países con 0.00%
    MIN: d3.color(baseColor)?.brighter(1.5)?.toString() || '#f5f5f5',  // Muy claro
    LOW: d3.color(baseColor)?.brighter(1)?.toString() || '#d0d0d0',    // Claro
    MID: baseColor,                                                    // Color base del sector
    HIGH: d3.color(baseColor)?.darker(0.7)?.toString() || '#909090',   // Oscuro
    MAX: d3.color(baseColor)?.darker(1.2)?.toString() || '#707070',    // Muy oscuro
  };
};

// Textos localizados para el mapa
type MapTexts = {
  es: {
    [key: string]: string;
  };
  en: {
    [key: string]: string;
  };
};

const mapTexts: MapTexts = {
  es: {
    title: "Inversión en I+D por país",
    loading: "Cargando mapa...",
    error: "Error al cargar el mapa de Europa",
    noData: "Sin datos",
    rdInvestment: "Inversión I+D",
    ofGDP: "del PIB",
    lessThan: "< 1%",
    between1: "1% - 1.8%",
    between2: "1.8% - 2.5%",
    between3: "2.5% - 3.2%",
    between4: "> 3.2%",
    allSectors: "Todos los sectores",
    rdInvestmentByCountry: "Inversión en I+D por país",
    // Sectores traducidos
    sector_business: "Empresas",
    sector_government: "Gobierno",
    sector_education: "Educación superior",
    sector_nonprofit: "Organizaciones sin ánimo de lucro",
    sector_total: "Todos los sectores",
    percentOfGDP: "% del PIB",
  },
  en: {
    title: "R&D Investment by Country",
    loading: "Loading map...",
    error: "Error loading Europe map",
    noData: "No data",
    rdInvestment: "R&D Investment",
    ofGDP: "of GDP",
    lessThan: "< 1%",
    between1: "1% - 1.8%",
    between2: "1.8% - 2.5%",
    between3: "2.5% - 3.2%",
    between4: "> 3.2%",
    allSectors: "All Sectors",
    rdInvestmentByCountry: "R&D Investment by Country",
    // Sectores traducidos
    sector_business: "Business enterprise",
    sector_government: "Government",
    sector_education: "Higher education",
    sector_nonprofit: "Private non-profit",
    sector_total: "All sectors",
    percentOfGDP: "% of GDP",
  }
};

// Función para normalizar texto (remover acentos y caracteres especiales)
function normalizarTexto(texto: string | undefined): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Función para verificar si una entidad es UE o zona euro (no un país)
function isSupranationalEntity(name: string | undefined): boolean {
  if (!name) return false;
  
  // Usar el nuevo sistema de mapeo
  return isSupranationalFromMapping(name);
}

// Función para obtener el nombre del país de las propiedades GeoJSON
function getCountryName(feature: GeoJsonFeature): string {
  const props = feature.properties || {};
  // Intentar obtener el nombre del país de diferentes propiedades posibles
  return (
    props.NAME ||
    props.NAME_EN ||
    props.ADMIN ||
    props.CNTRY_NAME ||
    props.name ||
    'Desconocido'
  ) as string;
}

// Función para obtener el ISO3 del país
function getCountryIso3(feature: GeoJsonFeature): string {
  const props = feature.properties || {};
  
  // Obtener el nombre del país
  const countryName = getCountryName(feature);
  
  // Usar el nuevo sistema de mapeo para obtener el ISO3
  const iso3FromMapping = getIso3FromCountryName(countryName);
  if (iso3FromMapping) {
    return iso3FromMapping;
  }
  
  // Como fallback, intentar obtener el código ISO3 de diferentes propiedades posibles
  return (props.ISO3 || props.iso_a3 || props.ADM0_A3 || '') as string;
}

// Función para obtener el valor de la UE
function getEUValue(data: EuropeCSVData[], yearStr: string, sector: string, dataDisplayType: DataDisplayType = 'percent_gdp'): number | null {
  if (!data || data.length === 0) return null;
  
  // Buscar los datos de la UE usando el nombre exacto del CSV
  const euData = data.filter(item => {
    const isEU = item.Country === 'European Union - 27 countries (from 2020)';
    const yearMatch = item.Year === yearStr;
    
    // Normalizar el sector para manejar 'All Sectors', 'total', etc.
    let normalizedSector = sector.toLowerCase();
    if (normalizedSector === 'all sectors' || normalizedSector === 'all' || normalizedSector === 'total') {
      normalizedSector = 'total';
    }
    
    // Para 'total' buscar el sector 'All Sectors'
    const sectorMatch = (
      normalizedSector === 'total' && item.Sector === 'All Sectors'
    ) || item.Sector === sector;
    
    return isEU && yearMatch && sectorMatch;
  });
  
  if (euData.length === 0) return null;
  
  // En función del tipo de visualización, devolver %PIB o millones de euros
  if (dataDisplayType === 'percent_gdp') {
    // Obtener el valor de porcentaje del PIB
    const gdpValueStr = euData[0]['%GDP'];
    if (!gdpValueStr) return null;
    
    try {
      return parseFloat(gdpValueStr.replace(',', '.'));
    } catch {
      return null;
    }
  } else {
    // Obtener el valor en millones de euros
    const euroValueStr = euData[0]['Approx_RD_Investment_million_euro'];
    if (!euroValueStr) return null;
    
    try {
      // Dividir entre 27 países para obtener el promedio
      return parseFloat(euroValueStr.replace(',', '.')) / 27;
    } catch {
      return null;
    }
  }
}

// Función para obtener el valor de España
function getSpainValue(data: EuropeCSVData[], yearStr: string, sector: string, dataDisplayType: DataDisplayType = 'percent_gdp'): number | null {
  if (!data || data.length === 0) return null;

  // Mapeo del sector seleccionado al nombre en inglés
  const sectorNameMapping: Record<string, string> = {
    'total': 'All Sectors',
    'business': 'Business enterprise sector',
    'government': 'Government sector',
    'education': 'Higher education sector',
    'nonprofit': 'Private non-profit sector'
  };
  const sectorNameEn = sectorNameMapping[sector] || 'All Sectors';

  // Buscar España en los datos usando el nombre exacto
  const spainData = data.filter(item => {
    const isSpain = item.Country === 'Spain';
    const yearMatch = item.Year === yearStr;
    const sectorMatch = item.Sector === sectorNameEn || 
      (item.Sector === 'All Sectors' && sectorNameEn === 'All Sectors');
    return isSpain && yearMatch && sectorMatch;
  });

  if (spainData.length === 0) return null;

  // Obtener el valor según el tipo de visualización
  if (dataDisplayType === 'percent_gdp') {
    const valueStr = spainData[0]['%GDP'] || '';
    if (!valueStr) return null;
    try {
      return parseFloat(valueStr.replace(',', '.'));
    } catch {
      return null;
    }
  } else {
    // Modo millones de euros
    const valueStr = spainData[0]['Approx_RD_Investment_million_euro'] || '';
    if (!valueStr) return null;
    try {
      return parseFloat(valueStr.replace(',', '.'));
    } catch {
      return null;
    }
  }
}

// Función para obtener el valor de Canarias
function getCanariasValue(data: AutonomousCommunityData[], yearStr: string, sector: string, dataDisplayType: DataDisplayType = 'percent_gdp'): number | null {
  if (!data || data.length === 0) return null;
  
  // Buscar Canarias en los datos de comunidades autónomas
  const canariasData = data.filter(item => {
    const isCommunity = normalizarTexto(item["Comunidad Limpio"]) === "canarias";
    const yearMatch = item["Año"] === yearStr;
    
    // Para manejar diferentes formatos de sector
    let sectorMatch = false;
    if (sector === 'total' || sector === 'All Sectors') {
      sectorMatch = item["Sector"] === "All Sectors" || item["Sector Id"] === "(_T)";
    } else if (sector === 'business') {
      sectorMatch = item["Sector Id"] === "(BES)" || item["Sector"] === "Business enterprise sector";
    } else if (sector === 'government') {
      sectorMatch = item["Sector Id"] === "(GOV)" || item["Sector"] === "Government sector";
    } else if (sector === 'education') {
      sectorMatch = item["Sector Id"] === "(HES)" || item["Sector"] === "Higher education sector";
    } else if (sector === 'nonprofit') {
      sectorMatch = item["Sector Id"] === "(PNP)" || item["Sector"] === "Private non-profit sector";
    } else {
      sectorMatch = item["Sector"] === sector || item["Sector Id"] === `(${sector.toUpperCase()})`;
    }
    
    return isCommunity && yearMatch && sectorMatch;
  });
  
  if (canariasData.length === 0) return null;
  
  if (dataDisplayType === 'percent_gdp') {
    // Obtener el valor del % PIB
    const valueStr = canariasData[0]["% PIB I+D"] || '';
    if (!valueStr) return null;
    
    try {
      return parseFloat(valueStr.replace(',', '.'));
    } catch {
      return null;
    }
  } else {
    // Modo millones de euros - convertir de miles a millones
    const valueStr = canariasData[0]["Gasto en I+D (Miles €)"] || '';
    if (!valueStr) return null;
    
    try {
      // Convertir de miles a millones dividiendo por 1000
      return parseFloat(valueStr.replace('.', '').replace(',', '.')) / 1000;
    } catch {
      return null;
    }
  }
}

// Función para obtener el valor del país basado en los datos, año y sector seleccionados
function getCountryValue(
  feature: GeoJsonFeature,
  data: EuropeCSVData[],
  selectedYear: string,
  selectedSector: string,
  dataDisplayType: DataDisplayType = 'percent_gdp'
): number | null {
  if (!data || !feature || !feature.properties) return null;
  
  // Obtener ISO3 del país desde el feature GeoJSON
  const iso3 = feature.properties.iso_a3;
  // Obtener nombre del país desde el feature GeoJSON (backup)
  const countryName = getCountryName(feature);
  
  // Mapeo especial para países con nombres diferentes en GeoJSON y CSV
  const countryNameMapping: { [key: string]: string[] } = {
    'Czech Republic': ['Czechia', 'Czech Republic', 'Chequia', 'República Checa'],
    'Czechia': ['Czechia', 'Czech Republic', 'Chequia', 'República Checa'],
    'Bosnia and Herzegovina': ['Bosnia and Herzegovina', 'Bosnia y Herzegovina'],
    'North Macedonia': ['North Macedonia', 'Republic of North Macedonia', 'Macedonia del Norte'],
    'United Kingdom': ['United Kingdom', 'Reino Unido'],
  };
  
  // Verificar si es la Unión Europea
  const isEU = normalizarTexto(countryName).includes('european union');
  
  // Verificar si es la Zona Euro
  const isEuroArea = normalizarTexto(countryName).includes('euro area');
  const is2023EuroArea = isEuroArea && countryName.includes('2023');
  const is2015EuroArea = isEuroArea && countryName.includes('2015');
  
  // Si es un caso especial (UE, Zona Euro), buscar de manera específica
  if (isEU) {
    return getEUValue(data, selectedYear, selectedSector, dataDisplayType);
  } else if (isEuroArea) {
    // Buscar los datos de Zona Euro
    const euroAreaData = data.filter(item => {
      // Normalizar nombre del país del item
      const itemCountry = normalizarTexto(item.Country);
      // Comprobar si coincide con la zona euro
      const isCorrectEuroArea = itemCountry.includes('euro area');
      // Comprobar si es la versión correcta (2023 o 2015-2022)
      const isCorrect2023 = is2023EuroArea && itemCountry.includes('2023');
      const isCorrect2015 = is2015EuroArea && itemCountry.includes('2015');
      
      const isCorrectEuroAreaVersion = isCorrect2023 || isCorrect2015;
      
      const yearMatch = item.Year === selectedYear;
      
      // Normalizar el sector seleccionado para manejar diferentes formatos
      let normalizedSector = selectedSector.toLowerCase();
      if (normalizedSector === 'all sectors' || normalizedSector === 'all' || normalizedSector === 'total') {
        normalizedSector = 'all sectors';
      }
      
      const sectorMatch = item.Sector === selectedSector || 
                      (item.Sector === 'All Sectors' && (normalizedSector === 'all sectors' || selectedSector === 'All Sectors'));
      
      return isCorrectEuroArea && isCorrectEuroAreaVersion && yearMatch && sectorMatch;
    });
    
    if (euroAreaData.length === 0) return null;
    
    // En función del tipo de visualización, devolver %PIB o millones de euros
    if (dataDisplayType === 'percent_gdp') {
      const gdpValueStr = euroAreaData[0]['%GDP'];
      if (!gdpValueStr) return null;
      
      try {
        return parseFloat(gdpValueStr.replace(',', '.'));
      } catch {
        return null;
      }
    } else {
      // Obtener el valor en millones de euros
      const euroValueStr = euroAreaData[0]['Approx_RD_Investment_million_euro'];
      if (!euroValueStr) return null;
      
      try {
        // Dividir entre el número de países correspondiente para obtener el promedio
        const numCountries = is2023EuroArea ? 20 : 19;
        return parseFloat(euroValueStr.replace(',', '.')) / numCountries;
      } catch {
        return null;
      }
    }
  }

  // Para el resto de países, buscar por ISO3 o por nombre
  const countryData = data.filter(item => {
    // Si tenemos ISO3 en ambos, comparar por ISO3
    if (iso3 && item.ISO3) {
      if (normalizarTexto(item.ISO3) === normalizarTexto(iso3)) {
        const yearMatch = item.Year === selectedYear;
        const sectorMatch = item.Sector === selectedSector || 
                        (item.Sector === 'All Sectors' && selectedSector === 'All Sectors');
        return yearMatch && sectorMatch;
      }
    }
    
    // Si no hay coincidencia por ISO3, intentar por nombre
    const itemCountry = normalizarTexto(item.Country);
    const countryNameNormalized = normalizarTexto(countryName);
    
    // Verificar si es un país que necesita mapeo especial
    let countryMatches = itemCountry === countryNameNormalized;
    
    // Si no hay coincidencia directa, verificar con el mapeo de nombres alternativos
    if (!countryMatches && countryNameMapping[countryName]) {
      // Buscar coincidencia con alguno de los nombres alternativos
      countryMatches = countryNameMapping[countryName].some(name => 
        normalizarTexto(name) === itemCountry
      );
    }
    
    const yearMatch = item.Year === selectedYear;
    
    // Normalizar el sector seleccionado para manejar diferentes formatos
    let normalizedSector = selectedSector.toLowerCase();
    if (normalizedSector === 'all sectors' || normalizedSector === 'all' || normalizedSector === 'total') {
      normalizedSector = 'all sectors';
    }
    
    const sectorMatch = item.Sector === selectedSector || 
                    (item.Sector === 'All Sectors' && (normalizedSector === 'all sectors' || selectedSector === 'All Sectors'));
    
    return countryMatches && yearMatch && sectorMatch;
  });
  
  if (countryData.length === 0) return null;
  
  // En función del tipo de visualización, devolver %PIB o millones de euros
  if (dataDisplayType === 'percent_gdp') {
    const gdpValueStr = countryData[0]['%GDP'];
    if (!gdpValueStr) return null;
    
    try {
      return parseFloat(gdpValueStr.replace(',', '.'));
    } catch {
      return null;
    }
  } else {
    // Obtener el valor en millones de euros
    const euroValueStr = countryData[0]['Approx_RD_Investment_million_euro'];
    if (!euroValueStr) return null;
    
    try {
      return parseFloat(euroValueStr.replace(',', '.'));
    } catch {
      return null;
    }
  }
}

// Crear una función para obtener los rangos de valores de un sector específico
function getSectorValueRange(
  data: EuropeCSVData[], 
  selectedYear: string, 
  selectedSector: string,
  dataDisplayType: DataDisplayType = 'percent_gdp'
): { min: number, max: number } {
  // Valores predeterminados en caso de no tener datos
  const defaultRange = { min: 0, max: 3.5 };
  
  if (!data || data.length === 0) return defaultRange;
  
  // Extraer todos los valores numéricos válidos del dataset para el año y sector seleccionados
  const values = data.filter(item => {
    // Verificar si coincide con el año
    const yearMatch = item.Year === selectedYear;
    
    // Verificar si coincide con el sector
    let sectorName = selectedSector;
    // Normalizar el sector seleccionado para manejar diferentes formatos
    let normalizedSector = selectedSector.toLowerCase();
    if (normalizedSector === 'all sectors' || normalizedSector === 'all' || normalizedSector === 'total') {
      normalizedSector = 'all';
    }
    
    if ([
      'all', 'total', 'business', 'government', 'education', 'nonprofit'
    ].includes(normalizedSector)) {
      const sectorNameMapping: Record<string, string> = {
        'total': 'All Sectors',
        'all': 'All Sectors',
        'business': 'Business enterprise sector',
        'government': 'Government sector', 
        'education': 'Higher education sector',
        'nonprofit': 'Private non-profit sector'
      };
      sectorName = sectorNameMapping[normalizedSector] || 'All Sectors';
    }
    const sectorMatch = (item.Sector === sectorName) || 
                        (item.Sector === 'All Sectors' && (sectorName === 'All Sectors' || normalizedSector === 'all'));
    // Excluir Unión Europea y zonas euro
    const nombre = normalizarTexto(item.Country) + ' ' + normalizarTexto(item.País || '');
    const esUE = nombre.includes('union europea') || nombre.includes('european union');
    const esZonaEuro = nombre.includes('zona euro') || nombre.includes('euro area');
    // Si coincide año y sector y NO es UE ni zona euro, incluirlo
    return yearMatch && sectorMatch && !esUE && !esZonaEuro;
  }).map(item => {
    // Obtener el valor según el tipo de visualización
    if (dataDisplayType === 'percent_gdp') {
      const valueStr = item['%GDP'] || item.Value || '0';
      return parseFloat(valueStr.replace(',', '.'));
    } else { // 'million_euro'
      const valueStr = item['Approx_RD_Investment_million_euro'] || '0';
      return parseFloat(valueStr);
    }
  }).filter(val => !isNaN(val) && val >= 0);
  
  // Si no hay valores, devolver rango predeterminado
  if (values.length === 0) return defaultRange;
  
  // Calcular el mínimo y máximo redondeados
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return { 
    min: min,
    max: max
  };
}

// Obtiene el color para un valor dado basado en la paleta de colores
function getColorForValue(
  value: number | null, 
  selectedSector: string, 
  data: EuropeCSVData[] = [], 
  selectedYear: string = '',
  dataDisplayType: DataDisplayType = 'percent_gdp'
): string {
  // Si no hay datos, usar el color NULL
  if (value === null || value === undefined) {
    return getSectorPalette(selectedSector).NULL;
  }
  
  // Si el valor es exactamente 0, usar el color ZERO
  if (value === 0 || value === 0.0 || value.toString() === '0' || value.toString() === '0.0') {
    return getSectorPalette(selectedSector).ZERO;
  }

  // Para valores positivos, asignar color según su valor
  const palette = getSectorPalette(selectedSector);
  
  // Si no tenemos datos para calcular rangos, usar valores por defecto
  if (!data || !data.length || !selectedYear) {
    if (value < 1.0) {
      return palette.MIN;
    } else if (value < 1.8) {
      return palette.LOW;
    } else if (value < 2.5) {
      return palette.MID;
    } else {
      return palette.HIGH;
    }
  }
  
  try {
    // Calcular rangos basados en los datos disponibles
    const range = getSectorValueRange(data, selectedYear, selectedSector, dataDisplayType);
    
    // Si no hay suficiente rango, usar valores predeterminados
    if (range.max <= range.min || range.max - range.min < 0.001) {
      if (value < 1.0) {
        return palette.MIN;
      } else if (value < 1.8) {
        return palette.LOW;
      } else if (value < 2.5) {
        return palette.MID;
      } else {
        return palette.HIGH;
      }
    }
    
    // Calcular rangos basados en min y max
    const step = (range.max - range.min) / 4;
    const threshold1 = range.min + step;
    const threshold2 = range.min + 2 * step;
    const threshold3 = range.min + 3 * step;
    
    // Asignar color según el rango
    if (value <= threshold1) {
      return palette.MIN;
    } else if (value <= threshold2) {
      return palette.LOW;
    } else if (value <= threshold3) {
      return palette.MID;
    } else {
      return palette.HIGH;
    }
  } catch {
    // En caso de error, usar valores por defecto
    if (value < 1.0) {
      return palette.MIN;
    } else if (value < 1.8) {
      return palette.LOW;
    } else if (value < 2.5) {
      return palette.MID;
    } else {
      return palette.HIGH;
    }
  }
}

// Función para obtener la descripción de una etiqueta
function getLabelDescription(label: string, language: 'es' | 'en'): string {
  const descriptions: Record<string, {es: string, en: string}> = {
    'e': {
      es: 'Estimado',
      en: 'Estimated'
    },
    'p': {
      es: 'Provisional',
      en: 'Provisional'
    },
    'd': {
      es: 'Definición difiere',
      en: 'Definition differs'
    },
    'b': {
      es: 'Ruptura en series temporales',
      en: 'Break in time series'
    },
    'dp': {
      es: 'Definición difiere, provisional',
      en: 'Definition differs, provisional'
    },
    'ep': {
      es: 'Estimado, provisional',
      en: 'Estimated, provisional'
    },
    'bp': {
      es: 'Ruptura en series temporales, provisional',
      en: 'Break in time series, provisional'
    },
    'bd': {
      es: 'Ruptura en series temporales, definición difiere',
      en: 'Break in time series, definition differs'
    },
    'de': {
      es: 'Definición difiere, estimado',
      en: 'Definition differs, estimated'
    },
    'u': {
      es: 'Baja fiabilidad',
      en: 'Low reliability'
    }
  };
  
  return descriptions[label] ? descriptions[label][language] : '';
}

// Función para obtener la URL de la bandera de un país
function getCountryFlagUrl(countryName: string, feature?: GeoJsonFeature): string {  
  if (!countryName) return "https://flagcdn.com/un.svg"; // Bandera ONU por defecto
  
  // 1. Primero buscar por ISO3 si está disponible en el feature
  if (feature) {
    const iso3 = getCountryIso3(feature);
    if (iso3) {
      // Casos especiales para países que podrían tener problemas con ISO3
      if (iso3 === 'CZE') {
        return "https://flagcdn.com/cz.svg"; // Czechia/República Checa
      }
      
      // Buscar en countryFlags por ISO3
      const flagItem = countryFlags.find(flag => flag.iso3 === iso3);
      if (flagItem) {
        return flagItem.flag;
      }
    }
  }
  
  // Si no tenemos feature o no encontramos por ISO3, seguimos con el método anterior
  const normalizedName = normalizarTexto(countryName);
  
  // 2. Casos especiales
  if (normalizedName.includes('union europea') || normalizedName.includes('european union')) {
    return "https://flagcdn.com/eu.svg"; // La UE tiene un código especial en flagcdn
  } else if (normalizedName.includes('zona euro') || normalizedName.includes('euro area')) {
    return "https://flagcdn.com/eu.svg"; // Usamos también la bandera de la UE para la zona euro
  } else if (normalizedName.includes('espana') || normalizedName.includes('españa') || normalizedName.includes('spain')) {
    return "/logos/spain.svg";
  } else if (normalizedName.includes('alemania') || normalizedName.includes('germany')) {
    return "https://flagcdn.com/de.svg";
  } else if (normalizedName.includes('francia') || normalizedName.includes('france')) {
    return "https://flagcdn.com/fr.svg";
  } else if (normalizedName.includes('reino unido') || normalizedName.includes('united kingdom') || normalizedName.includes('uk')) {
    return "https://flagcdn.com/gb.svg";
  } else if (normalizedName.includes('italia') || normalizedName.includes('italy')) {
    return "https://flagcdn.com/it.svg";
  } else if (normalizedName.includes('suecia') || normalizedName.includes('sweden')) {
    return "https://flagcdn.com/se.svg";
  } else if (normalizedName.includes('finlandia') || normalizedName.includes('finland')) {
    return "https://flagcdn.com/fi.svg";
  } else if (normalizedName.includes('canarias') || normalizedName.includes('canary islands')) {
    return "https://flagcdn.com/es-ct.svg"; // Usamos un código regional para Canarias
  } else if (normalizedName.includes('estados unidos') || normalizedName.includes('united states')) {
    return "https://flagcdn.com/us.svg";
  }
  // Nuevos casos específicos para Czechia
  else if (normalizedName.includes('czech') || normalizedName.includes('chequia') || normalizedName.includes('republica checa')) {
    return "https://flagcdn.com/cz.svg";
  }
  // Otros casos específicos para países que no muestran correctamente su bandera
  else if (normalizedName.includes('belgica') || normalizedName.includes('belgium')) {
    return "https://flagcdn.com/be.svg";
  } else if (normalizedName.includes('dinamarca') || normalizedName.includes('denmark')) {
    return "https://flagcdn.com/dk.svg";
  } else if (normalizedName.includes('islandia') || normalizedName.includes('iceland')) {
    return "https://flagcdn.com/is.svg";
  } else if (normalizedName.includes('noruega') || normalizedName.includes('norway')) {
    return "https://flagcdn.com/no.svg";
  } else if (normalizedName.includes('eslovenia') || normalizedName.includes('slovenia')) {
    return "https://flagcdn.com/si.svg";
  } else if (normalizedName.includes('paises bajos') || normalizedName.includes('netherlands') || normalizedName.includes('holanda')) {
    return "https://flagcdn.com/nl.svg";
  } else if (normalizedName.includes('republica checa') || normalizedName.includes('czech') || normalizedName.includes('czechia')) {
    return "https://flagcdn.com/cz.svg";
  } else if (normalizedName.includes('polonia') || normalizedName.includes('poland')) {
    return "https://flagcdn.com/pl.svg";
  } else if (normalizedName.includes('grecia') || normalizedName.includes('greece')) {
    return "https://flagcdn.com/gr.svg";
  } else if (normalizedName.includes('croacia') || normalizedName.includes('croatia')) {
    return "https://flagcdn.com/hr.svg";
  } else if (normalizedName.includes('hungria') || normalizedName.includes('hungary')) {
    return "https://flagcdn.com/hu.svg";
  } else if (normalizedName.includes('lituania') || normalizedName.includes('lithuania')) {
    return "https://flagcdn.com/lt.svg";
  } else if (normalizedName.includes('eslovaquia') || normalizedName.includes('slovakia')) {
    return "https://flagcdn.com/sk.svg";
  } else if (normalizedName.includes('luxemburgo') || normalizedName.includes('luxembourg')) {
    return "https://flagcdn.com/lu.svg";
  } else if (normalizedName.includes('letonia') || normalizedName.includes('latvia')) {
    return "https://flagcdn.com/lv.svg";
  } else if (normalizedName.includes('chipre') || normalizedName.includes('cyprus')) {
    return "https://flagcdn.com/cy.svg";
  } else if (normalizedName.includes('rusia') || normalizedName.includes('russia')) {
    return "https://flagcdn.com/ru.svg";
  } else if (normalizedName.includes('corea del sur') || normalizedName.includes('south korea')) {
    return "https://flagcdn.com/kr.svg";
  } else if (normalizedName.includes('japon') || normalizedName.includes('japan')) {
    return "https://flagcdn.com/jp.svg";
  } else if (normalizedName.includes('suiza') || normalizedName.includes('switzerland')) {
    return "https://flagcdn.com/ch.svg";
  } else if (normalizedName.includes('macedonia del norte') || normalizedName.includes('north macedonia')) {
    return "https://flagcdn.com/mk.svg";
  } else if (normalizedName.includes('turquia') || normalizedName.includes('turkiye') || normalizedName.includes('turkey')) {
    return "https://flagcdn.com/tr.svg";
  }
  
  // 3. Si aún no encontramos, buscar en el JSON de banderas por nombre
  const countryData = countryFlags.find(country => {
    const normalizedCountry = normalizarTexto(country.country);
    return normalizedName.includes(normalizedCountry);
  });
  
  return countryData?.flag || "https://flagcdn.com/un.svg"; // Devolvemos un por defecto (Naciones Unidas)
}

// Función para obtener el valor del año anterior
const getPreviousYearValue = (
  data: EuropeCSVData[], 
  countryIso3: string | undefined, 
  countryName: string, 
  yearStr: string, 
  sector: string,
  dataDisplayType: DataDisplayType = 'percent_gdp'
): number | null => {
  if (!data || data.length === 0) return null;
  
  const year = parseInt(yearStr);
  if (year <= 1) return null;
  
  const previousYear = (year - 1).toString();
  
  // Mapeo del sector seleccionado al nombre en inglés
  const sectorNameMapping: Record<string, string> = {
    'total': 'All Sectors',
    'business': 'Business enterprise sector',
    'government': 'Government sector',
    'education': 'Higher education sector',
    'nonprofit': 'Private non-profit sector'
  };
  
  const sectorNameEn = sectorNameMapping[sector] || 'All Sectors';
  
  // Buscar datos del país para el año anterior
  const countryPrevYearData = data.filter(item => {
    const isCountry = (countryIso3 && item.ISO3 && normalizarTexto(item.ISO3) === normalizarTexto(countryIso3)) ||
                     normalizarTexto(item.Country) === normalizarTexto(countryName) ||
                     (item.País && normalizarTexto(item.País) === normalizarTexto(countryName));
    const yearMatch = item.Year === previousYear;
    const sectorMatch = item.Sector === sectorNameEn || 
                      (item.Sector === 'All Sectors' && sectorNameEn === 'All Sectors');
    return isCountry && yearMatch && sectorMatch;
  });
  
  if (countryPrevYearData.length === 0) return null;
  
  // Obtener el valor según el tipo de visualización
  if (dataDisplayType === 'percent_gdp') {
    const valueStr = countryPrevYearData[0]['%GDP'] || '';
    if (!valueStr) return null;
    
    try {
      return parseFloat(valueStr.replace(',', '.'));
    } catch {
      return null;
    }
  } else {
    // Modo millones de euros
    const valueStr = countryPrevYearData[0]['Approx_RD_Investment_million_euro'] || '';
    if (!valueStr) return null;
    
    try {
      return parseFloat(valueStr.replace(',', '.'));
    } catch {
      return null;
    }
  }
};

// Añadir una función para posicionar el tooltip inteligentemente y optimizada para móvil
function positionTooltip(
  tooltip: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>, 
  event: MouseEvent, 
  tooltipNode: HTMLElement
): void {
  // Obtener las dimensiones del tooltip
  const tooltipRect = tooltipNode.getBoundingClientRect();
  const tooltipWidth = tooltipRect.width || 320; // Aumentar ancho por defecto para móvil
  const tooltipHeight = tooltipRect.height || 280; // Aumentar altura por defecto
  
  // Obtener dimensiones de la ventana
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Detectar si es móvil (pantalla pequeña)
  const isMobile = windowWidth < 768;
  
  let left, top;
  
  if (isMobile) {
    // En móvil, centrar el tooltip en la pantalla con margen
    const margin = 10;
    
    // Centrar horizontalmente con margen de seguridad
    left = Math.max(margin, (windowWidth - tooltipWidth) / 2);
    
    // Posicionar verticalmente - preferir la parte superior si cabe
    if (event.clientY > windowHeight / 2) {
      // Si el click está en la mitad inferior, mostrar arriba
      top = Math.max(margin, event.clientY - tooltipHeight - 20);
    } else {
      // Si el click está en la mitad superior, mostrar abajo
      top = Math.min(windowHeight - tooltipHeight - margin, event.clientY + 20);
    }
    
    // Asegurar que cabe en la pantalla
    if (tooltipHeight > windowHeight - 2 * margin) {
      top = margin;
    }
  } else {
    // Comportamiento original para desktop
    left = event.clientX + 15;
    top = event.clientY - 15;
    
    // Ajustar horizontalmente si se sale por la derecha
    if (left + tooltipWidth > windowWidth - 10) {
      left = event.clientX - tooltipWidth - 15; // Mover a la izquierda del cursor
    }
    
    // Ajustar verticalmente si se sale por abajo
    if (top + tooltipHeight > windowHeight - 10) {
      if (tooltipHeight < windowHeight - 20) {
        // Si cabe en la pantalla, ajustar hacia arriba
        top = windowHeight - tooltipHeight - 10;
      } else {
        // Si es demasiado grande, colocarlo en la parte superior con scroll
        top = 10;
      }
    }
    
    // Asegurar que no se salga por arriba
    if (top < 10) {
      top = 10;
    }
    
    // Asegurar que no se salga por la izquierda
    if (left < 10) {
      left = 10;
    }
  }
  
  // Aplicar la posición
  tooltip
    .style('left', `${left}px`)
    .style('top', `${top}px`);
}

// Función para formatear números con separador de miles
function formatNumberWithThousandSeparator(value: number, decimals: number = 0): string {
  return value.toLocaleString('es-ES', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

// Formato para valores en el tooltip
const formatValue = (value: number, dataDisplayType: DataDisplayType = 'percent_gdp') => {
  if (dataDisplayType === 'percent_gdp') {
    return value.toFixed(2);
  } else {
    // Para millones de euros, mostrar con separador de miles y sin decimales
    return formatNumberWithThousandSeparator(value, 0);
  }
};

const EuropeanRDMap: React.FC<EuropeanRDMapProps> = ({ 
  data, 
  selectedYear, 
  selectedSector, 
  language, 
  onClick, 
  labels = [], 
  autonomousCommunitiesData = [],
  dataDisplayType = 'percent_gdp'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geojsonData, setGeojsonData] = useState<GeoJsonData | null>(null);
  const [valueRange, setValueRange] = useState<{min: number, max: number}>({min: 0, max: 3.5});
  
  // Acceso a los textos localizados
  const t = mapTexts[language];

  // Obtener la paleta de colores para el sector seleccionado
  const colorPalette = getSectorPalette(selectedSector);
  
  // Preparar paleta de colores para el sector seleccionado
  useEffect(() => {
    // No hacemos nada, pero mantenemos la dependencia para posibles futuras optimizaciones
  }, [selectedSector, colorPalette]);

  // Calcular el rango de valores cuando cambia el sector o el año
  useEffect(() => {
    const newRange = getSectorValueRange(data, selectedYear.toString(), selectedSector, dataDisplayType);
    setValueRange(newRange);
  }, [data, selectedYear, selectedSector, dataDisplayType]);

  // Cargar el GeoJSON
  useEffect(() => {
    // Si ya tenemos los datos, no los volvemos a cargar
    if (geojsonData) return;
    
    setLoading(true);
    setError(null);
    fetch(EUROPE_GEOJSON_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(t.error);
        }
        return response.json();
      })
      .then(geoJsonData => {
        setGeojsonData(geoJsonData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando el mapa:', err);
        setError(t.error);
        setLoading(false);
      });
  }, [t.error, geojsonData]);

  // No necesitamos registrar información de datos en cada render
  useEffect(() => {
    // Este efecto está vacío para eliminar logs innecesarios que afectan el rendimiento
  }, [data]);

  // Crear un caché con useMemo para los valores de los países
  const countryValuesCache = useMemo(() => {
    // Solo calcular si tenemos todos los datos necesarios
    if (!data || !data.length || !geojsonData) return new Map();
    
    const cache = new Map<string, number | null>();
    
    // Precalcular valores para todos los países
    geojsonData.features.forEach(feature => {
      const countryId = feature.properties?.iso_a3 || getCountryName(feature);
      if (countryId) {
        const value = getCountryValue(feature, data, selectedYear.toString(), selectedSector, dataDisplayType);
        cache.set(countryId, value);
      }
    });
    
    return cache;
  }, [data, geojsonData, selectedYear, selectedSector, dataDisplayType]);

  // Función para obtener el valor del país optimizada usando caché
  const getCountryValueOptimized = React.useCallback(
    (feature: GeoJsonFeature): number | null => {
      const countryId = feature.properties?.iso_a3 || getCountryName(feature);
      
      // Usar el valor del caché si existe
      if (countryId && countryValuesCache.has(countryId)) {
        return countryValuesCache.get(countryId) || null;
      }
      
      // Si no está en caché, calcularlo y guardarlo
      const value = getCountryValue(feature, data, selectedYear.toString(), selectedSector, dataDisplayType);
      if (countryId) {
        // Modificar el Map es seguro porque es local a este componente
        countryValuesCache.set(countryId, value);
      }
      
      return value;
    },
    [data, selectedYear, selectedSector, dataDisplayType, countryValuesCache]
  );

  // Función para obtener el título del mapa basado en los datos seleccionados
  const getMapTitle = (): string => {
    return `${t.rdInvestmentByCountry} · ${selectedYear}`;
  };
  
  // Función para obtener el nombre del sector basado en el sector seleccionado
  // Se utiliza en el componente al renderizar etiquetas del mapa
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getSectorText = (): string => {
    // Determinar el nombre del sector
    let sectorId = selectedSector.toLowerCase();
    
    // Si se pasa un nombre de sector completo, extraer el ID
    if (sectorId.includes('sector')) {
      const normalizedSector = normalizarTexto(sectorId);
      
      if (normalizedSector.includes('business') || normalizedSector.includes('empresa')) {
        sectorId = 'business';
      } else if (normalizedSector.includes('government') || normalizedSector.includes('gobierno')) {
        sectorId = 'government';
      } else if (normalizedSector.includes('education') || normalizedSector.includes('educacion')) {
        sectorId = 'education';
      } else if (normalizedSector.includes('nonprofit') || normalizedSector.includes('sin fines')) {
        sectorId = 'nonprofit';
      } else {
        // Es probablemente ya un ID (total, business, etc.)
        sectorId = selectedSector.toLowerCase();
        // Normalizar para asegurar compatibilidad
        if (sectorId === 'all') sectorId = 'total';
      }
    }
    
    const sectorKey = `sector_${sectorId}` as keyof typeof t;
    return t[sectorKey] || t.allSectors;
  };
  
  // Función para obtener el color del sector para el título
  const getSectorColor = (): string => {
    // Normalizar el ID del sector para asegurar compatibilidad
    let normalizedId = selectedSector.toLowerCase();
    
    // Transformar nombres de sectores en inglés a IDs
    if (normalizedId === 'all sectors' || normalizedId === 'all' || normalizedId === 'total') normalizedId = 'total';
    if (normalizedId === 'business enterprise sector') normalizedId = 'business';
    if (normalizedId === 'government sector') normalizedId = 'government';
    if (normalizedId === 'higher education sector') normalizedId = 'education';
    if (normalizedId === 'private non-profit sector') normalizedId = 'nonprofit';
    
    // Asegurar que usamos una clave válida para SECTOR_COLORS
    const validSectorId = (normalizedId in SECTOR_COLORS) ? normalizedId : 'total';
    const baseColor = SECTOR_COLORS[validSectorId as keyof typeof SECTOR_COLORS];
    
    // Devolver una versión más oscura del color para el texto
    return d3.color(baseColor)?.darker(0.8)?.toString() || '#333333';
  };

  // Renderizar el mapa cuando los datos GeoJSON están disponibles
  useEffect(() => {
    if (!svgRef.current || !geojsonData) return;

    const currentSvg = svgRef.current;

    const renderMap = () => {
      const svg = d3.select(currentSvg);
      svg.selectAll('*').remove();

      const width = 600;
      const height = 450;
      
      // Configurar la proyección
      const projection = d3.geoMercator()
        .center([10, 55])
        .scale(450)
        .translate([width / 2, height / 2]);
      
      const path = d3.geoPath().projection(projection);
      
      // Crear el grupo para el mapa
      const mapGroup = svg.append('g')
        .attr('transform', 'translate(0, 30)'); // Desplazar el mapa para dejar espacio al título
      
      // Preparar datos para poder calcular el ranking
      const countryValues: Array<{ feature: GeoJsonFeature; value: number | null }> = [];
      
      // Primero, recopilamos todos los valores de los países
      geojsonData.features.forEach(feature => {
        const value = getCountryValueOptimized(feature);
        if (value !== null) {
          countryValues.push({ feature, value });
        }
      });
      
      // Ordenar países por valor de mayor a menor (para calcular ranking)
      // Usar función estable de comparación para garantizar consistencia
      const sortedCountries = countryValues
        .sort((a, b) => {
          // Comparar primero por valor
          const valueDiff = (b.value || 0) - (a.value || 0);
          if (valueDiff !== 0) return valueDiff;
          
          // Si los valores son iguales, ordenar alfabéticamente para mantener un orden estable
          const nameA = getCountryName(a.feature);
          const nameB = getCountryName(b.feature);
          return nameA.localeCompare(nameB);
        });
      
      // Función para obtener el ranking de un país
      const getCountryRank = (feature: GeoJsonFeature): { rank: number, total: number } | null => {
        const value = getCountryValueOptimized(feature);
        if (value === null) return null;
        
        // Obtener el nombre del país
        const countryName = getCountryName(feature);
        
        // Si es una entidad supranacional, no mostrar ranking
        if (isSupranationalEntity(countryName)) return null;
        
        // Filtrar solo los países (no entidades supranacionales) para el ranking
        const onlyCountriesRanking = sortedCountries.filter(
          item => !isSupranationalEntity(getCountryName(item.feature))
        );
        
        // Encontrar la posición en la lista filtrada
        const countryIndex = onlyCountriesRanking.findIndex(
          item => item.feature === feature
        );
        
        if (countryIndex === -1) return null;
        
        return {
          rank: countryIndex + 1, // +1 porque los índices empiezan en 0
          total: onlyCountriesRanking.length
        };
      };
      
      // Renderizar países
      mapGroup.selectAll('path')
        .data(geojsonData.features)
        .enter()
        .append('path')
        .attr('d', (d: GeoJsonFeature) => path(d) || '')
        .attr('fill', (d: GeoJsonFeature) => {
          const value = getCountryValueOptimized(d);
          return getColorForValue(value, selectedSector, data, selectedYear.toString(), dataDisplayType);
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('class', 'country')
        .on('mouseover', function(event: MouseEvent, d: GeoJsonFeature) {
          // Cambiar el estilo al pasar el mouse
          d3.select(this)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
            
          // Obtener el nombre del país en el idioma correspondiente
          let countryName;
          const countryIso3 = getCountryIso3(d);
          const feature = d.properties || {};
          
          // Buscar el país en los datos originales para obtener el nombre correcto
          const countryData = data.find(item => 
            (countryIso3 && item.ISO3 && normalizarTexto(item.ISO3) === normalizarTexto(countryIso3)) ||
            normalizarTexto(item.Country) === normalizarTexto(getCountryName(d))
          );
          
          if (language === 'es') {
            // Para español, intentar usar el nombre en español de los datos
            countryName = countryData?.País || feature.NAME_ES || getCountryName(d);
          } else {
            // Para inglés, usar el nombre en inglés de los datos
            countryName = countryData?.Country || feature.NAME_EN || feature.NAME || getCountryName(d);
          }
          
          const value = getCountryValueOptimized(d);
          
          // Obtener el ranking del país
          const rankInfo = getCountryRank(d);
          
          // Positioning directly with clientX/clientY for better accuracy
          const tooltip = d3.select('.country-tooltip');
          
          // Verificar si es España
          const isSpain = (countryName && (
            normalizarTexto(String(countryName)).includes('spain') || 
            normalizarTexto(String(countryName)).includes('espana') ||
            normalizarTexto(String(countryName)).includes('españa')
          ));
          
          // Verificar si es la UE
            const isEU = (countryName && (
              normalizarTexto(String(countryName)).includes('union europea') || 
              normalizarTexto(String(countryName)).includes('european union')
            ));
            
          // Verificar si es Canarias
          const isCanarias = (countryName && (
            normalizarTexto(String(countryName)).includes('canarias') || 
            normalizarTexto(String(countryName)).includes('canary islands')
          ));
          
          // Verificar si es un caso especial (UE, Zona Euro, etc.)
          const normalizedName = normalizarTexto(String(countryName));
          const isEuroArea = normalizedName.includes('zona euro') || normalizedName.includes('euro area');
          const isEuroArea2023 = isEuroArea && normalizedName.includes('2023');
          
          let tooltipContent = '';
          
          // Si no hay datos, mostrar un mensaje simple
          if (value === null) {
            tooltipContent = `
              <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                  <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                    <img src="${getCountryFlagUrl(String(countryName), d)}" class="w-full h-full object-cover" alt="${countryName}" />
                  </div>
                  <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
                </div>
                <div class="p-4">
                  <p class="text-gray-500">${t.noData}</p>
                </div>
              </div>
            `;
          } else if (value === 0) {
            // Caso especial para valores exactamente cero
            tooltipContent = `
              <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                  <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                    <img src="${getCountryFlagUrl(String(countryName), d)}" class="w-full h-full object-cover" alt="${countryName}" />
                  </div>
                  <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
                </div>
                <div class="p-4">
                  <div class="mb-3">
                    <div class="flex items-center text-gray-500 text-sm mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                      <span>
                        ${language === 'es' ? 'Inversión I+D' : 'R&D Investment'}
                      </span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-xl font-bold text-blue-700">${formatValue(0, dataDisplayType)}</span>
                      <span class="ml-1 text-gray-600 text-sm">${dataDisplayType === 'percent_gdp' ? '%' : 'M€'}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          } else {
            // Obtener valores para comparativas
            const euValue = !isEU ? getEUValue(data, selectedYear.toString(), selectedSector, dataDisplayType) : null;
            const spainValue = !isSpain ? getSpainValue(data, selectedYear.toString(), selectedSector, dataDisplayType) : null;
            const canariasValue = !isCanarias ? getCanariasValue(autonomousCommunitiesData, selectedYear.toString(), selectedSector, dataDisplayType) : null;
            const previousYearValue = getPreviousYearValue(data, d.properties?.iso_a3, String(countryName), selectedYear.toString(), selectedSector, dataDisplayType);
            
            // Preparar HTML para la comparación YoY
            let yoyComparisonHtml = '';
            if (previousYearValue !== null && previousYearValue !== 0) {
              const difference = value - previousYearValue;
              const percentDiff = (difference / previousYearValue) * 100;
              const formattedDiff = percentDiff.toFixed(2);
              const isPositive = difference > 0;
              yoyComparisonHtml = `
                <div class="${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center mt-1 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                    <path d="${isPositive ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}"></path>
                  </svg>
                  <span>${isPositive ? '+' : ''}${formattedDiff}% vs ${selectedYear - 1}</span>
                </div>
              `;
            } else {
              yoyComparisonHtml = `<div class="text-gray-400 flex items-center mt-1 text-xs">--</div>`;
            }
            
            // Preparar comparaciones
            let euComparisonHtml = '';
            if (!isEU && euValue !== null && euValue > 0) {
                const difference = value - euValue;
                
                if (dataDisplayType === 'percent_gdp') {
                  // Para modo porcentaje PIB
                  const percentDiff = (difference / euValue) * 100;
                  const formattedDiff = percentDiff.toFixed(1);
                  const isPositive = difference > 0;
                  const color = isPositive ? 'text-green-600' : 'text-red-600';
                  
                  euComparisonHtml = `
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                        `vs Unión Europea (${euValue.toFixed(2)}%):` : 
                        `vs European Union (${euValue.toFixed(2)}%):`}</span>
                      <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                    </div>
                  `;
                } else {
                  // Para modo millones de euros (valores absolutos)
                  const isPositive = difference > 0;
                  const color = isPositive ? 'text-green-600' : 'text-red-600';
                  
                  // Variables intermedias para evitar problemas
                  const isEs = language === 'es';
                  const labelText = isEs
                    ? `vs Media UE (${formatNumberWithThousandSeparator(euValue, 0)} M€):`
                    : `vs Avg EU (${formatNumberWithThousandSeparator(euValue, 0)} M€):`;
                  
                  euComparisonHtml = `
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600 inline-block w-44">${labelText}</span>
                      <span class="font-medium ${color}">${isPositive ? '+' : '-'}${formatNumberWithThousandSeparator(Math.abs(difference), 0)} M€</span>
                    </div>
                  `;
                }
            } else if (!isEU) {
              euComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                    dataDisplayType === 'percent_gdp' ? 'vs Unión Europea:' : 'vs Media UE:' : 
                    dataDisplayType === 'percent_gdp' ? 'vs European Union:' : 'vs Avg EU:'}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
            
            let spainComparisonHtml = '';
            if (!isSpain && spainValue !== null && spainValue > 0) {
              if (dataDisplayType === 'percent_gdp') {
                // Para porcentaje de PIB mostrar la comparación en porcentaje
                const difference = value - spainValue;
                const percentDiff = (difference / spainValue) * 100;
                const formattedDiff = percentDiff.toFixed(1);
                const isPositive = difference > 0;
                const color = isPositive ? 'text-green-600' : 'text-red-600';
                
                spainComparisonHtml = `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 inline-block w-44">${language === 'es' ? 
                      `vs España (${spainValue.toFixed(2)}%):` : 
                      `vs Spain (${spainValue.toFixed(2)}%):`}</span>
                    <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                  </div>
                `;
              } else {
                // Para millones de euros mostrar la diferencia en valor absoluto
                const difference = value - spainValue;
                const isPositive = difference > 0;
                const color = isPositive ? 'text-green-600' : 'text-red-600';
                
                // Variables intermedias para evitar problemas
                const isEs = language === 'es';
                const labelText = isEs
                  ? `vs España (${formatNumberWithThousandSeparator(spainValue, 0)} M€):`
                  : `vs Spain (${formatNumberWithThousandSeparator(spainValue, 0)} M€):`;
                
                spainComparisonHtml = `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 inline-block w-44">${labelText}</span>
                    <span class="font-medium ${color}">${isPositive ? '+' : '-'}${formatNumberWithThousandSeparator(Math.abs(difference), 0)} M€</span>
                  </div>
                `;
              }
            } else if (!isSpain) {
              spainComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-44">${language === 'es' ? 'vs España:' : 'vs Spain:'}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
            
            let canariasComparisonHtml = '';
            if (!isCanarias && canariasValue !== null && canariasValue > 0) {
              if (dataDisplayType === 'percent_gdp') {
                // Para porcentaje de PIB mostrar la comparación en porcentaje
                const difference = value - canariasValue;
                const percentDiff = (difference / canariasValue) * 100;
                const formattedDiff = percentDiff.toFixed(1);
                const isPositive = difference > 0;
                const color = isPositive ? 'text-green-600' : 'text-red-600';
                
                // Variables intermedias para evitar problemas de tipado
                const isEs = language === 'es';
                const labelText = isEs
                  ? `vs Canarias (${canariasValue.toFixed(2)}%):`
                  : `vs Canary Islands (${canariasValue.toFixed(2)}%):`;
                
                canariasComparisonHtml = `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 inline-block w-44">${labelText}</span>
                    <span class="font-medium ${color}">${isPositive ? '+' : ''}${formattedDiff}%</span>
                  </div>
                `;
              } else {
                // Para millones de euros mostrar la diferencia en valor absoluto
                const difference = value - canariasValue;
                const isPositive = difference > 0;
                const color = isPositive ? 'text-green-600' : 'text-red-600';
                
                // Variables intermedias para evitar problemas de tipado
                const isEs = language === 'es';
                const labelText = isEs
                  ? `vs Canarias (${formatNumberWithThousandSeparator(canariasValue, 0)} M€):`
                  : `vs Canary Islands (${formatNumberWithThousandSeparator(canariasValue, 0)} M€):`;
                
                canariasComparisonHtml = `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600 inline-block w-44">${labelText}</span>
                    <span class="font-medium ${color}">${isPositive ? '+' : '-'}${formatNumberWithThousandSeparator(Math.abs(difference), 0)} M€</span>
                  </div>
                `;
              }
            } else if (!isCanarias) {
              canariasComparisonHtml = `
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600 inline-block w-44">${language === 'es' ? 'vs Canarias:' : 'vs Canary Islands:'}</span>
                  <span class="font-medium text-gray-400">--</span>
                </div>
              `;
            }
            
            // Buscar etiqueta para este país y año
            let label = '';
            // Obtener la etiqueta directamente del registro de datos si existe
            const countryData = data.find(item => {
              // Intentar coincidir por ISO3 primero
              if (d.properties?.iso_a3 && item.ISO3) {
                if (normalizarTexto(item.ISO3) === normalizarTexto(d.properties.iso_a3)) {
                  const yearMatch = item.Year === selectedYear.toString();
                  const sectorMatch = item.Sector === selectedSector || 
                                  (item.Sector === 'All Sectors' && selectedSector === 'All Sectors');
                  return yearMatch && sectorMatch;
                }
              }
              
              // Si no coincide por ISO3, intentar por nombre
              const itemCountryNormalized = normalizarTexto(item.Country);
              const itemPaisNormalized = normalizarTexto(item.País || '');
              const countryNameNormalized = normalizarTexto(String(countryName));
              
              // Verificar si coincide el país (en inglés o español)
              const countryMatches = 
                itemCountryNormalized === countryNameNormalized ||
                itemPaisNormalized === countryNameNormalized;
              
              // Verificar si coincide el año y sector
              const yearMatches = item.Year === selectedYear.toString();
              const sectorMatches = item.Sector === selectedSector;
              
              return countryMatches && yearMatches && sectorMatches;
            });
            
            if (countryData?.label_percent_gdp_id) {
              label = countryData.label_percent_gdp_id;
            }
            
            // Compilar comparaciones - Siempre incluir todas las comparaciones
            const comparisonsHtml = `${euComparisonHtml}${spainComparisonHtml}${canariasComparisonHtml}`;
            
            // Renderizar el tooltip con el mismo diseño que CountryRankingChart
            tooltipContent = `
              <div class="max-w-xs bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <!-- Header con el nombre del país -->
                <div class="flex items-center p-3 bg-blue-50 border-b border-blue-100">
                  <div class="w-8 h-6 mr-2 rounded overflow-hidden relative">
                    <img src="${getCountryFlagUrl(String(countryName), d)}" class="w-full h-full object-cover" alt="${countryName}" />
                  </div>
                  <h3 class="text-lg font-bold text-gray-800">${countryName || 'Desconocido'}</h3>
                </div>
                
                <!-- Contenido principal -->
                <div class="p-4">
                  <!-- Métrica principal -->
                  <div class="mb-3">
                    <div class="flex items-center text-gray-500 text-sm mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m22 7-7.5 7.5-7-7L2 13"></path><path d="M16 7h6v6"></path></svg>
                      <span>
                        ${language === 'es' ? 'Inversión I+D:' : 'R&D Investment:'}
                      </span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-xl font-bold text-blue-700">
                        ${formatValue(value, dataDisplayType)}
                      </span>
                      <span class="ml-1 text-gray-600 text-sm">${dataDisplayType === 'percent_gdp' ? '%' : 'M€'}</span>
                      ${(isEU || isEuroArea) && dataDisplayType !== 'percent_gdp' ? 
                        `<span class="ml-1 text-gray-600 text-sm">${language === 'es' ? 'Media' : 'Avg'}</span>` : ''}
                      ${label ? `<span class="ml-2 text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">${label}</span>` : ''}
                    </div>
                    ${yoyComparisonHtml}
                  </div>
                  
                  ${(isEU || isEuroArea) && dataDisplayType !== 'percent_gdp' ? `
                  <div class="mt-1 mb-3 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                    ${(() => {
                      if (isEU) {
                        return language === 'es' 
                          ? 'Valor promedio calculado dividiendo el total por 27 países' 
                          : 'Average value calculated by dividing the total by 27 countries';
                      } else if (isEuroArea2023) {
                        return language === 'es'
                          ? 'Valor promedio calculado dividiendo el total por 20 países'
                          : 'Average value calculated by dividing the total by 20 countries';
                      } else {
                        return language === 'es'
                          ? 'Valor promedio calculado dividiendo el total por 19 países'
                          : 'Average value calculated by dividing the total by 19 countries';
                      }
                    })()}
                  </div>
                  ` : ''}
                  
                  <!-- Ranking (si está disponible y no es entidad supranacional) -->
                  ${rankInfo && !isSupranationalEntity(String(countryName)) ? `
                  <div class="mb-4">
                    <div class="bg-yellow-50 p-2 rounded-md flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-2">
                        <circle cx="12" cy="8" r="6" />
                        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                      </svg>
                      <span class="font-medium">Rank </span>
                      <span class="font-bold text-lg mx-1">${rankInfo.rank}</span>
                      <span class="text-gray-600">${language === 'es' ? `de ${rankInfo.total}` : `of ${rankInfo.total}`}</span>
                    </div>
                  </div>
                  ` : ''}
                  
                  <!-- Comparativas -->
                  <div class="space-y-2 border-t border-gray-100 pt-3">
                    <div class="text-xs text-gray-500 mb-1">${language === 'es' ? 'Comparativa' : 'Comparative'}</div>
                    ${comparisonsHtml}
                  </div>
                </div>
                
                <!-- Footer -->
                ${label && getLabelDescription(label, language) ? `
                  <div class="bg-gray-50 px-3 py-2 flex items-center text-xs text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                    <span>${label} - ${getLabelDescription(label, language)}</span>
                  </div>
                ` : ''}
              </div>
            `;
          }
          
          // Actualizar el contenido del tooltip y mostrarlo
          tooltip.html(tooltipContent)
            .style('display', 'block')
            .style('opacity', 1);
          
          // Posicionar el tooltip de manera inteligente
          const tooltipNode = document.querySelector('.country-tooltip') as HTMLElement;
          if (tooltipNode) {
            positionTooltip(tooltip, event, tooltipNode);
          }
        })
        .on('mousemove', function(event: MouseEvent) {
          // Actualizar posición del tooltip con suavidad usando clientX/clientY
          const tooltip = d3.select('.country-tooltip');
          const tooltipNode = document.querySelector('.country-tooltip') as HTMLElement;
          if (tooltipNode) {
            positionTooltip(tooltip, event, tooltipNode);
          }
        })
        .on('mouseout', function() {
          // Restaurar el estilo al quitar el mouse
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
            
          // Fade out tooltip
          const tooltip = d3.select('.country-tooltip');
          tooltip.style('opacity', 0);
          
          // Ocultar después de la transición
          setTimeout(() => {
            if (tooltip.style('opacity') === '0') {
              tooltip.style('display', 'none');
            }
          }, 100);
        })
        .on('click', (event: MouseEvent, d: GeoJsonFeature) => {
          if (!onClick) return;
          const countryName = getCountryName(d);
          onClick(countryName);
        })
        .style('cursor', onClick ? 'pointer' : 'default');
      
      // Crear etiquetas para la leyenda basadas en el rango de valores
      const min = valueRange.min;
      const max = valueRange.max;
      const range = max - min;
      
      const threshold1 = min + (range * 0.2);
      const threshold2 = min + (range * 0.4);
      const threshold3 = min + (range * 0.6);
      const threshold4 = min + (range * 0.8);
      
      // Redondear los umbrales para mayor legibilidad
      const formatLegendValue = (value: number) => {
        if (dataDisplayType === 'percent_gdp') {
          return `${value.toFixed(2)}%`;
        } else {
          // Redondear a la centena más cercana si es menor a 10.000, si no a la millar
          let rounded = value;
          if (value < 10000) {
            rounded = Math.round(value / 100) * 100;
          } else {
            rounded = Math.round(value / 1000) * 1000;
          }
          return `${formatNumberWithThousandSeparator(rounded, 0)} M€`;
        }
      };

      // Mejorar el degradado de colores para que el contraste sea más claro
      // Usar d3.interpolate para crear un gradiente perceptible entre min y max
      const colorInterpolator = d3.interpolateRgb(colorPalette.MIN, colorPalette.MAX);
      function getGradientColor(val: number) {
        if (max === min) return colorPalette.MID;
        const t = (val - min) / (max - min);
        return colorInterpolator(t);
      }

      // Añadir leyenda
      const legendGroup = svg.append('g')
        .attr('transform', `translate(20, ${height - 170})`);
      
      // Añadir primero 'Sin datos' y luego '0' a la leyenda
      const legendLabels = [
        { color: colorPalette.NULL, label: language === 'es' ? 'Sin datos' : 'No data' },
        { color: colorPalette.ZERO, label: '0' + (dataDisplayType === 'percent_gdp' ? '%' : ' M€') },
      ];
      // Luego los rangos normales
      const legendValues = [min, threshold1, threshold2, threshold3, threshold4, max];
      legendValues.forEach((val, i) => {
        let label = '';
        if (i === 0) label = `< ${formatLegendValue(threshold1)}`;
        else if (i === legendValues.length - 1) label = `> ${formatLegendValue(threshold4)}`;
        else label = `${formatLegendValue(legendValues[i])}`;
        legendLabels.push({ color: getGradientColor(val), label });
      });
      // Renderizar la leyenda sin solapamientos
      legendLabels.forEach((item, i) => {
        legendGroup.append('rect')
          .attr('x', 0)
          .attr('y', i * 20)
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', item.color);
        legendGroup.append('text')
          .attr('x', 20)
          .attr('y', i * 20 + 12)
          .text(item.label)
          .attr('font-size', '12px')
          .attr('fill', '#000000');
      });
    };

    renderMap();
  }, [geojsonData, getCountryValueOptimized, language, onClick, colorPalette, valueRange, t, labels, autonomousCommunitiesData, dataDisplayType]);
  
  return (
    <div className="relative w-full h-full" ref={mapContainerRef}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <p className="text-gray-600">
            {t.loading}
          </p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <div className="mb-2 text-center">
        <h3 className="text-sm font-semibold text-gray-800">
          {getMapTitle()}
        </h3>
                 <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800" 
             style={{ backgroundColor: `${d3.color(getSectorColor())?.copy({ opacity: 0.15 })}` }}>
          {(() => {
            // Obtener el nombre exacto del sector desde los datos
            const sectorMapping: Record<string, string> = {
              'total': 'All Sectors',
              'business': 'Business enterprise sector',
              'government': 'Government sector',
              'education': 'Higher education sector',
              'nonprofit': 'Private non-profit sector'
            };
            
            // Normalizar el ID del sector
            let normalizedId = selectedSector.toLowerCase();
            if (normalizedId === 'all sectors' || normalizedId === 'all' || normalizedId === 'total') normalizedId = 'total';
            if (normalizedId === 'business enterprise sector') normalizedId = 'business';
            if (normalizedId === 'government sector') normalizedId = 'government';
            if (normalizedId === 'higher education sector') normalizedId = 'education';
            if (normalizedId === 'private non-profit sector') normalizedId = 'nonprofit';
            
            // Obtener el nombre del sector en inglés
            const sectorNameEn = sectorMapping[normalizedId] || 'All Sectors';
            
            // Traducir al idioma actual
            if (language === 'es') {
              switch (sectorNameEn) {
                case 'All Sectors':
                  return 'Todos los sectores';
                case 'Business enterprise sector':
                  return 'Sector empresarial';
                case 'Government sector':
                  return 'Sector gubernamental';
                case 'Higher education sector':
                  return 'Enseñanza Superior';
                case 'Private non-profit sector':
                  return 'Instituciones privadas sin fines de lucro';
                default:
                  return sectorNameEn;
              }
            } else {
              return sectorNameEn;
            }
          })()}
        </div>
      </div>
      
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        viewBox="0 0 600 450" 
        preserveAspectRatio="xMidYMid meet"
      />
      
      {/* Tooltip permanente en el DOM, controlado por D3 directamente */}
      <div 
        className="country-tooltip absolute z-50 pointer-events-none"
        style={{
          display: 'none',
          position: 'fixed',
          opacity: 0,
          transition: 'opacity 0.1s ease-in-out',
          maxWidth: '350px'
        }}
      >
      </div>
    </div>
  );
};

export default EuropeanRDMap; 