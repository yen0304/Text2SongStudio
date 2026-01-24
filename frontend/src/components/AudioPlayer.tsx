'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type AudioSample } from '@/lib/api';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface AudioPlayerProps {
  audioIds: string[];
}

export function AudioPlayer({ audioIds }: AudioPlayerProps) {
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);

  useEffect(() => {
    Promise.all(audioIds.map((id) => api.getAudioMetadata(id)))
      .then(setSamples)
      .catch(console.error);
  }, [audioIds]);

  useEffect(() => {
    if (typeof window === 'undefined' || !waveformRef.current || audioIds.length === 0) return;

    let wavesurfer: any = null;

    const initWaveSurfer = async () => {
      const WaveSurfer = (await import('wavesurfer.js')).default;

      wavesurfer = WaveSurfer.create({
        container: waveformRef.current!,
        waveColor: 'hsl(262.1, 83.3%, 57.8%)',
        progressColor: 'hsl(262.1, 83.3%, 40%)',
        cursorColor: 'hsl(262.1, 83.3%, 30%)',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 80,
        normalize: true,
      });

      wavesurfer.on('ready', () => {
        setDuration(wavesurfer.getDuration());
      });

      wavesurfer.on('audioprocess', () => {
        setCurrentTime(wavesurfer.getCurrentTime());
      });

      wavesurfer.on('play', () => setIsPlaying(true));
      wavesurfer.on('pause', () => setIsPlaying(false));
      wavesurfer.on('finish', () => {
        setIsPlaying(false);
        if (currentIndex < audioIds.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      });

      wavesurferRef.current = wavesurfer;

      if (audioIds[currentIndex]) {
        wavesurfer.load(api.getAudioStreamUrl(audioIds[currentIndex]));
      }
    };

    initWaveSurfer();

    return () => {
      if (wavesurfer) {
        wavesurfer.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (wavesurferRef.current && audioIds[currentIndex]) {
      wavesurferRef.current.load(api.getAudioStreamUrl(audioIds[currentIndex]));
    }
  }, [currentIndex, audioIds]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Sample {currentIndex + 1} of {audioIds.length}
          </span>
          {currentSample && (
            <span>
              {currentSample.duration_seconds.toFixed(1)}s @ {currentSample.sample_rate}Hz
            </span>
          )}
        </div>

        <div ref={waveformRef} className="w-full rounded-md overflow-hidden bg-muted" />

        <div className="flex items-center justify-between text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

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

        {audioIds.length > 1 && (
          <div className="flex gap-2 justify-center">
            {audioIds.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
