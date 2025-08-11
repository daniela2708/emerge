# Observatorio de I+D de Canarias - Dashboard BI

Una aplicación web moderna y amigable para móviles que presenta análisis comparativos e históricos de indicadores de investigación, desarrollo e innovación en las Islas Canarias.

## 🚀 Características Principales

### 📱 Optimización Móvil
- **Progressive Web App (PWA)**: Instalable en dispositivos móviles
- **Diseño Responsive**: Adaptado para pantallas de todos los tamaños
- **Navegación Táctil**: Menú hamburguesa y controles optimizados para touch
- **Rendimiento Móvil**: Carga rápida y experiencia fluida en dispositivos móviles
- **Modo Offline**: Funcionalidad básica disponible sin conexión a internet

### 📊 Secciones de Análisis
- **Visión General**: Panorama del ecosistema de I+D+i en Canarias
- **Inversión en I+D**: Análisis del esfuerzo financiero como % del PIB
- **Investigadores**: Capital humano dedicado a I+D por sectores
- **Patentes**: Análisis de solicitudes ante la Oficina Europea de Patentes
- **Fuentes de Datos**: Información sobre las fuentes utilizadas

### 🌐 Características Técnicas
- **Multiidioma**: Español e Inglés
- **Gráficos Interactivos**: Visualizaciones responsivas con Recharts
- **Mapas Dinámicos**: Representaciones geográficas interactivas
- **Tooltips Informativos**: Información contextual en hover/touch
- **Exportación de Datos**: Capacidad de descarga de información

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS con utilidades móviles personalizadas
- **Build Tool**: Vite con plugin PWA
- **Gráficos**: Recharts, D3.js, Chart.js
- **Mapas**: React Simple Maps
- **PWA**: Vite PWA Plugin con Workbox

## 📱 Instalación como PWA

### Android/Chrome
1. Visita la aplicación en tu navegador Chrome
2. Aparecerá automáticamente un prompt de instalación
3. Toca "Instalar" para añadir la app a tu pantalla de inicio

### iOS/Safari
1. Abre la aplicación en Safari
2. Toca el botón de compartir (cuadrado con flecha hacia arriba)
3. Selecciona "Añadir a pantalla de inicio"
4. Toca "Añadir" para confirmar

## 🚀 Desarrollo

### Requisitos Previos
- Node.js 18+ 
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone [url-del-repositorio]

# Navegar al directorio
cd dashboard-bi

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles
```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con PWA habilitado

# Construcción
npm run build        # Build de producción con PWA

# Vista previa
npm run preview      # Vista previa del build de producción

# Linting
npm run lint         # Verificar código con ESLint
```

## 📱 Optimizaciones Móviles Implementadas

### CSS y Estilos
- **Safe Area Support**: Soporte para dispositivos con notch
- **Touch Targets**: Botones con tamaño mínimo de 44px (iOS guidelines)
- **Smooth Scrolling**: Desplazamiento suave optimizado para móviles
- **Responsive Typography**: Tipografía que se adapta al tamaño de pantalla
- **Mobile-First Design**: Diseño pensado primero para móviles

### Interacción
- **Menú Hamburguesa**: Navegación colapsable en pantallas pequeñas
- **Gestos Táctiles**: Optimizado para interacción táctil
- **Feedback Visual**: Estados hover/active adaptados para touch
- **Prevención de Zoom**: Inputs configurados para evitar zoom automático en iOS

### Rendimiento
- **Code Splitting**: Carga bajo demanda de componentes
- **Image Optimization**: Imágenes optimizadas para diferentes densidades
- **Service Worker**: Caché inteligente para carga rápida
- **Lazy Loading**: Carga diferida de contenido no crítico

## 🔧 Configuración PWA

La aplicación incluye:
- **Manifest.json**: Configuración de la aplicación web
- **Service Worker**: Generado automáticamente por Vite PWA
- **Iconos**: Iconos adaptativos para diferentes plataformas
- **Shortcuts**: Accesos directos a secciones principales
- **Offline Support**: Funcionalidad básica sin conexión

## 📊 Estructura de Datos

Los datos se organizan en:
- **CSV Files**: Datos estructurados en formato CSV
- **JSON Configs**: Configuraciones de visualización
- **Static Assets**: Logos, iconos y recursos estáticos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está desarrollado por EMERGE - Asociación Canaria de Startups.

## 📞 Contacto

Para más información sobre el proyecto, contacta con EMERGE - Asociación Canaria de Startups.

---

**Nota**: Esta aplicación está optimizada para proporcionar la mejor experiencia posible tanto en dispositivos móviles como de escritorio, con especial énfasis en la usabilidad móvil y la capacidad de instalación como PWA.
