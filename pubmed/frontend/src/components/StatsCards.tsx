import type { Statistics } from '../api';

interface Props {
  stats: Statistics;
  loading: boolean;
}

export default function StatsCards({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <div className="skeleton w-16 h-8 mb-2" />
            <div className="skeleton w-24 h-4" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { value: stats.total.toLocaleString(), label: '文献总量' },
    { value: stats.year_range, label: '年份范围' },
    { value: stats.avg_impact_factor.toFixed(1), label: '平均影响因子' },
    { value: `${stats.quartile_counts.Q1 + stats.quartile_counts.Q2}`, label: '一区/二区文献' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="stat-card">
          <div className="stat-value">{card.value}</div>
          <div className="stat-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
