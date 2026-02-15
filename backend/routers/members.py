from __future__ import annotations
import uuid
from fastapi import APIRouter, HTTPException
from ..database import USE_SUPABASE, supabase_client
from ..memory_store import memory_store
from ..models import Member, MemberCreate, MemberUpdate
from .auth import registerUserInternal

router = APIRouter(prefix="/api/members", tags=["members"])

TABLE = "members"
CREDIT_TABLE = "credit_records"


@router.get("", response_model=list[Member])
async def getMembers():
    """获取全部成员（含信用记录）"""
    if USE_SUPABASE:
        members = supabase_client.select(TABLE)
        for m in members:
            cr = supabase_client.select(
                CREDIT_TABLE,
                filters={"userId": f"eq.{m['id']}"},
                order="createdAt.desc"
            )
            m["creditHistory"] = cr
        return members
    else:
        members = memory_store.get_all(TABLE)
        for m in members:
            m["creditHistory"] = memory_store.get_all(
                CREDIT_TABLE, {"userId": m["id"]}
            )
        return members


@router.post("", response_model=Member)
async def createMember(body: MemberCreate):
    """
    新增成员。
    如果请求中包含 username + password，自动创建登录账号。
    """
    memberId = str(uuid.uuid4())[:8]
    data = {
        "id": memberId,
        "name": body.name,
        "avatar": body.avatar or "",
        "role": body.role,
        "contact": body.contact,
        "creditScore": body.creditScore or 100,
    }

    if USE_SUPABASE:
        rows = supabase_client.insert(TABLE, data)
        created = rows[0] if rows else data
        created["creditHistory"] = []
    else:
        created = memory_store.insert(TABLE, data)
        created["creditHistory"] = []

    # 同步创建登录账号（如果提供了用户名和密码）
    if body.username and body.password:
        try:
            registerUserInternal(
                username=body.username,
                password=body.password,
                displayName=body.name,
                role=body.accountRole or "user",
            )
        except HTTPException:
            # 用户名冲突时不阻断成员创建，但在终端打印警告
            print(f"[WARN] 登录账号 '{body.username}' 创建失败（可能已存在）")

    return created


@router.put("/{memberId}", response_model=Member)
async def updateMember(memberId: str, body: MemberUpdate):
    """更新成员信息"""
    updateData = body.model_dump(exclude_none=True)
    if not updateData:
        raise HTTPException(status_code=400, detail="No update data")

    if USE_SUPABASE:
        rows = supabase_client.update(TABLE, {"id": f"eq.{memberId}"}, updateData)
        if not rows:
            raise HTTPException(status_code=404, detail="Member not found")
        member = rows[0]
        cr = supabase_client.select(
            CREDIT_TABLE,
            filters={"userId": f"eq.{memberId}"},
            order="createdAt.desc"
        )
        member["creditHistory"] = cr
        return member
    else:
        updated = memory_store.update(TABLE, memberId, updateData)
        if not updated:
            raise HTTPException(status_code=404, detail="Member not found")
        updated["creditHistory"] = memory_store.get_all(
            CREDIT_TABLE, {"userId": memberId}
        )
        return updated


@router.delete("/{memberId}")
async def deleteMember(memberId: str):
    """删除成员"""
    if USE_SUPABASE:
        supabase_client.delete(TABLE, {"id": f"eq.{memberId}"})
    else:
        memory_store.delete(TABLE, memberId)
    return {"ok": True}
