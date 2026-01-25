'use client';

import { useState } from 'react';
import { datasetsApi, Dataset, DatasetExport } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

interface DatasetExportDialogProps {
  dataset: Dataset;
  onClose: () => void;
  onSuccess: () => void;
}

export function DatasetExportDialog({ dataset, onClose, onSuccess }: DatasetExportDialogProps) {
  const [format, setFormat] = useState<'jsonl' | 'huggingface'>('jsonl');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<DatasetExport | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await datasetsApi.export(dataset.id, format);
      setExportResult(result);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const trainingCommand = exportResult
    ? `python -m model.training.cli train \\
  --dataset "${exportResult.export_path}" \\
  --type ${dataset.type} \\
  --name "my-adapter" \\
  --version "1.0.0" \\
  --output ./adapters/my-adapter`
    : '';

  const copyCommand = () => {
    navigator.clipboard.writeText(trainingCommand.replace(/\\\n\s*/g, ' '));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle>Export Dataset: {dataset.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!exportResult ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={format === 'jsonl'}
                      onChange={() => setFormat('jsonl')}
                      className="w-4 h-4"
                    />
                    <span>JSONL (recommended)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={format === 'huggingface'}
                      onChange={() => setFormat('huggingface')}
                      className="w-4 h-4"
                    />
                    <span>Hugging Face Dataset</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This will export <span className="font-semibold">{dataset.sample_count}</span> samples
                  for {dataset.type} training.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </>
          ) : (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Export successful!</p>
                <p className="text-sm text-green-700 mt-1">
                  Path: <code className="bg-green-100 px-1 rounded">{exportResult.export_path}</code>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Training Command</label>
                  <Button variant="ghost" size="sm" onClick={copyCommand}>
                    Copy
                  </Button>
                </div>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                  {trainingCommand}
                </pre>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {!exportResult ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isLoading}>
                {isLoading ? 'Exporting...' : 'Export'}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>
              Done
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
