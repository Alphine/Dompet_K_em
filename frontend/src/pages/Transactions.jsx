import { useState } from "react";
import { Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTransactions, useInvalidateFinance } from "@/lib/hooks";
import { formatIDR, formatDateID, TRANSACTION_TYPE_LABELS, STATUS_LABELS } from "@/lib/format";
import { Mascot } from "@/components/Mascot";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const INCOME_TYPES = ["SALE", "RECEIVABLE_PAYMENT", "OWNER_INJECTION"];

export default function Transactions() {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const { data: transactions = [], isLoading } = useTransactions({ limit: 200, type: typeFilter === "ALL" ? undefined : typeFilter });
  const invalidate = useInvalidateFinance();

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      invalidate();
      toast.success("Transaksi dihapus");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menghapus transaksi");
    }
  };

  return (
    <div className="space-y-4" data-testid="transactions-page">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-kem-navy">Transaksi</h1>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-kem-muted" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger data-testid="transaction-type-filter" className="h-9 rounded-xl w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              {Object.entries(TRANSACTION_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-kem-muted text-sm" data-testid="transactions-loading">Memuat...</p>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center text-center gap-3" data-testid="transactions-empty">
          <Mascot expression="thinking" className="w-20 h-20" />
          <p className="text-kem-muted text-sm">Belum ada transaksi. Catat penjualan atau pengeluaran pertama Anda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100" data-testid="transactions-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4" data-testid={`transaction-item-${tx.id}`}>
              <div>
                <p className="text-sm font-semibold text-kem-navy">{TRANSACTION_TYPE_LABELS[tx.type] || tx.type}</p>
                <p className="text-xs text-kem-muted">{formatDateID(tx.date)} · {tx.counterparty || tx.description || "-"} · {STATUS_LABELS[tx.status]}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-semibold ${INCOME_TYPES.includes(tx.type) ? "text-kem-green" : "text-red-500"}`}>
                  {INCOME_TYPES.includes(tx.type) ? "+" : "-"}{formatIDR(tx.amount)}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger data-testid={`delete-transaction-${tx.id}`} className="text-slate-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
                      <AlertDialogDescription>Aksi ini akan membalik efeknya pada kas, piutang/utang, dan tidak dapat dibatalkan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid={`cancel-delete-${tx.id}`}>Batal</AlertDialogCancel>
                      <AlertDialogAction data-testid={`confirm-delete-${tx.id}`} onClick={() => handleDelete(tx.id)}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
