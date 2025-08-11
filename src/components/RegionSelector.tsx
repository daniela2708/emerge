import React from 'react';
import { useTranslation } from 'react-i18next';

interface RegionSelectorProps {
  selectedRegions: string[];
  availableRegions: { id: string; name: string }[];
  onChange: (selectedRegions: string[]) => void;
  maxSelections?: number;
  label?: string;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({
  selectedRegions,
  availableRegions,
  onChange,
  maxSelections = 3,
  label
}) => {
  const { t } = useTranslation();

  const handleToggleRegion = (regionId: string) => {
    if (selectedRegions.includes(regionId)) {
      onChange(selectedRegions.filter(id => id !== regionId));
    } else if (selectedRegions.length < maxSelections) {
      onChange([...selectedRegions, regionId]);
    }
  };

  return (
    <div className="mb-4">
      {label && <p className="font-medium text-gray-700 mb-2">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {availableRegions.map((region) => (
          <button
            key={region.id}
            onClick={() => handleToggleRegion(region.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedRegions.includes(region.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {region.name}
          </button>
        ))}
      </div>
      {selectedRegions.length >= maxSelections && (
        <p className="text-xs text-gray-600 mt-1">
          {t('common.maxSelectionsReached', { count: maxSelections })}
        </p>
      )}
    </div>
  );
};

export default RegionSelector; 