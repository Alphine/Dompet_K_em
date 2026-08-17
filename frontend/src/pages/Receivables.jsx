import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useReceivablesOpen, useAccounts, useInvalidateFinance } from "@/lib/hooks";
import { formatIDR, formatDateID, todayISO } from "@/lib/format";
import { Mascot } from "@/components/Mascot";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const STATUS_BADGE = { unpaid: "bg-slate-100 text-slate-600", partial: "bg-amber-100 text-amber-700", overdue: "bg-red-100 text-red-600", paid: "bg-emerald-100 text-emerald-700" };

export default function Receivables() {
  const { data, isLoading } = useReceivablesOpen();
  const { data: accounts = [] } = useAccounts();
  const invalidate = useInvalidateFinance();
  const items = data?.items || [];
  const today = todayISO();

  return (
    <div className="space-y-4" data-testid="receivables-page">
      <div>
        <h1 className="font-heading text-2xl font-bold text-kem-navy">Piutang</h1>
        <p className="text-kem-muted text-sm">Total tertagih: <span className="font-semibold text-kem-navy">{formatIDR(data?.total_outstanding || 0)}</span></p>
      </div>

      {isLoading ? (
        <p className="text-kem-muted text-sm">Memuat...</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center text-center gap-3" data-testid="receivables-empty">
          <Mascot expression="happy" className="w-20 h-20" />
          <p className="text-kem-muted text-sm">Tidak ada piutang yang perlu ditagih.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100" data-testid="receivables-list">
          {items.map((r) => {
            const isOverdue = r.due_date && r.due_date < today && r.outstanding > 0;
            const status = isOverdue ? "overdue" : r.status;
            return (
              <div key={r.id} className="flex items-center justify-between p-4" data-testid={`receivable-item-${r.id}`}>
                <div>
                  <p className="text-sm font-semibold text-kem-navy">{r.customer}</p>
                  <p className="text-xs text-kem-muted">Jatuh tempo: {formatDateID(r.due_date)}</p>
                  <Badge className={`${STATUS_BADGE[status]} mt-1 border-0`}>{status}</Badge>
                </div>
                <div className="text-right space-y-2">
                  <p className="font-heading font-bold text-kem-navy">{formatIDR(r.outstanding)}</p>
                  <PayDialog receivable={r} accounts={accounts} invalidate={invalidate} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PayDialog({ receivable, accounts, invalidate }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(receivable.outstanding));
  const [accountId, setAccountId] = useState(accounts?.[0]?.id || "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return toast.error("Masukkan jumlah pembayaran");
    if (!accountId) return toast.error("Pilih rekening");
    setSaving(true);
    try {
      await api.put(`/receivables/${receivable.id}`, { amount: Number(amount), account_id: accountId, date: todayISO() });
      invalidate();
      toast.success("Pembayaran diterima!");
      setOpen(false);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal mencatat pembayaran");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger data-testid={`pay-receivable-${receivable.id}`} className="text-xs font-medium text-kem-teal border border-kem-teal rounded-full px-3 py-1">
        Terima Bayar
      </DialogTrigger>
      <DialogContent data-testid="receivable-pay-dialog">
        <DialogHeader>
          <DialogTitle>Terima Pembayaran — {receivable.customer}</DialogTitle>
          <DialogDescription>Catat pembayaran piutang yang diterima dari pelanggan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Jumlah (Rp)</Label>
            <Input data-testid="receivable-pay-amount-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Diterima Ke</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger data-testid="receivable-pay-account-select" className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button data-testid="receivable-pay-submit-button" disabled={saving} onClick={submit} className="w-full rounded-full bg-kem-navy text-white">Simpan</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
