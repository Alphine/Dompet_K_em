import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { todayISO } from "@/lib/format";
import { useInvalidateFinance } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OwnerWithdrawalForm({ accounts, onSuccess }) {
  const invalidate = useInvalidateFinance();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ amount: "", account_id: accounts?.[0]?.id || "", date: todayISO(), notes: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Masukkan jumlah penarikan");
    if (!form.account_id) return toast.error("Pilih rekening");
    setSaving(true);
    try {
      await api.post("/transactions", { type: "OWNER_WITHDRAWAL", amount: Number(form.amount), account_id: form.account_id, date: form.date, status: "PAID", description: form.notes || null });
      invalidate();
      toast.success("Penarikan modal pemilik berhasil dicatat!");
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal mencatat penarikan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="owner-withdrawal-form">
      <p className="text-xs text-kem-muted bg-amber-50 border-l-2 border-kem-gold rounded-lg px-3 py-2">
        Penarikan modal pemilik TIDAK dihitung sebagai biaya operasional usaha.
      </p>
      <div>
        <Label>Jumlah Penarikan (Rp)</Label>
        <Input data-testid="owner-withdrawal-amount-input" type="number" autoFocus value={form.amount} onChange={(e) => set("amount", e.target.value)} className="mt-1.5 h-14 text-2xl font-heading font-bold rounded-xl" />
      </div>
      <div>
        <Label>Dari Rekening</Label>
        <Select value={form.account_id} onValueChange={(v) => set("account_id", v)}>
          <SelectTrigger data-testid="owner-withdrawal-account-select" className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Catatan (opsional)</Label>
        <Textarea data-testid="owner-withdrawal-notes-input" value={form.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 rounded-xl" />
      </div>
      <Button data-testid="owner-withdrawal-save-button" disabled={saving} onClick={submit} className="w-full h-12 rounded-full bg-kem-navy hover:bg-kem-navylight text-white font-semibold mt-2">
        Simpan Penarikan
      </Button>
    </div>
  );
}
