"""
Supabase 数据库客户端初始化模块。
使用 httpx 直接调用 Supabase PostgREST API，兼容所有密钥格式。
如果未配置 Supabase 凭证，则回退到内存存储模式以便开发调试。
"""

import os
from typing import Optional
import httpx
from dotenv import load_dotenv

# 加载 backend/ 目录下的 .env 文件
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# 判断是否使用 Supabase
USE_SUPABASE = bool(
    SUPABASE_URL and SUPABASE_SERVICE_KEY
    and SUPABASE_URL != "https://your-project.supabase.co"
)


class SupabaseRestClient:
    """
    轻量 Supabase REST 客户端，通过 PostgREST API 操作数据。
    不依赖 supabase-py SDK，兼容所有密钥格式。
    """

    def __init__(self, url: str, key: str):
        self.base_url = f"{url}/rest/v1"
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _request(
        self,
        method: str,
        table: str,
        params: Optional[dict] = None,
        json_data: Optional[dict | list] = None,
    ) -> list[dict]:
        """发送 HTTP 请求到 PostgREST 端点"""
        url = f"{self.base_url}/{table}"
        resp = httpx.request(
            method,
            url,
            headers=self.headers,
            params=params or {},
            json=json_data,
            timeout=15.0,
            verify=False  # Disable SSL verification to avoid proxy/firewall issues
        )
        resp.raise_for_status()
        if resp.status_code == 204 or not resp.text:
            return []
        return resp.json()

    # ---- 查询 ----

    def select(self, table: str, columns: str = "*", filters: Optional[dict] = None,
               order: Optional[str] = None, limit: Optional[int] = None) -> list[dict]:
        """
        SELECT 查询。
        filters 示例: {"workspace": "eq.Tmall", "userId": "eq.m1"}
        order 示例: "createdAt.desc"
        """
        params = {"select": columns}
        if filters:
            params.update(filters)
        if order:
            params["order"] = order
        if limit:
            params["limit"] = str(limit)
        return self._request("GET", table, params=params)

    # ---- 写入 ----

    def insert(self, table: str, data: dict) -> list[dict]:
        """INSERT 一条记录"""
        return self._request("POST", table, json_data=data)

    def update(self, table: str, filters: dict, data: dict) -> list[dict]:
        """UPDATE 记录，filters 为 PostgREST 过滤条件"""
        return self._request("PATCH", table, params=filters, json_data=data)

    def delete(self, table: str, filters: dict) -> list[dict]:
        """DELETE 记录"""
        return self._request("DELETE", table, params=filters)


# 初始化客户端
supabase_client: Optional[SupabaseRestClient] = None

if USE_SUPABASE:
    supabase_client = SupabaseRestClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    # 通过一个简单请求测试连接
    try:
        supabase_client.select("members", limit=1)
        print("[OK] Supabase connected and 'members' table exists")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404 or "does not exist" in e.response.text:
            print("[WARN] Supabase connected but tables not created yet")
            print("[WARN] Please execute init_db.sql in Supabase SQL Editor")
        else:
            print(f"[WARN] Supabase connection issue: {e.response.status_code} {e.response.text[:200]}")
    except Exception as e:
        print(f"[WARN] Supabase connection test failed: {e}")
        print("[INFO] Will retry on first actual request")
else:
    print("[WARN] Supabase not configured, using in-memory storage")
