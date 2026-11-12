import type { AiChatMessage } from '../types.ts';

export type ChatPersonaId = 'customer-guide' | 'umkm-mentor' | 'bchain-halal' | 'fast-assistant';

export interface ChatPersonaOption {
  id: ChatPersonaId;
  label: string;
  shortDesc: string;
  modelLabel: string;
  quickPrompts: string[];
}

export const CHAT_PERSONAS: ChatPersonaOption[] = [
  {
    id: 'customer-guide',
    label: 'Asisten Belanja',
    shortDesc: 'Kurasi produk, sejarah UMKM & pesanan B-Market',
    modelLabel: 'Gemini 4 Hydrogen',
    quickPrompts: [
      'Rekomendasikan parfum BOTEGA & harganya di B-Market',
      'Ceritakan sejarah berdirinya Windrasari & produk shiborinya',
      'Menu Botok Pepes Lanjar Jaya & Stik Kentang Puya Kitchen?',
    ],
  },
  {
    id: 'umkm-mentor',
    label: 'Mentor UMKM',
    shortDesc: 'Strategi omzet, konten viral, B-Finance & pembinaan',
    modelLabel: 'Gemini 4 Hydrogen',
    quickPrompts: [
      'Bagaimana strategi membuat video produk UMKM cepat viral?',
      'Tips mengatur arus kas dan margin laba di B-Finance?',
      'Rekomendasi jadwal pembinaan & webinar yang cocok untuk toko saya',
    ],
  },
  {
    id: 'bchain-halal',
    label: 'Pakar B-Chain & Halal',
    shortDesc: 'Verifikasi QR, nomor batch & legalitas produk',
    modelLabel: 'Gemini 4 Hydrogen',
    quickPrompts: [
      'Bagaimana cara cek keaslian produk lewat B-CHAIN?',
      'Produk mana saja yang sudah terverifikasi B-CHAIN?',
      'Apa saja syarat legalitas NIB, PIRT, dan Halal untuk UMKM?',
    ],
  },
  {
    id: 'fast-assistant',
    label: 'Respon Kilat',
    shortDesc: 'Jawaban cepat FAQ, B-Edu poin, streak & navigasi',
    modelLabel: 'Gemini 3.1 Flash Lite',
    quickPrompts: [
      'Cara main Streak & Pecah Telur di B-Edu?',
      'Bagaimana menukarkan poin menjadi voucher belanja?',
      'Bagaimana cara chat langsung dengan penjual di B-Market?',
    ],
  },
];

export async function streamGeminiChat(params: {
  message: string;
  history: AiChatMessage[];
  rolePersona: ChatPersonaId;
  context: Record<string, unknown>;
  onChunk: (accumulatedText: string, provider?: string, model?: string) => void;
}): Promise<{ reply: string; provider: string; model: string }> {
  const { message, history, rolePersona, context, onChunk } = params;

  const payload = JSON.stringify({
    message,
    rolePersona,
    history: history.slice(-14).map((m) => ({ id: m.id, role: m.role, text: m.text })),
    context,
  });

  try {
    const resp = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });

    if (resp.ok && resp.body) {
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let provider = 'gemini';
      let model = 'gemini-4-hydrogen';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const line = evt
            .split('\n')
            .find((l) => l.startsWith('data:'));
          if (!line) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.provider) provider = parsed.provider;
            if (parsed.model) model = parsed.model;
            if (parsed.chunk) {
              accumulated += parsed.chunk;
              onChunk(accumulated, provider, model);
            }
          } catch {
            // Ignore malformed SSE fragment
          }
        }
      }

      if (accumulated.trim().length > 0) {
        return { reply: accumulated, provider, model };
      }
    }
  } catch {
    // Fallback to standard JSON endpoint below
  }

  const fallbackResp = await fetch('/api/ai/b-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
  const data = await fallbackResp.json();
  if (!fallbackResp.ok) {
    throw new Error(data.error || 'BINA AI sedang sibuk.');
  }
  const reply = String(data.reply || '');
  onChunk(reply, data.provider, data.model);
  return {
    reply,
    provider: data.provider || 'local-fallback',
    model: data.model || 'local',
  };
}
