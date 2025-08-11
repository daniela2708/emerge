import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Users, MapPin, Award, PieChart } from 'lucide-react';

// Interfaces para los datos
interface ResearchersData {
  sectperf: string;
  geo: string;
  TIME_PERIOD: string;
  OBS_VALUE: string;
  OBS_FLAG?: string;
  [key: string]: string | undefined;
}

interface ResearchersCommunityData {
  TERRITORIO: string;
  TERRITORIO_CODE: string;
  TIME_PERIOD: string;
  SECTOR_EJECUCION_CODE: string;
  SEXO_CODE: string;
  MEDIDAS_CODE: string;
  OBS_VALUE: string;
  [key: string]: string;
}

interface ResearchersKeyMetricsProps {
  researchersData: ResearchersData[];
  communityData: ResearchersCommunityData[];
  selectedYear: number;
  language: 'es' | 'en';
  isLoading: boolean;
  isCommunityLoading: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, trend, color }) => (
  <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 group relative overflow-hidden">
    {/* Línea decorativa superior */}
    <div className={`absolute top-0 left-0 right-0 h-1 ${color.replace('bg-gradient-to-br', 'bg-gradient-to-r')}`}></div>
    
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-2 capitalize">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mb-1 leading-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <div className={`flex items-center px-2 py-1 rounded-md ${trend.isPositive ? 'bg-emerald-50' : 'bg-red-50'} w-fit`}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
              )}
              <span className={`text-xs font-semibold ${trend.isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-gray-400 ml-2">vs año anterior</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} shadow-sm group-hover:shadow-md transition-all duration-300`}>
        <div className="w-5 h-5 text-white">{icon}</div>
      </div>
    </div>
  </div>
);

const ResearchersKeyMetrics: React.FC<ResearchersKeyMetricsProps> = ({
  researchersData,
  communityData,
  selectedYear,
  language,
  isLoading,
  isCommunityLoading
}) => {

  // Textos localizados
  const texts = {
    es: {
      totalResearchers: "Total Investigadores España",
      spainRanking: "Posición en Europa",
      topCommunity: "Comunidad Líder",
      spainGrowth: "Crecimiento España",
      euShare: "% del Total UE",
      topSector: "Sector Principal (España)",
      of: "de",
      position: "posición",
      loading: "Calculando métricas...",
      noData: "Datos no disponibles",
      // Nombres de sectores
      business: "Empresarial",
      government: "Administración Pública", 
      education: "Enseñanza Superior",
      nonprofit: "Privado sin Fines de Lucro",
      // Nombres de comunidades comunes
      madrid: "Madrid",
      cataluña: "Cataluña",
      andalucía: "Andalucía",
      valencia: "Com. Valenciana",
      "país vasco": "País Vasco"
    },
    en: {
      totalResearchers: "Total Researchers Spain",
      spainRanking: "Position in Europe", 
      topCommunity: "Leading Community",
      spainGrowth: "Spain Growth",
      euShare: "% of EU Total",
      topSector: "Main Sector (Spain)",
      of: "of",
      position: "position",
      loading: "Calculating metrics...",
      noData: "Data not available",
      // Sector names
      business: "Business",
      government: "Government",
      education: "Higher Education", 
      nonprofit: "Private Non-Profit",
      // Community names
      madrid: "Madrid",
      cataluña: "Catalonia",
      andalucía: "Andalusia", 
      valencia: "Valencia",
      "país vasco": "Basque Country"
    }
  };

  const t = texts[language];

  // Función para normalizar nombres de comunidades
  const normalizeCommunityName = (name: string): string => {
    const normalized = name.toLowerCase().trim();
    
    if (normalized.includes('madrid')) return language === 'es' ? 'Madrid' : 'Madrid';
    if (normalized.includes('cataluña') || normalized.includes('catalunya')) return language === 'es' ? 'Cataluña' : 'Catalonia';
    if (normalized.includes('andalucía') || normalized.includes('andalucia')) return language === 'es' ? 'Andalucía' : 'Andalusia';
    if (normalized.includes('valencia')) return language === 'es' ? 'Com. Valenciana' : 'Valencia';
    if (normalized.includes('país vasco') || normalized.includes('euskadi')) return language === 'es' ? 'País Vasco' : 'Basque Country';
    if (normalized.includes('galicia')) return 'Galicia';
    if (normalized.includes('castilla y león')) return language === 'es' ? 'Castilla y León' : 'Castile and León';
    
    return name;
  };

  // Función para traducir nombres de sectores
  const translateSectorName = (sectorCode: string): string => {
    switch(sectorCode) {
      case 'BES':
      case 'business':
        return t.business;
      case 'GOV':
      case 'government':
        return t.government;
      case 'HES':
      case 'education':
        return t.education;
      case 'PNP':
      case 'nonprofit':
        return t.nonprofit;
      default:
        return sectorCode;
    }
  };

  const metrics = useMemo(() => {
    if (isLoading || isCommunityLoading || !researchersData.length) {
      return null;
    }

    try {
      // 1. Calcular total de investigadores en España
      const spainDataCurrent = researchersData.find(item =>
        item.geo === 'ES' &&
        item.TIME_PERIOD === selectedYear.toString() &&
        item.sectperf === 'TOTAL'
      );

      const totalResearchers = spainDataCurrent ?
        parseInt(spainDataCurrent.OBS_VALUE?.replace(',', '') || '0') : 0;

      // 2. Calcular ranking de España en Europa
      const europeanDataCurrent = researchersData
        .filter(item =>
          item.TIME_PERIOD === selectedYear.toString() &&
          item.sectperf === 'TOTAL' &&
          item.geo !== 'EU27_2020' &&
          item.OBS_VALUE
        )
        .map(item => ({
          country: item.geo,
          value: parseInt(item.OBS_VALUE?.replace(',', '') || '0')
        }))
        .sort((a, b) => b.value - a.value);

      const spainRanking = europeanDataCurrent.findIndex(item => item.country === 'ES') + 1;
      const totalCountries = europeanDataCurrent.length;

      // 3. Encontrar comunidad autónoma líder
      const communityDataCurrent = communityData
        .filter(item =>
          item.TIME_PERIOD === selectedYear.toString() &&
          item.SECTOR_EJECUCION_CODE === '_T' &&
          item.SEXO_CODE === '_T' &&
          item.MEDIDAS_CODE === 'INVESTIGADORES_EJC' &&
          !item.TERRITORIO.toLowerCase().includes('españa') &&
          !item.TERRITORIO.toLowerCase().includes('total nacional') &&
          item.OBS_VALUE
        )
        .map(item => ({
          name: normalizeCommunityName(item.TERRITORIO),
          value: parseInt(item.OBS_VALUE?.replace(',', '') || '0')
        }))
        .sort((a, b) => b.value - a.value);

      const topCommunity = communityDataCurrent[0] || { name: t.noData, value: 0 };

      // 4. Calcular crecimiento de España año sobre año
      const spainDataPrevious = researchersData.find(item =>
        item.geo === 'ES' &&
        item.TIME_PERIOD === (selectedYear - 1).toString() &&
        item.sectperf === 'TOTAL'
      );

      const previousValue = spainDataPrevious ?
        parseInt(spainDataPrevious.OBS_VALUE?.replace(',', '') || '0') : 0;

      const spainGrowth = previousValue > 0 ?
        ((totalResearchers - previousValue) / previousValue) * 100 : 0;

      // 5. Calcular porcentaje de España respecto al total UE
      const euDataCurrent = researchersData.find(item =>
        item.geo === 'EU27_2020' &&
        item.TIME_PERIOD === selectedYear.toString() &&
        item.sectperf === 'TOTAL'
      );

      const euTotal = euDataCurrent ?
        parseInt(euDataCurrent.OBS_VALUE?.replace(',', '') || '0') : 0;

      const euPercentage = euTotal > 0 ? (totalResearchers / euTotal) * 100 : 0;

      // 6. Encontrar sector principal en España
      const spainSectorData = researchersData
        .filter(item =>
          item.geo === 'ES' &&
          item.TIME_PERIOD === selectedYear.toString() &&
          item.sectperf !== 'TOTAL' &&
          item.OBS_VALUE
        )
        .map(item => ({
          sector: item.sectperf || '',
          value: parseInt(item.OBS_VALUE?.replace(',', '') || '0')
        }))
        .sort((a, b) => b.value - a.value);

      const topSectorData = spainSectorData[0];
      const topSector = topSectorData ? {
        name: translateSectorName(topSectorData.sector),
        percentage: totalResearchers > 0 ? (topSectorData.value / totalResearchers) * 100 : 0
      } : { name: t.noData, percentage: 0 };

      return {
        totalResearchers,
        spainRanking,
        totalCountries,
        topCommunity,
        spainGrowth,
        euPercentage,
        topSector
      };

    } catch (error) {
      console.error('Error calculating metrics:', error);
      return null;
    }
  }, [researchersData, communityData, selectedYear, language, isLoading, isCommunityLoading]);

  if (isLoading || isCommunityLoading) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[200px] flex items-center justify-center w-full">
        <div className="text-center text-gray-400">
          <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 min-h-[200px] flex items-center justify-center w-full">
        <div className="text-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">{t.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Investigadores España */}
      <MetricCard
        title={t.totalResearchers}
        value={metrics.totalResearchers.toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
        subtitle={`Año ${selectedYear}`}
        icon={<Users className="w-5 h-5 text-white" />}
        trend={{
          value: metrics.spainGrowth,
          isPositive: metrics.spainGrowth >= 0
        }}
        color="bg-gradient-to-br from-blue-500 to-blue-600"
      />

      {/* Posición en Europa */}
      <MetricCard
        title={t.spainRanking}
        value={`#${metrics.spainRanking}`}
        subtitle={`${t.of} ${metrics.totalCountries} ${language === 'es' ? 'países europeos' : 'European countries'}`}
        icon={<Award className="w-5 h-5 text-white" />}
        color="bg-gradient-to-br from-emerald-500 to-emerald-600"
      />

      {/* Comunidad Autónoma Líder */}
      <MetricCard
        title={t.topCommunity}
        value={metrics.topCommunity.name}
        subtitle={`${metrics.topCommunity.value.toLocaleString(language === 'es' ? 'es-ES' : 'en-US')} ${language === 'es' ? 'investigadores' : 'researchers'}`}
        icon={<MapPin className="w-5 h-5 text-white" />}
        color="bg-gradient-to-br from-purple-500 to-purple-600"
      />

      {/* Porcentaje del Total UE */}
      <MetricCard
        title={t.euShare}
        value={`${metrics.euPercentage.toFixed(1)}%`}
        subtitle={`${language === 'es' ? 'del total europeo' : 'of European total'} (${selectedYear})`}
        icon={<PieChart className="w-5 h-5 text-white" />}
        color="bg-gradient-to-br from-orange-500 to-orange-600"
      />

      {/* Sector Principal */}
      <MetricCard
        title={t.topSector}
        value={metrics.topSector.name}
        subtitle={`${metrics.topSector.percentage.toFixed(1)}% ${language === 'es' ? 'del total nacional' : 'of national total'}`}
        icon={<TrendingUp className="w-5 h-5 text-white" />}
        color="bg-gradient-to-br from-indigo-500 to-indigo-600"
      />

      {/* Crecimiento España */}
      <MetricCard
        title={t.spainGrowth}
        value={`${metrics.spainGrowth >= 0 ? '+' : ''}${metrics.spainGrowth.toFixed(1)}%`}
        subtitle={`${language === 'es' ? 'crecimiento interanual' : 'year-over-year growth'} (${selectedYear-1}-${selectedYear})`}
                  icon={metrics.spainGrowth >= 0 ? 
            <TrendingUp className="w-5 h-5 text-white" /> : 
            <TrendingDown className="w-5 h-5 text-white" />
          }
        color={metrics.spainGrowth >= 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : "bg-gradient-to-br from-red-500 to-red-600"}
      />
    </div>
  );
};

export default ResearchersKeyMetrics; 