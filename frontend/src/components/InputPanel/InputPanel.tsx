import { useState, useCallback, useRef } from 'react';
import { Box, Button, TextField, CircularProgress, Typography, Tabs, Tab } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { extractFromImage } from '../../api/diagnose';

export interface VideoInput {
  title: string;
  content: string;
  coverBase64?: string;
}

interface Props {
  onSubmitSingle: (v: VideoInput) => void;
  onSubmitCompare: (own: VideoInput, competitor: VideoInput) => void;
  loading: boolean;
}

// ── Reusable image upload zone ──────────────────────────────────────
function ImageZone({
  cover, onCover, onExtracted,
}: {
  cover: string | null;
  onCover: (b64: string | null) => void;
  onExtracted?: (title: string, content: string) => void;
}) {
  const [dragging, setDragging]     = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      onCover(dataUrl);
      const raw = dataUrl.split(',')[1];
      if (onExtracted && raw) {
        setExtracting(true);
        try {
          const extracted = await extractFromImage(raw);
          if (extracted.title || extracted.content) {
            onExtracted(extracted.title ?? '', extracted.content ?? '');
          }
        } finally {
          setExtracting(false);
        }
      }
    };
    reader.readAsDataURL(file);
  }, [onCover, onExtracted]);

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadImage(f); }}
      onClick={() => !cover && fileRef.current?.click()}
      sx={{
        mb: 2, borderRadius: '10px',
        border: `1.5px dashed ${dragging ? '#fe2c55' : 'rgba(255,255,255,0.15)'}`,
        background: dragging ? 'rgba(254,44,85,0.06)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s', cursor: cover ? 'default' : 'pointer', overflow: 'hidden',
        '&:hover': cover ? {} : { borderColor: 'rgba(254,44,85,0.4)', background: 'rgba(254,44,85,0.04)' },
      }}
    >
      <AnimatePresence mode="wait">
        {cover ? (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Box sx={{ position: 'relative' }}>
              <Box component="img" src={cover} sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
              <Box component="button"
                onClick={(e) => { e.stopPropagation(); onCover(null); }}
                sx={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px', color: '#e8eaf0', cursor: 'pointer',
                  px: 1.25, py: 0.5, fontSize: 12, fontFamily: 'inherit',
                  '&:hover': { background: 'rgba(254,44,85,0.7)' },
                }}
              >移除</Box>
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.7))', px: 2, py: 1 }}>
                {extracting
                  ? <Box sx={{ fontSize: 12, color: '#25f4ee', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={10} sx={{ color: '#25f4ee' }} /> 正在识别标题和文案…
                    </Box>
                  : <Typography sx={{ fontSize: 12, color: 'rgba(232,234,240,0.6)' }}>封面图已上传 · 封面诊断师将进行视觉分析</Typography>
                }
              </Box>
            </Box>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Box sx={{ py: 2.5, textAlign: 'center' }}>
              <Box sx={{ fontSize: 26, mb: 0.75, opacity: 0.4 }}>📎</Box>
              <Box sx={{ fontSize: 13, color: 'rgba(232,234,240,0.45)', mb: 0.4 }}>拖拽或点击上传截图</Box>
              <Box sx={{ fontSize: 11, color: 'rgba(232,234,240,0.25)' }}>Ctrl+V 粘贴 · 自动识别标题和文案</Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f); }} />
    </Box>
  );
}

// ── Single video input form ──────────────────────────────────────────
function VideoForm({
  label, value, onChange, enablePaste,
}: {
  label?: string;
  value: VideoInput;
  onChange: (v: VideoInput) => void;
  enablePaste?: boolean;
}) {
  const set = (patch: Partial<VideoInput>) => onChange({ ...value, ...patch });

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set({ coverBase64: (ev.target?.result as string).split(',')[1] });
    reader.readAsDataURL(file);
  }, [value]);

  return (
    <Box onPaste={enablePaste ? handlePaste : undefined}>
      {label && <Box sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(232,234,240,0.4)', textTransform: 'uppercase', mb: 1.5 }}>{label}</Box>}
      <TextField fullWidth label="视频标题" value={value.title}
        onChange={(e) => set({ title: e.target.value })}
        placeholder="输入视频标题" sx={{ mb: 1.5 }} size="small" />
      <TextField fullWidth multiline rows={3} label="视频文案" value={value.content}
        onChange={(e) => set({ content: e.target.value })}
        placeholder="粘贴视频文案…" sx={{ mb: 1.5 }} size="small" />
      <ImageZone
        cover={value.coverBase64 ? `data:image/jpeg;base64,${value.coverBase64}` : null}
        onCover={(dataUrl) => set({ coverBase64: dataUrl ? dataUrl.split(',')[1] : undefined })}
        onExtracted={(title, content) => {
          if (title && !value.title) set({ title });
          if (content && !value.content) set({ content });
        }}
      />
    </Box>
  );
}

const EMPTY: VideoInput = { title: '', content: '' };

// ── Main InputPanel ──────────────────────────────────────────────────
export default function InputPanel({ onSubmitSingle, onSubmitCompare, loading }: Props) {
  const [mode, setMode]           = useState<0 | 1>(0); // 0=single, 1=compare
  const [own, setOwn]             = useState<VideoInput>(EMPTY);
  const [competitor, setComp]     = useState<VideoInput>(EMPTY);

  const canSingle  = !loading && (!!own.title.trim() || !!own.content.trim() || !!own.coverBase64);
  const canCompare = !loading && canSingle && (!!competitor.title.trim() || !!competitor.content.trim() || !!competitor.coverBase64);

  const handleSingle = () => { if (canSingle) onSubmitSingle(own); };
  const handleCompare = () => { if (canCompare) onSubmitCompare(own, competitor); };

  // Global paste for single mode
  const handleGlobalPaste = useCallback((e: React.ClipboardEvent) => {
    if (mode !== 0) return;
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const raw = dataUrl.split(',')[1];
      setOwn(prev => ({ ...prev, coverBase64: raw }));
      extractFromImage(raw).then(extracted => {
        setOwn(prev => ({
          ...prev,
          title: extracted.title && !prev.title ? extracted.title : prev.title,
          content: extracted.content && !prev.content ? extracted.content : prev.content,
        }));
      });
    };
    reader.readAsDataURL(file);
  }, [mode]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 2 }}
      onPaste={handleGlobalPaste}
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: mode === 1 ? 900 : 680 }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <Box sx={{
              display: 'inline-block', fontSize: { xs: 40, sm: 54 }, fontWeight: 900, letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #fe2c55 0%, #ff6b8a 40%, #25f4ee 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1,
            }}>抖医 DyRx</Box>
          </motion.div>
          <Box sx={{ mt: 1.5, fontSize: 14, color: 'rgba(232,234,240,0.45)', letterSpacing: '0.08em' }}>
            AI 视频诊断工具 · 以评论引子质量为最高权重维度
          </Box>
        </Box>

        {/* Mode tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Tabs value={mode} onChange={(_, v) => setMode(v as 0 | 1)}
            sx={{
              borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', p: 0.5,
              minHeight: 36,
              '& .MuiTab-root': { minHeight: 32, fontSize: 13, fontWeight: 600, borderRadius: '7px', px: 2.5, color: 'rgba(232,234,240,0.45)', textTransform: 'none' },
              '& .Mui-selected': { color: '#e8eaf0 !important', background: 'rgba(254,44,85,0.15)' },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            <Tab label="单视频诊断" />
            <Tab label="竞品对比" />
          </Tabs>
        </Box>

        {/* Card */}
        <Box sx={{
          position: 'relative', borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)', overflow: 'hidden', p: 3,
          '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #fe2c55, #7c3aed, #25f4ee)' },
        }}>
          <AnimatePresence mode="wait">
            {mode === 0 ? (
              <motion.div key="single" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <VideoForm value={own} onChange={setOwn} enablePaste />
                <Button variant="contained" size="large" fullWidth onClick={handleSingle} disabled={!canSingle}
                  sx={{ py: 1.75, fontSize: 16, fontWeight: 800, letterSpacing: '0.04em', borderRadius: '10px' }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : '开始诊断 →'}
                </Button>
              </motion.div>
            ) : (
              <motion.div key="compare" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                  <Box sx={{ p: 2, borderRadius: '10px', background: 'rgba(37,244,238,0.04)', border: '1px solid rgba(37,244,238,0.15)' }}>
                    <VideoForm label="我的视频" value={own} onChange={setOwn} />
                  </Box>
                  <Box sx={{ p: 2, borderRadius: '10px', background: 'rgba(254,44,85,0.04)', border: '1px solid rgba(254,44,85,0.15)' }}>
                    <VideoForm label="竞品视频" value={competitor} onChange={setComp} />
                  </Box>
                </Box>
                <Button variant="contained" size="large" fullWidth onClick={handleCompare} disabled={!canCompare}
                  sx={{ py: 1.75, fontSize: 16, fontWeight: 800, letterSpacing: '0.04em', borderRadius: '10px' }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : '开始竞品对比 →'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Tags */}
        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2.5, mt: 3, fontSize: 12, color: 'rgba(232,234,240,0.3)', letterSpacing: '0.06em' }}>
          {['评论引子 30%', '5 Agent 并行', '三轮辩论', '封面视觉分析', '竞品对比'].map((t) => <Box key={t}>{t}</Box>)}
        </Box>
      </motion.div>
    </Box>
  );
}
