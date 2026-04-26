import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import type { FinalReport } from '../../api/diagnose';

interface Props {
  report: FinalReport | null;
}

const PRIORITY_COLORS = ['#fe2c55', '#f59e0b', '#25f4ee'];
const PRIORITY_GLOWS  = ['rgba(254,44,85,0.3)', 'rgba(245,158,11,0.3)', 'rgba(37,244,238,0.3)'];

export default function OptimizationRoadmap({ report }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!report) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Box sx={{ fontSize: 13, color: 'rgba(232,234,240,0.35)' }}>等待诊断完成…</Box>
      </Box>
    );
  }

  const { improvement_roadmap, dimensions } = report;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(232,234,240,0.35)', textTransform: 'uppercase', mb: 1 }}>
            优先改进路线
          </Box>
          <Box sx={{ fontSize: 22, fontWeight: 800, color: '#e8eaf0' }}>
            按预计提分排序的 Top 3 改进动作
          </Box>
        </Box>

        {/* 3-col cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2.5, mb: 4,
        }}>
          {improvement_roadmap.map((item, i) => {
            const color = PRIORITY_COLORS[i] ?? '#64748b';
            const glow  = PRIORITY_GLOWS[i]  ?? 'transparent';
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
                <Box sx={{
                  borderRadius: '16px', p: 3, height: '100%',
                  background: `rgba(255,255,255,0.025)`,
                  border: `1px solid ${color}33`,
                  position: 'relative', overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 32px ${glow}` },
                }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
                  {/* Priority badge */}
                  <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.75,
                    px: 1.25, py: 0.4, borderRadius: '6px', mb: 2,
                    background: `${color}18`, border: `1px solid ${color}44`,
                  }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                    <Box sx={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em' }}>
                      P{item.priority} · {item.dimension}
                    </Box>
                  </Box>
                  {/* Action */}
                  <Typography variant="body2" sx={{ color: 'rgba(232,234,240,0.85)', fontSize: 13, lineHeight: 1.7, mb: 2.5 }}>
                    {item.action}
                  </Typography>
                  {/* Score lift */}
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <Box sx={{ fontSize: 24, fontWeight: 900, color, filter: `drop-shadow(0 0 6px ${color}66)` }}>
                      +{item.score_lift}
                    </Box>
                    <Box sx={{ fontSize: 11, color: 'rgba(232,234,240,0.35)', lineHeight: 1.3 }}>
                      预计<br />提分
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            );
          })}
        </Box>

        {/* All suggestions by dimension */}
        <Box sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Box sx={{ fontSize: 12, fontWeight: 700, color: 'rgba(232,234,240,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              各维度完整建议
            </Box>
          </Box>
          {Object.entries(dimensions).map(([key, dim]) => {
            const isOpen = expanded === key;
            return (
              <Box key={key} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Box
                  component="button"
                  onClick={() => setExpanded(isOpen ? null : key)}
                  sx={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'none', border: 'none', cursor: 'pointer', px: 3, py: 1.75,
                    color: '#e8eaf0', fontFamily: 'inherit', transition: 'background 0.2s',
                    '&:hover': { background: 'rgba(255,255,255,0.025)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ fontSize: 13, fontWeight: 600 }}>{dim.label}</Box>
                    <Box sx={{ fontSize: 13, fontWeight: 700, color: '#25f4ee' }}>{dim.score}</Box>
                  </Box>
                  <Box sx={{ fontSize: 18, color: 'rgba(232,234,240,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ↓
                  </Box>
                </Box>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <Box sx={{ px: 3, pb: 2 }}>
                        {dim.suggestions.map((s, si) => (
                          <Box key={si} sx={{
                            display: 'flex', gap: 1.5, mb: 1,
                            p: 1.5, borderRadius: '8px', background: 'rgba(255,255,255,0.02)',
                          }}>
                            <Box sx={{ minWidth: 20, height: 20, borderRadius: '50%', fontSize: 10, fontWeight: 700, background: 'rgba(37,244,238,0.15)', color: '#25f4ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {si + 1}
                            </Box>
                            <Typography variant="body2" sx={{ fontSize: 13, color: 'rgba(232,234,240,0.7)', lineHeight: 1.6 }}>{s}</Typography>
                          </Box>
                        ))}
                        {dim.analysis && (
                          <Box sx={{ mt: 1, px: 1.5, py: 1, borderRadius: '6px', background: 'rgba(255,255,255,0.015)', fontSize: 12, color: 'rgba(232,234,240,0.45)', fontStyle: 'italic' }}>
                            {dim.analysis}
                          </Box>
                        )}
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            );
          })}
        </Box>
      </Box>
    </motion.div>
  );
}
