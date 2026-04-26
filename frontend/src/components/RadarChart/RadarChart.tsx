import ReactECharts from 'echarts-for-react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import type { FinalReport } from '../../api/diagnose';

interface Props {
  report: FinalReport;
}

const DIM_ORDER = ['comment_bait', 'content', 'cover', 'algorithm', 'competitor'];

export default function RadarChart({ report }: Props) {
  const indicators = DIM_ORDER.map((key) => ({
    name: report.dimensions[key]?.label ?? key,
    max: 100,
  }));

  const values = DIM_ORDER.map((key) => report.dimensions[key]?.score ?? 0);

  const option = {
    backgroundColor: 'transparent',
    radar: {
      indicator: indicators,
      radius: '62%',
      splitNumber: 4,
      axisName: {
        color: 'rgba(232,234,240,0.55)',
        fontSize: 12,
        formatter: (name: string) =>
          name === '评论引子质量' ? `{hl|${name}}` : name,
        rich: {
          hl: { color: '#fe2c55', fontWeight: 700, fontSize: 13, textShadowBlur: 6, textShadowColor: 'rgba(254,44,85,0.5)' },
        },
      },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } },
      splitArea: { areaStyle: { color: ['rgba(255,255,255,0.015)', 'rgba(255,255,255,0.025)'] } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    series: [{
      type: 'radar',
      data: [{ value: values, name: '综合诊断' }],
      areaStyle: {
        opacity: 0.18,
        color: { type: 'radial', x: 0.5, y: 0.5, r: 0.8, colorStops: [{ offset: 0, color: '#25f4ee' }, { offset: 1, color: '#fe2c55' }] },
      },
      lineStyle: {
        width: 2,
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#25f4ee' }, { offset: 1, color: '#fe2c55' }] },
        shadowBlur: 8, shadowColor: 'rgba(37,244,238,0.4)',
      },
      itemStyle: { color: '#25f4ee', borderWidth: 2, borderColor: '#080b14' },
      symbol: 'circle', symbolSize: 7,
    }],
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1a1f2e',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#e8eaf0', fontSize: 12 },
    },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ fontSize: 12, letterSpacing: '0.1em', color: 'rgba(232,234,240,0.4)', textTransform: 'uppercase', mb: 1 }}>
          六维综合诊断
        </Box>
        <Box sx={{
          fontSize: 72, fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, #25f4ee, #7c3aed)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          filter: 'drop-shadow(0 0 16px rgba(37,244,238,0.35))',
        }}>
          {report.total_score}
        </Box>
        <Box sx={{ fontSize: 13, color: 'rgba(232,234,240,0.35)', mt: 0.5 }}>综合评分 / 100</Box>
      </Box>

      <Box sx={{
        borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)', p: 1,
      }}>
        <ReactECharts option={option} style={{ height: 380 }} />
      </Box>

      {/* Dimension legend */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
        {DIM_ORDER.map((key) => {
          const dim = report.dimensions[key];
          const isTop = key === 'comment_bait';
          return (
            <Box key={key} sx={{
              px: 2, py: 0.75, borderRadius: '8px', fontSize: 12,
              background: isTop ? 'rgba(254,44,85,0.1)' : 'rgba(255,255,255,0.03)',
              border: isTop ? '1px solid rgba(254,44,85,0.3)' : '1px solid rgba(255,255,255,0.07)',
              color: isTop ? '#fe2c55' : 'rgba(232,234,240,0.55)',
              display: 'flex', gap: 1, alignItems: 'center',
            }}>
              <span>{dim?.label ?? key}</span>
              <Box component="span" sx={{ fontWeight: 700, color: isTop ? '#fe2c55' : '#25f4ee' }}>{dim?.score}</Box>
            </Box>
          );
        })}
      </Box>
    </motion.div>
  );
}
