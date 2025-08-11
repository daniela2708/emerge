import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, FileText, MapPin, Star, Globe } from 'lucide-react';

// Interfaces para los tipos de datos
interface PatentsEuropeData {
  STRUCTURE: string;
  STRUCTURE_ID: string;
  STRUCTURE_NAME: string;
  freq: string;
  'Time frequency': string;
  coop_ptn: string;
  'Cooperation partners': string;
  unit: string;
  'Unit of measure': string;
  geo: string;
  'Geopolitical entity (reporting)': string;
  TIME_PERIOD: string;
  Time: string;
  OBS_VALUE: string;
  'Observation value': string;
  OBS_FLAG?: string;
  'Observation status (Flag) V2 structure'?: string;
  CONF_STATUS?: string;
  'Confidentiality status (flag)'?: string;
  [key: string]: string | undefined;
}

interface PatentsSpainData {
  'Nuts Prov': string;
  'Provincia': string;
  '2010': string;
  '2011': string;
  '2012': string;
  '2013': string;
  '2014': string;
  '2015': string;
  '2016': string;
  '2017': string;
  '2018': string;
  '2019': string;
  '2020': string;
  '2021': string;
  '2022': string;
  '2023': string;
  '2024': string;
  'SUMA': string;
  [key: string]: string | undefined;
}

interface PatentsKPIProps {
  europeData: PatentsEuropeData[];
  spainData: PatentsSpainData[];
  language: 'es' | 'en';
}

// Mapeo de provincias a comunidades autónomas
const PROVINCE_TO_COMMUNITY: { [key: string]: string } = {
  // Andalucía
  'Almería': 'Andalucía', 'Cádiz': 'Andalucía', 'Córdoba': 'Andalucía', 'Granada': 'Andalucía',
  'Huelva': 'Andalucía', 'Jaén': 'Andalucía', 'Málaga': 'Andalucía', 'Sevilla': 'Andalucía',
  // Aragón
  'Huesca': 'Aragón', 'Teruel': 'Aragón', 'Zaragoza': 'Aragón',
  // Asturias
  'Asturias': 'Asturias',
  // Canarias
  'Las Palmas': 'Canarias', 'Santa Cruz de Tenerife': 'Canarias',
  // Cantabria
  'Cantabria': 'Cantabria',
  // Castilla-La Mancha
  'Albacete': 'Castilla-La Mancha', 'Ciudad Real': 'Castilla-La Mancha', 'Cuenca': 'Castilla-La Mancha',
  'Guadalajara': 'Castilla-La Mancha', 'Toledo': 'Castilla-La Mancha',
  // Castilla y León
  'Ávila': 'Castilla y León', 'Burgos': 'Castilla y León', 'León': 'Castilla y León',
  'Palencia': 'Castilla y León', 'Salamanca': 'Castilla y León', 'Segovia': 'Castilla y León',
  'Soria': 'Castilla y León', 'Valladolid': 'Castilla y León', 'Zamora': 'Castilla y León',
  // Cataluña
  'Barcelona': 'Cataluña', 'Girona': 'Cataluña', 'Lleida': 'Cataluña', 'Tarragona': 'Cataluña',
  // Comunidad Valenciana
  'Alicante': 'Comunidad Valenciana', 'Castellón': 'Comunidad Valenciana', 'Valencia': 'Comunidad Valenciana',
  // Extremadura
  'Badajoz': 'Extremadura', 'Cáceres': 'Extremadura',
  // Galicia
  'A Coruña': 'Galicia', 'Lugo': 'Galicia', 'Ourense': 'Galicia', 'Pontevedra': 'Galicia',
  // Islas Baleares
  'Illes Balears': 'Islas Baleares',
  // La Rioja
  'La Rioja': 'La Rioja',
  // Madrid
  'Madrid': 'Madrid',
  // Murcia
  'Murcia': 'Murcia',
  // Navarra
  'Navarra': 'Navarra',
  // País Vasco
  'Araba/Álava': 'País Vasco', 'Bizkaia': 'País Vasco', 'Gipuzkoa': 'País Vasco',
  // Ceuta y Melilla
  'Ceuta': 'Ceuta', 'Melilla': 'Melilla'
};

const PatentsKPI: React.FC<PatentsKPIProps> = ({ europeData, spainData, language }) => {
  const [kpiData, setKpiData] = useState({
    totalSpainPatents: 0,
    europeSpainPatents: 0,
    yoyGrowth: 0,
    leadingCommunity: { name: '', value: 0 }
  });

  const [loading, setLoading] = useState(true);

  // Textos localizados
  const texts = {
    es: {
      totalSpainTitle: 'Patentes Nacionales 2024',
      totalSpainSubtitle: 'Total registradas en territorio español',
      europeTitle: 'Patentes España en EPO 2024',
      europeSubtitle: 'Solicitudes españolas en Europa',
      yoyTitle: 'Variación Anual EPO',
      yoySubtitle: 'Crecimiento España vs 2023',
      leadingTitle: 'Comunidad Líder Nacional',
      leadingSubtitle: 'Mayor actividad inventiva',
      loading: 'Cargando...'
    },
    en: {
      totalSpainTitle: 'National Patents 2024',
      totalSpainSubtitle: 'Total registered in Spanish territory',
      europeTitle: 'Spain Patents in EPO 2024',
      europeSubtitle: 'Spanish applications in Europe',
      yoyTitle: 'Annual EPO Variation',
      yoySubtitle: 'Spain growth vs 2023',
      leadingTitle: 'Leading National Community',
      leadingSubtitle: 'Highest inventive activity',
      loading: 'Loading...'
    }
  };

  const t = texts[language];

  useEffect(() => {
    const calculateKPIs = () => {
      setLoading(true);
      
      try {
        // 1. Calcular total de patentes de España 2024 (sumando TODAS las filas incluyendo No residentes)
        let totalSpainPatents = 0;
        let validValues = 0;
        
        spainData.forEach((item) => {
          const provinceName = item['Provincia'];
          const value2024String = item['2024'];
          
          // Incluir TODAS las filas (incluyendo No residentes ES)
          if (provinceName && provinceName !== '') {
            const value2024 = parseFloat(value2024String || '0');
            if (!isNaN(value2024) && value2024 > 0) {
              validValues++;
              totalSpainPatents += value2024;
            }
          }
        });
        
        console.log(`Patentes España 2024: ${totalSpainPatents} (${validValues} registros positivos)`);

        // 2. Obtener patentes de España en Europa 2024
        const europeSpainData = europeData.find(item => 
          item.geo === 'ES' && 
          item.TIME_PERIOD === '2024' && 
          item.coop_ptn === 'APPL' &&
          item.unit === 'NR'
        );
        const europeSpainPatents = europeSpainData ? parseInt(europeSpainData.OBS_VALUE) : 0;

        // 3. Calcular crecimiento YoY de España en Europa
        const europeSpain2023 = europeData.find(item => 
          item.geo === 'ES' && 
          item.TIME_PERIOD === '2023' && 
          item.coop_ptn === 'APPL' &&
          item.unit === 'NR'
        );
        const patents2023 = europeSpain2023 ? parseInt(europeSpain2023.OBS_VALUE) : 0;
        const yoyGrowth = patents2023 > 0 ? ((europeSpainPatents - patents2023) / patents2023) * 100 : 0;

        // 4. Encontrar comunidad líder 2024 (agrupando por comunidades)
        const communityMap = new Map<string, number>();
        
        spainData.forEach(item => {
          const provinceName = item['Provincia'];
          if (provinceName && !provinceName.includes('No residentes') && provinceName !== '') {
            const community = PROVINCE_TO_COMMUNITY[provinceName];
            if (community) {
              const value2024 = parseFloat(item['2024'] || '0');
              if (!isNaN(value2024)) {
                communityMap.set(community, (communityMap.get(community) || 0) + value2024);
              }
            }
          }
        });
        
        let leadingCommunity = { name: '', value: 0 };
        communityMap.forEach((value, community) => {
          if (value > leadingCommunity.value) {
            leadingCommunity = { name: community, value };
          }
        });

        setKpiData({
          totalSpainPatents,
          europeSpainPatents,
          yoyGrowth,
          leadingCommunity
        });
        
      } catch (error) {
        console.error('Error calculating Patents KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (europeData.length > 0 && spainData.length > 0) {
      calculateKPIs();
    }
  }, [europeData, spainData]);

  // Función para formatear números (mostrar números completos)
  const formatNumber = (value: number): string => {
    return Math.round(value).toLocaleString(language === 'es' ? 'es-ES' : 'en-US');
  };

  // Función para formatear porcentaje
  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-md border border-gray-100">
            <div className="animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-xl mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: Total Patentes España */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-200 hover:scale-[1.02] transform">
        <div className="flex items-center justify-between mb-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 leading-tight">
              {formatNumber(kpiData.totalSpainPatents)}
            </div>
            <div className="text-xs text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-full mt-1">
              Nacional
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-900 mb-0.5">{t.totalSpainTitle}</h3>
          <p className="text-[10px] text-gray-600">{t.totalSpainSubtitle}</p>
        </div>
      </div>

      {/* KPI 2: Patentes Europa */}
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-purple-200 hover:scale-[1.02] transform">
        <div className="flex items-center justify-between mb-3">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 rounded-xl shadow-md">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 leading-tight">
              {formatNumber(kpiData.europeSpainPatents)}
            </div>
            <div className="text-xs text-purple-600 font-semibold bg-purple-100 px-2 py-0.5 rounded-full mt-1">
              Europa
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-900 mb-0.5">{t.europeTitle}</h3>
          <p className="text-[10px] text-gray-600">{t.europeSubtitle}</p>
        </div>
      </div>

      {/* KPI 3: Crecimiento YoY */}
      <div className="bg-gradient-to-br from-white to-green-50 rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-green-200 hover:scale-[1.02] transform">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl shadow-md ${kpiData.yoyGrowth >= 0 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
            {kpiData.yoyGrowth >= 0 ? 
              <TrendingUp className="h-5 w-5 text-white" /> :
              <TrendingDown className="h-5 w-5 text-white" />
            }
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold leading-tight ${kpiData.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(kpiData.yoyGrowth)}
            </div>
            <div className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${kpiData.yoyGrowth >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
              2023-2024
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-900 mb-0.5">{t.yoyTitle}</h3>
          <p className="text-[10px] text-gray-600">{t.yoySubtitle}</p>
        </div>
      </div>

      {/* KPI 4: Comunidad Líder */}
      <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-orange-200 hover:scale-[1.02] transform">
        <div className="flex items-center justify-between mb-3">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-md">
            <Star className="h-5 w-5 text-white" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 leading-tight">
              {formatNumber(kpiData.leadingCommunity.value)}
            </div>
            <div className="text-xs text-orange-600 font-semibold bg-orange-100 px-2 py-0.5 rounded-full mt-1 flex items-center justify-end">
              <MapPin className="h-2.5 w-2.5 mr-1" />
              Líder
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-900 mb-0.5">{t.leadingTitle}</h3>
          <p className="text-[10px] text-gray-600 truncate font-medium" title={kpiData.leadingCommunity.name}>
            {kpiData.leadingCommunity.name || t.leadingSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatentsKPI; 