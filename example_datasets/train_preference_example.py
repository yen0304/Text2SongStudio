"""
範例訓練腳本 - 偏好學習 (DPO - Direct Preference Optimization)

此腳本展示如何使用 Text2SongStudio 的訓練模組進行 DPO 偏好學習。
DPO 透過人類偏好對比來優化模型，讓模型學習生成人類更偏好的音樂。
"""

import os
import sys

# 將專案根目錄加入 Python 路徑
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from model.training.config import TrainingConfig
from model.training.preference import train_preference


def main():
    """執行 DPO 偏好學習訓練"""
    
    # 建立訓練配置
    config = TrainingConfig(
        # ========== 資料集設定 ==========
        dataset_path="./example_datasets/preference_dataset.jsonl",
        dataset_type="preference",  # 使用偏好學習
        
        # ========== 基礎模型 ==========
        base_model="facebook/musicgen-small",
        model_cache_dir="./model_cache",
        
        # ========== LoRA 設定 ==========
        lora_r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        lora_target_modules=["q_proj", "v_proj", "k_proj", "out_proj"],
        
        # ========== DPO 特定參數 ==========
        dpo_beta=0.1,  # DPO 溫度參數，控制偏好學習的強度
                       # 較小值 (0.01-0.1): 更強的偏好學習效果
                       # 較大值 (0.5-1.0): 更保守的學習
        
        # ========== 訓練參數 ==========
        num_epochs=3,
        batch_size=2,                         # DPO 需要成對比較，建議使用較小批次
        gradient_accumulation_steps=4,
        learning_rate=5e-5,                   # DPO 通常使用比 SFT 更小的學習率
        weight_decay=0.01,
        warmup_steps=50,
        max_grad_norm=1.0,
        
        # ========== 輸出設定 ==========
        output_dir="./output/my_dpo_adapter",
        adapter_name="my-dpo-music-adapter",
        adapter_version="1.0.0",
        adapter_description="DPO-trained adapter based on human preferences",
        
        # ========== 檢查點設定 ==========
        save_steps=500,
        save_total_limit=3,
        eval_steps=100,
        
        # ========== 早停設定 ==========
        early_stopping_patience=3,
        early_stopping_threshold=0.005,  # DPO 的改善通常較小
        
        # ========== 硬體設定 ==========
        fp16=True,
        device="cuda",
        
        # ========== 日誌設定 ==========
        logging_steps=10,
        log_dir="./logs",
    )
    
    # 驗證配置
    config.validate()
    
    print("=" * 60)
    print("Text2SongStudio - DPO 偏好學習訓練")
    print("=" * 60)
    print(f"資料集路徑: {config.dataset_path}")
    print(f"基礎模型: {config.base_model}")
    print(f"DPO Beta: {config.dpo_beta}")
    print(f"輸出目錄: {config.output_dir}")
    print(f"Adapter 名稱: {config.adapter_name}")
    print("=" * 60)
    
    # 開始訓練
    train_preference(config)
    
    print("\n訓練完成！")
    print(f"Adapter 已保存至: {config.output_dir}")


if __name__ == "__main__":
    main()
