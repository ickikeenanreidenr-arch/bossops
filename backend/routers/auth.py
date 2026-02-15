"""
认证路由模块 — 登录、注册、获取用户信息、修改密码。
使用 Supabase admin_users 表存储账号，支持内存模式回退。
"""

import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from ..auth_utils import (
    hashPassword,
    verifyPassword,
    createAccessToken,
    getCurrentUser,
)
from ..database import supabase_client, USE_SUPABASE

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ============== 请求/响应模型 ==============

class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    displayName: Optional[str] = ""
    role: Optional[str] = "admin"  # "admin" 或 "user"


class ChangePasswordRequest(BaseModel):
    oldPassword: str
    newPassword: str


class UserResponse(BaseModel):
    id: str
    username: str
    displayName: str
    role: str


class LoginResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserResponse


# ============== 内存模式兜底存储 ==============

memoryUsers: list[dict] = []

# 当 Supabase 已配置但 admin_users 表不存在时，自动回退到内存模式
useSupabaseAuth = USE_SUPABASE


def _ensureDefaultAdmin():
    """确保默认管理员账号存在（首次启动自动创建）"""
    global useSupabaseAuth

    if useSupabaseAuth:
        try:
            rows = supabase_client.select(
                "admin_users",
                filters={"username": "eq.admin"},
            )
            if not rows:
                supabase_client.insert("admin_users", {
                    "id": str(uuid.uuid4()),
                    "username": "admin",
                    "hashed_password": hashPassword("admin123"),
                    "display_name": "管理员",
                    "role": "admin",
                })
                print("[OK] 已创建默认管理员账号: admin / admin123")
        except Exception as e:
            # admin_users 表不存在时回退到内存模式
            print(f"[WARN] Supabase admin_users 表访问失败: {e}")
            print("[INFO] 认证模块回退到内存模式")
            useSupabaseAuth = False

    # 内存模式兜底：确保始终有默认管理员
    if not useSupabaseAuth:
        if not any(u["username"] == "admin" for u in memoryUsers):
            memoryUsers.append({
                "id": str(uuid.uuid4()),
                "username": "admin",
                "hashed_password": hashPassword("admin123"),
                "display_name": "管理员",
                "role": "admin",
            })
            print("[OK] 内存模式：已创建默认管理员账号 admin / admin123")


# 模块加载时自动初始化
_ensureDefaultAdmin()


def _findUserByUsername(username: str) -> Optional[dict]:
    """根据用户名查找用户"""
    if useSupabaseAuth:
        rows = supabase_client.select(
            "admin_users",
            filters={"username": f"eq.{username}"},
        )
        return rows[0] if rows else None
    else:
        return next((u for u in memoryUsers if u["username"] == username), None)


def _findUserById(userId: str) -> Optional[dict]:
    """根据 ID 查找用户"""
    if useSupabaseAuth:
        rows = supabase_client.select(
            "admin_users",
            filters={"id": f"eq.{userId}"},
        )
        return rows[0] if rows else None
    else:
        return next((u for u in memoryUsers if u["id"] == userId), None)


def _toUserResponse(user: dict) -> UserResponse:
    """将数据库记录转为响应模型"""
    return UserResponse(
        id=user["id"],
        username=user["username"],
        displayName=user.get("display_name", ""),
        role=user.get("role", "admin"),
    )


# ============== 路由端点 ==============

@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    """
    用户登录 — 验证用户名密码后返回 JWT token。
    默认账号: admin / admin123
    """
    user = _findUserByUsername(body.username)
    if not user or not verifyPassword(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = createAccessToken({"sub": user["id"], "username": user["username"]})

    return LoginResponse(
        accessToken=token,
        user=_toUserResponse(user),
    )


@router.get("/me", response_model=UserResponse)
async def getMe(currentUser: dict = Depends(getCurrentUser)):
    """获取当前登录用户信息"""
    user = _findUserById(currentUser["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return _toUserResponse(user)


def registerUserInternal(
    username: str,
    password: str,
    displayName: str = "",
    role: str = "admin",
) -> dict:
    """
    内部注册函数 — 供 members 路由等模块直接调用，不做 JWT 校验。
    返回创建的用户 dict，用户名已存在时抛出 HTTPException。
    """
    existing = _findUserByUsername(username)
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")

    newUser = {
        "id": str(uuid.uuid4()),
        "username": username,
        "hashed_password": hashPassword(password),
        "display_name": displayName or username,
        "role": role,
    }

    if useSupabaseAuth:
        supabase_client.insert("admin_users", newUser)
    else:
        memoryUsers.append(newUser)

    return newUser


@router.post("/register", response_model=UserResponse)
async def register(body: RegisterRequest, currentUser: dict = Depends(getCurrentUser)):
    """
    创建新账号 — 需要已登录管理员权限。
    防止未授权用户注册。
    """
    newUser = registerUserInternal(
        username=body.username,
        password=body.password,
        displayName=body.displayName or "",
        role=body.role or "admin",
    )
    return _toUserResponse(newUser)


@router.put("/password")
async def changePassword(
    body: ChangePasswordRequest,
    currentUser: dict = Depends(getCurrentUser),
):
    """修改当前用户密码"""
    user = _findUserById(currentUser["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if not verifyPassword(body.oldPassword, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="原密码错误")

    newHash = hashPassword(body.newPassword)

    if useSupabaseAuth:
        supabase_client.update(
            "admin_users",
            filters={"id": f"eq.{user['id']}"},
            data={"hashed_password": newHash},
        )
    else:
        user["hashed_password"] = newHash

    return {"ok": True, "message": "密码修改成功"}
