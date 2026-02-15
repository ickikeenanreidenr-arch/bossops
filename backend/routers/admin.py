"""
管理员后台 API 路由 — 全局统计数据 + 用户管理。
所有端点需要管理员认证。
"""

from __future__ import annotations
import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from ..auth_utils import getCurrentUser, hashPassword
from ..database import USE_SUPABASE, supabase_client
from ..memory_store import memory_store
from ..routers.auth import (
    _findUserByUsername,
    _findUserById,
    _toUserResponse,
    memoryUsers,
    useSupabaseAuth,
    UserResponse,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ============== 请求模型 ==============

class ResetPasswordRequest(BaseModel):
    newPassword: str


class AdjustCreditRequest(BaseModel):
    change: int
    reason: str


# ============== 统计 API ==============

@router.get("/stats")
async def getStats(currentUser: dict = Depends(getCurrentUser)):
    """
    全局统计数据 — 跨工作区汇总。
    返回成员、商品、目标、信用分等核心指标。
    """
    # 获取所有数据
    if USE_SUPABASE:
        members = supabase_client.select("members")
        tmallProducts = supabase_client.select("products", filters={"workspace": "eq.Tmall"})
        taoProducts = supabase_client.select("products", filters={"workspace": "eq.TaoFactory"})
        tmallTargets = supabase_client.select("targets", filters={"workspace": "eq.Tmall"})
        taoTargets = supabase_client.select("targets", filters={"workspace": "eq.TaoFactory"})
    else:
        members = memory_store.get_all("members")
        tmallProducts = memory_store.get_all("products", {"workspace": "Tmall"})
        taoProducts = memory_store.get_all("products", {"workspace": "TaoFactory"})
        tmallTargets = memory_store.get_all("targets", {"workspace": "Tmall"})
        taoTargets = memory_store.get_all("targets", {"workspace": "TaoFactory"})

    allProducts = tmallProducts + taoProducts
    allTargets = tmallTargets + taoTargets

    # 计算统计指标
    totalMembers = len(members)
    totalProducts = len(allProducts)
    totalTargets = len(allTargets)
    completedTargets = len([t for t in allTargets if t.get("completedAt")])
    targetCompletionRate = round((completedTargets / totalTargets * 100)) if totalTargets > 0 else 0

    # 信用分统计
    creditScores = [m.get("creditScore", 0) for m in members]
    avgCredit = round(sum(creditScores) / len(creditScores)) if creditScores else 0
    maxCredit = max(creditScores) if creditScores else 0
    minCredit = min(creditScores) if creditScores else 0

    # 信用分分布
    creditDistribution = {
        "danger": len([s for s in creditScores if s < 60]),
        "normal": len([s for s in creditScores if 60 <= s < 100]),
        "good": len([s for s in creditScores if 100 <= s < 150]),
        "excellent": len([s for s in creditScores if 150 <= s < 180]),
        "legendary": len([s for s in creditScores if s >= 180]),
    }

    # 商品状态分布
    productStatusDist = {}
    for p in allProducts:
        status = p.get("status", "Pending")
        productStatusDist[status] = productStatusDist.get(status, 0) + 1

    # 按工作区对比
    tmallCompletedTargets = len([t for t in tmallTargets if t.get("completedAt")])
    taoCompletedTargets = len([t for t in taoTargets if t.get("completedAt")])

    # 成员排行（按积分排序）
    memberRanking = sorted(
        [{"id": m["id"], "name": m["name"], "role": m.get("role", ""), "creditScore": m.get("creditScore", 0)} for m in members],
        key=lambda x: x["creditScore"],
        reverse=True,
    )

    return {
        "overview": {
            "totalMembers": totalMembers,
            "totalProducts": totalProducts,
            "totalTargets": totalTargets,
            "completedTargets": completedTargets,
            "targetCompletionRate": targetCompletionRate,
            "avgCredit": avgCredit,
            "maxCredit": maxCredit,
            "minCredit": minCredit,
        },
        "creditDistribution": creditDistribution,
        "productStatusDistribution": productStatusDist,
        "workspaceComparison": {
            "tmall": {
                "products": len(tmallProducts),
                "targets": len(tmallTargets),
                "completedTargets": tmallCompletedTargets,
            },
            "taoFactory": {
                "products": len(taoProducts),
                "targets": len(taoTargets),
                "completedTargets": taoCompletedTargets,
            },
        },
        "memberRanking": memberRanking,
    }


# ============== 用户管理 API ==============

@router.get("/users", response_model=list[UserResponse])
async def listUsers(currentUser: dict = Depends(getCurrentUser)):
    """获取所有管理员账号列表"""
    if useSupabaseAuth:
        rows = supabase_client.select("admin_users")
        return [_toUserResponse(r) for r in rows]
    else:
        return [_toUserResponse(u) for u in memoryUsers]


@router.delete("/users/{userId}")
async def deleteUser(userId: str, currentUser: dict = Depends(getCurrentUser)):
    """删除管理员账号（不能删除自己）"""
    if userId == currentUser["sub"]:
        raise HTTPException(status_code=400, detail="不能删除当前登录的账号")

    user = _findUserById(userId)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if useSupabaseAuth:
        supabase_client.delete("admin_users", {"id": f"eq.{userId}"})
    else:
        memoryUsers[:] = [u for u in memoryUsers if u["id"] != userId]

    return {"ok": True}


@router.put("/users/{userId}/reset-password")
async def resetUserPassword(
    userId: str,
    body: ResetPasswordRequest,
    currentUser: dict = Depends(getCurrentUser),
):
    """重置指定用户的密码"""
    user = _findUserById(userId)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    newHash = hashPassword(body.newPassword)

    if useSupabaseAuth:
        supabase_client.update(
            "admin_users",
            filters={"id": f"eq.{userId}"},
            data={"hashed_password": newHash},
        )
    else:
        user["hashed_password"] = newHash

    return {"ok": True, "message": "密码已重置"}


# ============== 数据调整 API ==============

@router.put("/members/{memberId}/credit")
async def adjustMemberCredit(
    memberId: str,
    body: AdjustCreditRequest,
    currentUser: dict = Depends(getCurrentUser),
):
    """手动调整成员积分"""
    if USE_SUPABASE:
        memberRows = supabase_client.select(
            "members", columns="creditScore",
            filters={"id": f"eq.{memberId}"},
        )
        if not memberRows:
            raise HTTPException(status_code=404, detail="成员不存在")

        currentScore = memberRows[0]["creditScore"]
        newScore = max(0, currentScore + body.change)
        supabase_client.update(
            "members",
            {"id": f"eq.{memberId}"},
            {"creditScore": newScore},
        )

        # 写入信用记录
        import datetime
        supabase_client.insert("credit_records", {
            "id": str(uuid.uuid4())[:8],
            "userId": memberId,
            "change": body.change,
            "reason": f"[管理员调整] {body.reason}",
            "eventType": "ADMIN_ADJUST",
            "relatedId": "",
            "cycleKey": "admin",
            "createdAt": datetime.datetime.now().isoformat(),
        })

        return {"ok": True, "newScore": newScore}
    else:
        member = memory_store.get_by_id("members", memberId)
        if not member:
            raise HTTPException(status_code=404, detail="成员不存在")

        member["creditScore"] = max(0, member.get("creditScore", 0) + body.change)

        import datetime
        memory_store.insert("credit_records", {
            "id": str(uuid.uuid4())[:8],
            "userId": memberId,
            "change": body.change,
            "reason": f"[管理员调整] {body.reason}",
            "eventType": "ADMIN_ADJUST",
            "relatedId": "",
            "cycleKey": "admin",
            "createdAt": datetime.datetime.now().isoformat(),
        })

        return {"ok": True, "newScore": member["creditScore"]}
