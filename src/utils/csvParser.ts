import { RDInvestmentData } from '../data/rdInvestment';

/**
 * Función para parsear datos CSV a formato utilizable por la aplicación
 * Soporta separadores de coma (,), punto y coma (;) y pipe (|)
 */
export const parseCSV = (
  csvContent: string, 
  options: {
    delimiter?: string;        // Auto-detectado si no se especifica
    hasHeader?: boolean;       // true por defecto
    yearColumns?: boolean;     // Si las columnas son años (true) o si las filas son años (false)
    idColumn?: number;         // Índice de la columna de identificadores
    nameColumnEs?: number;     // Índice de la columna de nombres en español
    nameColumnEn?: number;     // Índice de la columna de nombres en inglés
    typeColumn?: number;       // Índice de la columna de tipo (country, region, average)
    skipRows?: number[];       // Filas a omitir (por ejemplo, subtotales)
    skipColumns?: number[];    // Columnas a omitir
    yearStart?: number;        // Año inicial (si las columnas son años)
    defaultType?: 'country' | 'region' | 'average'; // Tipo por defecto si no hay columna de tipo
  } = {}
): RDInvestmentData[] => {
  // Valores por defecto
  const hasHeader = options.hasHeader !== false;
  const yearColumns = options.yearColumns !== false;
  const idColumn = options.idColumn || 0;
  const nameColumnEs = options.nameColumnEs || 1;
  const nameColumnEn = options.nameColumnEn || (options.nameColumnEs ? options.nameColumnEs + 1 : 2);
  const typeColumn = options.typeColumn;
  const skipRows = options.skipRows || [];
  const skipColumns = options.skipColumns || [];
  const defaultType = options.defaultType || 'country';
  
  // Detectar el delimitador si no se especifica
  let delimiter = options.delimiter;
  if (!delimiter) {
    if (csvContent.includes(';')) {
      delimiter = ';';
    } else if (csvContent.includes('|')) {
      delimiter = '|';
    } else {
      delimiter = ',';
    }
  }
  
  // Dividir el contenido en líneas
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Omitir la fila de encabezado si es necesario
  const dataStartIndex = hasHeader ? 1 : 0;
  
  // Procesar cada línea
  const result: RDInvestmentData[] = [];
  
  if (yearColumns) {
    // Las columnas representan años
    const header = hasHeader ? lines[0].split(delimiter) : [];
    
    // Determinar años a partir de las columnas
    const yearColumns: number[] = [];
    const years: number[] = [];
    
    if (hasHeader) {
      header.forEach((col, index) => {
        if (!skipColumns.includes(index) && 
            index !== idColumn && 
            index !== nameColumnEs && 
            index !== nameColumnEn && 
            (typeColumn === undefined || index !== typeColumn)) {
          // Intentar extraer el año de la columna
          const yearMatch = col.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            const year = parseInt(yearMatch[0]);
            yearColumns.push(index);
            years.push(year);
          }
        }
      });
    } else if (options.yearStart) {
      // Si no hay encabezado pero se especifica año inicial
      const dataColumns = lines[0].split(delimiter).length;
      const nonDataColumns = [idColumn, nameColumnEs, nameColumnEn];
      if (typeColumn !== undefined) nonDataColumns.push(typeColumn);
      
      let yearIndex = options.yearStart;
      for (let i = 0; i < dataColumns; i++) {
        if (!skipColumns.includes(i) && !nonDataColumns.includes(i)) {
          yearColumns.push(i);
          years.push(yearIndex++);
        }
      }
    }
    
    // Procesar cada línea de datos
    for (let i = dataStartIndex; i < lines.length; i++) {
      if (skipRows.includes(i)) continue;
      
      const columns = lines[i].split(delimiter);
      
      // Crear el objeto de datos
      const id = columns[idColumn]?.trim() || `entity_${i}`;
      const nameEs = columns[nameColumnEs]?.trim() || id;
      const nameEn = columns[nameColumnEn]?.trim() || nameEs;
      const type = typeColumn !== undefined && columns[typeColumn]
        ? (columns[typeColumn].trim() as 'country' | 'region' | 'average')
        : defaultType;
      
      const values: {[year: number]: number | null} = {};
      
      // Llenar los valores por año
      yearColumns.forEach((colIndex, index) => {
        const year = years[index];
        const value = columns[colIndex]?.trim();
        
        if (value && !isNaN(Number(value.replace(',', '.')))) {
          values[year] = Number(value.replace(',', '.'));
        } else {
          values[year] = null;
        }
      });
      
      result.push({
        id,
        name: {
          es: nameEs,
          en: nameEn
        },
        type,
        values
      });
    }
  } else {
    // Las filas representan años, cada columna es una entidad diferente
    // Esta implementación depende de los detalles específicos, podemos ampliarla si es necesario
    // Por ahora, implementamos solo el caso de columnas como años
  }
  
  return result;
};

/**
 * Ejemplo de uso:
 * 
 * const csvContent = `
 * id;name_es;name_en;type;2012;2013;2014
 * eu27;Unión Europea;European Union;average;2.08;2.08;2.09
 * es;España;Spain;country;1.29;1.27;1.23
 * `;
 * 
 * const data = parseCSV(csvContent, { 
 *   delimiter: ';',
 *   hasHeader: true,
 *   yearColumns: true,
 *   idColumn: 0,
 *   nameColumnEs: 1,
 *   nameColumnEn: 2,
 *   typeColumn: 3
 * });
 */

// Función para cargar un archivo CSV desde una URL
export const loadCSVFromURL = async (
  url: string, 
  options: Parameters<typeof parseCSV>[1] = {}
): Promise<RDInvestmentData[]> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al cargar el CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    return parseCSV(csvContent, options);
  } catch (error) {
    console.error('Error cargando el CSV:', error);
    return [];
  }
};

// Función para convertir string CSV directamente
export const convertCSVString = (
  csvString: string,
  options: Parameters<typeof parseCSV>[1] = {}
): RDInvestmentData[] => {
  return parseCSV(csvString, options);
}; 