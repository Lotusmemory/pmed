const API_BASE = '';

export interface Article {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: string;
  doi: string;
  impact_factor: number;
  quartile: string;
}

export interface Statistics {
  total: number;
  year_range: string;
  avg_impact_factor: number;
  quartile_counts: Record<string, number>;
  yearly_distribution: Record<string, number>;
  journal_distribution: Record<string, number>;
}

export interface SearchResponse {
  articles: Article[];
  statistics: Statistics;
  message?: string;
}

export interface WordCloudItem {
  word: string;
  count: number;
}

export interface ReviewResponse {
  review: string;
  source: string;
}

export async function searchArticles(params: {
  query: string;
  max_results?: number;
  sort?: string;
  date_from?: string;
  date_to?: string;
}): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Search failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchWordCloud(): Promise<WordCloudItem[]> {
  const res = await fetch(`${API_BASE}/api/wordcloud`);
  if (!res.ok) throw new Error('Failed to fetch word cloud data');
  const data = await res.json();
  return data.words;
}

export async function generateReview(params: {
  query: string;
}): Promise<ReviewResponse> {
  const res = await fetch(`${API_BASE}/api/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Review generation failed');
  }
  return res.json();
}
