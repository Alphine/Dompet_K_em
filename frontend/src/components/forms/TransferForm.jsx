import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { todayISO } from "@/lib/format";
import { useInvalidateFinance } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TransferForm({ accounts, onSuccess }) {
  const invalidate = useInvalidateFinance();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ amount: "", account_id: accounts?.[0]?.id || "", to_account_id: accounts?.[1]?.id || "", date: todayISO() });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Masukkan jumlah transfer");
    if (form.account_id === form.to_account_id) return toast.error("Rekening asal dan tujuan harus berbeda");
    setSaving(true);
    try {
      await api.post("/transactions", { type: "TRANSFER", amount: Number(form.amount), account_id: form.account_id, to_account_id: form.to_account_id, date: form.date, status: "PAID" });
      invalidate();
      toast.success("Transfer berhasil dicatat!");
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal mencatat transfer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="transfer-form">
      <div>
        <Label>Jumlah Transfer (Rp)</Label>
        <Input data-testid="transfer-amount-input" type="number" autoFocus value={form.amount} onChange={(e) => set("amount", e.target.value)} className="mt-1.5 h-14 text-2xl font-heading font-bold rounded-xl" />
      </div>
      <div>
        <Label>Dari Rekening</Label>
        <Select value={form.account_id} onValueChange={(v) => set("account_id", v)}>
          <SelectTrigger data-testid="transfer-from-account-select" className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Ke Rekening</Label>
        <Select value={form.to_account_id} onValueChange={(v) => set("to_account_id", v)}>
          <SelectTrigger data-testid="transfer-to-account-select" className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <p className="text-xs text-kem-muted">Transfer antar rekening tidak memengaruhi laba usaha, hanya memindahkan lokasi kas.</p>
      <Button data-testid="transfer-save-button" disabled={saving} onClick={submit} className="w-full h-12 rounded-full bg-kem-navy hover:bg-kem-navylight text-white font-semibold mt-2">
        Simpan Transfer
      </Button>
    </div>
  );
}
