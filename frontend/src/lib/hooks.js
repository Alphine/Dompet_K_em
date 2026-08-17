import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: async () => (await api.get("/accounts")).data });
}

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: async () => (await api.get("/products")).data });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get("/categories")).data });
}

export function useReceivablesOpen() {
  return useQuery({ queryKey: ["receivables"], queryFn: async () => (await api.get("/receivables")).data });
}

export function usePayablesOpen() {
  return useQuery({ queryKey: ["payables"], queryFn: async () => (await api.get("/payables")).data });
}

export function useDashboardSummary() {
  return useQuery({ queryKey: ["dashboard-summary"], queryFn: async () => (await api.get("/dashboard/summary")).data });
}

export function useDashboardAlerts() {
  return useQuery({ queryKey: ["dashboard-alerts"], queryFn: async () => (await api.get("/dashboard/alerts")).data });
}

export function useTransactions(params = {}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: async () => (await api.get("/transactions", { params })).data,
  });
}

const FINANCE_KEYS = [
  "dashboard-summary", "dashboard-alerts", "transactions", "accounts",
  "receivables", "payables", "products", "reports-pl", "reports-cashflow",
  "reports-sales", "reports-expenses", "reports-receivables", "reports-payables",
];

export function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => FINANCE_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}
