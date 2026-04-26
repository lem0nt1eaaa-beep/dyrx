import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { FinalReport } from '../../api/diagnose';

interface SideState {
  label: string;
  report: FinalReport | null;
  loading: boolean;
  color: string;
}

interface Props {
  own: SideState;
  competitor: SideState;
}

const DIM_ORDER = ['comment_bait', 'content', 'cover', 'algorithm', 'competitor'];

function ScoreGauge({ score, color }: { score: number; color: string }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color, filter: `drop-shadow(0 0 12px ${color}66)` }}>
        {score}
      </Box>
      <Box sx={{ fontSize: 11, color: 'rgba(232,234,240,0.35)', mt: 0.5 }}>/ 100</Box>
    </Box>
  );
}

function DimBar({ label, ownScore, compScore }: { label: string; ownScore: number; compScore: number }) {
  const diff = ownScore - compScore;
  const diffColor = diff > 0 ? '#10b981' : diff < 0 ? '#fe2c55' : 'rgba(232,234,240,0.4)';
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Box sx={{ fontSize: 12, color: 'rgba(232,234,240,0.6)', flex: 1 }}>{label}</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ fontSize: 13, fontWeight: 700, color: '#25f4ee', minWidth: 28, textAlign: 'right' }}>{ownScore}</Box>
          <Box sx={{ fontSize: 11, fontWeight: 700, color: diffColor, minWidth: 36, textAlign: 'center' }}>
            {diff > 0 ? `+${diff}` : diff}
          </Box>
          <Box sx={{ fontSize: 13, fontWeight: 700, color: '#fe2c55', minWidth: 28 }}>{compScore}</Box>
        </Box>
      </Box>
      {/* Dual bar */}
      <Box sx={{ display: 'flex', gap: 0.5, height: 6 }}>
        <Box sx={{ flex: 1, borderRadius: '99px 0 0 99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${ownScore}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: '99px 0 0 99px', background: '#25f4ee', boxShadow: '0 0 6px #25f4ee66' }}
          />
        </Box>
        <Box sx={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
        <Box sx={{ flex: 1, borderRadius: '0 99px 99px 0', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${compScore}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: '0 99px 99px 0', background: '#fe2c55', boxShadow: '0 0 6px #fe2c5566' }}
          />
        </Box>
      </Box>
    </Box>
  );
}

function LoadingPanel({ label, color }: { label: string; color: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[0, 1, 2].map(d => (
          <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.3 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          </motion.div>
        ))}
      </Box>
      <Box sx={{ fontSize: 13, color: 'rgba(232,234,240,0.4)' }}>{label} 诊断中…</Box>
    </Box>
  );
}

export default function CompareView({ own, competitor }: Props) {
  const bothDone = own.report && competitor.report;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, py: 4 }}>
      {/* Header scores */}
      <Box sx={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 2, mb: 4,
        alignItems: 'center',
      }}>
        {/* Own */}
        <Box sx={{
          borderRadius: '16px', p: 3, textAlign: 'center',
          background: 'rgba(37,244,238,0.05)', border: '1px solid rgba(37,244,238,0.2)',
        }}>
          <Box sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#25f4ee', textTransform: 'uppercase', mb: 2 }}>
            {own.label}
          </Box>
          {own.loading && !own.report
            ? <LoadingPanel label={own.label} color="#25f4ee" />
            : own.report
              ? <>
                  <ScoreGauge score={own.report.total_score} color="#25f4ee" />
                  <Box sx={{ mt: 1.5, fontSize: 13, color: 'rgba(232,234,240,0.5)' }}>
                    爆款概率 <Box component="span" sx={{ color: '#25f4ee', fontWeight: 700 }}>{own.report.viral_probability}%</Box>
                  </Box>
                </>
              : null
          }
        </Box>

        {/* VS */}
        <Box sx={{
          width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          fontSize: 13, fontWeight: 800, color: 'rgba(232,234,240,0.4)',
        }}>VS</Box>

        {/* Competitor */}
        <Box sx={{
          borderRadius: '16px', p: 3, textAlign: 'center',
          background: 'rgba(254,44,85,0.05)', border: '1px solid rgba(254,44,85,0.2)',
        }}>
          <Box sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#fe2c55', textTransform: 'uppercase', mb: 2 }}>
            {competitor.label}
          </Box>
          {competitor.loading && !competitor.report
            ? <LoadingPanel label={competitor.label} color="#fe2c55" />
            : competitor.report
              ? <>
                  <ScoreGauge score={competitor.report.total_score} color="#fe2c55" />
                  <Box sx={{ mt: 1.5, fontSize: 13, color: 'rgba(232,234,240,0.5)' }}>
                    爆款概率 <Box component="span" sx={{ color: '#fe2c55', fontWeight: 700 }}>{competitor.report.viral_probability}%</Box>
                  </Box>
                </>
              : null
          }
        </Box>
      </Box>

      {/* Dimension comparison */}
      {bothDone && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ borderRadius: '16px', p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', mb: 3 }}>
            {/* Legend */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ fontSize: 11, color: '#25f4ee', fontWeight: 700, letterSpacing: '0.06em' }}>{own.label} →</Box>
              <Box sx={{ fontSize: 11, color: 'rgba(232,234,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>维度对比</Box>
              <Box sx={{ fontSize: 11, color: '#fe2c55', fontWeight: 700, letterSpacing: '0.06em' }}>← {competitor.label}</Box>
            </Box>
            {DIM_ORDER.map((key) => {
              const ownDim  = own.report!.dimensions[key];
              const compDim = competitor.report!.dimensions[key];
              if (!ownDim || !compDim) return null;
              return (
                <DimBar key={key} label={ownDim.label} ownScore={ownDim.score} compScore={compDim.score} />
              );
            })}
          </Box>

          {/* Insight: where own wins / loses */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {/* Own advantages */}
            <Box sx={{ borderRadius: '12px', p: 2.5, background: 'rgba(37,244,238,0.04)', border: '1px solid rgba(37,244,238,0.15)' }}>
              <Box sx={{ fontSize: 11, fontWeight: 700, color: '#25f4ee', letterSpacing: '0.08em', mb: 1.5 }}>我的优势维度</Box>
              {DIM_ORDER
                .filter(k => (own.report!.dimensions[k]?.score ?? 0) > (competitor.report!.dimensions[k]?.score ?? 0))
                .map(k => {
                  const dim = own.report!.dimensions[k];
                  const diff = dim.score - (competitor.report!.dimensions[k]?.score ?? 0);
                  return (
                    <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography sx={{ fontSize: 13, color: 'rgba(232,234,240,0.7)' }}>{dim.label}</Typography>
                      <Box sx={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>+{diff}</Box>
                    </Box>
                  );
                })}
              {DIM_ORDER.every(k => (own.report!.dimensions[k]?.score ?? 0) <= (competitor.report!.dimensions[k]?.score ?? 0)) && (
                <Box sx={{ fontSize: 13, color: 'rgba(232,234,240,0.3)' }}>暂无领先维度</Box>
              )}
            </Box>

            {/* Gaps to close */}
            <Box sx={{ borderRadius: '12px', p: 2.5, background: 'rgba(254,44,85,0.04)', border: '1px solid rgba(254,44,85,0.15)' }}>
              <Box sx={{ fontSize: 11, fontWeight: 700, color: '#fe2c55', letterSpacing: '0.08em', mb: 1.5 }}>需追赶的维度</Box>
              {DIM_ORDER
                .filter(k => (own.report!.dimensions[k]?.score ?? 0) < (competitor.report!.dimensions[k]?.score ?? 0))
                .sort((a, b) =>
                  (competitor.report!.dimensions[b]?.score ?? 0) - (own.report!.dimensions[b]?.score ?? 0) -
                  ((competitor.report!.dimensions[a]?.score ?? 0) - (own.report!.dimensions[a]?.score ?? 0))
                )
                .map(k => {
                  const dim = own.report!.dimensions[k];
                  const diff = (competitor.report!.dimensions[k]?.score ?? 0) - dim.score;
                  return (
                    <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography sx={{ fontSize: 13, color: 'rgba(232,234,240,0.7)' }}>{dim.label}</Typography>
                      <Box sx={{ fontSize: 13, fontWeight: 700, color: '#fe2c55' }}>-{diff}</Box>
                    </Box>
                  );
                })}
              {DIM_ORDER.every(k => (own.report!.dimensions[k]?.score ?? 0) >= (competitor.report!.dimensions[k]?.score ?? 0)) && (
                <Box sx={{ fontSize: 13, color: 'rgba(232,234,240,0.3)' }}>全面领先竞品</Box>
              )}
            </Box>
          </Box>
        </motion.div>
      )}
    </Box>
  );
}
