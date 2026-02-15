"""
JWT 认证工具模块 — 提供 token 生成/验证和密码加密功能。
使用 python-jose 实现 JWT，passlib 实现 bcrypt 密码哈希。
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

# 修复 passlib 与新版 bcrypt 的兼容性问题
import bcrypt
if not hasattr(bcrypt, '__about__'):
    bcrypt.__about__ = type('about', (), {'__version__': bcrypt.__version__})()

from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# JWT 配置 — 密钥建议在生产环境中配置为环境变量
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "bossops-super-secret-key-change-in-production")
ALGORITHM = "HS256"
# token 有效期 7 天，减少频繁登录
ACCESS_TOKEN_EXPIRE_DAYS = 7

# 密码上下文 — 使用 bcrypt 加密
passwordContext = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token 提取器
bearerScheme = HTTPBearer(auto_error=False)


def hashPassword(password: str) -> str:
    """将明文密码加密为 bcrypt 哈希"""
    return passwordContext.hash(password)


def verifyPassword(plainPassword: str, hashedPassword: str) -> bool:
    """验证明文密码是否匹配 bcrypt 哈希"""
    return passwordContext.verify(plainPassword, hashedPassword)


def createAccessToken(data: dict, expiresDelta: Optional[timedelta] = None) -> str:
    """
    生成 JWT access token。
    data 中应包含 sub(用户ID) 等声明。
    """
    toEncode = data.copy()
    expire = datetime.now(timezone.utc) + (expiresDelta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    toEncode.update({"exp": expire})
    return jwt.encode(toEncode, SECRET_KEY, algorithm=ALGORITHM)


def verifyToken(token: str) -> Optional[dict]:
    """
    验证 JWT token 并返回 payload。
    token 无效或过期时返回 None。
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def getCurrentUser(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearerScheme),
) -> dict:
    """
    FastAPI 依赖项 — 从请求头中提取并验证 JWT token。
    用于保护需要认证的路由端点。
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verifyToken(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证凭证无效或已过期",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload
