import React, { ReactNode } from 'react';

interface KeyPointProps {
  icon?: ReactNode;
  iconColor?: string;
  children: ReactNode;
}

const KeyPoint: React.FC<KeyPointProps> = ({ 
  icon, 
  iconColor = 'text-blue-600',
  children 
}) => {
  return (
    <div className="flex items-start py-2 border-l-4 border-blue-100 pl-3 mb-3">
      {icon && <span className={`inline-block mr-2 ${iconColor}`}>{icon}</span>}
      <div className="text-gray-700 text-sm">{children}</div>
    </div>
  );
};

export default KeyPoint; 