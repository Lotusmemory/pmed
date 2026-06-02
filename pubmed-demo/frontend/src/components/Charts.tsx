import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { Statistics } from '../api';

interface Props {
  stats: Statistics;
  loading: boolean;
}

export default function Charts({ stats, loading }: Props) {
  const yearlyRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);
  const quartileRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<echarts.ECharts[]>([]);

  // Cleanup all charts on unmount or before re-init
  useEffect(() => {
    return () => {
      chartsRef.current.forEach((c) => c.dispose());
      chartsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (loading || !stats.total) return;

    // Dispose previous instances
    chartsRef.current.forEach((c) => c.dispose());
    chartsRef.current = [];

    // Yearly distribution bar chart
    if (yearlyRef.current) {
      const chart = echarts.init(yearlyRef.current);
      chartsRef.current.push(chart);
      const years = Object.keys(stats.yearly_distribution);
      const counts = Object.values(stats.yearly_distribution);
      chart.setOption({
        title: { text: '年度发文量', left: 'center', textStyle: { fontSize: 16, fontWeight: 600 } },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: years, axisLabel: { rotate: 45 } },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: counts,
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
        }],
        grid: { left: 50, right: 20, bottom: 60, top: 50 },
      });
    }

    // Journal distribution pie chart
    if (journalRef.current) {
      const chart = echarts.init(journalRef.current);
      chartsRef.current.push(chart);
      const data = Object.entries(stats.journal_distribution).map(([name, value]) => ({ name, value }));
      chart.setOption({
        title: { text: '期刊分布 Top 10', left: 'center', textStyle: { fontSize: 16, fontWeight: 600 } },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          data,
        }],
      });
    }

    // Quartile pie chart
    if (quartileRef.current) {
      const chart = echarts.init(quartileRef.current);
      chartsRef.current.push(chart);
      const qc = stats.quartile_counts;
      const data = [
        { value: qc.Q1, name: 'Q1 (IF≥10)', itemStyle: { color: '#ef4444' } },
        { value: qc.Q2, name: 'Q2 (5≤IF<10)', itemStyle: { color: '#f97316' } },
        { value: qc.Q3, name: 'Q3 (2≤IF<5)', itemStyle: { color: '#eab308' } },
        { value: qc.Q4, name: 'Q4 (IF<2)', itemStyle: { color: '#22c55e' } },
      ];
      chart.setOption({
        title: { text: '期刊分区分布', left: 'center', textStyle: { fontSize: 16, fontWeight: 600 } },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
          type: 'pie',
          radius: '65%',
          data,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
        }],
      });
    }

    // Handle resize
    const handleResize = () => chartsRef.current.forEach((c) => c.resize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stats, loading]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card"><div className="skeleton w-full h-64" /></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="card p-2">
        <div ref={yearlyRef} style={{ width: '100%', height: 300 }} />
      </div>
      <div className="card p-2">
        <div ref={journalRef} style={{ width: '100%', height: 300 }} />
      </div>
      <div className="card p-2">
        <div ref={quartileRef} style={{ width: '100%', height: 300 }} />
      </div>
    </div>
  );
}
