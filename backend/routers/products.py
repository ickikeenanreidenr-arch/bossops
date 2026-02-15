"""
商品 API 路由。
按工作区（Tmall / TaoFactory）隔离数据。
"""

from __future__ import annotations
import uuid
from fastapi import APIRouter, HTTPException, Query
from ..database import USE_SUPABASE, supabase_client
from ..memory_store import memory_store
from ..models import Product, ProductCreate, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["products"])

TABLE = "products"


@router.get("", response_model=list[Product])
async def getProducts(workspace: str = Query("Tmall")):
    """按工作区获取商品列表"""
    if USE_SUPABASE:
        return supabase_client.select(TABLE, filters={"workspace": f"eq.{workspace}"})
    else:
        return memory_store.get_all(TABLE, {"workspace": workspace})


@router.get("/{productId}", response_model=Product)
async def getProduct(productId: str):
    """获取单个商品详情"""
    if USE_SUPABASE:
        rows = supabase_client.select(TABLE, filters={"id": f"eq.{productId}"})
        if not rows:
            raise HTTPException(status_code=404, detail="Product not found")
        return rows[0]
    else:
        product = memory_store.get_by_id(TABLE, productId)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product


@router.post("", response_model=Product)
async def createProduct(body: ProductCreate):
    """新增商品"""
    newId = str(uuid.uuid4())[:8]
    data = {
        "id": newId,
        "name": body.name,
        "productId": body.productId,
        "image": body.image or "",
        "storeName": body.storeName,
        "link": body.link,
        "profitLink": body.profitLink,
        "imagePackagePath": body.imagePackagePath,
        "operatorId": body.operatorId,
        "status": body.status.value if body.status else "Pending",
        "workspace": body.workspace,
        "dayCount": 0,
        "history": [],
        "taskProgress": {},
        "strategy": body.strategy,
        "lifecycleStage": body.lifecycleStage,
        "lastUpdateDate": None,
        "analysisRecords": [],
    }

    if USE_SUPABASE:
        rows = supabase_client.insert(TABLE, data)
        return rows[0] if rows else data
    else:
        return memory_store.insert(TABLE, data)


@router.put("/{productId}", response_model=Product)
async def updateProduct(productId: str, body: ProductUpdate):
    """更新商品（支持部分更新）"""
    updateData = body.model_dump(exclude_none=True)
    if "status" in updateData and updateData["status"]:
        updateData["status"] = (
            updateData["status"].value
            if hasattr(updateData["status"], "value")
            else updateData["status"]
        )

    if not updateData:
        raise HTTPException(status_code=400, detail="No update data")

    if USE_SUPABASE:
        rows = supabase_client.update(TABLE, {"id": f"eq.{productId}"}, updateData)
        if not rows:
            raise HTTPException(status_code=404, detail="Product not found")
        return rows[0]
    else:
        updated = memory_store.update(TABLE, productId, updateData)
        if not updated:
            raise HTTPException(status_code=404, detail="Product not found")
        return updated


@router.delete("/{productId}")
async def deleteProduct(productId: str):
    """软删除商品"""
    if USE_SUPABASE:
        supabase_client.update(TABLE, {"id": f"eq.{productId}"}, {"status": "Trashed"})
    else:
        memory_store.update(TABLE, productId, {"status": "Trashed"})
    return {"ok": True}
