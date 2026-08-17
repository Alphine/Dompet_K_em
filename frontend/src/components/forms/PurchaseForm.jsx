import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";
import { todayISO } from "@/lib/format";
import { useProducts, useInvalidateFinance } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PurchaseForm({ accounts, onSuccess }) {
  const { data: products = [] } = useProducts();
  const invalidate = useInvalidateFinance();
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: "", supplier: "", account_id: accounts?.[0]?.id || "", date: todayISO(),
    status: "PAID", product_id: "", quantity: "", due_date: "", notes: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Masukkan jumlah pembelian");
    setSaving(true);
    try {
      await api.post("/transactions", {
        type: "PURCHASE", amount: Number(form.amount), account_id: form.account_id || null,
        counterparty: form.supplier || null, date: form.date, status: form.status,
        product_id: form.product_id || null, quantity: form.product_id ? Number(form.quantity || 0) : null,
        unit_price: form.product_id && form.quantity ? Number(form.amount) / Number(form.quantity) : null,
        due_date: form.status === "UNPAID" ? form.due_date || null : null,
        description: form.notes || null,
      });
      invalidate();
      toast.success("Pembelian berhasil dicatat!");
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menyimpan pembelian");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="purchase-form">
      <div>
        <Label>Jumlah Pembelian (Rp)</Label>
        <Input data-testid="purchase-amount-input" type="number" autoFocus value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="150000" className="mt-1.5 h-14 text-2xl font-heading font-bold rounded-xl" />
      </div>

      <div>
        <Label>Pemasok</Label>
        <Input data-testid="purchase-supplier-input" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Nama pemasok" className="mt-1.5 h-11 rounded-xl" />
      </div>

      <div>
        <Label>Status Pembayaran</Label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {[{ v: "PAID", l: "Lunas" }, { v: "UNPAID", l: "Belum Bayar" }].map((s) => (
            <button key={s.v} data-testid={`purchase-status-${s.v.toLowerCase()}`} onClick={() => set("status", s.v)} className={`py-2.5 rounded-xl text-sm font-medium border ${form.status === s.v ? "bg-kem-navy text-white border-kem-navy" : "border-slate-200 text-kem-muted"}`}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {form.status === "PAID" && (
        <div>
          <Label>Bayar Dari</Label>
          <Select value={form.account_id} onValueChange={(v) => set("account_id", v)}>
            <SelectTrigger data-testid="purchase-account-select" className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Pilih rekening" /></SelectTrigger>
            <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {form.status === "UNPAID" && (
        <div>
          <Label>Jatuh Tempo</Label>
          <Input data-testid="purchase-due-date-input" type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} className="mt-1.5 h-11 rounded-xl" />
        </div>
      )}

      <button data-testid="purchase-advanced-toggle" onClick={() => setAdvanced(!advanced)} className="flex items-center gap-1 text-sm text-kem-teal font-medium">
        Detail Lanjutan (Stok) {advanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {advanced && (
        <div className="space-y-4">
          <div>
            <Label>Produk (untuk update stok)</Label>
            <Select value={form.product_id} onValueChange={(v) => set("product_id", v)}>
              <SelectTrigger data-testid="purchase-product-select" className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Tanpa update stok" /></SelectTrigger>
              <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.product_id && (
            <div>
              <Label>Jumlah (Qty)</Label>
              <Input data-testid="purchase-quantity-input" type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="mt-1.5 h-11 rounded-xl" />
            </div>
          )}
          <div>
            <Label>Tanggal</Label>
            <Input data-testid="purchase-date-input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div>
            <Label>Catatan</Label>
            <Textarea data-testid="purchase-notes-input" value={form.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
        </div>
      )}

      <Button data-testid="purchase-save-button" disabled={saving} onClick={submit} className="w-full h-12 rounded-full bg-kem-navy hover:bg-kem-navylight text-white font-semibold mt-2">
        Simpan Pembelian
      </Button>
    </div>
  );
}
