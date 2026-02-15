
import { AIDiagnosis, LifecycleStage } from '../../types.ts';

export interface AIReport extends AIDiagnosis {
  timestamp: string;
  actionPriority: 'observe' | 'adjust' | 'emergency';
  diagnosis_code?: string;
}

export interface DetailedAnalysisRecord {
  id: string;
  productId: string;
  date: string;
  lifecycleStage: LifecycleStage;
  
  // 1. 全站核心指标
  site: {
    visitors: number;
    buyers: number;
    spend: number;
    amount: number;
  };
  
  // 2. 关键词核心指标
  keyword: {
    visitors: number;
    buyers: number;
    spend: number;
    amount: number;
  };
  
  // 3. 产品整体核心指标
  product: {
    searchVisitors: number;
    searchBuyers: number;
    paidSpend: number;
    amount: number;
    totalBuyers: number;
  };
  
  // 4. 竞品核心指标
  competitor: {
    siteBuyers: number;
    siteCVR: number;
    keywordBuyers: number;
    keywordCVR: number;
    overallBuyers: number;
    overallCVR: number;
  };
  
  // 自动计算/衍生指标
  siteCVR: number;
  siteROI: number;
  keywordCVR: number;
  keywordROI: number;
  searchCVR: number;
  productOverallROI: number;
  
  aiDiagnosis?: AIReport;
  aiHistory?: AIReport[];
}
