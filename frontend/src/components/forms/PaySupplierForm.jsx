import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { todayISO, formatIDR } from "@/lib/format";
import { usePayablesOpen, useInvalidateFinance } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PaySupplierForm({ accounts, onSuccess }) {
  const { data: payables } = usePayablesOpen();
  const items = payables?.items || [];
  const invalidate = useInvalidateFinance();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ payable_id: "", amount: "", account_id: accounts?.[0]?.id || "", date: todayISO() });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSelect = (id) => {
    set("payable_id", id);
    const pay = items.find((p) => p.id === id);
    if (pay) set("amount", String(pay.outstanding));
  };

  const submit = async () => {
    if (!form.payable_id) return toast.error("Pilih utang yang dibayar");
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Masukkan jumlah pembayaran");
    if (!form.account_id) return toast.error("Pilih rekening sumber dana");
    setSaving(true);
    try {
      await api.put(`/payables/${form.payable_id}`, { amount: Number(form.amount), account_id: form.account_id, date: form.date });
      invalidate();
      toast.success("Pembayaran ke pemasok berhasil dicatat!");
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal mencatat pembayaran");
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) {
    return <p className="text-center text-kem-muted py-8" data-testid="pay-supplier-empty">Belum ada tagihan yang jatuh tempo.</p>;
  }

  return (
    <div className="space-y-4" data-testid="pay-supplier-form">
      <div>
        <Label>Pilih Utang</Label>
        <Select value={form.payable_id} onValueChange={handleSelect}>
          <SelectTrigger data-testid="pay-supplier-payable-select" className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Pilih pemasok" /></SelectTrigger>
          <SelectContent>{items.map((p) => <SelectItem key={p.id} value={p.id}>{p.supplier} — {formatIDR(p.outstanding)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Jumlah Dibayar (Rp)</Label>
        <Input data-testid="pay-supplier-amount-input" type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} className="mt-1.5 h-14 text-2xl font-heading font-bold rounded-xl" />
      </div>
      <div>
        <Label>Bayar Dari</Label>
        <Select value={form.account_id} onValueChange={(v) => set("account_id", v)}>
          <SelectTrigger data-testid="pay-supplier-account-select" className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Pilih rekening" /></SelectTrigger>
          <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button data-testid="pay-supplier-save-button" disabled={saving} onClick={submit} className="w-full h-12 rounded-full bg-kem-navy hover:bg-kem-navylight text-white font-semibold mt-2">
        Simpan Pembayaran
      </Button>
    </div>
  );
}
