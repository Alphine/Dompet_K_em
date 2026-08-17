import { useState } from "react";
import { toast } from "sonner";
import { Plus, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { useProducts, useInvalidateFinance } from "@/lib/hooks";
import { formatIDR } from "@/lib/format";
import { Mascot } from "@/components/Mascot";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const invalidate = useInvalidateFinance();

  return (
    <div className="space-y-4" data-testid="products-page">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-kem-navy">Stok Produk</h1>
        <ProductDialog invalidate={invalidate} />
      </div>

      {isLoading ? (
        <p className="text-kem-muted text-sm">Memuat...</p>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center text-center gap-3" data-testid="products-empty">
          <Mascot expression="thinking" className="w-20 h-20" />
          <p className="text-kem-muted text-sm">Tambahkan produk untuk mulai memantau stok dan margin.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="products-grid">
          {products.map((p) => {
            const low = p.stock_qty <= p.low_stock_threshold;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4" data-testid={`product-card-${p.id}`}>
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-kem-navy">{p.name}</p>
                  {low && <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-full px-2 py-0.5"><AlertTriangle size={11} /> Stok tipis</span>}
                </div>
                <p className="text-sm text-kem-muted mt-1">Stok: <span className="font-medium text-kem-navy">{p.stock_qty} {p.unit}</span></p>
                <div className="flex justify-between mt-3 text-sm">
                  <span className="text-kem-muted">Modal: {formatIDR(p.cost_price)}</span>
                  <span className="text-kem-green font-medium">Jual: {formatIDR(p.selling_price)}</span>
                </div>
                <StockAdjustDialog product={p} invalidate={invalidate} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductDialog({ invalidate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "pcs", stock_qty: "", cost_price: "", selling_price: "", low_stock_threshold: "5" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Nama produk wajib diisi");
    setSaving(true);
    try {
      await api.post("/products", {
        name: form.name, unit: form.unit, stock_qty: Number(form.stock_qty) || 0,
        cost_price: Number(form.cost_price) || 0, selling_price: Number(form.selling_price) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 0,
      });
      invalidate();
      toast.success("Produk ditambahkan!");
      setOpen(false);
      setForm({ name: "", unit: "pcs", stock_qty: "", cost_price: "", selling_price: "", low_stock_threshold: "5" });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menambahkan produk");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger data-testid="add-product-button" className="flex items-center gap-1.5 bg-kem-navy text-white text-sm font-medium rounded-full px-4 py-2">
        <Plus size={15} /> Tambah Produk
      </DialogTrigger>
      <DialogContent data-testid="add-product-dialog">
        <DialogHeader>
          <DialogTitle>Produk Baru</DialogTitle>
          <DialogDescription>Tambahkan produk baru untuk dipantau stok dan marginnya.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Nama Produk</Label><Input data-testid="product-name-input" value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5 rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Satuan</Label><Input data-testid="product-unit-input" value={form.unit} onChange={(e) => set("unit", e.target.value)} className="mt-1.5 rounded-xl" /></div>
            <div><Label>Stok Awal</Label><Input data-testid="product-stock-input" type="number" value={form.stock_qty} onChange={(e) => set("stock_qty", e.target.value)} className="mt-1.5 rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Harga Modal (Rp)</Label><Input data-testid="product-cost-price-input" type="number" value={form.cost_price} onChange={(e) => set("cost_price", e.target.value)} className="mt-1.5 rounded-xl" /></div>
            <div><Label>Harga Jual (Rp)</Label><Input data-testid="product-selling-price-input" type="number" value={form.selling_price} onChange={(e) => set("selling_price", e.target.value)} className="mt-1.5 rounded-xl" /></div>
          </div>
          <div><Label>Batas Stok Menipis</Label><Input data-testid="product-low-stock-input" type="number" value={form.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} className="mt-1.5 rounded-xl" /></div>
          <Button data-testid="product-save-button" disabled={saving} onClick={submit} className="w-full rounded-full bg-kem-navy text-white">Simpan Produk</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StockAdjustDialog({ product, invalidate }) {
  const [open, setOpen] = useState(false);
  const [change, setChange] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!change) return toast.error("Masukkan jumlah penyesuaian");
    setSaving(true);
    try {
      await api.post(`/products/${product.id}/adjust-stock`, { quantity_change: Number(change) });
      invalidate();
      toast.success("Stok disesuaikan!");
      setOpen(false);
      setChange("");
    } catch (e) {
      toast.error("Gagal menyesuaikan stok");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger data-testid={`adjust-stock-${product.id}`} className="mt-3 w-full text-xs font-medium text-kem-teal border border-kem-teal rounded-full py-1.5">
        Sesuaikan Stok
      </DialogTrigger>
      <DialogContent data-testid="adjust-stock-dialog">
        <DialogHeader>
          <DialogTitle>Sesuaikan Stok — {product.name}</DialogTitle>
          <DialogDescription>Tambah atau kurangi stok secara manual.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Perubahan (gunakan minus untuk mengurangi)</Label>
          <Input data-testid="stock-adjust-input" type="number" value={change} onChange={(e) => setChange(e.target.value)} placeholder="contoh: -3 atau 10" className="rounded-xl" />
          <Button data-testid="stock-adjust-submit-button" disabled={saving} onClick={submit} className="w-full rounded-full bg-kem-navy text-white">Simpan</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
