"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon, ModuleBadge } from "@/components/studio/StudioShell";
import { useAuth } from "@/lib/auth";
import { sendChatMessage } from "@/lib/api";
import { presentError } from "@/lib/errorMessages";
import type { ChatMessage } from "@/lib/types";

const STORAGE_KEY = "nutriscan_coach_chat";

const SUGGESTIONS = [
  "Kasih rekomendasi menu makan buat aku hari ini",
  "Buatkan laporan analisa mingguan aku",
  "Kenapa asupan protein aku sering kurang?",
];

function loadStoredMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveStoredMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // localStorage unavailable — conversation just won't persist across reloads
  }
}

/** Renders **bold** segments from the model's reply without pulling in a full markdown parser. */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] items-start gap-space-sm sm:max-w-[75%] ${isUser ? "flex-row-reverse" : ""}`}>
        {!isUser && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-50">
            <Icon name="smart_toy" className="text-[16px] text-emerald-600" />
          </span>
        )}
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser ? "rounded-tr-sm bg-slate-900 text-white" : "rounded-tl-sm border border-slate-100 bg-slate-50 text-slate-800"
          }`}
        >
          {renderInline(message.content, isUser ? "u" : "a")}
        </div>
      </div>
    </div>
  );
}

export default function CoachPage() {
  const { token, isGuest, ready } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function load() {
      setMessages(loadStoredMessages());
    }
    load();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(content: string) {
    if (!token || !content.trim() || isSending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: content.trim() }];
    setMessages(nextMessages);
    saveStoredMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setError(null);
    try {
      const res = await sendChatMessage(nextMessages, token);
      const withReply: ChatMessage[] = [...nextMessages, { role: "assistant", content: res.reply }];
      setMessages(withReply);
      saveStoredMessages(withReply);
    } catch (err) {
      setError(presentError(err).message);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  function handleClearChat() {
    setMessages([]);
    saveStoredMessages([]);
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div>
          <ModuleBadge moduleLabel="Module 06 // AI Coach" description="Personal nutrition assistant, grounded in your real data" color="emerald" />
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-slate-900">Tanya AI Coach</h1>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearChat}
            className="flex shrink-0 items-center gap-1 self-start rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-100 md:self-auto"
          >
            <Icon name="refresh" className="text-[16px]" />
            Chat Baru
          </button>
        )}
      </div>

      {ready && isGuest && (
        <div className="flex flex-col items-start gap-space-sm rounded-2xl border border-amber-200/70 bg-amber-50 p-space-md sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-body-sm text-amber-800">Masuk dulu biar AI Coach bisa lihat data kalori &amp; aktivitasmu yang asli.</p>
          <Link href="/login" className="shrink-0 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800">
            Masuk
          </Link>
        </div>
      )}

      <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div ref={scrollRef} className="flex flex-1 flex-col gap-space-md overflow-y-auto p-space-md sm:p-space-lg">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-space-lg py-space-xl text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-50">
                <Icon name="smart_toy" className="text-[28px] text-emerald-600" />
              </span>
              <div>
                <p className="font-title-lg text-title-lg font-semibold text-slate-900">Halo! Aku AI Coach kamu.</p>
                <p className="mt-1 max-w-sm font-body-sm text-body-sm text-slate-500">
                  Tanya soal kalori, minta rekomendasi menu, atau suruh aku buatin laporan analisa dari data yang sudah kamu catat.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-space-xs">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!token}
                    onClick={() => void sendMessage(s)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => <ChatBubble key={i} message={m} />)
          )}

          {isSending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-space-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-50">
                  <Icon name="smart_toy" className="text-[16px] text-emerald-600" />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-center font-body-sm text-body-sm text-rose-500">{error}</p>}
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-space-sm border-t border-slate-100 p-space-md">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            disabled={!token || isSending}
            placeholder={token ? "Tanya apa aja soal gizi & aktivitasmu…" : "Masuk dulu buat mulai chat"}
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!token || isSending || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Kirim pesan"
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Icon name="send" className="text-[18px]" />
            )}
          </button>
        </form>
      </div>
    </>
  );
}
