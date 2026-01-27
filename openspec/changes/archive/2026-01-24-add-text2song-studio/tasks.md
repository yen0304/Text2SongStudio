# Tasks: Add Text2Song Studio Platform

## Phase 1: Project Foundation

- [x] 1.1 Initialize monorepo structure with frontend/, backend/, and model/ directories
- [x] 1.2 Set up Next.js frontend with Tailwind CSS and shadcn/ui
- [x] 1.3 Set up FastAPI backend with project structure (routers, models, services)
- [x] 1.4 Configure PostgreSQL database with SQLAlchemy models
- [x] 1.5 Set up MinIO for local S3-compatible storage
- [x] 1.6 Create Docker Compose for local development environment
- [x] 1.7 Add basic health check endpoints and CORS configuration

## Phase 2: Prompt Management

- [x] 2.1 Create Prompt database model and Pydantic schemas
- [x] 2.2 Implement POST /prompts endpoint with validation
- [x] 2.3 Implement GET /prompts and GET /prompts/{id} endpoints
- [x] 2.4 Build prompt editor component in frontend
- [x] 2.5 Add structured attribute inputs (style, tempo, mood, 
95 x 16
讓我先了解一下目前的音樂生成配置和設定：

現在我了解了問題所在。讓我檢查一下有什麼更好的模型選項：

讀取 spec.md，1 至 50 行

根據我的分析，以下是提升音樂生成品質的幾個關鍵方向：

🎵 提升音樂品質的方法
1. 升級到更大的模型 ⭐ 最有效
你目前使用的是 facebook/musicgen-small，這是最小的版本。MusicGen 有三個版本：

模型	參數量	品質
musicgen-small	300M	較差
musicgen-medium	1.5B	中等
musicgen-large	3.3B	最佳
修改方式：在 .env 檔案中或 config.py 更改：

2. 調整生成參數
在生成時可以調整這些參數來改善品質：

參數	目前值	建議值	說明
temperature	1.0	0.7-0.9	降低可讓輸出更穩定
top_k	250	150-200	減少隨機性
top_p	0.0	0.9	啟用 nucleus sampling
3. 使用更好的 Prompt 描述
撰寫更詳細的音樂描述，例如：

instrumentation)
- [x] 2.6 Implement prompt validation (length limits, attribute schema)
- [x] 2.7 Add prompt history/listing UI

## Phase 3: Audio Generation

- [x] 3.1 Integrate MusicGen model loading with PEFT support
- [x] 3.2 Create AudioSample database model
- [x] 3.3 Implement background job system for generation
- [x] 3.4 Implement POST /generate endpoint (submit job)
- [x] 3.5 Implement GET /generate/{job_id} endpoint (poll status)
- [x] 3.6 Implement audio upload to S3/MinIO storage
- [x] 3.7 Implement GET /audio/{id}/stream endpoint
- [x] 3.8 Build generation status UI with progress indicator
- [x] 3.9 Integrate wavesurfer.js for audio waveform playback
- [x] 3.10 Build side-by-side audio comparison component

## Phase 4: Feedback Collection

- [x] 4.1 Create Feedback database model and schemas
- [x] 4.2 Implement POST /feedback endpoint
- [x] 4.3 Implement GET /feedback endpoint with filtering
- [x] 4.4 Build rating UI component (1-5 scale with criteria)
- [x] 4.5 Build A/B preference selection component
- [x] 4.6 Build tag/annotation input component
- [x] 4.7 Implement feedback aggregation statistics endpoint

## Phase 5: Dataset Construction

- [x] 5.1 Create Dataset database model
- [x] 5.2 Implement dataset builder service with filtering logic
- [x] 5.3 Implement POST /datasets endpoint (create from feedback)
- [x] 5.4 Implement supervised dataset export (prompt, audio, rating)
- [x] 5.5 Implement preference dataset export (prompt, chosen, rejected)
- [x] 5.6 Build dataset management UI (create, view, export)
- [x] 5.7 Add dataset statistics and quality metrics

## Phase 6: LoRA Adapter Management

- [x] 6.1 Create Adapter database model
- [x] 6.2 Implement adapter storage and loading utilities
- [x] 6.3 Implement GET /adapters endpoint
- [x] 6.4 Implement POST /adapters endpoint (register adapter)
- [x] 6.5 Implement adapter activation/deactivation
- [x] 6.6 Build adapter selection UI in generation flow
- [x] 6.7 Add adapter metadata display (version, training info)

## Phase 7: Training Pipeline

- [x] 7.1 Create training configuration schema
- [x] 7.2 Implement supervised fine-tuning script with PEFT
- [x] 7.3 Implement preference-based training script (DPO/ranking loss)
- [x] 7.4 Add training progress logging and checkpointing
- [x] 7.5 Create CLI tool for local training execution
- [x] 7.6 Implement adapter registration after training completion
- [x] 7.7 Add training run tracking and history

## Phase 8: Integration and Polish

- [x] 8.1 End-to-end testing of generation -> feedback -> training flow
- [x] 8.2 Add error handling and user-friendly error messages
- [x] 8.3 Implement request validation and rate limiting
- [x] 8.4 Add basic API key authentication
- [x] 8.5 Write API documentation (OpenAPI/Swagger)
- [x] 8.6 Create developer setup guide
- [x] 8.7 Add logging and monitoring hooks

## Dependencies

- Phase 2 depends on Phase 1 completion
- Phase 3 depends on Phase 1 and Phase 2 (prompts required for generation)
- Phase 4 depends on Phase 3 (audio required for feedback)
- Phase 5 depends on Phase 4 (feedback required for datasets)
- Phase 6 can proceed in parallel with Phases 4-5
- Phase 7 depends on Phase 5 and Phase 6
- Phase 8 depends on all previous phases

## Parallelizable Work

Within each phase, frontend and backend tasks can often proceed in parallel:
- Phase 2: Tasks 2.1-2.3 (backend) parallel with 2.4-2.5 (frontend)
- Phase 3: Tasks 3.1-3.7 (backend) parallel with 3.8-3.10 (frontend)
- Phase 4: Tasks 4.1-4.3 (backend) parallel with 4.4-4.6 (frontend)
