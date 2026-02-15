"""
Pydantic 数据模型 — 与前端 types.ts 完全对应。
"""

from __future__ import annotations
from typing import Optional, Any
from enum import Enum
from pydantic import BaseModel, Field


# ============== 枚举类型 ==============

class ProductStatus(str, Enum):
    PENDING = "Pending"
    ACTIVE = "Active"
    ABANDONED = "Abandoned"
    MAINTENANCE = "Maintenance"
    TRASHED = "Trashed"


class LifecycleStage(str, Enum):
    NEW_ARRIVAL = "new_arrival"
    EXPLOSION = "explosion"
    MAINTENANCE = "maintenance"


class CutoutStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


# ============== 信用积分 ==============

class CreditRecordCreate(BaseModel):
    """创建信用记录的请求体"""
    userId: str
    eventType: str
    relatedId: Optional[str] = None
    cycleKey: Optional[str] = "default"
    data: Optional[dict] = None


class CreditRecord(BaseModel):
    id: str
    userId: str
    change: int
    reason: str
    eventType: str
    relatedId: Optional[str] = None
    cycleKey: Optional[str] = None
    createdAt: str


# ============== 团队成员 ==============

class MemberCreate(BaseModel):
    name: str
    avatar: Optional[str] = ""
    role: str
    contact: str
    creditScore: Optional[int] = 100
    # 登录账号相关（可选，填写后自动创建登录账号）
    username: Optional[str] = None
    password: Optional[str] = None
    accountRole: Optional[str] = "user"  # "admin" 或 "user"


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = None
    contact: Optional[str] = None
    creditScore: Optional[int] = None


class Member(BaseModel):
    id: str
    name: str
    avatar: str = ""
    role: str
    contact: str
    creditScore: int = 100
    creditHistory: list[CreditRecord] = []


# ============== 运营日志 ==============

class OperationLog(BaseModel):
    id: str
    date: str
    dayIndex: int
    content: str
    images: list[str] = []
    operatorName: str


# ============== AI 诊断 ==============

class AIDiagnosis(BaseModel):
    score: int
    summary: str
    suggestion: str
    alertLevel: str = "normal"


# ============== 数据分析记录 ==============

class DailyAnalysisRecord(BaseModel):
    id: str
    productId: str
    date: str
    uv: int = 0
    payUsers: int = 0
    gmv: float = 0
    adCost: float = 0
    cvr: float = 0
    roi: float = 0
    aiDiagnosis: Optional[AIDiagnosis] = None


# ============== 商品 ==============

class ProductCreate(BaseModel):
    name: str
    productId: str
    image: Optional[str] = ""
    storeName: str = ""
    link: str = ""
    profitLink: Optional[str] = None
    imagePackagePath: Optional[str] = None
    operatorId: str
    status: ProductStatus = ProductStatus.PENDING
    workspace: str = "Tmall"
    strategy: Optional[str] = None
    lifecycleStage: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    productId: Optional[str] = None
    image: Optional[str] = None
    storeName: Optional[str] = None
    link: Optional[str] = None
    profitLink: Optional[str] = None
    imagePackagePath: Optional[str] = None
    operatorId: Optional[str] = None
    status: Optional[ProductStatus] = None
    dayCount: Optional[int] = None
    strategy: Optional[str] = None
    lifecycleStage: Optional[str] = None
    lastUpdateDate: Optional[str] = None
    # 以下使用 JSONB 存储的复杂字段
    taskProgress: Optional[dict] = None
    history: Optional[list[dict]] = None
    analysisRecords: Optional[list[dict]] = None


class Product(BaseModel):
    id: str
    name: str
    productId: str
    image: str = ""
    storeName: str = ""
    link: str = ""
    profitLink: Optional[str] = None
    imagePackagePath: Optional[str] = None
    operatorId: str
    status: ProductStatus = ProductStatus.PENDING
    workspace: str = "Tmall"
    dayCount: int = 0
    history: list[dict] = []
    taskProgress: dict = {}
    strategy: Optional[str] = None
    lifecycleStage: Optional[str] = None
    lastUpdateDate: Optional[str] = None
    analysisRecords: Optional[list[dict]] = None


# ============== 致富目标 ==============

TargetType = str  # 前端定义的联合字符串类型

class TargetCreate(BaseModel):
    title: str
    type: str
    priority: str = "Medium"
    deadline: str
    operatorId: str
    workspace: str = "Tmall"


class TargetUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    operatorId: Optional[str] = None
    completedAt: Optional[str] = None
    completionNote: Optional[str] = None
    completionImages: Optional[list[str]] = None


class Target(BaseModel):
    id: str
    title: str
    type: str
    priority: str = "Medium"
    deadline: str
    completedAt: Optional[str] = None
    completionNote: Optional[str] = None
    completionImages: Optional[list[str]] = None
    operatorId: str
    workspace: str = "Tmall"
