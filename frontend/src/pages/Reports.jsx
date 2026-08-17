import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import api, { API } from "@/lib/api";
import { formatIDR, todayISO } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

function useReport(key, path, params) {
  return useQuery({ queryKey: [key, params], queryFn: async () => (await api.get(path, { params })).data });
}

export default function Reports() {
  const firstOfMonth = todayISO().slice(0, 8) + "01";
  const [start, setStart] = useState(firstOfMonth);
  const [end, setEnd] = useState(todayISO());

  const exportCsv = (type) => {
    window.open(`${API}/reports/export?type=${type}&start=${start}&end=${end}`, "_blank");
  };

  return (
    <div className="space-y-4" data-testid="reports-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-kem-navy">Laporan</h1>
        <div className="flex items-center gap-2">
          <input data-testid="report-start-date" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm" />
          <span className="text-kem-muted text-sm">-</span>
          <input data-testid="report-end-date" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm" />
        </div>
      </div>

      <Tabs defaultValue="pl">
        <TabsList className="bg-slate-100 rounded-full">
          <TabsTrigger data-testid="tab-profit-loss" value="pl" className="rounded-full">Laba Rugi</TabsTrigger>
          <TabsTrigger data-testid="tab-cashflow" value="cashflow" className="rounded-full">Arus Kas</TabsTrigger>
          <TabsTrigger data-testid="tab-sales" value="sales" className="rounded-full">Penjualan</TabsTrigger>
          <TabsTrigger data-testid="tab-expenses" value="expenses" className="rounded-full">Pengeluaran</TabsTrigger>
          <TabsTrigger data-testid="tab-receivables" value="receivables" className="rounded-full">Piutang</TabsTrigger>
          <TabsTrigger data-testid="tab-payables" value="payables" className="rounded-full">Utang</TabsTrigger>
        </TabsList>

        <TabsContent value="pl"><ProfitLossTab start={start} end={end} onExport={() => exportCsv("profit-loss")} /></TabsContent>
        <TabsContent value="cashflow"><CashflowTab start={start} end={end} /></TabsContent>
        <TabsContent value="sales"><SalesTab start={start} end={end} onExport={() => exportCsv("transactions")} /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab start={start} end={end} /></TabsContent>
        <TabsContent value="receivables"><AgingTab type="receivables" /></TabsContent>
        <TabsContent value="payables"><AgingTab type="payables" /></TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ children, testid }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-5 mt-4" data-testid={testid}>{children}</div>;
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between py-2 ${bold ? "font-heading font-bold text-kem-navy border-t border-slate-100 mt-1" : "text-sm text-kem-muted"}`}>
      <span>{label}</span>
      <span className={bold ? "text-kem-navy" : "font-medium text-kem-navy"}>{formatIDR(value)}</span>
    </div>
  );
}

function ProfitLossTab({ start, end, onExport }) {
  const { data, isLoading } = useReport("reports-pl", "/reports/profit-loss", { start, end });
  if (isLoading || !data) return <Card>Memuat...</Card>;
  return (
    <Card testid="report-profit-loss">
      <div className="flex justify-between items-center mb-2">
        <p className="font-heading font-semibold text-kem-navy">Laporan Laba Rugi</p>
        <Button data-testid="export-profit-loss-button" variant="outline" size="sm" onClick={onExport} className="rounded-full"><Download size={13} className="mr-1" /> Export CSV</Button>
      </div>
      <Row label="Omzet (Revenue)" value={data.revenue} />
      <Row label="HPP (COGS)" value={-data.cogs} />
      <Row label="Laba Kotor" value={data.gross_profit} bold />
      <Row label="Biaya Operasional" value={-data.operating_expenses} />
      <Row label="Laba Bersih" value={data.net_profit} bold />
      <p className="text-xs text-kem-muted mt-3">Margin Kotor: {data.gross_margin}% · Margin Bersih: {data.net_margin}%</p>
    </Card>
  );
}

function CashflowTab({ start, end }) {
  const { data, isLoading } = useReport("reports-cashflow", "/reports/cashflow", { start, end });
  if (isLoading || !data) return <Card>Memuat...</Card>;
  return (
    <Card testid="report-cashflow">
      <p className="font-heading font-semibold text-kem-navy mb-2">Laporan Arus Kas</p>
      <Row label="Kas Awal" value={data.opening_cash} />
      <Row label="Kas Masuk" value={data.cash_in} />
      <Row label="Kas Keluar" value={-data.cash_out} />
      <Row label="Kas Akhir" value={data.ending_cash} bold />
      <p className="text-xs text-kem-muted mt-3">Ingat: Laba tidak selalu sama dengan kas. Cek tab Laba Rugi untuk perbandingan.</p>
    </Card>
  );
}

function SalesTab({ start, end }) {
  const { data, isLoading } = useReport("reports-sales", "/reports/sales", { start, end, groupby: "product" });
  if (isLoading || !data) return <Card>Memuat...</Card>;
  return (
    <Card testid="report-sales">
      <p className="font-heading font-semibold text-kem-navy mb-2">Penjualan per Produk</p>
      {data.products?.length === 0 ? <p className="text-sm text-kem-muted">Belum ada data penjualan.</p> : data.products.map((p, i) => (
        <div key={i} className="flex justify-between py-2 border-b border-slate-50 last:border-0 text-sm">
          <span className="text-kem-navy font-medium">{p.product}</span>
          <span className="text-kem-muted">{formatIDR(p.revenue)} · Laba {formatIDR(p.profit)}</span>
        </div>
      ))}
    </Card>
  );
}

function ExpensesTab({ start, end }) {
  const { data, isLoading } = useReport("reports-expenses", "/reports/expenses", { start, end });
  if (isLoading || !data) return <Card>Memuat...</Card>;
  return (
    <Card testid="report-expenses">
      <p className="font-heading font-semibold text-kem-navy mb-2">Pengeluaran per Kategori</p>
      {data.current.breakdown.length === 0 ? <p className="text-sm text-kem-muted">Belum ada data pengeluaran.</p> : data.current.breakdown.map((b, i) => (
        <div key={i} className="flex justify-between py-2 border-b border-slate-50 last:border-0 text-sm">
          <span className="text-kem-navy font-medium">{b.category}</span>
          <span className="text-kem-muted">{formatIDR(b.amount)} ({b.percent}%)</span>
        </div>
      ))}
    </Card>
  );
}

function AgingTab({ type }) {
  const { data, isLoading } = useReport(`reports-${type}`, `/reports/${type}`, {});
  if (isLoading || !data) return <Card>Memuat...</Card>;
  return (
    <Card testid={`report-${type}-aging`}>
      <p className="font-heading font-semibold text-kem-navy mb-2">Umur {type === "receivables" ? "Piutang" : "Utang"}</p>
      <div className="grid grid-cols-4 gap-2 text-center mb-4">
        {Object.entries(data.aging).map(([bucket, amount]) => (
          <div key={bucket} className="bg-slate-50 rounded-xl p-2">
            <p className="text-xs text-kem-muted">{bucket} hari</p>
            <p className="text-sm font-semibold text-kem-navy">{formatIDR(amount)}</p>
          </div>
        ))}
      </div>
      {data.items.map((it) => (
        <div key={it.id} className="flex justify-between py-2 border-b border-slate-50 last:border-0 text-sm">
          <span className="text-kem-navy font-medium">{it.customer || it.supplier}</span>
          <span className="text-kem-muted">{formatIDR(it.outstanding)}</span>
        </div>
      ))}
    </Card>
  );
}
