export function formatIDR(amount) {
  const n = Math.round(Number(amount) || 0);
  return "Rp" + n.toLocaleString("id-ID");
}

export function formatDateID(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function monthLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export const TRANSACTION_TYPE_LABELS = {
  SALE: "Penjualan",
  EXPENSE: "Pengeluaran",
  PURCHASE: "Pembelian",
  RECEIVABLE_PAYMENT: "Terima Pembayaran",
  PAYABLE_PAYMENT: "Bayar Pemasok",
  OWNER_INJECTION: "Setor Modal",
  OWNER_WITHDRAWAL: "Tarik Modal",
  TRANSFER: "Transfer",
  ADJUSTMENT: "Penyesuaian",
};

export const STATUS_LABELS = {
  PAID: "Lunas",
  UNPAID: "Belum Bayar",
  PARTIAL: "Sebagian",
  CANCELLED: "Dibatalkan",
};
