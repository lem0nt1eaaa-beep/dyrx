import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CommentBaitDetail } from '../../api/diagnose';

interface Props {
  detail: CommentBaitDetail;
}

const NEON_COLORS = ['#fe2c55', '#25f4ee', '#7c3aed', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#f97316'];

export default function CommentBaitPanel({ detail }: Props) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  const personaData = Object.entries(detail.persona_distribution).map(
    ([name, value], i) => ({ name, value, itemStyle: { color: NEON_COLORS[i % NEON_COLORS.length] } })
  );

  const pieOption = {
    backgroundColor: 'transparent',
    series: [{
      type: 'pie', radius: ['38%', '65%'], data: personaData,
      label: { fontSize: 11, color: 'rgba(232,234,240,0.6)' },
      labelLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      emphasis: { scale: true, scaleSize: 4 },
    }],
    tooltip: { trigger: 'item', formatter: '{b}: {d}%', backgroundColor: '#1a1f2e', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#e8eaf0' } },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* 2-col main layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        {/* Left — Bait types */}
        <Box sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', p: 3 }}>
          <Box sx={{ fontSize: 11, letterSpacing: '0.1em', color: 'rgba(232,234,240,0.4)', textTransform: 'uppercase', mb: 2.5 }}>
            引子类型分布
          </Box>
          {Object.entries(detail.bait_types).map(([name, val], i) => (
            <Box key={name} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="body2" sx={{ fontSize: 13, color: 'rgba(232,234,240,0.7)' }}>{name}</Typography>
                <Box sx={{ fontSize: 13, fontWeight: 700, color: NEON_COLORS[i % NEON_COLORS.length] }}>{val}%</Box>
              </Box>
              <Box sx={{ height: 5, borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.9, delay: i * 0.07, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 99, background: NEON_COLORS[i % NEON_COLORS.length], boxShadow: `0 0 8px ${NEON_COLORS[i % NEON_COLORS.length]}55` }}
                />
              </Box>
            </Box>
          ))}
        </Box>

        {/* Right — Persona pie */}
        <Box sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', p: 3 }}>
          <Box sx={{ fontSize: 11, letterSpacing: '0.1em', color: 'rgba(232,234,240,0.4)', textTransform: 'uppercase', mb: 1 }}>
            预测评论人格分布
          </Box>
          <ReactECharts option={pieOption} style={{ height: 260 }} />
        </Box>
      </Box>

      {/* Suggestions */}
      <Box sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', p: 3, mb: 2 }}>
        <Box sx={{ fontSize: 11, letterSpacing: '0.1em', color: 'rgba(232,234,240,0.4)', textTransform: 'uppercase', mb: 2 }}>
          引子改写建议
        </Box>
        {detail.suggestions.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
            <Box sx={{
              mb: 1.5, p: 2, borderRadius: '10px', display: 'flex', gap: 1.5, alignItems: 'flex-start',
              background: 'rgba(254,44,85,0.05)', border: '1px solid rgba(254,44,85,0.15)', borderLeft: '3px solid #fe2c55',
            }}>
              <Box sx={{ minWidth: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 800, background: 'rgba(254,44,85,0.2)', color: '#fe2c55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i + 1}
              </Box>
              <Typography variant="body2" sx={{ fontSize: 13, color: 'rgba(232,234,240,0.8)', lineHeight: 1.6 }}>{s}</Typography>
            </Box>
          </motion.div>
        ))}
      </Box>

      {/* Seed comments — collapsible */}
      <Box sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <Box
          component="button"
          onClick={() => setCommentsOpen(o => !o)}
          sx={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer', px: 3, py: 2,
            color: '#e8eaf0', fontFamily: 'inherit',
            '&:hover': { background: 'rgba(255,255,255,0.02)' },
          }}
        >
          <Box sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(232,234,240,0.4)', textTransform: 'uppercase' }}>
            预测种子评论（{detail.seed_comments.length} 条）
          </Box>
          <Box sx={{ fontSize: 18, color: 'rgba(232,234,240,0.3)', transform: commentsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>↓</Box>
        </Box>
        <AnimatePresence>
          {commentsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <Box sx={{ px: 3, pb: 3 }}>
                {detail.seed_comments.map((c, i) => (
                  <Box key={i} sx={{ mb: 1.5, p: 2, borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                      <Box sx={{ px: 1, py: 0.25, borderRadius: '4px', fontSize: 11, fontWeight: 600, background: 'rgba(37,244,238,0.1)', color: '#25f4ee', border: '1px solid rgba(37,244,238,0.2)' }}>
                        {c.persona}
                      </Box>
                      <Box sx={{ fontSize: 11, color: 'rgba(232,234,240,0.3)' }}>点赞 {c.predicted_likes.toLocaleString()}</Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: 13, color: 'rgba(232,234,240,0.75)' }}>{c.text}</Typography>
                  </Box>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
}
