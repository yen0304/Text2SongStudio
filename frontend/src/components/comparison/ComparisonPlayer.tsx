'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { abTestsApi, audioApi, ABTestPair } from '@/lib/api';
import { Play, Pause, Volume2, ThumbsUp, Equal } from 'lucide-react';

interface ComparisonPlayerProps {
  pair: ABTestPair;
  testId: string;
  onVoted: () => void;
}

export function ComparisonPlayer({ pair, testId, onVoted }: ComparisonPlayerProps) {
  const [playingA, setPlayingA] = useState(false);
  const [playingB, setPlayingB] = useState(false);
  const [voting, setVoting] = useState(false);
  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);

  const handlePlayA = () => {
    if (playingA) {
      audioRefA.current?.pause();
      setPlayingA(false);
    } else {
      audioRefB.current?.pause();
      setPlayingB(false);
      audioRefA.current?.play();
      setPlayingA(true);
    }
  };

  const handlePlayB = () => {
    if (playingB) {
      audioRefB.current?.pause();
      setPlayingB(false);
    } else {
      audioRefA.current?.pause();
      setPlayingA(false);
      audioRefB.current?.play();
      setPlayingB(true);
    }
  };

  const handleVote = async (preference: 'a' | 'b' | 'equal') => {
    setVoting(true);
    try {
      await abTestsApi.submitVote(testId, pair.id, preference);
      onVoted();
    } catch (error) {
      console.error('Failed to submit vote:', error);
    } finally {
      setVoting(false);
    }
  };

  const handleAudioEndA = () => setPlayingA(false);
  const handleAudioEndB = () => setPlayingB(false);

  if (pair.preference !== null) {
    return (
      <div className="p-6 bg-muted/30 rounded-lg border border-border text-center">
        <p className="text-muted-foreground">
          You voted for{' '}
          <span className="font-bold">
            {pair.preference === 'a' ? 'Sample A' : pair.preference === 'b' ? 'Sample B' : 'Equal'}
          </span>
        </p>
      </div>
    );
  }

  if (!pair.is_ready || !pair.audio_a_id || !pair.audio_b_id) {
    return (
      <div className="p-6 bg-muted/30 rounded-lg border border-border text-center">
        <p className="text-muted-foreground">Generating samples...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border border-border rounded-lg space-y-6">
      {/* Audio Elements */}
      <audio
        ref={audioRefA}
        src={audioApi.getStreamUrl(pair.audio_a_id)}
        onEnded={handleAudioEndA}
        preload="metadata"
      />
      <audio
        ref={audioRefB}
        src={audioApi.getStreamUrl(pair.audio_b_id)}
        onEnded={handleAudioEndB}
        preload="metadata"
      />

      {/* Player Controls */}
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <Button
            size="lg"
            variant={playingA ? 'default' : 'outline'}
            className="w-full h-24 flex flex-col gap-2"
            onClick={handlePlayA}
          >
            <Volume2 size={24} />
            <span className="font-bold">Sample A</span>
            <span className="text-xs">{playingA ? 'Playing...' : 'Click to play'}</span>
          </Button>
        </div>
        <div className="text-center">
          <Button
            size="lg"
            variant={playingB ? 'default' : 'outline'}
            className="w-full h-24 flex flex-col gap-2"
            onClick={handlePlayB}
          >
            <Volume2 size={24} />
            <span className="font-bold">Sample B</span>
            <span className="text-xs">{playingB ? 'Playing...' : 'Click to play'}</span>
          </Button>
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="border-t pt-6">
        <p className="text-center text-sm text-muted-foreground mb-4">
          Which sample sounds better?
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => handleVote('a')}
            disabled={voting}
            className="flex-1 max-w-40"
          >
            <ThumbsUp size={16} className="mr-2" />
            A is better
          </Button>
          <Button
            variant="outline"
            onClick={() => handleVote('equal')}
            disabled={voting}
            className="flex-1 max-w-32"
          >
            <Equal size={16} className="mr-2" />
            Equal
          </Button>
          <Button
            onClick={() => handleVote('b')}
            disabled={voting}
            className="flex-1 max-w-40"
          >
            <ThumbsUp size={16} className="mr-2" />
            B is better
          </Button>
        </div>
      </div>
    </div>
  );
}
