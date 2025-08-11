import Papa from 'papaparse';
import { GDPData, ResearchersData, PatentsData } from '../types/data';

export const loadCSVData = async (filePath: string): Promise<any[]> => {
  try {
    const response = await fetch(filePath);
    const csvText = await response.text();
    
    const result = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    return result.data as any[];
  } catch (error) {
    console.error(`Error loading CSV data from ${filePath}:`, error);
    return [];
  }
};

export const formatGDPData = (rawData: any[]): GDPData[] => {
  return rawData.map(item => ({
    year: parseInt(item.year),
    region: item.region,
    publicPercentage: parseFloat(item.public_percentage) || 0,
    privatePercentage: parseFloat(item.private_percentage) || 0,
    totalPercentage: parseFloat(item.total_percentage) || 0
  }));
};

export const formatResearchersData = (rawData: any[]): ResearchersData[] => {
  return rawData.map(item => ({
    year: parseInt(item.year),
    region: item.region,
    publicSector: parseInt(item.public_sector) || 0,
    privateSector: parseInt(item.private_sector) || 0,
    total: parseInt(item.total) || 0
  }));
};

export const formatPatentsData = (rawData: any[]): PatentsData[] => {
  return rawData.map(item => ({
    year: parseInt(item.year),
    region: item.region,
    publicSector: parseInt(item.public_sector) || 0,
    privateSector: parseInt(item.private_sector) || 0,
    total: parseInt(item.total) || 0
  }));
};

export const getAvailableYears = <T extends { year: number }>(data: T[]): number[] => {
  const years = data.map(item => item.year);
  return [...new Set(years)].sort((a, b) => a - b);
};

export const getAvailableRegions = <T extends { region: string }>(data: T[]): string[] => {
  const regions = data.map(item => item.region);
  return [...new Set(regions)].sort();
};

export const filterDataByRegions = <T extends { region: string }>(
  data: T[],
  regions: string[]
): T[] => {
  if (regions.length === 0) return data;
  return data.filter(item => regions.includes(item.region));
};

export const filterDataByYearRange = <T extends { year: number }>(
  data: T[],
  startYear: number,
  endYear: number
): T[] => {
  return data.filter(item => item.year >= startYear && item.year <= endYear);
}; 