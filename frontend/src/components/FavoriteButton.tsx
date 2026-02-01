'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { favoritesApi, type TargetType } from '@/lib/api';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  targetType: TargetType;
  targetId: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
}

export function FavoriteButton({ 
  targetType, 
  targetId, 
  className,
  size = 'icon',
  variant = 'ghost'
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    // Check if item is favorited on mount
    favoritesApi.check(targetType, targetId)
      .then(fav => {
        setIsFavorited(!!fav);
        setFavoriteId(fav?.id || null);
      })
      .catch(console.error);
  }, [targetType, targetId]);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await favoritesApi.toggle(targetType, targetId);
      setIsFavorited(!!result);
      setFavoriteId(result?.id || null);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        'transition-colors',
        isFavorited && 'text-red-500 hover:text-red-600',
        className
      )}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={cn(
          'h-4 w-4',
          isFavorited && 'fill-current'
        )} 
      />
    </Button>
  );
}
