# 範例資料集 (Example Datasets)

本目錄包含 Text2SongStudio 進行 Finetuning 所需的範例資料集格式說明與範例檔案。

## 資料集類型

Text2SongStudio 支援兩種訓練模式，對應兩種不同的資料集格式：

### 1. 監督式微調 (Supervised Fine-tuning)
- 格式檔案：`supervised_dataset.jsonl`
- 用途：使用高評分的音訊樣本進行微調，讓模型學習生成符合特定風格或品質的音樂
- 訓練腳本：`model/training/supervised.py`

### 2. 偏好學習 (Preference/DPO Training)
- 格式檔案：`preference_dataset.jsonl`
- 用途：使用人類偏好對比學習，讓模型學習區分「好」與「不好」的生成結果
- 訓練腳本：`model/training/preference.py`

---

## 監督式微調資料集格式 (Supervised Dataset)

### 格式說明

每一行是一個 JSON 物件，包含以下欄位：

| 欄位名稱 | 類型 | 必填 | 說明 |
|---------|------|------|------|
| `prompt` | string | ✅ | 音樂生成的文字提示詞 |
| `audio_path` | string | ✅ | 音訊檔案的路徑（支援 WAV、MP3、FLAC 格式） |
| `rating` | float | ✅ | 評分 (1-5)，訓練時只會使用評分 ≥ 4 的樣本 |
| `tags` | array | ❌ | 標籤列表，例如 ["high_quality", "energetic"] |

### 範例

```json
{"prompt": "A cheerful pop song with bright piano melody", "audio_path": "./audio/sample_001.wav", "rating": 5.0, "tags": ["pop", "piano", "cheerful"]}
{"prompt": "Cinematic orchestral piece with dramatic strings", "audio_path": "./audio/sample_002.wav", "rating": 4.5, "tags": ["orchestral", "cinematic", "dramatic"]}
```

### 音訊要求

- **取樣率**：32000 Hz（會自動重取樣）
- **聲道**：單聲道或立體聲（會自動轉換為單聲道）
- **最大長度**：10 秒（超過會被截斷）
- **格式**：WAV、MP3、FLAC

---

## 偏好學習資料集格式 (Preference Dataset)

### 格式說明

每一行是一個 JSON 物件，包含以下欄位：

| 欄位名稱 | 類型 | 必填 | 說明 |
|---------|------|------|------|
| `prompt` | string | ✅ | 音樂生成的文字提示詞 |
| `chosen_path` | string | ✅ | 被偏好（較好）的音訊檔案路徑 |
| `rejected_path` | string | ✅ | 被拒絕（較差）的音訊檔案路徑 |
| `chosen_id` | string | ❌ | 被偏好音訊的 ID（可選，用於追蹤） |
| `rejected_id` | string | ❌ | 被拒絕音訊的 ID（可選，用於追蹤） |

### 範例

```json
{"prompt": "Upbeat electronic dance music with heavy bass", "chosen_path": "./audio/edm_good_001.wav", "rejected_path": "./audio/edm_bad_001.wav"}
{"prompt": "Relaxing ambient soundscape with nature sounds", "chosen_path": "./audio/ambient_good_001.wav", "rejected_path": "./audio/ambient_bad_001.wav"}
```

### DPO 訓練說明

DPO (Direct Preference Optimization) 使用對比學習的方式：
- 對於同一個 prompt，模型會學習提高「chosen」音訊的生成機率
- 同時降低「rejected」音訊的生成機率
- `dpo_beta` 參數控制偏好學習的強度（預設為 0.1）

---

## 目錄結構範例

建議的資料集目錄結構：

```
my_dataset/
├── train.jsonl          # 訓練資料
├── eval.jsonl           # 驗證資料（可選）
├── audio/               # 音訊檔案目錄
│   ├── sample_001.wav
│   ├── sample_002.wav
│   └── ...
└── metadata.json        # 資料集元資料（可選）
```

---

## 訓練配置範例

### 監督式微調配置

```python
from model.training.config import TrainingConfig
from model.training.supervised import train_supervised

config = TrainingConfig(
    # 資料集設定
    dataset_path="./my_dataset/train.jsonl",
    dataset_type="supervised",
    
    # 基礎模型
    base_model="facebook/musicgen-small",
    
    # LoRA 設定
    lora_r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    
    # 訓練參數
    num_epochs=3,
    batch_size=2,
    learning_rate=1e-4,
    gradient_accumulation_steps=4,
    
    # 輸出設定
    output_dir="./output/my_adapter",
    adapter_name="my-music-adapter",
    adapter_version="1.0.0",
)

train_supervised(config)
```

### 偏好學習配置

```python
from model.training.config import TrainingConfig
from model.training.preference import train_preference

config = TrainingConfig(
    dataset_path="./my_dataset/preferences.jsonl",
    dataset_type="preference",
    base_model="facebook/musicgen-small",
    
    # DPO 特定參數
    dpo_beta=0.1,
    
    num_epochs=3,
    batch_size=2,
    learning_rate=5e-5,  # DPO 通常使用較小的學習率
    
    output_dir="./output/my_dpo_adapter",
    adapter_name="my-dpo-adapter",
)

train_preference(config)
```

---

## 透過 API 建立資料集

除了手動建立資料集檔案，您也可以透過 Text2SongStudio 的 API 從收集的反饋中自動建構資料集：

### 建立監督式資料集

```bash
curl -X POST "http://localhost:8000/api/datasets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Quality Pop Dataset",
    "type": "supervised",
    "filter_query": {
      "min_rating": 4.0,
      "required_tags": ["pop"]
    }
  }'
```

### 匯出資料集

```bash
curl -X POST "http://localhost:8000/api/datasets/{dataset_id}/export" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "huggingface",
    "output_path": "./exports/my_dataset"
  }'
```

---

## 常見問題

### Q: 資料集需要多少樣本？
建議至少 100-500 個高品質樣本進行監督式微調，偏好學習則建議 200-1000 組對比對。

### Q: 評分低於 4 的樣本會被使用嗎？
監督式微調會自動過濾評分 < 4 的樣本，只使用高評分資料。

### Q: 音訊長度不一致怎麼辦？
系統會自動處理：過長的音訊會被截斷到 10 秒，過短的會進行零填充（zero-padding）。

### Q: 支援哪些音訊格式？
支援 WAV、MP3、FLAC 等 torchaudio 能讀取的所有格式。
