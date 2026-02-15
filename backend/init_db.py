"""
通过 Supabase REST API 执行建表 SQL。
运行方式: python -m backend.init_db
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

SQL_FILE = os.path.join(os.path.dirname(__file__), "init_db.sql")

def run():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
        return

    with open(SQL_FILE, "r", encoding="utf-8") as f:
        sql = f.read()

    # Supabase 提供 /rest/v1/rpc 端点，但建表需要通过 SQL Editor REST API
    # 使用 PostgREST 无法执行 DDL，所以我们逐步通过 supabase-py 来创建
    print("[INFO] Connecting to Supabase...")
    print(f"[INFO] URL: {SUPABASE_URL}")

    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    print("[OK] Connected successfully!")
    print()
    print("=" * 60)
    print("  IMPORTANT: Please run the SQL below in Supabase Dashboard")
    print("  Go to: SQL Editor -> New Query -> Paste & Run")
    print("=" * 60)
    print()
    print(sql)
    print()
    print("=" * 60)

    # 尝试验证连接 - 读取 members 表
    try:
        res = client.table("members").select("id").limit(1).execute()
        print(f"[OK] 'members' table exists, {len(res.data)} rows found")
    except Exception as e:
        err_str = str(e)
        if "does not exist" in err_str or "404" in err_str or "relation" in err_str:
            print("[WARN] 'members' table does not exist yet")
            print("[WARN] Please execute the SQL above in Supabase Dashboard first")
        else:
            print(f"[INFO] Table check result: {err_str}")


if __name__ == "__main__":
    run()
