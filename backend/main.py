"""
BossOps 电商工作台 — FastAPI 后端入口。
提供团队成员、商品、目标、信用积分的 RESTful API。
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import members, products, targets, credits, auth, admin

app = FastAPI(
    title="BossOps 电商工作台 API",
    description="数字化电商战略指挥塔后端服务",
    version="1.0.0",
)

# CORS 配置 — 允许前端开发服务器跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000"],
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
