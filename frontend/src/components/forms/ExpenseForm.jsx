import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";
import { todayISO } from "@/lib/format";
import { useCategories, useInvalidateFinance } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_CATEGORIES = ["Sewa", "Listrik & Air", "Internet", "Transportasi", "Marketing", "Kemasan", "Gaji Karyawan", "Perlengkapan", "Perawatan", "Biaya Bank", "Biaya Platform", "Lainnya"];

export default function ExpenseForm({ accounts, onSuccess }) {
  const { data: categories = [] } = useCategories();
  const invalidate = useInvalidateFinance();
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ amount: "", category_name: "", vendor: "", account_id: accounts?.[0]?.id || "", date: todayISO(), notes: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const categoryNames = Array.from(new Set([...categories.map((c) => c.name), ...DEFAULT_CATEGORIES]));

  const submit = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Masukkan jumlah pengeluaran");
    if (!form.category_name) return toast.error("Pilih kategori pengeluaran");
    if (!form.account_id) return toast.error("Pilih rekening pembayaran");
    setSaving(true);
    try {
      await api.post("/transactions", {
        type: "EXPENSE", amount: Number(form.amount), account_id: form.account_id,
        category_name: form.category_name, counterparty: form.vendor || null,
        date: form.date, status: "PAID", description: form.notes || null,
      });
      invalidate();
      toast.success("Pengeluaran berhasil dicatat!");
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menyimpan pengeluaran");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="expense-form">
      <div>
        <Label>Jumlah Pengeluaran (Rp)</Label>
        <Input data-testid="expense-amount-input" type="number" autoFocus value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="20000" className="mt-1.5 h-14 text-2xl font-heading font-bold rounded-xl" />
      </div>

      <div>
        <Label>Kategori</Label>
        <Select value={form.category_name} onValueChange={(v) => set("category_name", v)}>
          <SelectTrigger data-testid="expense-category-select" className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
          <SelectContent>{categoryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div>
        <Label>Bayar Dari</Label>
        <Select value={form.account_id} onValueChange={(v) => set("account_id", v)}>
          <SelectTrigger data-testid="expense-account-select" className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Pilih rekening" /></SelectTrigger>
          <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <button data-testid="expense-advanced-toggle" onClick={() => setAdvanced(!advanced)} className="flex items-center gap-1 text-sm text-kem-teal font-medium">
        Detail Lanjutan {advanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {advanced && (
        <div className="space-y-4">
          <div>
            <Label>Vendor / Penerima</Label>
            <Input data-testid="expense-vendor-input" value={form.vendor} onChange={(e) => set("vendor", e.target.value)} className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div>
            <Label>Tanggal</Label>
            <Input data-testid="expense-date-input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div>
            <Label>Catatan</Label>
            <Textarea data-testid="expense-notes-input" value={form.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
        </div>
      )}

      <Button data-testid="expense-save-button" disabled={saving} onClick={submit} className="w-full h-12 rounded-full bg-kem-navy hover:bg-kem-navylight text-white font-semibold mt-2">
        Simpan Pengeluaran
      </Button>
    </div>
  );
}
