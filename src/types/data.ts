export interface RegionData {
  id: string;
  name: string;
}

export interface GDPData {
  year: number;
  region: string;
  publicPercentage: number;
  privatePercentage: number;
  totalPercentage: number;
}

export interface ResearchersData {
  year: number;
  region: string;
  publicSector: number;
  privateSector: number;
  total: number;
}

export interface PatentsData {
  year: number;
  region: string;
  publicSector: number;
  privateSector: number;
  total: number;
}

export interface DataPoint {
  year: number;
  value: number;
  region: string;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'area'; 