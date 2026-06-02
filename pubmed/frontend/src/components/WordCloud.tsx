import { useEffect, useRef } from 'react';
import type { WordCloudItem } from '../api';

interface Props {
  words: WordCloudItem[];
  loading: boolean;
}

// Simple canvas-based word cloud renderer
function renderWordCloud(canvas: HTMLCanvasElement, words: WordCloudItem[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  if (!words.length) return;

  const maxCount = words[0].count;
  const colors = ['#3b82f6', '#1d4ed8', '#60a5fa', '#2563eb', '#93c5fd', '#1e40af', '#38bdf8', '#0ea5e9', '#6366f1', '#8b5cf6'];

  // Spiral placement
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const cx = W / 2;
  const cy = H / 2;

  function tryPlace(word: string, fontSize: number): { x: number; y: number } | null {
    if (!ctx) return null;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    const metrics = ctx.measureText(word);
    const w = metrics.width + 4;
    const h = fontSize + 4;

    // Spiral from center
    for (let t = 0; t < 500; t++) {
      const angle = t * 0.15;
      const radius = t * 1.2;
      const x = cx + radius * Math.cos(angle) - w / 2;
      const y = cy + radius * Math.sin(angle) - h / 2;

      // Check bounds
      if (x < 0 || y < 0 || x + w > W || y + h > H) continue;

      // Check overlap
      let overlaps = false;
      for (const p of placed) {
        if (x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        return { x, y };
      }
    }
    return null;
  }

  words.forEach((item) => {
    const minSize = 12;
    const maxSize = 52;
    const fontSize = Math.max(minSize, Math.min(maxSize, Math.round((item.count / maxCount) * maxSize)));
    const pos = tryPlace(item.word, fontSize);
    if (!pos) return;

    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.textBaseline = 'top';
    ctx.fillText(item.word, pos.x, pos.y);

    const metrics = ctx.measureText(item.word);
    placed.push({ x: pos.x, y: pos.y, w: metrics.width + 4, h: fontSize + 4 });
  });
}

export default function WordCloud({ words, loading }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (loading || !words.length || !canvasRef.current) return;
    renderWordCloud(canvasRef.current, words);
  }, [words, loading]);

  if (loading) {
    return (
      <div className="card mb-8">
        <div className="skeleton w-full h-72" />
      </div>
    );
  }

  return (
    <div className="card mb-8">
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
        关键词词云
      </h3>
      <canvas
        ref={canvasRef}
        width={1000}
        height={320}
        style={{ width: '100%', height: 320, display: words.length ? 'block' : 'none', borderRadius: '0.5rem' }}
      />
      {!words.length && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>暂无词云数据</p>}
    </div>
  );
}
