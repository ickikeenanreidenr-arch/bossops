"""
内存存储 — 在未配置 Supabase 凭证时作为回退方案使用。
所有数据仅存活于进程生命周期内，重启后重置。
"""

from __future__ import annotations
import uuid
from datetime import datetime


# ============== 初始种子数据 ==============

SEED_MEMBERS = [
    {
        "id": "m1", "name": "张三",
        "avatar": "https://picsum.photos/seed/m1/100",
        "role": "金牌运营", "contact": "13800138001",
        "creditScore": 120
    },
    {
        "id": "m2", "name": "李四",
        "avatar": "https://picsum.photos/seed/m2/100",
        "role": "资深店长", "contact": "13800138002",
        "creditScore": 95
    },
    {
        "id": "m3", "name": "王五",
        "avatar": "https://picsum.photos/seed/m3/100",
        "role": "新锐运营", "contact": "13800138003",
        "creditScore": 55
    },
    {
        "id": "m4", "name": "赵六",
        "avatar": "https://picsum.photos/seed/m4/100",
        "role": "视觉设计", "contact": "13800138004",
        "creditScore": 160
    },
]


class MemoryStore:
    """简易内存存储，键值结构：{ table_name: [row_dict, ...] }"""

    def __init__(self):
        self.tables: dict[str, list[dict]] = {
            "members": [dict(m) for m in SEED_MEMBERS],
            "credit_records": [],
            "products": [],
            "targets": [],
            "operation_logs": [],
            "analysis_records": [],
        }

    # ---- 通用 CRUD ----

    def get_all(self, table: str, filters: dict | None = None) -> list[dict]:
        rows = self.tables.get(table, [])
        if filters:
            for key, val in filters.items():
                rows = [r for r in rows if r.get(key) == val]
        return rows

    def get_by_id(self, table: str, row_id: str) -> dict | None:
        for row in self.tables.get(table, []):
            if row.get("id") == row_id:
                return row
        return None

    def insert(self, table: str, data: dict) -> dict:
        if "id" not in data or not data["id"]:
            data["id"] = str(uuid.uuid4())[:8]
        self.tables.setdefault(table, []).append(data)
        return data

    def update(self, table: str, row_id: str, data: dict) -> dict | None:
        for i, row in enumerate(self.tables.get(table, [])):
            if row.get("id") == row_id:
                row.update({k: v for k, v in data.items() if v is not None})
                return row
        return None

    def delete(self, table: str, row_id: str) -> bool:
        rows = self.tables.get(table, [])
        for i, row in enumerate(rows):
            if row.get("id") == row_id:
                rows.pop(i)
                return True
        return False


# 单例实例
memory_store = MemoryStore()
