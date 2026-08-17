import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { todayISO, formatIDR } from "@/lib/format";
import { useReceivablesOpen, useInvalidateFinance } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReceivePaymentForm({ accounts, onSuccess }) {
  const { data: receivables } = useReceivablesOpen();
  const items = receivables?.items || [];
  const invalidate = useInvalidateFinance();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ receivable_id: "", amount: "", account_id: accounts?.[0]?.id || "", date: todayISO() });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSelect = (id) => {
    set("receivable_id", id);
    const rec = items.find((r) => r.id === id);
    if (rec) set("amount", String(rec.outstanding));
  };

  const submit = async () => {
    if (!form.receivable_id) return toast.error("Pilih piutang yang dibayar");
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Masukkan jumlah pembayaran");
    if (!form.account_id) return toast.error("Pilih rekening penerima");
    setSaving(true);
    try {
      await api.put(`/receivables/${form.receivable_id}`, { amount: Number(form.amount), account_id: form.account_id, date: form.date });
      invalidate();
      toast.success("Pembayaran piutang berhasil dicatat!");
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal mencatat pembayaran");
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) {
    return <p className="text-center text-kem-muted py-8" data-testid="receive-payment-empty">Tidak ada piutang yang perlu ditagih.</p>;
  }

  return (
    <div className="space-y-4" data-testid="receive-payment-form">
      <div>
        <Label>Pilih Piutang</Label>
        <Select value={form.receivable_id} onValueChange={handleSelect}>
          <SelectTrigger data-testid="receive-payment-receivable-select" className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Pilih pelanggan" /></SelectTrigger>
          <SelectContent>{items.map((r) => <SelectItem key={r.id} value={r.id}>{r.customer} — {formatIDR(r.outstanding)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Jumlah Dibayar (Rp)</Label>
        <Input data-testid="receive-payment-amount-input" type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} className="mt-1.5 h-14 text-2xl font-heading font-bold rounded-xl" />
      </div>
      <div>
        <Label>Diterima Ke</Label>
        <Select value={form.account_id} onValueChange={(v) => set("account_id", v)}>
          <SelectTrigger data-testid="receive-payment-account-select" className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Pilih rekening" /></SelectTrigger>
          <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button data-testid="receive-payment-save-button" disabled={saving} onClick={submit} className="w-full h-12 rounded-full bg-kem-navy hover:bg-kem-navylight text-white font-semibold mt-2">
        Simpan Pembayaran
      </Button>
    </div>
  );
}
