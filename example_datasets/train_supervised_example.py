"""
範例訓練腳本 - 監督式微調 (Supervised Fine-tuning)

此腳本展示如何使用 Text2SongStudio 的訓練模組進行 LoRA 微調。
"""

import os
import sys

# 將專案根目錄加入 Python 路徑
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from model.training.config import TrainingConfig
from model.training.supervised import train_supervised


def main():
    """執行監督式微調訓練"""
    
    # 建立訓練配置
    config = TrainingConfig(
        # ========== 資料集設定 ==========
        dataset_path="./example_datasets/supervised_dataset.jsonl",
        dataset_type="supervised",  # 使用監督式學習
        
        # ========== 基礎模型 ==========
        # 可選: "facebook/musicgen-small", "facebook/musicgen-medium", "facebook/musicgen-large"
        base_model="facebook/musicgen-small",
        model_cache_dir="./model_cache",
        
        # ========== LoRA 設定 ==========
        lora_r=16,                    # LoRA 秩 (rank)，越大模型能力越強但訓練越慢
        lora_alpha=32,                # LoRA 縮放係數，通常設為 2 * lora_r
        lora_dropout=0.05,            # Dropout 防止過擬合
        lora_target_modules=["q_proj", "v_proj", "k_proj", "out_proj"],  # 要微調的模組
        
        # ========== 訓練參數 ==========
        num_epochs=3,                         # 訓練輪數
        batch_size=2,                         # 批次大小 (根據 GPU 記憶體調整)
        gradient_accumulation_steps=4,        # 梯度累積步數 (有效批次 = batch_size * 此值)
        learning_rate=1e-4,                   # 學習率
        weight_decay=0.01,                    # 權重衰減
        warmup_steps=100,                     # 學習率預熱步數
        max_grad_norm=1.0,                    # 梯度裁剪
        
        # ========== 輸出設定 ==========
        output_dir="./output/my_supervised_adapter",
        adapter_name="my-pop-music-adapter",  # Adapter 名稱
        adapter_version="1.0.0",
        adapter_description="Fine-tuned adapter for generating pop music",
        
        # ========== 檢查點設定 ==========
        save_steps=500,                # 每 N 步保存一次檢查點
        save_total_limit=3,            # 最多保留的檢查點數量
        eval_steps=100,                # 每 N 步評估一次
        
        # ========== 早停設定 ==========
        early_stopping_patience=3,     # 連續 N 次評估無改善則停止
        early_stopping_threshold=0.01, # 改善閾值
        
        # ========== 硬體設定 ==========
        fp16=True,                     # 使用混合精度訓練 (節省記憶體)
        device="cuda",                 # 使用 GPU (如無 GPU 會自動切換到 CPU)
        
        # ========== 日誌設定 ==========
        logging_steps=10,              # 每 N 步記錄一次
        log_dir="./logs",
    )
    
    # 驗證配置
    config.validate()
    
    print("=" * 60)
    print("Text2SongStudio - 監督式微調訓練")
    print("=" * 60)
    print(f"資料集路徑: {config.dataset_path}")
    print(f"基礎模型: {config.base_model}")
    print(f"輸出目錄: {config.output_dir}")
    print(f"Adapter 名稱: {config.adapter_name}")
    print("=" * 60)
    
    # 開始訓練
    train_supervised(config)
    
    print("\n訓練完成！")
    print(f"Adapter 已保存至: {config.output_dir}")


if __name__ == "__main__":
    main()
