# Dompet K-eM — Product Requirements Document

## Original Problem Statement
Build "Dompet K-eM" — an AI business finance copilot for Indonesian UMKM (warung, F&B, retail,
online sellers, resellers, service businesses, home industries). NOT a generic personal finance
tracker, NOT a complex accounting ERP. Core promise: "Catat gampang. Tahu untung. Kendalikan usaha."
Simple Mode is default; Advanced Mode reveals COGS/margins/inventory detail. Primary mobile CTA is a
dominant "+ RECORD" action covering Sale/Expense/Purchase/Receive Payment/Pay Supplier/Transfer/Owner
Withdrawal. K-eM AI must explain real recorded numbers via backend tool-calling, never hallucinate.
Full spec covers accounts, transaction engine, sales, purchases, COGS, expenses, owner money
separation, receivables/payables with aging, inventory-lite, dashboard, reports+export, alerts, and
the K-eM AI copilot — with strict security (server-side business scoping) and Indonesian UMKM UX.

## User Personas
- **Warung/F&B owner** — little/no accounting background, needs to record sales/expenses in seconds.
- **Online seller/reseller** — tracks payments received vs. pending (receivables), supplier payables.
- **Small retail/service owner** — cares about "how much cash do I have" and "am I profitable".

## Architecture
- **Frontend**: React (CRA + craco), react-router-dom v7, @tanstack/react-query, shadcn/ui, Tailwind
  (custom `kem` color tokens: navy/teal/green/gold), Plus Jakarta Sans (headings) + Inter (body),
  sonner for toasts, lucide-react icons, K-eM wallet-robot mascot (17 expression PNGs in
  `/public/mascot`).
- **Backend**: FastAPI, Motor (async MongoDB driver), UUID string IDs everywhere (no ObjectId
  exposure), all routes under `/api`.
- **Database**: MongoDB collections — users, user_sessions, businesses, accounts, categories,
  products, transactions, receivables, payables, ai_conversations, ai_messages.
- **Auth**: Emergent-managed Google OAuth (session_token httpOnly cookie, 7-day expiry, Bearer
  fallback for API testing).
- **AI**: Gemini 3.1 Pro via `emergentintegrations` (EMERGENT_LLM_KEY), custom tool-calling loop with
  19 backend finance tools — AI never computes numbers itself.

## Core Requirements (static)
1. Business bookkeeping first, AI second. Every financial number computed server-side.
2. Simple Mode default; Advanced Mode exposes COGS/margin/inventory.
3. Transactions never silently mutate; deletions reverse ledger effects with guard rails.
4. Transfers and Owner Withdrawal/Injection never affect revenue/profit.
5. Unpaid sales create receivables; unpaid purchases create payables; inventory purchase ≠ COGS.
6. K-eM AI must call backend tools for any numeric business question; labels estimates/simulations.
7. Server-side business_id resolution only — client never supplies business_id/user_id/role.

## Implemented (as of 17 Aug 2026 — Milestone 1 + full core loop in one pass)
- **Phase 1 (Foundation)**: React app shell, Emergent Google OAuth (session/me/logout), business
  onboarding (create business + starting cash OR load "Kedai Demo K-eM" seed), MongoDB models,
  server-side authorization via `get_current_business`.
- **Phase 2 (Core Money Engine)**: Accounts (Cash/Bank/E-wallet), full transaction engine — SALE,
  EXPENSE, PURCHASE, RECEIVABLE_PAYMENT, PAYABLE_PAYMENT, OWNER_INJECTION, OWNER_WITHDRAWAL,
  TRANSFER, ADJUSTMENT — with create/reverse/delete logic maintaining account running balances.
- **Phase 3 (Financial Engine)**: revenue, COGS (product-based + estimated %), gross profit, net
  profit, margins, cashflow (opening/in/out/ending), dashboard summary — manually verified end-to-end
  (revenue/cogs/gross/net/cash all matched hand-calculated expected values exactly; transfers/owner
  withdrawal proven to not affect profit).
- **Phase 4 (Business Ops)**: Receivables & Payables (with aging buckets 0-7/8-30/31-60/60+),
  Inventory Lite (products, stock adjust, low-stock alerts), Dashboard alerts (cashflow risk, overdue
  receivables, payables due, margin drop, expense anomaly, positive cost trend), Reports (P&L,
  Cashflow, Sales by product, Expense breakdown, Receivable/Payable aging, CSV export).
- **Phase 5 (K-eM AI)**: 19 backend finance tools, Gemini 3.1 Pro tool-calling loop, structured
  Indonesian response format (Jawaban → Data → Penjelasan → Saran), conversation persistence
  (ai_conversations/ai_messages), guardrail system prompt (no fabrication, no payments, Indonesian
  language, "Estimasi"/"Simulasi" labeling).
- **Mobile UX**: bottom nav (Home/Reports/K-eM/More), dominant floating "+ RECORD" button opening a
  bottom sheet with 7 fast-entry forms (advanced fields collapsible for speed).
- **Testing**: Backend pytest suite (26/26 passing) covering all 9 transaction types, cross-business
  isolation, receivables/payables, reports, AI chat. Two frontend bugs found and fixed: (1)
  BusinessContext loading race causing false /onboarding redirect, (2) receivables/payables list
  response shape now returns `{items, total_outstanding}` consistently.

## Prioritized Backlog
- **P0**: Re-verify BusinessContext fix + receivables/payables fix with a follow-up browser test pass.
- **P1**: Multi-user business membership (business_members collection exists conceptually but only
  single-owner is wired); account/business deletion flows; attachment upload for receipts.
- **P2**: Cashflow forecast tuning, anomaly detection refinement, monthly PDF report, billing tiers
  (Free/Pro/Team — explicitly out of scope for MVP per spec).

## Next Tasks
- Run a follow-up testing pass confirming the two bug fixes hold in real browser flows.
- Gather user feedback on AI response quality and record-flow speed (<20s sale / <15s expense targets).
