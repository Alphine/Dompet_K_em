import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";

const SUGGESTED = [
  "Berapa omzet saya bulan ini?",
  "Berapa laba bersih saya?",
  "Kenapa laba turun?",
  "Siapa yang belum bayar?",
  "Tagihan apa yang harus dibayar minggu ini?",
  "Produk mana yang paling menguntungkan?",
];

function renderRich(text) {
  const lines = (text || "").split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={j} className="text-kem-navy">{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>
    );
    return <p key={i} className={line.trim() === "" ? "h-2" : "mb-1"}>{parts}</p>;
  });
}

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/assistant/chat", { message: msg, conversation_id: conversationId });
      setConversationId(res.data.conversation_id);
      setMessages((m) => [...m, { role: "assistant", content: res.data.message }]);
    } catch (e) {
      toast.error("K-eM sedang tidak bisa menjawab. Coba lagi.");
      setMessages((m) => [...m, { role: "assistant", content: "Maaf, saya tidak bisa menjawab sekarang. Coba lagi sebentar." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]" data-testid="assistant-page">
      <div className="flex items-center gap-3 pb-4">
        <Mascot expression="analyzing" className="w-11 h-11" />
        <div>
          <h1 className="font-heading text-xl font-bold text-kem-navy">K-eM</h1>
          <p className="text-xs text-kem-muted">Asisten keuangan usaha Anda</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4" data-testid="assistant-message-list">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 py-10">
            <Mascot expression="normal" className="w-24 h-24" />
            <p className="text-kem-muted text-sm max-w-xs">Tanya K-eM tentang usaha Anda.</p>
            <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-md">
              {SUGGESTED.map((s) => (
                <button key={s} data-testid={`suggested-question-${s.slice(0, 10)}`} onClick={() => send(s)} className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 text-kem-navy hover:border-kem-teal">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`chat-message-${m.role}-${i}`}>
            {m.role === "assistant" && <Mascot expression="smile" className="w-8 h-8 mr-2 mt-1 shrink-0" />}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-kem-navy text-white" : "bg-white border-l-4 border-kem-teal text-kem-text shadow-sm"}`}>
              {m.role === "assistant" ? renderRich(m.content) : m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start" data-testid="assistant-typing-indicator">
            <Mascot expression="thinking" className="w-8 h-8 mr-2 mt-1 animate-pulse" />
            <div className="bg-white border-l-4 border-kem-teal rounded-2xl px-4 py-3 text-sm text-kem-muted">K-eM sedang menganalisis data Anda...</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-200 pt-3">
        <input
          data-testid="assistant-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Tanya soal omzet, laba, piutang..."
          className="flex-1 border border-slate-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-kem-teal/40"
        />
        <Button data-testid="assistant-send-button" onClick={() => send()} disabled={loading} className="rounded-full bg-kem-navy hover:bg-kem-navylight h-11 w-11 p-0">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
