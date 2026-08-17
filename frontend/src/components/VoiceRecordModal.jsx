import { useState, useRef } from "react";
import { toast } from "sonner";
import { Mic, Square, Loader2, Check } from "lucide-react";
import api from "@/lib/api";
import { todayISO } from "@/lib/format";
import { useAccounts, useInvalidateFinance } from "@/lib/hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function VoiceRecordModal({ open, onOpenChange, onSuccess }) {
  const { data: accounts = [] } = useAccounts();
  const invalidate = useInvalidateFinance();
  const [status, setStatus] = useState("idle"); // idle | recording | processing | review
  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const reset = () => {
    setStatus("idle");
    setTranscript("");
    setDraft(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = handleStop;
      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch (e) {
      toast.error("Tidak bisa mengakses mikrofon. Periksa izin browser Anda.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
  };

  const handleStop = async () => {
    setStatus("processing");
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, "voice.webm");
    try {
      const res = await api.post("/voice/parse", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setTranscript(res.data.transcript);
      setDraft({ ...res.data.draft, account_id: accounts?.[0]?.id || "" });
      setStatus("review");
    } catch (e) {
      toast.error("Gagal memproses suara. Coba lagi.");
      reset();
    }
  };

  const confirmSave = async () => {
    if (!draft?.amount || Number(draft.amount) <= 0) return toast.error("Masukkan jumlah yang valid");
    setSaving(true);
    try {
      if (draft.type === "SALE") {
        await api.post("/transactions", {
          type: "SALE", amount: Number(draft.amount), account_id: draft.account_id, date: todayISO(),
          status: "PAID", counterparty: draft.counterparty_or_category || null, description: draft.notes || null,
        });
      } else {
        await api.post("/transactions", {
          type: "EXPENSE", amount: Number(draft.amount), account_id: draft.account_id, date: todayISO(),
          category_name: draft.counterparty_or_category || "Lainnya", description: draft.notes || null,
        });
      }
      invalidate();
      toast.success("Transaksi dari suara berhasil disimpan!");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menyimpan transaksi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent data-testid="voice-record-dialog">
        <DialogHeader>
          <DialogTitle>Rekam Suara</DialogTitle>
          <DialogDescription>Ucapkan transaksi Anda, K-eM akan mengubahnya menjadi catatan.</DialogDescription>
        </DialogHeader>

        {status === "idle" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-sm text-kem-muted text-center">Contoh: "Saya jual nasi goreng laku dua puluh lima ribu tunai"</p>
            <button data-testid="voice-start-recording-button" onClick={startRecording} className="w-16 h-16 rounded-full bg-kem-navy text-white flex items-center justify-center">
              <Mic size={24} />
            </button>
          </div>
        )}

        {status === "recording" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-sm text-red-500 font-medium animate-pulse">Merekam... bicara sekarang</p>
            <button data-testid="voice-stop-recording-button" onClick={stopRecording} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center">
              <Square size={22} />
            </button>
          </div>
        )}

        {status === "processing" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={28} className="animate-spin text-kem-teal" />
            <p className="text-sm text-kem-muted">K-eM sedang memproses suara Anda...</p>
          </div>
        )}

        {status === "review" && draft && (
          <div className="space-y-3" data-testid="voice-review-form">
            <p className="text-xs text-kem-muted bg-slate-50 rounded-xl p-2 italic">"{transcript}"</p>
            <div>
              <Label>Jenis</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {[{ v: "SALE", l: "Penjualan" }, { v: "EXPENSE", l: "Pengeluaran" }].map((t) => (
                  <button key={t.v} data-testid={`voice-type-${t.v.toLowerCase()}`} onClick={() => setDraft((d) => ({ ...d, type: t.v }))} className={`py-2 rounded-xl text-sm font-medium border ${draft.type === t.v ? "bg-kem-navy text-white border-kem-navy" : "border-slate-200 text-kem-muted"}`}>
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Jumlah (Rp)</Label>
              <Input data-testid="voice-amount-input" type="number" value={draft.amount || ""} onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>{draft.type === "SALE" ? "Pelanggan" : "Kategori"}</Label>
              <Input data-testid="voice-counterparty-input" value={draft.counterparty_or_category || ""} onChange={(e) => setDraft((d) => ({ ...d, counterparty_or_category: e.target.value }))} className="mt-1.5 rounded-xl" />
            </div>
            <Button data-testid="voice-confirm-save-button" disabled={saving} onClick={confirmSave} className="w-full rounded-full bg-kem-navy text-white">
              <Check size={15} className="mr-1" /> Simpan Transaksi
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
