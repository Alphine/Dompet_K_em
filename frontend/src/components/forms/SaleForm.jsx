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

export default function SaleForm({ accounts, onSuccess }) {
  const { data: products = [] } = useProducts();
  const invalidate = useInvalidateFinance();
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: "", account_id: accounts?.[0]?.id || "", counterparty: "", date: todayISO(),
    status: "PAID", paid_amount: "", product_id: "", quantity: "1", notes: "",
    estimated_cogs_percent: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectedProduct = products.find((p) => p.id === form.product_id);

  const handleProductSelect = (id) => {
    set("product_id", id);
    const p = products.find((x) => x.id === id);
    if (p) set("amount", String(p.selling_price * Number(form.quantity || 1)));
  };

  const submit = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Masukkan jumlah penjualan");
    if (form.status !== "UNPAID" && !form.account_id) return toast.error("Pilih metode pembayaran");
    setSaving(true);
    try {
      await api.post("/transactions", {
        type: "SALE", amount: Number(form.amount), account_id: form.account_id || null,
        counterparty: form.counterparty || null, date: form.date, status: form.status,
        paid_amount: form.status === "PARTIAL" ? Number(form.paid_amount) : undefined,
        product_id: form.product_id || null, quantity: form.product_id ? Number(form.quantity) : null,
        unit_price: selectedProduct?.selling_price || null,
        estimated_cogs_percent: !form.product_id && form.estimated_cogs_percent ? Number(form.estimated_cogs_percent) : null,
        description: form.notes || null,
      });
      invalidate();
      toast.success("Penjualan berhasil dicatat!");
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menyimpan penjualan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="sale-form">
      <div>
        <Label>Jumlah Penjualan (Rp)</Label>
        <Input data-testid="sale-amount-input" type="number" autoFocus value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="50000" className="mt-1.5 h-14 text-2xl font-heading font-bold rounded-xl" />
      </div>

      <div>
        <Label>Status Pembayaran</Label>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {[{ v: "PAID", l: "Lunas" }, { v: "PARTIAL", l: "Sebagian" }, { v: "UNPAID", l: "Belum Bayar" }].map((s) => (
            <button
              key={s.v}
              data-testid={`sale-status-${s.v.toLowerCase()}`}
              onClick={() => set("status", s.v)}
              className={`py-2.5 rounded-xl text-sm font-medium border ${form.status === s.v ? "bg-kem-navy text-white border-kem-navy" : "border-slate-200 text-kem-muted"}`}
            >
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {form.status !== "UNPAID" && (
        <div>
          <Label>Metode Pembayaran</Label>
          <Select value={form.account_id} onValueChange={(v) => set("account_id", v)}>
            <SelectTrigger data-testid="sale-account-select" className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Pilih rekening" /></SelectTrigger>
            <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {form.status === "PARTIAL" && (
        <div>
          <Label>Jumlah Dibayar Sekarang (Rp)</Label>
          <Input data-testid="sale-paid-amount-input" type="number" value={form.paid_amount} onChange={(e) => set("paid_amount", e.target.value)} className="mt-1.5 h-11 rounded-xl" />
        </div>
      )}

      <button data-testid="sale-advanced-toggle" onClick={() => setAdvanced(!advanced)} className="flex items-center gap-1 text-sm text-kem-teal font-medium">
        Detail Lanjutan {advanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {advanced && (
        <div className="space-y-4 pt-1">
          <div>
            <Label>Pelanggan</Label>
            <Input data-testid="sale-customer-input" value={form.counterparty} onChange={(e) => set("counterparty", e.target.value)} placeholder="Nama pelanggan" className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div>
            <Label>Produk (opsional)</Label>
            <Select value={form.product_id} onValueChange={handleProductSelect}>
              <SelectTrigger data-testid="sale-product-select" className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Tanpa produk spesifik" /></SelectTrigger>
              <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.product_id && (
            <div>
              <Label>Jumlah (Qty)</Label>
              <Input data-testid="sale-quantity-input" type="number" value={form.quantity} onChange={(e) => { set("quantity", e.target.value); if (selectedProduct) set("amount", String(selectedProduct.selling_price * Number(e.target.value || 1))); }} className="mt-1.5 h-11 rounded-xl" />
            </div>
          )}
          {!form.product_id && (
            <div>
              <Label>Estimasi HPP (%) - opsional</Label>
              <Input data-testid="sale-cogs-percent-input" type="number" value={form.estimated_cogs_percent} onChange={(e) => set("estimated_cogs_percent", e.target.value)} placeholder="contoh: 40" className="mt-1.5 h-11 rounded-xl" />
            </div>
          )}
          <div>
            <Label>Tanggal</Label>
            <Input data-testid="sale-date-input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div>
            <Label>Catatan</Label>
            <Textarea data-testid="sale-notes-input" value={form.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
        </div>
      )}

      <Button data-testid="sale-save-button" disabled={saving} onClick={submit} className="w-full h-12 rounded-full bg-kem-navy hover:bg-kem-navylight text-white font-semibold mt-2">
        Simpan Penjualan
      </Button>
    </div>
  );
}
