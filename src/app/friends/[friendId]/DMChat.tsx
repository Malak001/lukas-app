"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  translated_body: string | null;
  translated_language: string | null;
  created_at: string;
};

export default function DMChat({
  currentUserId,
  friendId,
  friendName,
  initialMessages,
}: {
  currentUserId: string;
  friendId: string;
  friendName: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`dm-${[currentUserId, friendId].sort().join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `sender_id=eq.${currentUserId}`,
        },
        (payload) => {
          const row = payload.new as Message;
          if (row.recipient_id === friendId) {
            setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `sender_id=eq.${friendId}`,
        },
        (payload) => {
          const row = payload.new as Message;
          if (row.recipient_id === currentUserId) {
            setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, friendId]);

  const translateMessage = useCallback(async (messageId: string) => {
    const res = await fetch("/api/friends/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, translated_body: json.translatedBody, translated_language: json.translatedLanguage }
          : m
      )
    );
    return true;
  }, []);

  async function toggleTranslation(message: Message) {
    if (revealedIds.has(message.id)) {
      setRevealedIds((prev) => {
        const next = new Set(prev);
        next.delete(message.id);
        return next;
      });
      return;
    }

    setRevealedIds((prev) => new Set(prev).add(message.id));

    if (!message.translated_body) {
      setTranslatingIds((prev) => new Set(prev).add(message.id));
      const ok = await translateMessage(message.id);
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(message.id);
        return next;
      });
      if (!ok) {
        // couldn't translate — collapse back so the button reads as "closed" again
        setRevealedIds((prev) => {
          const next = new Set(prev);
          next.delete(message.id);
          return next;
        });
      }
    }
  }

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    try {
      const { error } = await supabaseRef.current
        .from("direct_messages")
        .insert({ sender_id: currentUserId, recipient_id: friendId, body });
      if (error) setText(body); // put it back so nothing's lost
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-4 py-2">
        <span className="text-sm text-stone-500">Chat with {friendName}</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId;
          const revealed = revealedIds.has(m.id);
          const translating = translatingIds.has(m.id);

          const bubble = (
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                isMe ? "bg-primary-600 text-white" : "bg-stone-100 text-stone-900"
              }`}
            >
              <p className="text-sm">{m.body}</p>
              {revealed && m.translated_body && (
                <p
                  className={`mt-1 border-t pt-1 text-sm ${
                    isMe ? "border-primary-400 text-primary-100" : "border-stone-300 text-stone-600"
                  }`}
                >
                  {m.translated_body}
                </p>
              )}
            </div>
          );

          if (isMe) {
            return (
              <div key={m.id} className="flex justify-end">
                {bubble}
              </div>
            );
          }

          return (
            <div key={m.id} className="flex items-start justify-start gap-1">
              {bubble}
              <button
                onClick={() => toggleTranslation(m)}
                disabled={translating}
                title="Translate this message"
                aria-label="Translate this message"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 disabled:opacity-50"
              >
                {translating ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-stone-400 border-t-stone-700" />
                ) : (
                  <span
                    className={`text-xs leading-none transition-transform ${revealed ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                )}
              </button>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex gap-2 border-t border-stone-200 p-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
