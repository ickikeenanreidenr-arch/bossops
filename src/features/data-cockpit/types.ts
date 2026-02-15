
import { AIDiagnosis } from '../../types';

export interface SKUGroupMetrics {
  visitors: number;
  buyers: number;
  amount?: number;
  adCost?: number;
}

export interface DetailedAnalysisRecord {
  id: string;
  productId: string;
  date: string;
  
  // 1. Full-site metrics
  site: SKUGroupMetrics;
  
  // 2. Search-related
  search: SKUGroupMetrics;
  
  // 3. Keyword metrics
  keyword: SKUGroupMetrics;
  
  // 4. Overall product metrics
  overall: SKUGroupMetrics;
  
  // 5. Competitor metrics
  competitor: SKUGroupMetrics;
  
  // Calculated
  siteCVR: number;
  searchCVR: number;
  keywordCVR: number;
  overallCVR: number;
  roi: number;
  
  aiDiagnosis?: AIDiagnosis;
}
