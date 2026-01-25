# Design: Backend Testing Infrastructure

## Context
Text2Song Studio 後端使用 FastAPI + SQLAlchemy async + Pydantic，目前僅有 health endpoint 測試。需要建立完整測試架構以確保 API 品質。

### 約束條件
- 資料庫交互使用 mock，不進行整合測試
- LLM/HuggingFace 相關功能不測試（generation service 的模型呼叫）
- S3/MinIO 使用 mock
- 目標覆蓋率 50%

## Goals / Non-Goals
### Goals
- 建立清晰的測試資料夾結構
- 提供可重用的 test fixtures
- 達到 50% 程式碼覆蓋率
- 測試 Pydantic validation 邏輯
- 測試 API endpoint 的 request/response 處理

### Non-Goals
- 資料庫整合測試
- E2E 測試
- 效能測試
- LLM 推論測試

## Decisions

### Decision 1: Test Directory Structure
採用按類型分類的結構：
```
backend/tests/
├── __init__.py
├── conftest.py           # 共用 fixtures
├── test_health.py        # 既有測試
├── test_config.py        # Config 測試
├── schemas/              # Schema 驗證測試
│   ├── __init__.py
│   ├── test_prompt.py
│   ├── test_feedback.py
│   ├── test_adapter.py
│   ├── test_dataset.py
│   ├── test_experiment.py
│   └── test_generation.py
├── routers/              # Router 測試
│   ├── __init__.py
│   ├── test_prompts.py
│   ├── test_feedback.py
│   ├── test_adapters.py
│   ├── test_datasets.py
│   ├── test_experiments.py
│   ├── test_audio.py
│   └── test_generation.py
└── services/             # Service 測試
    ├── __init__.py
    ├── test_storage.py
    └── test_dataset.py
```

**理由**: 與 `app/` 結構對應，便於定位測試檔案。

### Decision 2: Mocking Strategy
使用 `unittest.mock` 和 `pytest-mock`：
- **Database**: Mock `AsyncSession` 和 query results
- **Storage**: Mock `boto3.client`
- **Generation Service**: 不測試，因涉及 HuggingFace 模型

**理由**: 保持測試快速且隔離，不依賴外部服務。

### Decision 3: Fixture Design
```python
# conftest.py
@pytest.fixture
def client():
    """Test client with mocked dependencies."""
    
@pytest.fixture
def mock_db():
    """Mock AsyncSession with configurable responses."""
    
@pytest.fixture
def mock_storage():
    """Mock StorageService."""

@pytest.fixture
def sample_prompt():
    """Factory for Prompt test data."""
```

**理由**: 集中管理測試資料，避免重複程式碼。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Mock 與實際行為不一致 | 定期審查 mock 設定；未來可加入整合測試 |
| 覆蓋率數字但缺乏有效測試 | 強調有意義的 assertion，不只追求行數 |
| 測試維護成本 | 使用 fixtures 和工廠模式減少重複 |

## Open Questions
- 未來是否需要加入資料庫整合測試？（當前決定：否，保持 mock）
