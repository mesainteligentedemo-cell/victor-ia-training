'use client';

/**
 * ElevenLabsChat — Chat de texto con el agente Victor IA vía API directa.
 * Reemplaza al widget ConvAI. Habla con /api/elevenlabs-chat.
 *
 * Estilo: luxury dark (gris oscuro #6b7280, dorado #d4af37, blanco).
 * Sin dependencias externas (solo React). Responsive mobile/desktop.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ── Tipos ────────────────────────────────────────────────────────────────────
type Role = 'user' | 'agent';

interface Message {
  id: string;
  role: Role;
  text: string;
  ts: number;
}

interface ElevenLabsChatProps {
  /** Endpoint del serverless. Por defecto /api/elevenlabs-chat */
  endpoint?: string;
  /** Mensaje de bienvenida del agente (opcional). */
  welcomeMessage?: string;
  /** Título mostrado en el header. */
  title?: string;
}

// ── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0e0e10',
  panel: '#151518',
  panelAlt: '#1c1c20',
  border: '#2a2a2f',
  gray: '#6b7280',
  gold: '#d4af37',
  goldSoft: 'rgba(212,175,55,0.12)',
  white: '#f5f5f7',
  textDim: '#9ca3af'
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ── Componente ────────────────────────────────────────────────────────────────
export default function ElevenLabsChat({
  endpoint = '/api/elevenlabs-chat',
  welcomeMessage = 'Hola, soy Victor. ¿En qué te puedo ayudar con tu capacitación?',
  title = 'Victor IA'
}: ElevenLabsChatProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    welcomeMessage
      ? [{ id: uid(), role: 'agent', text: welcomeMessage, ts: Date.now() }]
      : []
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll al final
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    const userMsg: Message = { id: uid(), role: 'user', text, ts: Date.now() };
    const history = [...messages, userMsg].map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: text, conversationId, history }),
        signal: controller.signal
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status}`);
      }

      if (data.conversationId) setConversationId(data.conversationId);

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'agent',
          text: data.agentResponse || '(sin respuesta)',
          ts: Date.now()
        }
      ]);
    } catch (e: any) {
      const msg =
        e?.name === 'AbortError'
          ? 'La respuesta tardó demasiado. Intenta de nuevo.'
          : e?.message || 'Error de conexión.';
      setError(msg);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [input, loading, messages, conversationId, endpoint]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages(
      welcomeMessage
        ? [{ id: uid(), role: 'agent', text: welcomeMessage, ts: Date.now() }]
        : []
    );
    setConversationId(null);
    setError(null);
    setInput('');
    setLoading(false);
    inputRef.current?.focus();
  }, [welcomeMessage]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={S.shell}>
      <style>{keyframes}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.avatar}>V</div>
          <div>
            <div style={S.title}>{title}</div>
            <div style={S.subtitle}>
              <span style={S.dot} /> En línea
            </div>
          </div>
        </div>
        <button style={S.resetBtn} onClick={reset} title="Reiniciar conversación" aria-label="Reiniciar">
          Reiniciar
        </button>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} style={S.messages}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              ...S.row,
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={m.role === 'user' ? S.bubbleUser : S.bubbleAgent}>{m.text}</div>
          </div>
        ))}

        {loading && (
          <div style={{ ...S.row, justifyContent: 'flex-start' }}>
            <div style={{ ...S.bubbleAgent, ...S.typing }}>
              <span style={{ ...S.tdot, animationDelay: '0s' }} />
              <span style={{ ...S.tdot, animationDelay: '0.2s' }} />
              <span style={{ ...S.tdot, animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        {error && <div style={S.error}>{error}</div>}
      </div>

      {/* Input */}
      <div style={S.inputBar}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribe tu mensaje…"
          rows={1}
          style={S.textarea}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            ...S.sendBtn,
            opacity: loading || !input.trim() ? 0.45 : 1,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
          }}
          aria-label="Enviar"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: 440,
    height: 620,
    maxHeight: '85vh',
    margin: '0 auto',
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    overflow: 'hidden',
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: C.white,
    boxShadow: '0 24px 60px rgba(0,0,0,0.55)'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    background: C.panel,
    borderBottom: `1px solid ${C.border}`
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    fontSize: 18,
    color: C.bg,
    background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
    boxShadow: `0 0 0 1px ${C.goldSoft}`
  },
  title: { fontWeight: 600, fontSize: 15, letterSpacing: 0.2 },
  subtitle: { fontSize: 12, color: C.textDim, display: 'flex', alignItems: 'center', gap: 6 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#3ecf8e',
    boxShadow: '0 0 8px #3ecf8e'
  },
  resetBtn: {
    background: 'transparent',
    color: C.textDim,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '7px 12px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: `radial-gradient(120% 80% at 50% 0%, ${C.panelAlt} 0%, ${C.bg} 60%)`
  },
  row: { display: 'flex', width: '100%' },
  bubbleAgent: {
    maxWidth: '82%',
    padding: '11px 14px',
    borderRadius: '14px 14px 14px 4px',
    background: C.panelAlt,
    border: `1px solid ${C.border}`,
    color: C.white,
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  bubbleUser: {
    maxWidth: '82%',
    padding: '11px 14px',
    borderRadius: '14px 14px 4px 14px',
    background: `linear-gradient(135deg, ${C.gold}, #c19f2e)`,
    color: '#161616',
    fontWeight: 500,
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  typing: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '14px 16px' },
  tdot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: C.gray,
    display: 'inline-block',
    animation: 'elc-bounce 1.2s infinite ease-in-out'
  },
  error: {
    alignSelf: 'center',
    fontSize: 12.5,
    color: '#ff8a8a',
    background: 'rgba(255,80,80,0.08)',
    border: '1px solid rgba(255,80,80,0.25)',
    borderRadius: 10,
    padding: '8px 12px',
    textAlign: 'center'
  },
  inputBar: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 10,
    padding: 14,
    background: C.panel,
    borderTop: `1px solid ${C.border}`
  },
  textarea: {
    flex: 1,
    resize: 'none',
    maxHeight: 120,
    background: C.panelAlt,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '11px 14px',
    color: C.white,
    fontSize: 14,
    fontFamily: 'inherit',
    lineHeight: 1.4,
    outline: 'none'
  },
  sendBtn: {
    background: `linear-gradient(135deg, ${C.gold}, #b8941f)`,
    color: '#161616',
    fontWeight: 700,
    fontSize: 14,
    border: 'none',
    borderRadius: 12,
    padding: '11px 18px',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  }
};

const keyframes = `
@keyframes elc-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-5px); opacity: 1; }
}
`;