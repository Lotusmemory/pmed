import { useState, useEffect, useRef } from 'react';
import { generateReview, type ReviewResponse } from '../api';

interface Props {
  query: string;
  hasArticles: boolean;
  loading: boolean;
}

export default function ReviewSection({ query, hasArticles, loading }: Props) {
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const lastQueryRef = useRef('');

  // Auto-generate when search completes with new query
  useEffect(() => {
    if (!loading && hasArticles && query && query !== lastQueryRef.current) {
      lastQueryRef.current = query;
      handleGenerate();
    }
    // Reset when search starts (loading) or no articles
    if (loading) {
      setReview(null);
      setError('');
    }
  }, [loading, hasArticles, query]);

  const handleGenerate = async () => {
    if (!query) return;
    setGenerating(true);
    setError('');
    setReview(null);
    try {
      const result = await generateReview({ query });
      setReview(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '综述生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (review) {
      navigator.clipboard.writeText(review.review);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="card mb-8">
        <div className="skeleton w-48 h-6 mb-4" />
        <div className="skeleton w-full h-48" />
      </div>
    );
  }

  if (!hasArticles) return null;

  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">AI 综述报告</h3>
        <div className="flex gap-2">
          {review && (
            <button className="btn-secondary text-sm" onClick={handleCopy}>
              {copied ? '已复制' : '复制'}
            </button>
          )}
          <button
            className="btn-primary text-sm !px-4 !py-2"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? '生成中...' : '重新生成'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      {generating && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-500">正在调用大模型生成综述，请稍候...</span>
        </div>
      )}

      {review && !generating && (
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {review.review}
          </div>
          {review.source === 'fallback' && (
            <p className="mt-4 text-xs text-amber-600 bg-amber-50 p-2 rounded">
              * 此综述由本地规则生成。配置 LLM API Key 可获得更深入的分析。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
