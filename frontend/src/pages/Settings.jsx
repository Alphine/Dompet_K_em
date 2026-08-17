import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import api from "@/lib/api";
import { useBusiness } from "@/context/BusinessContext";
import { useAccounts, useInvalidateFinance } from "@/lib/hooks";
import { formatIDR } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const { business, refresh, mode, toggleMode } = useBusiness();
  const { data: accounts = [] } = useAccounts();
  const invalidate = useInvalidateFinance();
  const [form, setForm] = useState({ business_name: business?.business_name || "", city: business?.city || "" });
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/business", { business_name: form.business_name, city: form.city });
      await refresh();
      toast.success("Profil usaha diperbarui!");
    } catch {
      toast.error("Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <h1 className="font-heading text-2xl font-bold text-kem-navy">Pengaturan</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-heading font-semibold text-kem-navy">Profil Usaha</p>
        <div>
          <Label>Nama Usaha</Label>
          <Input data-testid="settings-business-name-input" value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} className="mt-1.5 rounded-xl" />
        </div>
        <div>
          <Label>Kota</Label>
          <Input data-testid="settings-city-input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="mt-1.5 rounded-xl" />
        </div>
        <div className="flex justify-between text-sm text-kem-muted pt-1">
          <span>Mata Uang</span><span className="font-medium text-kem-navy">{business?.currency}</span>
        </div>
        <Button data-testid="settings-save-profile-button" disabled={saving} onClick={saveProfile} className="rounded-full bg-kem-navy text-white">Simpan Profil</Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
        <div>
          <p className="font-heading font-semibold text-kem-navy">Mode Lanjutan</p>
          <p className="text-xs text-kem-muted">Tampilkan HPP, margin, dan detail akuntansi.</p>
        </div>
        <Switch data-testid="settings-mode-toggle" checked={mode === "advanced"} onCheckedChange={toggleMode} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-heading font-semibold text-kem-navy">Rekening / Akun</p>
          <AddAccountDialog invalidate={invalidate} />
        </div>
        <div className="divide-y divide-slate-100">
          {accounts.map((a) => (
            <div key={a.id} className="flex justify-between py-2 text-sm" data-testid={`account-row-${a.id}`}>
              <span className="text-kem-navy font-medium">{a.name} <span className="text-kem-muted text-xs">({a.type})</span></span>
              <span className="text-kem-navy font-semibold">{formatIDR(a.current_balance)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddAccountDialog({ invalidate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "CASH", opening_balance: "0" });

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Nama rekening wajib diisi");
    setSaving(true);
    try {
      await api.post("/accounts", { name: form.name, type: form.type, opening_balance: Number(form.opening_balance) || 0 });
      invalidate();
      toast.success("Rekening ditambahkan!");
      setOpen(false);
      setForm({ name: "", type: "CASH", opening_balance: "0" });
    } catch {
      toast.error("Gagal menambahkan rekening");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger data-testid="add-account-button" className="flex items-center gap-1 text-xs font-medium text-kem-teal border border-kem-teal rounded-full px-3 py-1.5">
        <Plus size={13} /> Tambah
      </DialogTrigger>
      <DialogContent data-testid="add-account-dialog">
        <DialogHeader>
          <DialogTitle>Rekening Baru</DialogTitle>
          <DialogDescription>Tambahkan rekening kas, bank, atau e-wallet baru.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Nama Rekening</Label><Input data-testid="account-name-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
          <div>
            <Label>Jenis</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger data-testid="account-type-select" className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK">Bank</SelectItem>
                <SelectItem value="EWALLET">E-wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Saldo Awal (Rp)</Label><Input data-testid="account-opening-balance-input" type="number" value={form.opening_balance} onChange={(e) => setForm((f) => ({ ...f, opening_balance: e.target.value }))} className="mt-1.5 rounded-xl" /></div>
          <Button data-testid="account-save-button" disabled={saving} onClick={submit} className="w-full rounded-full bg-kem-navy text-white">Simpan</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
