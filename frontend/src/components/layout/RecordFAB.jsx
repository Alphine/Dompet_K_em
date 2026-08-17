import { useState } from "react";
import { Plus, ShoppingCart, Receipt, Package, HandCoins, Truck, ArrowLeftRight, Wallet, Mic } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAccounts } from "@/lib/hooks";
import VoiceRecordModal from "@/components/VoiceRecordModal";
import SaleForm from "@/components/forms/SaleForm";
import ExpenseForm from "@/components/forms/ExpenseForm";
import PurchaseForm from "@/components/forms/PurchaseForm";
import ReceivePaymentForm from "@/components/forms/ReceivePaymentForm";
import PaySupplierForm from "@/components/forms/PaySupplierForm";
import TransferForm from "@/components/forms/TransferForm";
import OwnerWithdrawalForm from "@/components/forms/OwnerWithdrawalForm";

const TYPES = [
  { key: "SALE", label: "Penjualan", icon: ShoppingCart, color: "text-kem-green" },
  { key: "EXPENSE", label: "Pengeluaran", icon: Receipt, color: "text-red-500" },
  { key: "PURCHASE", label: "Pembelian", icon: Package, color: "text-kem-teal" },
  { key: "RECEIVE_PAYMENT", label: "Terima Bayar", icon: HandCoins, color: "text-kem-green" },
  { key: "PAY_SUPPLIER", label: "Bayar Pemasok", icon: Truck, color: "text-kem-teal" },
  { key: "TRANSFER", label: "Transfer", icon: ArrowLeftRight, color: "text-kem-navy" },
  { key: "OWNER_WITHDRAWAL", label: "Tarik Modal", icon: Wallet, color: "text-kem-gold" },
];

const FORM_MAP = {
  SALE: SaleForm, EXPENSE: ExpenseForm, PURCHASE: PurchaseForm,
  RECEIVE_PAYMENT: ReceivePaymentForm, PAY_SUPPLIER: PaySupplierForm,
  TRANSFER: TransferForm, OWNER_WITHDRAWAL: OwnerWithdrawalForm,
};

export default function RecordFAB() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const { data: accounts = [] } = useAccounts();

  const close = () => {
    setOpen(false);
    setTimeout(() => setType(null), 250);
  };

  const ActiveForm = type ? FORM_MAP[type] : null;
  const activeMeta = TYPES.find((t) => t.key === type);

  return (
    <>
      <button
        data-testid="record-fab-button"
        onClick={() => setOpen(true)}
        className="fixed z-50 bottom-24 md:bottom-8 left-1/2 md:left-auto md:right-8 -translate-x-1/2 md:translate-x-0 bg-kem-gold hover:brightness-105 text-kem-navy font-bold rounded-full pl-5 pr-6 py-4 shadow-[0_10px_30px_rgba(245,158,11,0.45)] flex items-center gap-2 transition-transform active:scale-95"
      >
        <Plus size={20} strokeWidth={3} />
        RECORD
      </button>

      <Sheet open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto max-w-lg mx-auto left-0 right-0" data-testid="record-sheet">
          <SheetHeader>
            <SheetTitle className="font-heading text-xl text-kem-navy flex items-center gap-2">
              {activeMeta && <activeMeta.icon size={20} className={activeMeta.color} />}
              {activeMeta ? activeMeta.label : "Catat Transaksi"}
            </SheetTitle>
            {type && (
              <button data-testid="record-sheet-back-button" onClick={() => setType(null)} className="text-sm text-kem-muted text-left">
                ← Pilih jenis lain
              </button>
            )}
          </SheetHeader>

          <div className="mt-5 pb-8">
            {!type ? (
              <>
                <button
                  data-testid="voice-record-trigger-button"
                  onClick={() => { close(); setTimeout(() => setVoiceOpen(true), 260); }}
                  className="w-full flex items-center justify-center gap-2 bg-kem-teal/10 text-kem-teal font-medium rounded-2xl py-3 mb-4 border border-kem-teal/30"
                >
                  <Mic size={16} /> Atau rekam dengan suara
                </button>
                <div className="grid grid-cols-2 gap-3" data-testid="record-type-grid">
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      data-testid={`record-type-${t.key.toLowerCase()}`}
                      onClick={() => setType(t.key)}
                      className="flex flex-col items-center gap-2 py-6 rounded-2xl border border-slate-200 hover:border-kem-teal hover:bg-kem-teal/5 transition-colors"
                    >
                      <t.icon size={26} className={t.color} />
                      <span className="text-sm font-medium text-kem-navy">{t.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <ActiveForm accounts={accounts} onSuccess={close} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <VoiceRecordModal open={voiceOpen} onOpenChange={setVoiceOpen} />
    </>
  );
}
