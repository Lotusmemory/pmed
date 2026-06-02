import { useState, useEffect, useRef } from 'react';
import type { Article } from '../api';

interface Props {
  articles: Article[];
  loading: boolean;
}

const PAGE_SIZE = 20;

export default function ArticleTable({ articles, loading }: Props) {
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<'impact_factor' | 'year'>('impact_factor');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const prevArticlesRef = useRef<Article[]>([]);

  // Reset page and expanded when articles change (new search)
  useEffect(() => {
    if (articles !== prevArticlesRef.current) {
      prevArticlesRef.current = articles;
      setPage(0);
      setExpandedIdx(null);
    }
  }, [articles]);

  // Filter: last 5 years (2021-2026), sort by IF
  const filtered = articles
    .filter((a) => {
      const y = parseInt(a.year);
      return y >= 2021 && y <= 2026;
    })
    .sort((a, b) => {
      const av = sortField === 'impact_factor' ? a.impact_factor : parseInt(a.year) || 0;
      const bv = sortField === 'impact_factor' ? b.impact_factor : parseInt(b.year) || 0;
      return sortAsc ? av - bv : bv - av;
    });

  const top100 = filtered.slice(0, 100);
  const totalPages = Math.ceil(top100.length / PAGE_SIZE);
  const pageData = top100.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (field: 'impact_factor' | 'year') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setPage(0);
  };

  if (loading) {
    return (
      <div className="card mb-8">
        <div className="skeleton w-48 h-6 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton w-full h-12 mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="card mb-8 overflow-hidden p-0">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700">
          高影响力文献 Top {top100.length}（近5年）
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">标题</th>
              <th className="px-4 py-3 text-left font-medium">作者</th>
              <th className="px-4 py-3 text-left font-medium">期刊</th>
              <th
                className="px-4 py-3 text-left font-medium cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('year')}
              >
                年份 {sortField === 'year' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th
                className="px-4 py-3 text-left font-medium cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('impact_factor')}
              >
                IF {sortField === 'impact_factor' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th className="px-4 py-3 text-left font-medium">DOI</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((article, i) => {
              const globalIdx = page * PAGE_SIZE + i;
              return (
                <tr
                  key={article.pmid}
                  className="border-t border-gray-50 hover:bg-blue-50/50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-400">{globalIdx + 1}</td>
                  <td className="px-4 py-3 max-w-md">
                    <div
                      className="font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                      onClick={() => setExpandedIdx(expandedIdx === globalIdx ? null : globalIdx)}
                    >
                      {article.title}
                    </div>
                    {expandedIdx === globalIdx && article.abstract && (
                      <div className="mt-2 text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg">
                        {article.abstract}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {article.authors.slice(0, 3).join(', ')}
                    {article.authors.length > 3 && ' et al.'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{article.journal}</td>
                  <td className="px-4 py-3 text-gray-600">{article.year}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      article.quartile === 'Q1' ? 'bg-red-100 text-red-700' :
                      article.quartile === 'Q2' ? 'bg-orange-100 text-orange-700' :
                      article.quartile === 'Q3' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {article.impact_factor.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {article.doi ? (
                      <a
                        href={`https://doi.org/${article.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-xs"
                      >
                        {article.doi.slice(0, 20)}...
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-gray-100">
          <button
            className="btn-secondary text-sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            className="btn-secondary text-sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
