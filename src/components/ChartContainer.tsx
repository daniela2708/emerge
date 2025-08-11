import React, { ReactNode } from 'react';

interface ChartContainerProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  icon,
  children, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md mb-6 ${className}`}>
      <div className="flex items-center border-b border-gray-100 p-4">
        {icon && <span className="text-xl mr-2 text-blue-600">{icon}</span>}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-4">
        <div className="chart-container h-80">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChartContainer; 