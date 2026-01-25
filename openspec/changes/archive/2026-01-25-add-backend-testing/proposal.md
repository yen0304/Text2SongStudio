# Change: Add Backend Testing Infrastructure

## Why
目前後端僅有基本的 health endpoint 測試，缺乏完整的測試覆蓋。需要建立系統化的測試基礎設施，達到 50% 以上的程式碼覆蓋率，以確保後端 API 的穩定性和可維護性。

## What Changes
- 建立後端測試資料夾結構，按功能模組分類
- 新增 pytest fixtures 用於測試隔離和資料模擬
- 為 schemas（Pydantic models）新增驗證測試
- 為 routers 新增 API 端點測試（使用 mocked database）
- 為 services 新增業務邏輯測試（排除 LLM/HuggingFace 相關）
- 配置 pytest-cov 達到 50% 覆蓋率門檻

## Scope
### 包含測試
- Pydantic schemas 驗證邏輯
- Router endpoints（mock database 交互）
- Services 業務邏輯（mock 外部依賴）
- Config 和 utilities

### 排除測試
- Database 實際交互（使用 mock）
- LLM/HuggingFace 模型相關（generation service 的模型呼叫）
- S3/MinIO storage 實際操作（使用 mock）

## Impact
- Affected specs: 新增 `backend-testing` capability
- Affected code:
  - `backend/tests/` - 測試程式碼
  - `backend/pyproject.toml` - 測試配置
