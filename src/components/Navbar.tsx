import React, { CSSProperties } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { TabType } from '../types';

interface NavBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const NavBar: React.FC<NavBarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();
  
  // Esta función ayuda a convertir literales de cadena a TabType de forma segura
  const tabValue = (value: string): TabType => value as TabType;
  
  const navStyle: CSSProperties = {
    background: '#1a4bbd', // Azul más vibrante como en la imagen
    padding: '8px 16px 0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };
  
  const tabStyle = (isActive: boolean): CSSProperties => ({
    backgroundColor: isActive ? '#FFFFFF' : 'transparent',
    color: isActive ? '#1a4bbd' : '#FFFFFF', // Texto azul para tab activo, blanco para inactivo
    fontWeight: isActive ? '600' : '500',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    borderTopLeftRadius: '6px',
    borderTopRightRadius: '6px',
    borderBottom: 'none',
    borderLeft: isActive ? '1px solid #FFFFFF' : 'none',
    borderRight: isActive ? '1px solid #FFFFFF' : 'none', 
    borderTop: isActive ? '2px solid #FFFFFF' : 'none',
    marginRight: '4px',
    transition: 'all 0.2s ease',
    position: isActive ? 'relative' : undefined,
    top: isActive ? '1px' : undefined
  });
  
  const iconStyle: CSSProperties = {
    marginRight: '8px',
    width: '20px',
    height: '20px'
  };
  
  return (
    <div style={navStyle} className="w-full">
      <div className="flex">
        <button 
          style={tabStyle(activeTab === 'overview')}
          onClick={() => setActiveTab('overview')}
          className="focus:outline-none"
        >
          <svg 
            style={iconStyle}
            fill="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
          <span>{t('overview')}</span>
        </button>
        
        <button
          style={tabStyle(activeTab === tabValue('investment'))}
          onClick={() => setActiveTab(tabValue('investment'))}
          className="focus:outline-none"
        >
          <span
            role="img"
            aria-label={t('investment')}
            style={iconStyle}
          >
            🇪🇸
          </span>
          <span>{t('investment')}</span>
        </button>
        
        <button 
          style={tabStyle(activeTab === 'researchers')}
          onClick={() => setActiveTab('researchers')}
          className="focus:outline-none"
        >
          <svg 
            style={iconStyle}
            fill="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          <span>{t('researchers')}</span>
        </button>
        
        <button 
          style={tabStyle(activeTab === 'patents')}
          onClick={() => setActiveTab('patents')}
          className="focus:outline-none"
        >
          <svg 
            style={iconStyle}
            fill="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
          <span>{t('patents')}</span>
        </button>
        
        <button 
          style={tabStyle(activeTab === tabValue('sources'))}
          onClick={() => setActiveTab(tabValue('sources'))}
          className="focus:outline-none"
        >
          <svg 
            style={iconStyle}
            fill="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 3C6.95 3 3.15 4.85 0 7.23L12 22 24 7.25C20.85 4.87 17.05 3 12 3zm1 13h-2v-6h2v6zm-2-8V6h2v2h-2z" />
          </svg>
          <span>{t('sources')}</span>
        </button>
      </div>
    </div>
  );
};

export default NavBar;