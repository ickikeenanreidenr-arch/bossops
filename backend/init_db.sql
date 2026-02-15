-- =============================================
-- BossOps 电商工作台 — Supabase 建表 SQL
-- 在 Supabase Dashboard > SQL Editor 中执行
-- =============================================

-- 1. 团队成员表
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    role TEXT NOT NULL,
    contact TEXT DEFAULT '',
    "creditScore" INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初始种子数据
INSERT INTO members (id, name, avatar, role, contact, "creditScore") VALUES
    ('m1', '张三', 'https://picsum.photos/seed/m1/100', '金牌运营', '13800138001', 120),
    ('m2', '李四', 'https://picsum.photos/seed/m2/100', '资深店长', '13800138002', 95),
    ('m3', '王五', 'https://picsum.photos/seed/m3/100', '新锐运营', '13800138003', 55),
    ('m4', '赵六', 'https://picsum.photos/seed/m4/100', '视觉设计', '13800138004', 160)
ON CONFLICT (id) DO NOTHING;


-- 2. 信用记录表
CREATE TABLE IF NOT EXISTS credit_records (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    change INTEGER NOT NULL DEFAULT 0,
    reason TEXT DEFAULT '',
    "eventType" TEXT NOT NULL,
    "relatedId" TEXT DEFAULT '',
    "cycleKey" TEXT DEFAULT 'default',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_user ON credit_records("userId");


-- 3. 商品表
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    image TEXT DEFAULT '',
    "storeName" TEXT DEFAULT '',
    link TEXT DEFAULT '',
    "profitLink" TEXT,
    "imagePackagePath" TEXT,
    "operatorId" TEXT NOT NULL REFERENCES members(id),
    status TEXT DEFAULT 'Pending',
    workspace TEXT NOT NULL DEFAULT 'Tmall',
    "dayCount" INTEGER DEFAULT 0,
    history JSONB DEFAULT '[]'::JSONB,
    "taskProgress" JSONB DEFAULT '{}'::JSONB,
    strategy TEXT,
    "lifecycleStage" TEXT,
    "lastUpdateDate" TEXT,
    "analysisRecords" JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_workspace ON products(workspace);
CREATE INDEX IF NOT EXISTS idx_product_operator ON products("operatorId");


-- 4. 致富目标表
CREATE TABLE IF NOT EXISTS targets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    deadline TEXT NOT NULL,
    "completedAt" TEXT,
    "completionNote" TEXT,
    "completionImages" JSONB DEFAULT '[]'::JSONB,
    "operatorId" TEXT NOT NULL REFERENCES members(id),
    workspace TEXT NOT NULL DEFAULT 'Tmall',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_target_workspace ON targets(workspace);


-- 5. 管理员账号表
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 6. 启用行级安全策略（RLS）— 可选
-- 如果使用 service_role key 访问则不需要 RLS
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE credit_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
