# Change: Redesign Dashboard UI as Model Tuning Control Panel

**Status: APPLIED**
**Applied Date: 2025-01-24**

## Why
當前 UI 設計像音樂播放器，但實際上這是一個「模型行為調校儀表板」。用戶需要管理實驗、監控訓練、比較 Adapter 效果、追蹤 Job 狀態，而非單純播放音樂。參考 GitHub Actions、MLflow、Kubernetes Dashboard 的設計模式更為合適。

## What Changes
- **NEW** 側邊欄導航架構（取代目前的單頁面設計）
- **NEW** Pipeline 視圖：展示 Generation → Feedback → Dataset → Training 工作流
- **NEW** Experiment 管理：列表、比較、詳情頁面
- **NEW** Generation Job Queue：即時任務狀態監控
- **NEW** Adapter 版本歷史：類似 Git history 的視覺化
- **NEW** Metrics Dashboard：訓練損失曲線、評分分佈圖表
- **NEW** A/B Testing 視圖：並排比較不同 Adapter 生成結果
- **NEW** 後端 API：Experiment CRUD、Job 列表查詢、Metrics 端點、A/B Test 管理
- **PRESERVED** 現有生成功能（Prompt 編輯、樂器選擇、音頻播放、Feedback 收集）
- 音頻播放改為內嵌在 Run 詳情頁

## Impact
- Affected specs: `audio-generation`, `training-pipeline`, `feedback-collection`, `lora-adapter-management`
- New specs: `experiment-management`, `dashboard-layout`
- Affected code:
  - Frontend: 新增 sidebar layout、多個新頁面和組件
  - Backend: 新增 Experiment model、擴展 Job/Adapter API、新增 Metrics 端點
- **BREAKING**: 頁面路由結構變更（原 `/` 移至 `/generate`，原 `/training` 移至 `/datasets`）

## Success Criteria
1. ✅ 側邊欄導航可快速切換各功能區
2. ✅ Pipeline 視圖清楚展示當前工作流程階段
3. ✅ Job Queue 顯示所有任務狀態，可篩選和排序
4. ✅ Experiment 列表可比較多次訓練結果
5. ✅ A/B Test 可並排播放和評分不同 Adapter 的生成結果
6. ✅ 現有功能（樂器選擇、Prompt 編輯等）完整保留
