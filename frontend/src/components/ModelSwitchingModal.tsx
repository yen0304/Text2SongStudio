'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Download, Loader2, XCircle } from 'lucide-react';
import { modelsApi, type ModelSwitchProgressEvent } from '@/lib/api';

interface ModelSwitchingModalProps {
  isOpen: boolean;
  modelId: string;
  modelDisplayName: string;
  onComplete: (success: boolean, currentModel?: string) => void;
}

export function ModelSwitchingModal({
  isOpen,
  modelId,
  modelDisplayName,
  onComplete,
}: ModelSwitchingModalProps) {
  const [stage, setStage] = useState<string>('');
  const [message, setMessage] = useState<string>('Initializing...');
  const [progress, setProgress] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [filesCompleted, setFilesCompleted] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');
  const [downloadInfo, setDownloadInfo] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !modelId) return;

    // Reset state
    setStage('');
    setMessage('Initializing...');
    setProgress(0);
    setOverallProgress(0);
    setFilesCompleted(0);
    setTotalFiles(0);
    setFileName('');
    setDownloadInfo('');
    setStatus('loading');
    setErrorMessage('');

    const handleProgress = (event: ModelSwitchProgressEvent) => {
      setStage(event.stage || '');
      setMessage(event.message);

      if (event.event === 'progress' && event.progress !== undefined) {
        // Update current file progress
        setProgress(event.progress);
        setFileName(event.file_name || '');
        
        // Update overall progress if available
        if (event.overall_progress !== undefined) {
          setOverallProgress(event.overall_progress);
        }
        if (event.files_completed !== undefined) {
          setFilesCompleted(event.files_completed);
        }
        if (event.total_files !== undefined) {
          setTotalFiles(event.total_files);
        }
        
        if (event.downloaded_size && event.total_size) {
          setDownloadInfo(`${event.downloaded_size} / ${event.total_size}${event.speed ? ` @ ${event.speed}` : ''}`);
        } else if (event.file_complete) {
          // Clear download info when a file completes
          setDownloadInfo('');
        }
      } else if (event.event === 'status') {
        // For status events, show indeterminate progress
        if (event.stage === 'unloading') {
          setProgress(10);
          setOverallProgress(5);
        } else if (event.stage === 'loading') {
          setProgress(90);
          setOverallProgress(95);
        } else if (event.stage === 'preparing') {
          setProgress(0);
          setOverallProgress(0);
        }
      } else if (event.event === 'done') {
        setStatus('success');
        setProgress(100);
        setOverallProgress(100);
        setTimeout(() => {
          onComplete(true, event.current_model);
        }, 1500);
      } else if (event.event === 'error') {
        setStatus('error');
        setErrorMessage(event.message);
        setTimeout(() => {
          onComplete(false);
        }, 3000);
      }
    };

    modelsApi.switchModelStream(modelId, handleProgress).catch((err) => {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to switch model');
      setTimeout(() => {
        onComplete(false);
      }, 3000);
    });
  }, [isOpen, modelId, onComplete]);

  const getStageIcon = () => {
    if (status === 'success') {
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    }
    if (status === 'error') {
      return <XCircle className="h-8 w-8 text-red-500" />;
    }
    if (stage === 'downloading') {
      return <Download className="h-8 w-8 text-blue-500 animate-pulse" />;
    }
    return <Loader2 className="h-8 w-8 text-primary animate-spin" />;
  };

  const getStageLabel = () => {
    if (status === 'success') return 'Complete';
    if (status === 'error') return 'Error';
    switch (stage) {
      case 'unloading':
        return 'Unloading Current Model';
      case 'downloading':
        return 'Downloading Model';
      case 'loading':
        return 'Loading Model';
      case 'complete':
        return 'Complete';
      default:
        return 'Preparing';
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStageIcon()}
            <span>Switching to {modelDisplayName}</span>
          </DialogTitle>
          <DialogDescription>
            {status === 'loading' && (
              <span className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                Please do not close this page or navigate away
              </span>
            )}
            {status === 'success' && (
              <span className="text-green-600 dark:text-green-500">
                Model switch completed successfully!
              </span>
            )}
            {status === 'error' && (
              <span className="text-red-600 dark:text-red-500">
                {errorMessage}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stage indicator */}
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {getStageLabel()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>

          {/* Overall progress bar (when downloading) */}
          {stage === 'downloading' && totalFiles > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Overall Progress</span>
                <span>File {filesCompleted + 1} / {totalFiles}</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span></span>
                <span>{overallProgress.toFixed(0)}%</span>
              </div>
            </div>
          )}

          {/* Current file progress bar */}
          <div className="space-y-2">
            {stage === 'downloading' && totalFiles > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current File</span>
                <span></span>
              </div>
            )}
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="truncate max-w-[200px]" title={fileName || 'Processing...'}>
                {fileName || 'Processing...'}
              </span>
              <span>{progress.toFixed(0)}%</span>
            </div>
          </div>

          {/* Download info */}
          {downloadInfo && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-mono">
                {downloadInfo}
              </p>
            </div>
          )}

          {/* Warning message */}
          {status === 'loading' && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                Model switching may take several minutes depending on model size and internet speed.
                Large models (e.g., MusicGen Large) require downloading ~8GB of data.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
