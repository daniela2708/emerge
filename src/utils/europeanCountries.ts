// Lista centralizada de códigos de países europeos
// Esta lista debe ser consistente entre ResearchersEuropeanMap y ResearcherRankingChart
export const EUROPEAN_COUNTRY_CODES = [
  // Códigos ISO2
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 
  'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'UK', 'GB', 'CH', 
  'NO', 'IS', 'TR', 'ME', 'MK', 'AL', 'RS', 'BA', 'MD', 'UA', 
  'XK', 'RU', 'EU27_2020', 'EA19', 'EA20',
  // Códigos ISO3
  'AUT', 'BEL', 'BGR', 'CYP', 'CZE', 'DEU', 'DNK', 'EST', 'GRC', 'ESP',
  'FIN', 'FRA', 'HRV', 'HUN', 'IRL', 'ITA', 'LTU', 'LUX', 'LVA', 'MLT',
  'NLD', 'POL', 'PRT', 'ROU', 'SWE', 'SVN', 'SVK', 'GBR', 'CHE', 'NOR',
  'ISL', 'TUR', 'MNE', 'MKD', 'ALB', 'SRB', 'BIH', 'MDA', 'UKR', 'RUS'
];

// Función para verificar si un código de país es europeo
export const isEuropeanCountry = (countryCode: string): boolean => {
  return EUROPEAN_COUNTRY_CODES.includes(countryCode);
};

// Función para verificar si múltiples códigos corresponden a un país europeo
export const isEuropeanCountryMultiple = (codes: (string | undefined)[]): boolean => {
  return codes.some(code => code && isEuropeanCountry(code));
}; 