import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import RadarChart from '../RadarChart/RadarChart';
import type { FinalReport } from '../../api/diagnose';

interface Props {
  report: FinalReport | null;
}

const DIM_ORDER = ['comment_bait', 'content', 'cover', 'algorithm', 'competitor'];
const DIM_COLORS: Record<string, string> = {
  comment_bait: '#fe2c55',
  content:      '#25f4ee',
  cover:        '#7c3aed',
  algorithm:    '#f59e0b',
  competitor:   '#10b981',
};

export default function OverviewPanel({ report }: Props) {
  if (!report) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
            {[0, 1, 2].map(d => (
              <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.3 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#fe2c55' }} />
              </motion.div>
            ))}
          </Box>
          <Box sx={{ fontSize: 14, color: 'rgba(232,234,240,0.4)' }}>AI 正在分析，结果即将呈现…</Box>
        </Box>
      </Box>
    );
  }

  const cb = report.comment_bait_detail;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '55% 45%' },
        gap: 3,
        alignItems: 'start',
      }}>
        {/* Left — Radar */}
        <Box sx={{
          borderRadius: '16px', background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)', p: 3,
        }}>
          <RadarChart report={report} />
        </Box>

        {/* Right — Key stats */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Comment bait hero */}
          <Box sx={{
            borderRadius: '16px', p: 3, position: 'relative', overflow: 'hidden',
            background: 'rgba(254,44,85,0.06)', border: '1px solid rgba(254,44,85,0.2)',
          }}>
            <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(254,44,85,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <Box sx={{ fontSize: 11, letterSpacing: '0.1em', color: 'rgba(232,234,240,0.4)', textTransform: 'uppercase', mb: 1 }}>
              评论引子命中率
            </Box>
            <Box sx={{
              fontSize: 60, fontWeight: 900, lineHeight: 1,
              background: 'linear-gradient(135deg, #fe2c55, #ff6b8a)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {cb.bait_hit_rate}<Box component="span" sx={{ fontSize: 28 }}>%</Box>
            </Box>
            <Box sx={{ fontSize: 12, color: 'rgba(232,234,240,0.45)', mt: 0.5 }}>
              神评出现概率：<Box component="span" sx={{ color: '#25f4ee', fontWeight: 700 }}>{cb.shen_ping_probability}%</Box>
            </Box>
          </Box>

          {/* Dimension scores */}
          <Box sx={{
            borderRadius: '16px', p: 3,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Box sx={{ fontSize: 11, letterSpacing: '0.1em', color: 'rgba(232,234,240,0.4)', textTransform: 'uppercase', mb: 2 }}>
              六维评分
            </Box>
            {DIM_ORDER.map((key, i) => {
              const dim = report.dimensions[key];
              if (!dim) return null;
              const color = DIM_COLORS[key] ?? '#64748b';
              return (
                <Box key={key} sx={{ mb: i < DIM_ORDER.length - 1 ? 1.75 : 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                    <Box sx={{ fontSize: 12, color: 'rgba(232,234,240,0.65)' }}>{dim.label}</Box>
                    <Box sx={{ fontSize: 13, fontWeight: 700, color }}>{dim.score}</Box>
                  </Box>
                  <Box sx={{ height: 5, borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dim.score}%` }}
                      transition={{ duration: 0.9, delay: i * 0.1, ease: 'easeOut' }}
                      style={{ height: '100%', borderRadius: 99, background: color, boxShadow: `0 0 6px ${color}66` }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}
