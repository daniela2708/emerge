/**
 * Paleta de colores para el Dashboard BI
 * 
 * Este archivo contiene todas las definiciones de colores utilizados en el proyecto,
 * organizados por contexto para facilitar su uso en diferentes componentes.
 */

// Colores institucionales de España
export const SPAIN_COLORS = {
  RED: '#AA151B',
  YELLOW: '#F1BF00'
};

// Colores institucionales de Canarias
export const CANARY_COLORS = {
  BLUE: '#0033A0',
  YELLOW: '#FFD100',
  WHITE: '#FFFFFF',
  DARK_GRAY: '#4D4D4F'
};

// Colores institucionales de la Unión Europea
export const EU_COLORS = {
  // Colores primarios
  PRIMARY_BLUE: '#003399', // Azul UE - Color primario oficial
  PRIMARY_YELLOW: '#FFCC00', // Amarillo UE - Color primario oficial
  
  // Colores alternos/complementarios
  ALT_BLUE: '#0056A0', // Azul claro - Color alterno
  ALT_YELLOW: '#FAD201', // Amarillo oro claro - Color alterno
};

// Color corporativo de EMERGE (cliente)
export const EMERGE_COLOR = '#2596be';

// Paleta extendida para el dashboard
export const DASHBOARD_PALETTE = {
  PRIMARY: '#4059ad',
  SECONDARY: '#6b9ac4',
  ACCENT: '#a31621',
  WARNING: '#f4b942',
  SUCCESS: '#97d8c4',
  BACKGROUND: '#fffdf7',
  LIGHT_BACKGROUND: '#eff2f1'
};

// Objeto combinado para facilitar importación
const COLORS = {
  SPAIN: SPAIN_COLORS,
  CANARY: CANARY_COLORS,
  EU: EU_COLORS,
  EMERGE: EMERGE_COLOR,
  DASHBOARD: DASHBOARD_PALETTE
};

export default COLORS;

// Función para obtener colores por contexto
export const getContextColors = (context: 'spain' | 'canary' | 'eu' | 'emerge' | 'dashboard'): Record<string, string> => {
  switch (context) {
    case 'spain':
      return SPAIN_COLORS;
    case 'canary':
      return CANARY_COLORS;
    case 'eu':
      return EU_COLORS;
    case 'emerge':
      return { PRIMARY: EMERGE_COLOR };
    case 'dashboard':
      return DASHBOARD_PALETTE;
    default:
      return DASHBOARD_PALETTE;
  }
};

// Colores para los sectores de I+D
export const SECTOR_COLORS = {
  business: "#008080",     // Teal
  government: "#166088",   // Azul cobalto (más compatible con la paleta)
  education: "#2A9D8F",    // Verde esmeralda
  nonprofit: "#1C7C54",    // Verde bosque oscuro
  total: "#014f86"         // Azul petróleo oscuro (para "All sectors")
}; 