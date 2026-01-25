'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ComparisonPlayer } from '@/components/comparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, ABTestDetail, ABTestResults, Prompt } from '@/lib/api';
import {
  Loader2,
  ArrowLeft,
  Play,
  BarChart2,
  GitCompare,
  Plus,
  CheckCircle,
} from 'lucide-react';

export default function ABTestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  
  const [test, setTest] = useState<ABTestDetail | null>(null);
  const [results, setResults] = useState<ABTestResults | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [testData, resultsData, promptsData] = await Promise.all([
        api.getABTest(testId),
        api.getABTestResults(testId),
        api.listPrompts(1, 50),
      ]);
      setTest(testData);
      setResults(resultsData);
      setPrompts(promptsData.items);
      
      // Find first unvoted pair
      const unvotedIndex = testData.pairs.findIndex(p => p.preference === null && p.is_ready);
      if (unvotedIndex >= 0) {
        setCurrentPairIndex(unvotedIndex);
      }
    } catch (error) {
      console.error('Failed to fetch A/B test:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [testId]);

  const handleGenerateSamples = async () => {
    if (selectedPrompts.length === 0) return;
    
    setGenerating(true);
    try {
      await api.generateABTestSamples(testId, { prompt_ids: selectedPrompts });
      setShowPromptSelector(false);
      setSelectedPrompts([]);
      fetchData();
    } catch (error) {
      console.error('Failed to generate samples:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleVoted = () => {
    fetchData();
    // Move to next unvoted pair
    if (test) {
      const nextIndex = test.pairs.findIndex((p, i) => i > currentPairIndex && p.preference === null && p.is_ready);
      if (nextIndex >= 0) {
        setCurrentPairIndex(nextIndex);
      }
    }
  };

  const togglePromptSelection = (promptId: string) => {
    setSelectedPrompts(prev => 
      prev.includes(promptId)
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">A/B test not found</p>
        <Button variant="outline" onClick={() => router.push('/ab-tests')}>
          Back to A/B Tests
        </Button>
      </div>
    );
  }

  const currentPair = test.pairs[currentPairIndex];
  const unvotedPairs = test.pairs.filter(p => p.preference === null && p.is_ready);
  const votedPairs = test.pairs.filter(p => p.preference !== null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={test.name}
        description={test.description || undefined}
        breadcrumb={[
          { label: 'A/B Tests', href: '/ab-tests' },
          { label: test.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/ab-tests')}>
              <ArrowLeft size={16} />
              <span className="ml-2">Back</span>
            </Button>
            <Button onClick={() => setShowPromptSelector(!showPromptSelector)}>
              <Plus size={16} />
              <span className="ml-2">Add Samples</span>
            </Button>
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Adapter A</div>
            <Badge variant="outline">{test.adapter_a_name || 'Base Model'}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Adapter B</div>
            <Badge variant="outline">{test.adapter_b_name || 'Base Model'}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Progress</div>
            <div className="flex items-center gap-2">
              <div className="font-bold">{votedPairs.length}/{test.total_pairs}</div>
              <span className="text-muted-foreground">voted</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Status</div>
            <Badge 
              variant="secondary" 
              className={
                test.status === 'active' 
                  ? 'bg-green-500/10 text-green-600'
                  : test.status === 'completed'
                  ? 'bg-purple-500/10 text-purple-600'
                  : 'bg-gray-500/10 text-gray-600'
              }
            >
              {test.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Prompt Selector */}
      {showPromptSelector && (
        <Card>
          <CardHeader>
            <CardTitle>Select Prompts for Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {prompts.map((prompt) => (
                <label
                  key={prompt.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPrompts.includes(prompt.id)}
                    onChange={() => togglePromptSelection(prompt.id)}
                    className="h-4 w-4"
                  />
                  <span className="flex-1 text-sm">{prompt.text}</span>
                  {prompt.instruments && prompt.instruments.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {prompt.instruments.join(', ')}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPromptSelector(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateSamples} 
                disabled={generating || selectedPrompts.length === 0}
              >
                {generating && <Loader2 size={16} className="animate-spin mr-2" />}
                Generate {selectedPrompts.length} Comparison{selectedPrompts.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voting Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare size={20} />
                Blind Comparison
                {unvotedPairs.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {unvotedPairs.length} remaining
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {test.pairs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No comparison pairs yet</p>
                  <Button onClick={() => setShowPromptSelector(true)}>
                    <Plus size={16} className="mr-2" />
                    Add Samples to Compare
                  </Button>
                </div>
              ) : currentPair ? (
                <ComparisonPlayer
                  pair={currentPair}
                  testId={testId}
                  onVoted={handleVoted}
                />
              ) : (
                <div className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="font-medium mb-2">All comparisons complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    You've voted on all available pairs
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pair Navigation */}
          {test.pairs.length > 0 && (
            <div className="flex gap-2 justify-center">
              {test.pairs.map((pair, index) => (
                <button
                  key={pair.id}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    index === currentPairIndex
                      ? 'bg-primary text-primary-foreground'
                      : pair.preference !== null
                      ? 'bg-green-500/20 text-green-600'
                      : pair.is_ready
                      ? 'bg-muted hover:bg-muted/80'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                  onClick={() => setCurrentPairIndex(index)}
                  disabled={!pair.is_ready}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 size={20} />
                Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results && results.total_votes > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Adapter A ({test.adapter_a_name || 'Base'})</span>
                      <span className="font-bold">{results.a_win_rate.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${results.a_win_rate}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Adapter B ({test.adapter_b_name || 'Base'})</span>
                      <span className="font-bold">{results.b_win_rate.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${results.b_win_rate}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Votes</span>
                      <span>{results.total_votes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">A Preferred</span>
                      <span>{results.a_preferred}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">B Preferred</span>
                      <span>{results.b_preferred}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Equal</span>
                      <span>{results.equal}</span>
                    </div>
                    {results.statistical_significance !== null && (
                      <div className="flex justify-between pt-2 border-t mt-2">
                        <span className="text-muted-foreground">Significance</span>
                        <Badge 
                          variant={results.statistical_significance > 0.95 ? 'default' : 'secondary'}
                        >
                          {(results.statistical_significance * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No votes yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
