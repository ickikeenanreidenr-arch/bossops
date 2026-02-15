"""
BossOps 电商工作台 — FastAPI 后端入口。
提供团队成员、商品、目标、信用积分的 RESTful API。
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import members, products, targets, credits, auth, admin

app = FastAPI(
    title="BossOps 电商工作台 API",
    description="数字化电商战略指挥塔后端服务",
    version="1.0.0",
)

# CORS 配置 — 通过环境变量 CORS_ORIGINS 支持动态配置（逗号分隔）
# 默认允许本地开发 + Vercel 部署域名
_defaultOrigins = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
_origins = os.getenv("CORS_ORIGINS", _defaultOrigins).split(",")
# 如果用通配符（适合调试，生产环境建议改为具体域名）
_allowAll = os.getenv("CORS_ALLOW_ALL", "false").lower() == "true"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allowAll else [o.strip() for o in _origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(members.router)
app.include_router(products.router)
app.include_router(targets.router)
app.include_router(credits.router)
app.include_router(auth.router)
app.include_router(admin.router)


@app.get("/api/health")
async def healthCheck():
    """健康检查端点"""
    from .database import USE_SUPABASE
    return {
        "status": "ok",
        "storage": "supabase" if USE_SUPABASE else "memory",
    }
