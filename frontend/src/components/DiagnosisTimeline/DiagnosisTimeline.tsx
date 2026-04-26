import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentEvent, FinalReport } from '../../api/diagnose';

const AGENT_COLORS: Record<string, string> = {
  '评论引子专家': '#fe2c55',
  '内容分析师':   '#25f4ee',
  '封面诊断师':   '#7c3aed',
  '算法策略师':   '#f59e0b',
  '竞品侦察员':   '#10b981',
};

const ROUND_META: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: 'Round 1', desc: '5 Agent 并行初诊',                    color: '#25f4ee' },
  2: { label: 'Round 2', desc: '交叉辩论 · 评论引子专家优先发言',    color: '#fe2c55' },
  3: { label: 'Round 3', desc: '裁判 Agent 综合裁定',                 color: '#7c3aed' },
};

interface Props {
  events: AgentEvent[];
}

export default function DiagnosisTimeline({ events }: Props) {
  const agentEvents = events.filter(e => e.type === 'agent_start' || e.type === 'agent_result');
  const finalReportEvent = events.find(e => e.type === 'final_report');
  const finalReport = finalReportEvent?.report as FinalReport | undefined;

  // Group by round
  const rounds: Record<number, AgentEvent[]> = {};
  for (const e of agentEvents) {
    const r = e.round ?? 1;
    if (!rounds[r]) rounds[r] = [];
    rounds[r].push(e);
  }

  // Deduplicate: if agent_result exists for an agent in a round, drop its agent_start
  for (const r of Object.keys(rounds)) {
    const n = Number(r);
    const resultAgents = new Set(
      rounds[n].filter(e => e.type === 'agent_result').map(e => e.agent)
    );
    rounds[n] = rounds[n].filter(
      e => e.type !== 'agent_start' || !resultAgents.has(e.agent)
    );
  }

  if (agentEvents.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Box sx={{ fontSize: 13, color: 'rgba(232,234,240,0.35)' }}>等待 AI 辩论开始…</Box>
      </Box>
    );
  }

  return (
    <Box>
      {[1, 2].map((roundNum) => {
        const roundEvents = rounds[roundNum];
        if (!roundEvents?.length) return null;
        const meta = ROUND_META[roundNum];
        return (
          <Box key={roundNum} sx={{ mb: 4 }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 2, mb: 2.5,
              pb: 1.5, borderBottom: `1px solid ${meta.color}22`,
            }}>
              <Box sx={{
                px: 1.5, py: 0.4, borderRadius: '6px', fontSize: 12, fontWeight: 700,
                background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}33`,
                letterSpacing: '0.04em',
              }}>
                {meta.label}
              </Box>
              <Box sx={{ fontSize: 12, color: 'rgba(232,234,240,0.4)' }}>{meta.desc}</Box>
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: roundNum === 1 ? 'repeat(5, 1fr)' : 'repeat(2, 1fr)',
              },
              gap: 1.5,
            }}>
              <AnimatePresence>
                {roundEvents.map((e, i) => {
                  const color = AGENT_COLORS[e.agent ?? ''] ?? '#64748b';
                  const isResult = e.type === 'agent_result';
                  return (
                    <motion.div
                      key={`${roundNum}-${e.agent}-${e.type}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                    >
                      <Box sx={{
                        borderRadius: '12px', p: 2,
                        background: isResult ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.015)',
                        border: `1px solid ${isResult ? color + '33' : 'rgba(255,255,255,0.06)'}`,
                        borderTop: `2px solid ${color}`,
                        height: '100%',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isResult ? 1.5 : 0 }}>
                          <Box sx={{ fontSize: 12, fontWeight: 700, color }}>{e.agent}</Box>
                          {!isResult && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {[0, 1, 2].map(d => (
                                <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}>
                                  <Box sx={{ width: 3, height: 3, borderRadius: '50%', background: color }} />
                                </motion.div>
                              ))}
                            </Box>
                          )}
                        </Box>
                        {isResult && e.result && (
                          <Box>
                            <Box sx={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, mb: 1 }}>
                              {(e.result as Record<string, number>).score}
                            </Box>
                            <Typography variant="body2" sx={{ fontSize: 12, color: 'rgba(232,234,240,0.6)', lineHeight: 1.5 }}>
                              {(e.result as Record<string, string>).analysis}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Box>
          </Box>
        );
      })}

      {/* Round 3 — final judge summary */}
      {finalReport && (() => {
        const meta = ROUND_META[3];
        const dims = finalReport.dimensions;
        return (
          <Box sx={{ mb: 4 }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 2, mb: 2.5,
              pb: 1.5, borderBottom: `1px solid ${meta.color}22`,
            }}>
              <Box sx={{
                px: 1.5, py: 0.4, borderRadius: '6px', fontSize: 12, fontWeight: 700,
                background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}33`,
                letterSpacing: '0.04em',
              }}>
                {meta.label}
              </Box>
              <Box sx={{ fontSize: 12, color: 'rgba(232,234,240,0.4)' }}>{meta.desc}</Box>
            </Box>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Box sx={{
                borderRadius: '12px', p: 3,
                background: 'rgba(124,58,237,0.06)',
                border: '1px solid rgba(124,58,237,0.25)',
                borderTop: '2px solid #7c3aed',
              }}>
                {/* Score row */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2.5 }}>
                  <Box sx={{
                    fontSize: 52, fontWeight: 900, lineHeight: 1,
                    background: 'linear-gradient(135deg, #25f4ee, #7c3aed)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                    {finalReport.total_score}
                  </Box>
                  <Box>
                    <Box sx={{ fontSize: 12, color: '#fe2c55', fontWeight: 700 }}>爆款概率 {finalReport.viral_probability}%</Box>
                    <Box sx={{ fontSize: 12, color: 'rgba(232,234,240,0.4)' }}>超过同赛道 {finalReport.percentile_estimate}%</Box>
                  </Box>
                </Box>

                {/* Dimension final scores grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
                  {Object.entries(dims).map(([key, dim]) => {
                    const color = AGENT_COLORS[
                      key === 'comment_bait' ? '评论引子专家'
                      : key === 'content'    ? '内容分析师'
                      : key === 'cover'      ? '封面诊断师'
                      : key === 'algorithm'  ? '算法策略师'
                      :                        '竞品侦察员'
                    ] ?? '#64748b';
                    return (
                      <Box key={key} sx={{
                        p: 1.5, borderRadius: '8px', textAlign: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${color}22`,
                      }}>
                        <Box sx={{ fontSize: 22, fontWeight: 800, color }}>{dim.score}</Box>
                        <Box sx={{ fontSize: 10, color: 'rgba(232,234,240,0.4)', mt: 0.25, lineHeight: 1.3 }}>{dim.label}</Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </motion.div>
          </Box>
        );
      })()}
    </Box>
  );
}
