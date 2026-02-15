"""
信用积分事件 API。
将前端 triggerCreditEvent 的去重逻辑和积分计算迁移到后端。
"""

from __future__ import annotations
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from ..database import USE_SUPABASE, supabase_client
from ..memory_store import memory_store
from ..models import CreditRecordCreate, CreditRecord

router = APIRouter(prefix="/api/credits", tags=["credits"])

MEMBERS_TABLE = "members"
CREDITS_TABLE = "credit_records"

# 事件类型 -> 积分变动与描述映射
EVENT_CONFIG = {
    # ===== 加分事件 =====
    "TASK_COMPLETE": {"change": 2, "reason": "完成运营任务步骤"},
    "DAY_COMPLETE": {"change": 5, "reasonTemplate": "完成D{day}运营周期"},
    "VISUAL_ASSET_SAVED": {"change": 1, "reason": "保存AI视觉素材"},
    "GOAL_COMPLETE_ON_TIME": {"change": 3, "reason": "按时完成致富目标"},
    "ASSET_COMPLETE": {"change": 5, "reason": "产品完成全部运营流程"},
    "PUBLIC_POOL_TAKEN": {"change": 1, "reason": "从公共池领取产品"},
    # ===== 扣分事件 =====
    "GOAL_COMPLETE_LATE": {"change": -1, "reason": "目标超时完成"},
    "GOAL_OVERDUE_PENALTY": {"change": -3, "reason": "致富目标逾期未完成"},
    "WEEKLY_GOAL_COUNT_INSUFFICIENT": {"change": -2, "reason": "周目标数量不达标"},
    "MANUAL_ABANDON": {"change": -5, "reason": "手动放弃运营中的产品"},
    "ABANDON_WITHOUT_LOG": {"change": -8, "reason": "无操作记录直接放弃产品"},
    "ENTER_TRASH": {"change": -3, "reason": "产品被废弃"},
    "EARLY_MAINTAIN": {"change": 2, "reason": "提前进入维护期（表现良好）"},
}


@router.post("/trigger", response_model=CreditRecord | dict)
async def triggerCreditEvent(body: CreditRecordCreate):
    """触发信用事件：去重 -> 计算积分 -> 更新成员分数 -> 写入记录"""
    config = EVENT_CONFIG.get(body.eventType)
    if not config:
        return {"skipped": True, "reason": f"Unknown event type: {body.eventType}"}

    relatedId = body.relatedId or ""
    cycleKey = body.cycleKey or "default"

    # ---- 去重检查 ----
    if USE_SUPABASE:
        dup = supabase_client.select(
            CREDITS_TABLE,
            columns="id",
            filters={
                "userId": f"eq.{body.userId}",
                "eventType": f"eq.{body.eventType}",
                "relatedId": f"eq.{relatedId}",
                "cycleKey": f"eq.{cycleKey}",
            }
        )
        if dup:
            return {"skipped": True, "reason": "Duplicate event"}
    else:
        existing = memory_store.get_all(CREDITS_TABLE)
        isDuplicate = any(
            r.get("userId") == body.userId
            and r.get("eventType") == body.eventType
            and r.get("relatedId") == relatedId
            and r.get("cycleKey") == cycleKey
            for r in existing
        )
        if isDuplicate:
            return {"skipped": True, "reason": "Duplicate event"}

    # ---- 计算积分变动 ----
    change = config["change"]
    if "reasonTemplate" in config:
        dayNum = (body.data or {}).get("day", "?")
        reason = config["reasonTemplate"].format(day=dayNum)
    else:
        reason = config["reason"]

    # ---- 写入信用记录 ----
    recordId = str(uuid.uuid4())[:8]
    record = {
        "id": recordId,
        "userId": body.userId,
        "change": change,
        "reason": reason,
        "eventType": body.eventType,
        "relatedId": relatedId,
        "cycleKey": cycleKey,
        "createdAt": datetime.now().isoformat(),
    }

    if USE_SUPABASE:
        supabase_client.insert(CREDITS_TABLE, record)
        # 更新成员积分
        memberRows = supabase_client.select(
            MEMBERS_TABLE, columns="creditScore",
            filters={"id": f"eq.{body.userId}"}
        )
        if memberRows:
            currentScore = memberRows[0]["creditScore"]
            newScore = max(0, currentScore + change)
            supabase_client.update(
                MEMBERS_TABLE,
                {"id": f"eq.{body.userId}"},
                {"creditScore": newScore}
            )
    else:
        memory_store.insert(CREDITS_TABLE, record)
        member = memory_store.get_by_id(MEMBERS_TABLE, body.userId)
        if member:
            member["creditScore"] = max(0, member.get("creditScore", 0) + change)

    return record
