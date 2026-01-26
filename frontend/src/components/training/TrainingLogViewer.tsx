'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { logsApi } from '@/lib/api/modules/logs';
import { cn } from '@/lib/utils';

interface TrainingLogViewerProps {
  runId: string;
  isLive?: boolean;
  height?: string;
  className?: string;
}

export function TrainingLogViewer({
  runId,
  isLive = false,
  height = '400px',
  className,
}: TrainingLogViewerProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decode base64 to Uint8Array
  const decodeBase64 = useCallback((base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }, []);

  // Write data to terminal
  const writeToTerminal = useCallback(
    (data: string | Uint8Array) => {
      if (terminalInstance.current) {
        terminalInstance.current.write(data);
        if (autoScroll) {
          terminalInstance.current.scrollToBottom();
        }
      }
    },
    [autoScroll]
  );

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: false,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        cursor: '#c0caf5',
        cursorAccent: '#1a1b26',
        selectionBackground: '#33467c',
        black: '#32344a',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#ad8ee6',
        cyan: '#449dab',
        white: '#787c99',
        brightBlack: '#444b6a',
        brightRed: '#ff7a93',
        brightGreen: '#b9f27c',
        brightYellow: '#ff9e64',
        brightBlue: '#7da6ff',
        brightMagenta: '#bb9af7',
        brightCyan: '#0db9d7',
        brightWhite: '#acb0d0',
      },
      convertEol: true,
      scrollback: 10000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstance.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    // Use ResizeObserver for container resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      terminal.dispose();
      terminalInstance.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Load history and connect to stream
  useEffect(() => {
    if (!terminalInstance.current) return;

    const loadHistory = async () => {
      try {
        setError(null);
        const response = await logsApi.getLogs(runId);

        if (response.data) {
          const bytes = decodeBase64(response.data);
          writeToTerminal(bytes);
        }

        // If live, connect to SSE stream
        if (isLive) {
          connectToStream();
        }
      } catch (err) {
        console.error('[TrainingLogViewer] Failed to load history:', err);
        setError('Failed to load log history');
      }
    };

    const connectToStream = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = logsApi.createLogStream(runId);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('log', (event: MessageEvent) => {
        const parsed = logsApi.parseSSEEvent(event, 'log');
        if (parsed?.type === 'log') {
          const bytes = decodeBase64(parsed.data.chunk);
          writeToTerminal(bytes);
        }
      });

      eventSource.addEventListener('heartbeat', () => {
        // Just keep connection alive
      });

      eventSource.addEventListener('done', (event: MessageEvent) => {
        const parsed = logsApi.parseSSEEvent(event, 'done');
        if (parsed?.type === 'done') {
          setIsConnected(false);
          eventSource.close();

          // Show completion message
          const exitCode = parsed.data.exit_code;
          if (exitCode === 0) {
            writeToTerminal('\r\n\x1b[32m[Training completed successfully]\x1b[0m\r\n');
          } else {
            writeToTerminal(
              `\r\n\x1b[31m[Training exited with code ${exitCode}]\x1b[0m\r\n`
            );
          }
        }
      });

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        // EventSource will auto-reconnect
      };
    };

    loadHistory();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [runId, isLive, decodeBase64, writeToTerminal]);

  // Clear terminal
  const handleClear = () => {
    terminalInstance.current?.clear();
  };

  return (
    <div className={cn('flex flex-col rounded-lg overflow-hidden border border-zinc-700', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">Training Logs</span>
          {isLive && (
            <span
              className={cn(
                'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                isConnected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                )}
              />
              {isConnected ? 'Live' : 'Connecting...'}
            </span>
          )}
          {!isLive && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-600/50 text-zinc-400">
              Completed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            Auto-scroll
          </label>
          <button
            onClick={handleClear}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={terminalRef}
        style={{ height }}
        className="bg-[#1a1b26]"
      />

      {/* Error message */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
