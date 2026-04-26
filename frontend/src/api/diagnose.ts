export interface DiagnoseRequest {
  video_url?: string;
  title?: string;
  content?: string;
  cover_base64?: string;
}

export interface AgentEvent {
  type: 'step' | 'agent_start' | 'agent_result' | 'final_report' | 'error';
  index?: number;
  label?: string;
  agent?: string;
  round?: number;
  result?: Record<string, unknown>;
  report?: FinalReport;
  message?: string;
}

export interface ImprovementItem {
  priority: number;
  action: string;
  dimension: string;
  score_lift: number;
}

export interface FinalReport {
  total_score: number;
  viral_probability: number;
  percentile_estimate: number;
  improvement_roadmap: ImprovementItem[];
  dimensions: Record<string, DimensionDetail>;
  comment_bait_detail: CommentBaitDetail;
}

export interface DimensionDetail {
  label: string;
  score: number;
  weight: number;
  analysis: string;
  suggestions: string[];
}

export interface CommentBaitDetail {
  bait_hit_rate: number;
  bait_types: Record<string, number>;
  persona_distribution: Record<string, number>;
  shen_ping_probability: number;
  seed_comments: SeedComment[];
  suggestions: string[];
}

export interface SeedComment {
  text: string;
  persona: string;
  predicted_likes: number;
}

// 本地开发走 Vite proxy，生产直连 Railway 后端（避免 Vercel 代理多一跳影响 SSE）
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function startDiagnose(req: DiagnoseRequest): Promise<string> {
  const res = await fetch(`${API_BASE}/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.task_id as string;
}

export function streamDiagnose(
  taskId: string,
  onEvent: (e: AgentEvent) => void,
  onDone: () => void,
  onError: (err: string) => void
): () => void {
  const es = new EventSource(`${API_BASE}/diagnose/${taskId}/stream`);

  es.onmessage = (e) => {
    if (e.data === '[DONE]') { es.close(); onDone(); return; }
    try { onEvent(JSON.parse(e.data) as AgentEvent); } catch { /* ignore */ }
  };
  es.onerror = () => { es.close(); onError('SSE 连接断开'); };

  return () => es.close();
}

export async function extractFromImage(imageBase64: string): Promise<{ title?: string; content?: string }> {
  try {
    const res = await fetch(`${API_BASE}/extract-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64 }),
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function startCompare(
  own: DiagnoseRequest,
  competitor: DiagnoseRequest
): Promise<{ own_task_id: string; competitor_task_id: string }> {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ own, competitor }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
