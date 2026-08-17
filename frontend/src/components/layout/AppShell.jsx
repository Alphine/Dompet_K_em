import { Routes, Route, Navigate } from "react-router-dom";
import { useBusiness } from "@/context/BusinessContext";
import { Mascot } from "@/components/Mascot";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import RecordFAB from "@/components/layout/RecordFAB";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Receivables from "@/pages/Receivables";
import Payables from "@/pages/Payables";
import Products from "@/pages/Products";
import Reports from "@/pages/Reports";
import Assistant from "@/pages/Assistant";
import Settings from "@/pages/Settings";
import More from "@/pages/More";
import Onboarding from "@/pages/Onboarding";

export default function AppShell() {
  const { business, loading } = useBusiness();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-kem-bg" data-testid="business-loading">
        <Mascot expression="loading" className="w-20 h-20 animate-pulse" />
        <p className="text-kem-muted text-sm">Memuat usaha Anda...</p>
      </div>
    );
  }

  if (!business) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen bg-kem-bg md:flex" data-testid="app-shell">
      <Sidebar />
      <div className="flex-1 md:ml-64 pb-24 md:pb-0">
        <Header />
        <main className="p-4 md:p-8 max-w-6xl mx-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/receivables" element={<Receivables />} />
            <Route path="/payables" element={<Payables />} />
            <Route path="/products" element={<Products />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/more" element={<More />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
      <RecordFAB />
    </div>
  );
}
