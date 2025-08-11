import React from 'react';

export type DataDisplayType = 'percent_gdp' | 'million_euro';
export type PatentsDisplayType = 'number' | 'per_million_inhabitants';

interface DataTypeSelectorProps {
  dataType: DataDisplayType;
  onChange: (type: DataDisplayType) => void;
  language: 'es' | 'en';
}

interface PatentsDataTypeSelectorProps {
  patsDisplayType: PatentsDisplayType;
  onChange: (type: PatentsDisplayType) => void;
  language: 'es' | 'en';
}

const DataTypeSelector: React.FC<DataTypeSelectorProps> = ({ dataType, onChange, language }) => {
  // Textos traducidos
  const texts = {
    es: {
      percentGDP: "% del PIB",
      millionEuro: "€"
    },
    en: {
      percentGDP: "% of GDP",
      millionEuro: "€"
    }
  };

  const t = texts[language];

  return (
    <div className="flex justify-end mb-2">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          className={`px-4 py-1 text-sm font-medium rounded-l-lg ${
            dataType === 'percent_gdp' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => onChange('percent_gdp')}
        >
          {t.percentGDP}
        </button>
        <button
          type="button"
          className={`px-4 py-1 text-sm font-medium rounded-r-lg ${
            dataType === 'million_euro' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => onChange('million_euro')}
        >
          {t.millionEuro}
        </button>
      </div>
    </div>
  );
};

const PatentsDataTypeSelector: React.FC<PatentsDataTypeSelectorProps> = ({ patsDisplayType, onChange, language }) => {
  // Textos traducidos
  const texts = {
    es: {
      number: "Número",
      perMillionInhab: "Por millón hab."
    },
    en: {
      number: "Number",
      perMillionInhab: "Per million inhab."
    }
  };

  const t = texts[language];

  return (
    <div className="flex justify-end mb-2">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          className={`px-4 py-1 text-sm font-medium rounded-l-lg ${
            patsDisplayType === 'number' 
              ? 'bg-orange-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => onChange('number')}
        >
          {t.number}
        </button>
        <button
          type="button"
          className={`px-4 py-1 text-sm font-medium rounded-r-lg ${
            patsDisplayType === 'per_million_inhabitants' 
              ? 'bg-orange-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => onChange('per_million_inhabitants')}
        >
          {t.perMillionInhab}
        </button>
      </div>
    </div>
  );
};

export { DataTypeSelector as default, PatentsDataTypeSelector }; 