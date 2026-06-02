import { useState, useCallback } from 'react';
import { searchArticles, fetchWordCloud } from './api';
import type { Article, Statistics, WordCloudItem } from './api';
import StatsCards from './components/StatsCards';
import Charts from './components/Charts';
import WordCloud from './components/WordCloud';
import ArticleTable from './components/ArticleTable';
import ReviewSection from './components/ReviewSection';
import './index.css';

const SEARCH_HISTORY_KEY = 'pubmed_search_history';

function App() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [wordCloudData, setWordCloudData] = useState<WordCloudItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  // Search history from localStorage
  const getHistory = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  };
  const [history, setHistory] = useState<string[]>(getHistory);

  const saveHistory = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const current = getHistory();
    const updated = [trimmed, ...current.filter((h) => h !== trimmed)].slice(0, 5);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setSearched(true);
    setArticles([]);
    setStats(null);
    setWordCloudData([]);

    try {
      const searchResult = await searchArticles({
        query: trimmed,
        sort: sortBy,
        date_from: dateFrom,
        date_to: dateTo,
      });

      setArticles(searchResult.articles);
      setStats(searchResult.statistics);
      saveHistory(trimmed);

      if (searchResult.articles.length > 0) {
        const wc = await fetchWordCloud();
        setWordCloudData(wc);
      }

      if (searchResult.message) {
        setError(searchResult.message);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [query, sortBy, dateFrom, dateTo, history]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="py-2 px-6 text-center border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-800">PubMed 文献分析</span>
          </div>
          <span className="text-xs text-gray-400">TJChen</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className={`${searched ? 'mb-8' : 'flex flex-col items-center justify-center min-h-[60vh]'}`}>
          {!searched && (
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-3">
                PubMed 文献检索与分析
              </h1>
              <p className="text-gray-500 text-lg">
                输入关键词，智能检索文献、统计分析、生成综述
              </p>
            </div>
          )}

          <div className={`${searched ? '' : 'w-full max-w-2xl'}`}>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  className="search-input"
                  placeholder="输入生物医学关键词，如 CRISPR、immunotherapy..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {/* Search history dropdown */}
                {!searched && history.length > 0 && !query && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-10">
                    <p className="text-xs text-gray-400 px-3 py-1">最近搜索</p>
                    {history.map((h) => (
                      <button
                        key={h}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => setQuery(h)}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn-primary" onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : '搜索'}
              </button>
            </div>

            {/* Advanced options */}
            <div className="mt-2">
              <button
                className="text-sm text-gray-400 hover:text-blue-500 transition-colors"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '收起高级选项' : '展开高级选项'} ▾
              </button>
              {showAdvanced && (
                <div className="flex flex-wrap gap-4 mt-3 p-4 bg-white rounded-xl border border-gray-100">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">起始日期</label>
                    <input
                      type="date"
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 outline-none"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">结束日期</label>
                    <input
                      type="date"
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 outline-none"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">排序方式</label>
                    <select
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 outline-none"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="relevance">相关度</option>
                      <option value="pub_date">发表日期</option>
                      <option value="Author">作者</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Results sections */}
        {searched && (
          <>
            {stats && <StatsCards stats={stats} loading={loading} />}
            {stats && <Charts stats={stats} loading={loading} />}
            {<WordCloud words={wordCloudData} loading={loading} />}
            {<ArticleTable articles={articles} loading={loading} />}
            {<ReviewSection query={query} hasArticles={articles.length > 0} loading={loading} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100">
        PubMed Literature Analysis Demo · Powered by NCBI eUtils
      </footer>
    </div>
  );
}

export default App;
