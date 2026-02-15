"""
致富目标 API 路由。
按工作区隔离数据。
"""

from __future__ import annotations
import uuid
from fastapi import APIRouter, HTTPException, Query
from ..database import USE_SUPABASE, supabase_client
from ..memory_store import memory_store
from ..models import Target, TargetCreate, TargetUpdate

router = APIRouter(prefix="/api/targets", tags=["targets"])

TABLE = "targets"


@router.get("", response_model=list[Target])
async def getTargets(workspace: str = Query("Tmall")):
    """按工作区获取目标列表"""
    if USE_SUPABASE:
        return supabase_client.select(TABLE, filters={"workspace": f"eq.{workspace}"})
    else:
        return memory_store.get_all(TABLE, {"workspace": workspace})


@router.post("", response_model=Target)
async def createTarget(body: TargetCreate):
    """新增目标"""
    newId = str(uuid.uuid4())[:8]
    data = {
        "id": newId,
        "title": body.title,
        "type": body.type,
        "priority": body.priority,
        "deadline": body.deadline,
        "operatorId": body.operatorId,
        "workspace": body.workspace,
        "completedAt": None,
        "completionNote": None,
        "completionImages": [],
    }

    if USE_SUPABASE:
        rows = supabase_client.insert(TABLE, data)
        return rows[0] if rows else data
    else:
        return memory_store.insert(TABLE, data)


@router.put("/{targetId}", response_model=Target)
async def updateTarget(targetId: str, body: TargetUpdate):
    """更新目标"""
    updateData = body.model_dump(exclude_none=True)
    if not updateData:
        raise HTTPException(status_code=400, detail="No update data")

    if USE_SUPABASE:
        rows = supabase_client.update(TABLE, {"id": f"eq.{targetId}"}, updateData)
        if not rows:
            raise HTTPException(status_code=404, detail="Target not found")
        return rows[0]
    else:
        updated = memory_store.update(TABLE, targetId, updateData)
        if not updated:
            raise HTTPException(status_code=404, detail="Target not found")
        return updated


@router.delete("/{targetId}")
async def deleteTarget(targetId: str):
    """删除目标"""
    if USE_SUPABASE:
        supabase_client.delete(TABLE, {"id": f"eq.{targetId}"})
    else:
        memory_store.delete(TABLE, targetId)
    return {"ok": True}
