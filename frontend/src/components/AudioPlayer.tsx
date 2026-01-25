'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type AudioSample } from '@/lib/api';
import { Play, Pause, SkipBack, SkipForward, Check, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioIds: string[];
}

const SAMPLE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function AudioPlayer({ audioIds }: AudioPlayerProps) {
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playedSamples, setPlayedSamples] = useState<Set<number>>(new Set());
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);

  useEffect(() => {
    Promise.all(audioIds.map((id) => api.getAudioMetadata(id)))
      .then(setSamples)
      .catch(console.error);
  }, [audioIds]);

  useEffect(() => {
    if (typeof window === 'undefined' || !waveformRef.current || audioIds.length === 0) return;

    let ws: any = null;
    let destroyed = false;
    let isReady = false;
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    // Use setInterval for reliable progress updates
    const startProgressUpdates = () => {
      if (progressInterval) return;
      progressInterval = setInterval(() => {
        if (destroyed || !ws) return;
        try {
          const current = ws.getCurrentTime();
          setCurrentTime(current);
        } catch (e) {
          // Ignore errors when getting current time
        }
      }, 50); // Update every 50ms for smooth progress
    };

    const stopProgressUpdates = () => {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    };

    const initWaveSurfer = async () => {
      const WaveSurfer = (await import('wavesurfer.js')).default;

      if (destroyed || !waveformRef.current) return;

      ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'hsl(262.1, 83.3%, 57.8%)',
        progressColor: 'hsl(262.1, 83.3%, 40%)',
        cursorColor: 'hsl(262.1, 83.3%, 30%)',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 80,
        normalize: true,
      });

      ws.on('ready', () => {
        isReady = true;
        if (!destroyed) {
          setDuration(ws.getDuration());
          setCurrentTime(0);
        }
      });

      // Update on seeking/interaction
      ws.on('seeking', (currentTime: number) => {
        if (!destroyed) setCurrentTime(currentTime);
      });

      ws.on('interaction', (newTime: number) => {
        if (!destroyed) setCurrentTime(newTime);
      });

      ws.on('play', () => {
        if (!destroyed) {
          setIsPlaying(true);
          startProgressUpdates();
        }
      });
      ws.on('pause', () => {
        if (!destroyed) {
          setIsPlaying(false);
          stopProgressUpdates();
          // Update one final time to get accurate position
          try {
            setCurrentTime(ws.getCurrentTime());
          } catch (e) {}
        }
      });
      ws.on('finish', () => {
        if (!destroyed) {
          setIsPlaying(false);
          stopProgressUpdates();
          setCurrentTime(0);
          setCurrentIndex((prev) => (prev < audioIds.length - 1 ? prev + 1 : prev));
        }
      });
      
      // Handle internal errors from WaveSurfer (including AbortError)
      ws.on('error', () => {
        // Silently ignore - these are often AbortErrors during cleanup
      });

      wavesurferRef.current = ws;

      if (audioIds[0]) {
        try {
          await ws.load(api.getAudioStreamUrl(audioIds[0]));
        } catch (e) {
          // Ignore load errors (including AbortError)
        }
      }
    };

    initWaveSurfer().catch(() => {
      // Ignore initialization errors
    });

    return () => {
      destroyed = true;
      wavesurferRef.current = null;
      
      // Stop progress updates
      stopProgressUpdates();
      
      if (ws) {
        // Unsubscribe all events first to prevent callbacks during cleanup
        try {
          ws.unAll();
        } catch (e) {
          // Ignore
        }
        
        // Only destroy if the instance was fully initialized
        // This prevents AbortError when component unmounts before audio loads
        if (isReady) {
          try {
            ws.pause();
            ws.destroy();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        // If not ready, the load is still in progress - just let it fail silently
        // The unAll() call above will prevent any callbacks
      }
    };
  }, [audioIds]);

  useEffect(() => {
    if (wavesurferRef.current && audioIds[currentIndex]) {
      // Reset time when loading new audio
      setCurrentTime(0);
      setIsPlaying(false);
      wavesurferRef.current.load(api.getAudioStreamUrl(audioIds[currentIndex]));
    }
  }, [currentIndex, audioIds]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setPlayedSamples((prev) => new Set(Array.from(prev).concat([currentIndex])));
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const playNext = () => {
    if (currentIndex < audioIds.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSample = samples[currentIndex];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audio Player</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sample Tabs */}
        {audioIds.length > 1 && (
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {audioIds.map((_, index) => {
              const isActive = index === currentIndex;
              const isPlayed = playedSamples.has(index);
              return (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }
                  `}
                >
                  <span>Sample {SAMPLE_LABELS[index]}</span>
                  {isActive && isPlaying && (
                    <Volume2 className="h-3 w-3 text-primary animate-pulse" />
                  )}
                  {!isActive && isPlayed && (
                    <Check className="h-3 w-3 text-green-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Sample Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            Sample {SAMPLE_LABELS[currentIndex]}
          </span>
          {currentSample && (
            <span>
              {currentSample.duration_seconds.toFixed(1)}s @ {currentSample.sample_rate}Hz
            </span>
          )}
        </div>

        {/* Waveform */}
        <div ref={waveformRef} className="w-full h-20 rounded-md overflow-hidden bg-muted" />

        {/* Time Display */}
        <div className="flex items-center justify-between text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={playPrevious}
            disabled={currentIndex === 0}
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button variant="default" size="icon" onClick={togglePlayPause}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={playNext}
            disabled={currentIndex === audioIds.length - 1}
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Hint */}
        {audioIds.length > 1 && (
          <p className="text-xs text-center text-muted-foreground">
            {playedSamples.size === 0 && 'Click play to listen to each sample'}
            {playedSamples.size > 0 && playedSamples.size < audioIds.length && (
              <>
                <Check className="inline h-3 w-3 text-green-500 mr-1" />
                {playedSamples.size} of {audioIds.length} samples played
              </>
            )}
            {playedSamples.size === audioIds.length && (
              <>
                <Check className="inline h-3 w-3 text-green-500 mr-1" />
                All samples played
              </>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
