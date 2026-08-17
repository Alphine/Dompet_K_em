import { useMemo } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Package, Users, ArrowUpRight } from "lucide-react";
import { useDashboardSummary, useDashboardAlerts, useTransactions } from "@/lib/hooks";
import { useBusiness } from "@/context/BusinessContext";
import { formatIDR, monthLabel } from "@/lib/format";
import { Mascot } from "@/components/Mascot";

const SEVERITY_STYLE = {
  warning: "bg-amber-50 border-kem-gold text-amber-900",
  info: "bg-teal-50 border-kem-teal text-teal-900",
  success: "bg-emerald-50 border-kem-green text-emerald-900",
};

export default function Dashboard() {
  const { business, mode } = useBusiness();
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: alerts = [] } = useDashboardAlerts();
  const { data: recentTx = [] } = useTransactions({ limit: 6 });

  const periodLabel = useMemo(() => (summary ? monthLabel(summary.period.end) : ""), [summary]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3" data-testid="dashboard-loading">
        <Mascot expression="loading" className="w-16 h-16 animate-pulse" />
      </div>
    );
  }

  const hasTransactions = recentTx.length > 0;

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="font-heading text-2xl font-bold text-kem-navy">Selamat datang di {business?.business_name}</h1>
        <p className="text-kem-muted text-sm">Ringkasan usaha Anda — {periodLabel}</p>
      </div>

      {/* Cash hero */}
      <div className="bg-kem-navy rounded-3xl p-6 md:p-8 text-white relative overflow-hidden" data-testid="cash-hero-card">
        <div className="absolute -right-10 -top-10 w-56 h-56 bg-kem-teal/20 rounded-full blur-3xl" />
        <p className="text-white/60 text-sm relative z-10">Total Kas Saat Ini</p>
        <p className="font-heading text-4xl md:text-5xl font-extrabold mt-1 relative z-10" data-testid="total-cash-value">{formatIDR(summary.cash_balance)}</p>
        <div className="flex flex-wrap gap-4 mt-4 relative z-10">
          {summary.accounts.map((a) => (
            <div key={a.id} className="text-sm">
              <span className="text-white/50">{a.name}: </span>
              <span className="font-semibold">{formatIDR(a.balance)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="kpi-grid">
        <KpiCard label="Omzet Bulan Ini" value={summary.revenue} accent="text-kem-navy" testid="kpi-revenue" />
        <KpiCard label="Laba Kotor" value={summary.gross_profit} accent="text-kem-teal" sub={`${summary.gross_margin}% margin`} testid="kpi-gross-profit" />
        <KpiCard
          label="Laba Bersih"
          value={summary.net_profit}
          accent={summary.net_profit >= 0 ? "text-kem-green" : "text-red-500"}
          sub={`${summary.net_margin}% margin`}
          testid="kpi-net-profit"
        />
        <KpiCard label="Kas Usaha" value={summary.cash_balance} accent="text-kem-gold" testid="kpi-cash" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/receivables" data-testid="kpi-receivables-link" className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <p className="text-xs text-kem-muted flex items-center gap-1"><Users size={13} /> Piutang</p>
          <p className="font-heading font-bold text-lg text-kem-navy">{formatIDR(summary.receivables_outstanding)}</p>
          {summary.receivables_overdue > 0 && <p className="text-xs text-red-500 mt-0.5">{formatIDR(summary.receivables_overdue)} lewat jatuh tempo</p>}
        </Link>
        <Link to="/payables" data-testid="kpi-payables-link" className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <p className="text-xs text-kem-muted flex items-center gap-1"><ArrowUpRight size={13} /> Utang</p>
          <p className="font-heading font-bold text-lg text-kem-navy">{formatIDR(summary.payables_outstanding)}</p>
          {summary.payables_due_this_week > 0 && <p className="text-xs text-amber-600 mt-0.5">{formatIDR(summary.payables_due_this_week)} jatuh tempo minggu ini</p>}
        </Link>
        {mode === "advanced" && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-xs text-kem-muted">HPP (COGS)</p>
              <p className="font-heading font-bold text-lg text-kem-navy">{formatIDR(summary.cogs)}</p>
            </div>
            <Link to="/products" data-testid="kpi-lowstock-link" className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <p className="text-xs text-kem-muted flex items-center gap-1"><Package size={13} /> Stok Menipis</p>
              <p className="font-heading font-bold text-lg text-kem-navy">{summary.low_stock_count} produk</p>
            </Link>
          </>
        )}
      </div>

      {/* Alerts */}
      <div>
        <h2 className="font-heading font-semibold text-kem-navy mb-3">Perlu Perhatian</h2>
        {alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4" data-testid="alerts-empty">
            <Mascot expression="happy" className="w-12 h-12" />
            <p className="text-sm text-kem-muted">Semua terlihat baik. Tidak ada hal mendesak saat ini.</p>
          </div>
        ) : (
          <div className="space-y-2" data-testid="alerts-list">
            {alerts.map((a, i) => (
              <div key={i} data-testid={`alert-item-${a.type}`} className={`border-l-4 rounded-xl p-4 ${SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info}`}>
                <div className="flex items-center gap-2">
                  {a.severity === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <p className="font-semibold text-sm">{a.title}</p>
                </div>
                <p className="text-sm mt-1 opacity-90">{a.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions / empty state */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold text-kem-navy">Transaksi Terbaru</h2>
          <Link to="/transactions" className="text-sm text-kem-teal font-medium" data-testid="view-all-transactions-link">Lihat semua</Link>
        </div>
        {!hasTransactions ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center text-center gap-3" data-testid="transactions-empty-state">
            <Mascot expression="thinking" className="w-20 h-20" />
            <p className="text-kem-muted text-sm max-w-xs">Belum ada transaksi. Catat penjualan atau pengeluaran pertama Anda.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100" data-testid="recent-transactions-list">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4" data-testid={`transaction-row-${tx.id}`}>
                <div>
                  <p className="text-sm font-medium text-kem-navy">{tx.description || tx.counterparty || tx.type}</p>
                  <p className="text-xs text-kem-muted">{tx.date}</p>
                </div>
                <p className={`font-semibold ${["SALE", "RECEIVABLE_PAYMENT", "OWNER_INJECTION"].includes(tx.type) ? "text-kem-green" : "text-red-500"}`}>
                  {["SALE", "RECEIVABLE_PAYMENT", "OWNER_INJECTION"].includes(tx.type) ? "+" : "-"}{formatIDR(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent, sub, testid }) {
  const isPositiveTrend = value >= 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4" data-testid={testid}>
      <p className="text-xs text-kem-muted mb-1">{label}</p>
      <p className={`font-heading font-bold text-lg md:text-xl ${accent}`}>{formatIDR(value)}</p>
      {sub && (
        <p className="text-xs text-kem-muted mt-0.5 flex items-center gap-1">
          {isPositiveTrend ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {sub}
        </p>
      )}
    </div>
  );
}
