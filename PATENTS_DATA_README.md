# Guía para Reemplazar el Dataset de Patentes

Este documento explica cómo reemplazar el dataset de patentes europeas de manera que la información se actualice automáticamente sin problemas.

## Descripción del Dataset

Este indicador mide las solicitudes de protección de una invención presentadas ante la Oficina Europea de Patentes (EPO), independientemente de si son concedidas o no. Las solicitudes se asignan según el país de residencia del primer solicitante listado en el formulario de solicitud (principio del primer solicitante nombrado), así como según el país de residencia del inventor.

**Fuente**: European Patent Office (EPO) / Eurostat

## Estructura del Sistema

El sistema de datos de patentes está organizado de manera modular para facilitar el reemplazo de datasets:

### 1. Archivo de Configuración: `src/data/patentsData.ts`

Este archivo contiene:
- **Configuración de rutas**: Ubicación del archivo CSV
- **Mapeo de campos**: Nombres de columnas del CSV
- **Interfaces TypeScript**: Tipos de datos
- **Funciones de procesamiento**: Para transformar y filtrar datos
- **Textos localizados**: Etiquetas en español e inglés

### 2. Componente Principal: `src/pages/Patents/index.tsx`

Utiliza las funciones del archivo de configuración para:
- Cargar datos automáticamente
- Procesar y filtrar información
- Mostrar visualizaciones interactivas

## Cómo Reemplazar el Dataset

### Paso 1: Preparar el Nuevo Dataset

El nuevo archivo CSV debe tener la misma estructura que el actual:

```csv
STRUCTURE,STRUCTURE_ID,STRUCTURE_NAME,freq,Time frequency,coop_ptn,Cooperation partners,unit,Unit of measure,geo,Geopolitical entity (reporting),TIME_PERIOD,Time,OBS_VALUE,Observation value,OBS_FLAG,Observation status (Flag) V2 structure,CONF_STATUS,Confidentiality status (flag)
```

**Campos obligatorios:**
- `geo`: Código del país (ej: ES, DE, FR)
- `Geopolitical entity (reporting)`: Nombre del país
- `TIME_PERIOD`: Año (ej: 2023)
- `OBS_VALUE`: Valor numérico de solicitudes de patentes
- `coop_ptn`: Tipo de asignación (APPL = Por país del solicitante, INVT = Por país del inventor)
- `unit`: Unidad (NR = Número absoluto, P_MHAB = Por millón de habitantes)

**Campos opcionales:**
- `OBS_FLAG`: Flags de observación (p = provisional, e = estimado, etc.)

### Paso 2: Reemplazar el Archivo

1. **Ubicación**: Coloca el nuevo archivo en `public/data/patents/`
2. **Nombre**: Puedes usar el mismo nombre `patentes_europa.csv` o cambiar la ruta en la configuración

### Paso 3: Actualizar Configuración (si es necesario)

Si cambias el nombre del archivo o la estructura, actualiza `src/data/patentsData.ts`:

```typescript
export const PATENTS_DATA_CONFIG = {
  // Cambiar la ruta si es necesario
  EUROPE_PATENTS_CSV: './data/patents/TU_NUEVO_ARCHIVO.csv',
  
  // Actualizar campos si la estructura cambia
  CSV_FIELDS: {
    // ... mapeo de campos
  }
};
```

### Paso 4: Verificar Códigos de País

Si tu dataset incluye nuevos países, puedes agregar sus códigos en:

```typescript
COUNTRY_CODES: {
  SPAIN: 'ES',
  GERMANY: 'DE',
  // Agregar nuevos países aquí
  NEW_COUNTRY: 'XX'
}
```

## Funcionalidades Automáticas

Una vez reemplazado el dataset, el sistema automáticamente:

✅ **Detecta años disponibles** y los ordena de más reciente a más antiguo  
✅ **Extrae países disponibles** y los ordena alfabéticamente  
✅ **Procesa los datos** filtrando valores inválidos  
✅ **Actualiza filtros** con las nuevas opciones disponibles  
✅ **Genera rankings** dinámicos por año y tipo de datos  
✅ **Maneja estados de carga** y errores automáticamente  

## Tipos de Datos Soportados

### Por Tipo de Asignación:
- **Por país del solicitante (APPL)**: Solicitudes asignadas según el país de residencia del primer solicitante nombrado
- **Por país del inventor (INVT)**: Solicitudes asignadas según el país de residencia del inventor

### Por Unidad de Medida:
- **Número absoluto (NR)**: Cantidad total de solicitudes de patentes
- **Per cápita (P_MHAB)**: Solicitudes por millón de habitantes

## Validación de Datos

El sistema incluye validación automática que:
- Filtra registros con valores vacíos o inválidos
- Verifica que los años sean números válidos
- Asegura que los valores numéricos sean parseables
- Maneja flags de observación opcionales

## Ejemplo de Uso

```typescript
// Los datos se cargan automáticamente al montar el componente
// Las funciones de filtrado están disponibles:

const rankingData = getCountryRanking(
  patentsData,           // Datos procesados
  2023,                  // Año
  'applicant',           // Tipo de cooperación
  'number',              // Unidad
  15                     // Límite de resultados
);
```

## Solución de Problemas

### Error de Carga
- Verificar que el archivo esté en la ruta correcta
- Comprobar que el formato CSV sea válido
- Revisar la consola del navegador para errores específicos

### Datos No Aparecen
- Verificar que los nombres de columnas coincidan con la configuración
- Asegurar que los valores numéricos no contengan caracteres especiales
- Comprobar que los códigos de país sean válidos

### Filtros Vacíos
- Verificar que existan datos para los años seleccionados
- Comprobar que los tipos de cooperación y unidades estén correctos

## Mantenimiento

Para mantener el sistema actualizado:

1. **Actualizaciones regulares**: Reemplaza el CSV con datos más recientes
2. **Nuevos países**: Agrega códigos de país según sea necesario
3. **Nuevos campos**: Extiende las interfaces si el formato evoluciona
4. **Textos**: Actualiza las traducciones en `patentsTexts` si es necesario

El sistema está diseñado para ser robusto y manejar cambios en los datos de manera automática, minimizando la necesidad de modificaciones en el código. 