import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import type { FinalReport, AgentEvent } from '../../api/diagnose';

type TabId = 'overview' | 'comment_bait' | 'debate' | 'roadmap';

interface Props {
  report: FinalReport | null;
  events: AgentEvent[];
  phase: 'diagnosing' | 'done';
  activeTab: TabId;
  onTabChange: (t: TabId) => void;
  onReset: () => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',      label: '总览' },
  { id: 'comment_bait',  label: '评论引子' },
  { id: 'debate',        label: 'AI 辩论' },
  { id: 'roadmap',       label: '优化方案' },
];

export default function ResultsHeader({ report, events, phase, activeTab, onTabChange, onReset }: Props) {
  const debateCount = events.filter(e => e.type === 'agent_result').length;
  const isDiagnosing = phase === 'diagnosing';

  return (
    <Box sx={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(8,11,20,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      {/* Top row */}
      <Box sx={{
        maxWidth: 1200, mx: 'auto', px: 3, py: 1.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Box sx={{
          fontSize: 18, fontWeight: 900,
          background: 'linear-gradient(135deg, #fe2c55, #25f4ee)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          抖医 DyRx
        </Box>

        {/* Center stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {report ? (
            <>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: '#25f4ee', filter: 'drop-shadow(0 0 8px rgba(37,244,238,0.4))' }}>
                  {report.total_score}
                </Box>
                <Box sx={{ fontSize: 10, color: 'rgba(232,234,240,0.35)', letterSpacing: '0.06em' }}>综合评分</Box>
              </Box>
              <Box sx={{ width: '1px', height: 28, background: 'rgba(255,255,255,0.1)' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: '#fe2c55' }}>
                  {report.viral_probability}%
                </Box>
                <Box sx={{ fontSize: 10, color: 'rgba(232,234,240,0.35)', letterSpacing: '0.06em' }}>爆款概率</Box>
              </Box>
              <Box sx={{ width: '1px', height: 28, background: 'rgba(255,255,255,0.1)' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: '#7c3aed' }}>
                  {report.percentile_estimate}%
                </Box>
                <Box sx={{ fontSize: 10, color: 'rgba(232,234,240,0.35)', letterSpacing: '0.06em' }}>超过同赛道</Box>
              </Box>
            </>
          ) : isDiagnosing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {[0, 1, 2].map(d => (
                <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.3 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#fe2c55' }} />
                </motion.div>
              ))}
              <Box sx={{ fontSize: 13, color: 'rgba(232,234,240,0.45)' }}>诊断中…</Box>
            </Box>
          ) : null}
        </Box>

        {/* Reset */}
        <Box component="button" onClick={onReset} sx={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px', color: 'rgba(232,234,240,0.5)', cursor: 'pointer',
          px: 1.5, py: 0.75, fontSize: 12, fontFamily: 'inherit', transition: 'all 0.2s',
          '&:hover': { background: 'rgba(254,44,85,0.08)', borderColor: 'rgba(254,44,85,0.3)', color: '#fe2c55' },
        }}>← 重新诊断</Box>
      </Box>

      {/* Tab nav */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, display: 'flex', gap: 0 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badge = tab.id === 'debate' && debateCount > 0 ? debateCount : null;
          const disabled = isDiagnosing && tab.id !== 'overview' && tab.id !== 'debate';
          return (
            <Box
              key={tab.id}
              component="button"
              onClick={() => !disabled && onTabChange(tab.id)}
              sx={{
                position: 'relative', background: 'none', border: 'none',
                color: isActive ? '#e8eaf0' : 'rgba(232,234,240,0.4)',
                cursor: disabled ? 'default' : 'pointer',
                px: 2.5, py: 1.25, fontSize: 13, fontWeight: isActive ? 700 : 400,
                fontFamily: 'inherit', transition: 'all 0.2s',
                opacity: disabled ? 0.4 : 1,
                '&:hover': { color: disabled ? undefined : '#e8eaf0' },
              }}
            >
              {tab.label}
              {badge !== null && (
                <Box component="span" sx={{
                  ml: 0.75, px: 0.6, py: 0.1, borderRadius: '4px', fontSize: 10,
                  background: 'rgba(254,44,85,0.2)', color: '#fe2c55', fontWeight: 700,
                }}>
                  {badge}
                </Box>
              )}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  style={{
                    position: 'absolute', bottom: 0, left: 10, right: 10, height: 2,
                    background: 'linear-gradient(90deg, #fe2c55, #25f4ee)',
                    borderRadius: '2px 2px 0 0',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
