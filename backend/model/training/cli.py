#!/usr/bin/env python3
"""CLI tool for training LoRA adapters."""

import argparse
import json
import sys
from pathlib import Path

from model.training.config import TrainingConfig


def train_command(args):
    """Run training."""
    # Load config from file if provided
    if args.config:
        with open(args.config) as f:
            config_data = json.load(f)
        config = TrainingConfig.from_dict(config_data)
    else:
        config = TrainingConfig(
            dataset_path=args.dataset,
            dataset_type=args.type,
            output_dir=args.output,
            adapter_name=args.name,
            adapter_version=args.version,
            adapter_description=args.description or "",
            base_model=args.base_model,
            num_epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.lr,
            lora_r=args.lora_r,
            lora_alpha=args.lora_alpha,
            lora_dropout=args.lora_dropout,
            dpo_beta=args.beta,
            gradient_accumulation_steps=args.gradient_accumulation_steps,
            warmup_steps=args.warmup_steps,
            weight_decay=args.weight_decay,
            max_grad_norm=args.max_grad_norm,
            fp16=args.fp16.lower() == "true",
            save_steps=args.save_steps,
            save_total_limit=args.save_total_limit,
            eval_steps=args.eval_steps,
            early_stopping_enabled=args.early_stopping_enabled.lower() == "true",
            early_stopping_patience=args.early_stopping_patience,
            early_stopping_threshold=args.early_stopping_threshold,
        )

    # Override with CLI args
    if args.dataset:
        config.dataset_path = args.dataset
    if args.output:
        config.output_dir = args.output

    # Run training
    if config.dataset_type == "supervised":
        from model.training.supervised import train_supervised

        output_path = train_supervised(config)
    else:
        from model.training.preference import train_preference

        output_path = train_preference(config)

    print(f"\nTraining complete! Adapter saved to: {output_path}")
    print("\nTo register this adapter with the API, run:")
    print(
        f"  python -m model.training.cli register --path {output_path} --name {config.adapter_name} --version {config.adapter_version}"
    )


def register_command(args):
    """Register adapter with the API."""
    import httpx

    api_url = args.api_url.rstrip("/")

    # Load training config if available
    config_path = Path(args.path) / "training_config.json"
    training_config = {}
    if config_path.exists():
        with open(config_path) as f:
            training_config = json.load(f)

    # Register adapter
    data = {
        "name": args.name,
        "version": args.version,
        "description": args.description
        or training_config.get("adapter_description", ""),
        "base_model": args.base_model
        or training_config.get("base_model", "facebook/musicgen-small"),
        "storage_path": str(Path(args.path).absolute()),
        "training_config": training_config,
    }

    if args.dataset_id:
        data["training_dataset_id"] = args.dataset_id

    response = httpx.post(f"{api_url}/adapters", json=data)

    if response.status_code == 201:
        adapter = response.json()
        print("Adapter registered successfully!")
        print(f"  ID: {adapter['id']}")
        print(f"  Name: {adapter['name']} v{adapter['version']}")
    else:
        print(f"Failed to register adapter: {response.status_code}")
        print(response.text)
        sys.exit(1)


def list_command(args):
    """List registered adapters."""
    import httpx

    api_url = args.api_url.rstrip("/")
    response = httpx.get(f"{api_url}/adapters")

    if response.status_code == 200:
        data = response.json()
        print(f"Total adapters: {data['total']}\n")

        for adapter in data["items"]:
            status = "active" if adapter["is_active"] else "inactive"
            print(f"  [{status}] {adapter['name']} v{adapter['version']}")
            print(f"    ID: {adapter['id']}")
            print(f"    Base model: {adapter['base_model']}")
            if adapter["description"]:
                print(f"    Description: {adapter['description']}")
            print()
    else:
        print(f"Failed to list adapters: {response.status_code}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Text2Song Studio Training CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Train command
    train_parser = subparsers.add_parser("train", help="Train a LoRA adapter")
    train_parser.add_argument("--config", help="Path to config JSON file")
    train_parser.add_argument("--dataset", help="Path to training dataset")
    train_parser.add_argument(
        "--type", choices=["supervised", "preference"], default="supervised"
    )
    train_parser.add_argument("--output", help="Output directory")
    train_parser.add_argument("--name", help="Adapter name")
    train_parser.add_argument("--version", default="1.0.0", help="Adapter version")
    train_parser.add_argument("--description", help="Adapter description")
    train_parser.add_argument("--base-model", default="facebook/musicgen-small")
    train_parser.add_argument("--epochs", type=int, default=3)
    train_parser.add_argument("--batch-size", type=int, default=2)
    train_parser.add_argument("--lr", type=float, default=1e-4)
    train_parser.add_argument("--lora-r", type=int, default=16)
    train_parser.add_argument("--lora-alpha", type=int, default=32)
    train_parser.add_argument("--lora-dropout", type=float, default=0.05)
    train_parser.add_argument("--beta", type=float, default=0.1, help="DPO beta")
    train_parser.add_argument("--gradient-accumulation-steps", type=int, default=4)
    train_parser.add_argument("--warmup-steps", type=int, default=100)
    train_parser.add_argument("--weight-decay", type=float, default=0.01)
    train_parser.add_argument("--max-grad-norm", type=float, default=1.0)
    train_parser.add_argument(
        "--fp16", type=str, default="true", help="Enable FP16 mixed precision"
    )
    train_parser.add_argument("--save-steps", type=int, default=500)
    train_parser.add_argument("--save-total-limit", type=int, default=3)
    train_parser.add_argument("--eval-steps", type=int, default=100)
    train_parser.add_argument(
        "--early-stopping-enabled",
        type=str,
        default="true",
        help="Enable early stopping",
    )
    train_parser.add_argument("--early-stopping-patience", type=int, default=3)
    train_parser.add_argument("--early-stopping-threshold", type=float, default=0.01)
    train_parser.set_defaults(func=train_command)

    # Register command
    register_parser = subparsers.add_parser(
        "register", help="Register adapter with API"
    )
    register_parser.add_argument("--path", required=True, help="Path to adapter")
    register_parser.add_argument("--name", required=True, help="Adapter name")
    register_parser.add_argument("--version", default="1.0.0", help="Adapter version")
    register_parser.add_argument("--description", help="Adapter description")
    register_parser.add_argument("--base-model", help="Base model name")
    register_parser.add_argument("--dataset-id", help="Training dataset ID")
    register_parser.add_argument("--api-url", default="http://localhost:8000")
    register_parser.set_defaults(func=register_command)

    # List command
    list_parser = subparsers.add_parser("list", help="List registered adapters")
    list_parser.add_argument("--api-url", default="http://localhost:8000")
    list_parser.set_defaults(func=list_command)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
