
export type WorkspaceType = 'Tmall' | 'TaoFactory';

export enum ProductStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  ABANDONED = 'Abandoned',
  MAINTENANCE = 'Maintenance',
  TRASHED = 'Trashed'
}

export type LifecycleStage = 'new_arrival' | 'explosion' | 'maintenance';

export interface AIDiagnosis {
  score: number;
  summary: string;
  suggestion: string;
  alertLevel: 'normal' | 'warning' | 'critical';
}

export interface DailyAnalysisRecord {
  id: string;
  productId: string;
  date: string;
  uv: number;
  payUsers: number;
  gmv: number;
  adCost: number;
  cvr: number;
  roi: number;
  aiDiagnosis?: AIDiagnosis;
}

export interface CreditRecord {
  id: string;
  userId: string;
  change: number;
  reason: string;
  eventType: string;
  relatedId?: string;
  cycleKey?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
  contact: string;
  creditScore: number;
  creditHistory: CreditRecord[];
}

export interface TaskProgress {
  [day: number]: {
    [taskIndex: number]: {
      images: string[];
      completedAt: string;
    };
  };
}

export interface OperationLog {
  id: string;
  date: string;
  dayIndex: number;
  content: string;
  images: string[];
  operatorName: string;
}

export interface Product {
  id: string;
  name: string;
  productId: string;
  image: string;
  storeName: string;
  link: string;
  profitLink?: string; 
  imagePackagePath?: string; // 新增：商品图包路径
  operatorId: string;
  status: ProductStatus;
  dayCount: number; 
  history: OperationLog[];
  taskProgress: TaskProgress; 
  strategy?: 'standard' | 'tao-3day' | 'tao-7day'; 
  lifecycleStage?: LifecycleStage;
  lastUpdateDate?: string;
  analysisRecords?: DailyAnalysisRecord[];
}

export type TargetType = 
  | '爆款百万链接' | '低价秒杀链接' | '顺手链接' | '其他链接' | '分裂链接'
  | '日销200+链接' | '日销500+链接' | '日销1000+链接';

export interface Target {
  id: string;
  title: string;
  type: TargetType;
  priority: 'High' | 'Medium' | 'Low';
  deadline: string;
  completedAt?: string;
  completionNote?: string;
  completionImages?: string[];
  operatorId: string;
}

// AI Visual Lab Engineering Types
export type CutoutStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
export type CutoutType = 'WHITE' | 'TRANSPARENT';
export type ProductCategory = '家电' | '日化' | '食品' | '美妆' | '母婴' | '服饰' | '3C数码' | '家居' | '工具' | '其他';

export interface CutoutResult {
  type: CutoutType;
  imageUrl: string;
  width: number;
  height: number;
}

export interface CutoutTask {
  taskId: string;
  status: CutoutStatus;
  imageBase64: string;
  outputWhite: boolean;
  outputTransparent: boolean;
  enableHighRetouch: boolean;
  category?: ProductCategory;
  confidence?: number;
  description?: string;
  results?: CutoutResult[];
  createdAt: string;
}
