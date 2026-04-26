import { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import InputPanel, { type VideoInput } from './components/InputPanel/InputPanel';
import ResultsHeader from './components/ResultsHeader/ResultsHeader';
import OverviewPanel from './components/OverviewPanel/OverviewPanel';
import CommentBaitPanel from './components/CommentBaitPanel/CommentBaitPanel';
import DiagnosisTimeline from './components/DiagnosisTimeline/DiagnosisTimeline';
import OptimizationRoadmap from './components/OptimizationRoadmap/OptimizationRoadmap';
import CompareView from './components/CompareView/CompareView';
import {
  startDiagnose, streamDiagnose, startCompare,
  type AgentEvent, type FinalReport,
} from './api/diagnose';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#fe2c55' },
    secondary: { main: '#25f4ee' },
    background: { default: '#080b14', paper: 'rgba(255,255,255,0.04)' },
    text: { primary: '#e8eaf0', secondary: 'rgba(232,234,240,0.6)' },
    divider: 'rgba(255,255,255,0.07)',
  },
  typography: { fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
  shape: { borderRadius: 14 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(135deg, #fe2c55 0%, #c41e3a 100%)',
          boxShadow: '0 4px 24px rgba(254,44,85,0.35)', fontWeight: 700,
          '&:hover': { background: 'linear-gradient(135deg, #ff4d70 0%, #fe2c55 100%)', boxShadow: '0 6px 32px rgba(254,44,85,0.5)', transform: 'translateY(-1px)' },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)' },
        bar: { borderRadius: 99 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
          '&:hover fieldset': { borderColor: 'rgba(254,44,85,0.4) !important' },
          '&.Mui-focused fieldset': { borderColor: '#fe2c55 !important', boxShadow: '0 0 0 3px rgba(254,44,85,0.12)' },
        },
      },
    },
  },
});

type Phase = 'input' | 'diagnosing' | 'done' | 'comparing';
type TabId = 'overview' | 'comment_bait' | 'debate' | 'roadmap';

export default function App() {
  const [phase, setPhase]           = useState<Phase>('input');
  const [events, setEvents]         = useState<AgentEvent[]>([]);
  const [report, setReport]         = useState<FinalReport | null>(null);
  const [loading, setLoading]       = useState(false);
  const [activeTab, setActiveTab]   = useState<TabId>('overview');

  // Compare state
  const [ownReport, setOwnReport]       = useState<FinalReport | null>(null);
  const [compReport, setCompReport]     = useState<FinalReport | null>(null);
  const [ownLoading, setOwnLoading]     = useState(false);
  const [compLoading, setCompLoading]   = useState(false);
  const [ownLabel, setOwnLabel]         = useState('我的视频');
  const [compLabel, setCompLabel]       = useState('竞品视频');

  const reset = () => {
    setPhase('input'); setEvents([]); setReport(null); setActiveTab('overview');
    setOwnReport(null); setCompReport(null); setOwnLoading(false); setCompLoading(false);
  };

  // Single diagnosis
  const handleSingle = useCallback(async (v: VideoInput) => {
    setLoading(true);
    setEvents([]); setReport(null); setActiveTab('overview');
    try {
      const taskId = await startDiagnose({
        title: v.title, content: v.content, cover_base64: v.coverBase64,
      });
      setPhase('diagnosing');
      setLoading(false);
      streamDiagnose(
        taskId,
        (e) => {
          setEvents((prev) => [...prev, e]);
          if (e.type === 'final_report' && e.report) setReport(e.report);
        },
        () => setPhase('done'),
        () => setPhase('done'),
      );
    } catch { setLoading(false); }
  }, []);

  // Compare
  const handleCompare = useCallback(async (own: VideoInput, competitor: VideoInput) => {
    setLoading(true);
    setOwnReport(null); setCompReport(null);
    setOwnLabel(own.title || '我的视频');
    setCompLabel(competitor.title || '竞品视频');
    try {
      const { own_task_id, competitor_task_id } = await startCompare(
        { title: own.title, content: own.content, cover_base64: own.coverBase64 },
        { title: competitor.title, content: competitor.content, cover_base64: competitor.coverBase64 },
      );
      setPhase('comparing');
      setLoading(false);
      setOwnLoading(true);
      setCompLoading(true);

      streamDiagnose(
        own_task_id,
        (e) => { if (e.type === 'final_report' && e.report) setOwnReport(e.report); },
        () => setOwnLoading(false),
        () => setOwnLoading(false),
      );
      streamDiagnose(
        competitor_task_id,
        (e) => { if (e.type === 'final_report' && e.report) setCompReport(e.report); },
        () => setCompLoading(false),
        () => setCompLoading(false),
      );
    } catch { setLoading(false); }
  }, []);

  const handleTabChange = (tab: TabId) => {
    if (phase === 'diagnosing' && tab !== 'overview' && tab !== 'debate') return;
    setActiveTab(tab);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh' }}>
        <AnimatePresence mode="wait">
          {phase === 'input' ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InputPanel onSubmitSingle={handleSingle} onSubmitCompare={handleCompare} loading={loading} />
            </motion.div>

          ) : phase === 'comparing' ? (
            <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Minimal header for compare mode */}
              <Box sx={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(8,11,20,0.85)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>
                <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg, #fe2c55, #25f4ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    抖医 DyRx · 竞品对比
                  </Box>
                  <Box component="button" onClick={reset} sx={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', color: 'rgba(232,234,240,0.5)', cursor: 'pointer',
                    px: 1.5, py: 0.75, fontSize: 12, fontFamily: 'inherit',
                    '&:hover': { background: 'rgba(254,44,85,0.08)', borderColor: 'rgba(254,44,85,0.3)', color: '#fe2c55' },
                  }}>← 重新诊断</Box>
                </Box>
              </Box>
              <CompareView
                own={{ label: ownLabel, report: ownReport, loading: ownLoading, color: '#25f4ee' }}
                competitor={{ label: compLabel, report: compReport, loading: compLoading, color: '#fe2c55' }}
              />
            </motion.div>

          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ResultsHeader
                report={report} events={events} phase={phase as 'diagnosing' | 'done'}
                activeTab={activeTab} onTabChange={handleTabChange} onReset={reset}
              />
              <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, py: 4 }}>
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <OverviewPanel report={report} />
                    </motion.div>
                  )}
                  {activeTab === 'comment_bait' && report && (
                    <motion.div key="cb" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <CommentBaitPanel detail={report.comment_bait_detail} />
                    </motion.div>
                  )}
                  {activeTab === 'debate' && (
                    <motion.div key="debate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <DiagnosisTimeline events={events} />
                    </motion.div>
                  )}
                  {activeTab === 'roadmap' && (
                    <motion.div key="roadmap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <OptimizationRoadmap report={report} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </ThemeProvider>
  );
}
