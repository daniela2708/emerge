import React, { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  icon?: ReactNode;
  iconBgColor?: string;
  children: ReactNode;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon,
  iconBgColor = 'bg-blue-600',
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="flex items-center p-4 border-b border-gray-100">
        {icon && (
          <div className={`rounded-full ${iconBgColor} text-white p-2 mr-3 flex items-center justify-center`}>
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

export default InfoCard; 