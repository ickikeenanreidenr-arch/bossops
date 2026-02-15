/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Render 后端 API 基础地址，如 https://bossops-api.onrender.com/api */
    readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
