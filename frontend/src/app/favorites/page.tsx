'use client';

import { useState, useEffect } from 'react';
import { Heart, Music, FileText, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { favoritesApi, type FavoriteWithDetails, type TargetType } from '@/lib/api';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'prompt' | 'audio'>('all');

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const targetType = activeTab === 'all' ? undefined : activeTab as TargetType;
      const response = await favoritesApi.list({ target_type: targetType, limit: 100 });
      setFavorites(response.items);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [activeTab]);

  const handleRemove = async (favoriteId: string) => {
    try {
      await favoritesApi.delete(favoriteId);
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const promptFavorites = favorites.filter(f => f.target_type === 'prompt');
  const audioFavorites = favorites.filter(f => f.target_type === 'audio');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favorites"
        description="Your bookmarked prompts and audio samples"
        icon={<Heart className="h-6 w-6 text-red-500" />}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">
            All ({favorites.length})
          </TabsTrigger>
          <TabsTrigger value="prompt">
            <FileText className="h-4 w-4 mr-2" />
            Prompts ({promptFavorites.length})
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Music className="h-4 w-4 mr-2" />
            Audio ({audioFavorites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <FavoritesList 
            favorites={favorites} 
            isLoading={isLoading} 
            onRemove={handleRemove} 
          />
        </TabsContent>

        <TabsContent value="prompt" className="mt-6">
          <FavoritesList 
            favorites={promptFavorites} 
            isLoading={isLoading} 
            onRemove={handleRemove} 
          />
        </TabsContent>

        <TabsContent value="audio" className="mt-6">
          <FavoritesList 
            favorites={audioFavorites} 
            isLoading={isLoading} 
            onRemove={handleRemove} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface FavoritesListProps {
  favorites: FavoriteWithDetails[];
  isLoading: boolean;
  onRemove: (id: string) => void;
}

function FavoritesList({ favorites, isLoading, onRemove }: FavoritesListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground">Loading favorites...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-48 text-center">
          <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No favorites yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click the heart icon on prompts or audio samples to add them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {favorites.map(favorite => (
        <Card key={favorite.id}>
          <CardContent className="flex items-start justify-between py-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 mt-1">
                {favorite.target_type === 'prompt' ? (
                  <FileText className="h-5 w-5 text-blue-500" />
                ) : (
                  <Music className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {favorite.target_type}
                  </Badge>
                  {favorite.target_created_at && (
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(favorite.target_created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {favorite.target_preview && (
                  <p className="text-sm truncate">
                    {favorite.target_preview}
                  </p>
                )}
                {favorite.note && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Note: {favorite.note}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Favorited {new Date(favorite.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(favorite.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
