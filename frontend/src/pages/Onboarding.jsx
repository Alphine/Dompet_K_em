import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useBusiness } from "@/context/BusinessContext";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BUSINESS_TYPES = [
  { value: "RETAIL", label: "Retail / Toko" },
  { value: "FOOD_BEVERAGE", label: "Makanan & Minuman" },
  { value: "SERVICE", label: "Jasa" },
  { value: "ONLINE_SELLER", label: "Penjual Online" },
  { value: "RESELLER", label: "Reseller" },
  { value: "WHOLESALE", label: "Grosir" },
  { value: "HOME_INDUSTRY", label: "Industri Rumahan" },
  { value: "OTHER", label: "Lainnya" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { refresh } = useBusiness();
  const [form, setForm] = useState({ business_name: "", business_type: "FOOD_BEVERAGE", city: "", starting_cash: "" });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const createBusiness = async (loadDemo) => {
    if (!loadDemo && !form.business_name.trim()) {
      toast.error("Nama usaha wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/business", {
        business_name: form.business_name || "Usaha Saya",
        business_type: form.business_type,
        city: form.city,
        starting_cash: Number(form.starting_cash) || 0,
        load_demo_data: loadDemo,
      });
      await refresh();
      toast.success(loadDemo ? "Data contoh berhasil dimuat!" : "Usaha berhasil dibuat!");
      navigate("/dashboard");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal membuat usaha");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-kem-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
        <div className="flex items-center gap-4 mb-6">
          <Mascot expression="thinking" className="w-16 h-16" />
          <div>
            <h1 className="font-heading text-2xl font-bold text-kem-navy">Buat Usaha Anda</h1>
            <p className="text-kem-muted text-sm">Mulai catat keuangan usaha dalam hitungan menit.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="business_name">Nama Usaha</Label>
            <Input
              id="business_name"
              data-testid="onboarding-business-name-input"
              placeholder="contoh: Warung Bu Sari"
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              className="mt-1.5 rounded-xl h-11"
            />
          </div>

          <div>
            <Label>Jenis Usaha</Label>
            <Select value={form.business_type} onValueChange={(v) => set("business_type", v)}>
              <SelectTrigger data-testid="onboarding-business-type-select" className="mt-1.5 rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Kota</Label>
              <Input id="city" data-testid="onboarding-city-input" placeholder="Jakarta" value={form.city} onChange={(e) => set("city", e.target.value)} className="mt-1.5 rounded-xl h-11" />
            </div>
            <div>
              <Label htmlFor="starting_cash">Modal Kas Awal (Rp)</Label>
              <Input id="starting_cash" data-testid="onboarding-starting-cash-input" type="number" placeholder="500000" value={form.starting_cash} onChange={(e) => set("starting_cash", e.target.value)} className="mt-1.5 rounded-xl h-11" />
            </div>
          </div>

          <Button
            data-testid="onboarding-create-business-button"
            disabled={submitting}
            onClick={() => createBusiness(false)}
            className="w-full h-12 rounded-full bg-kem-navy hover:bg-kem-navylight text-white font-semibold"
          >
            Mulai Catat Usaha Saya
          </Button>

          <div className="relative py-2 text-center">
            <span className="text-xs text-kem-muted bg-white px-2 relative z-10">atau</span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
          </div>

          <Button
            data-testid="onboarding-demo-data-button"
            variant="outline"
            disabled={submitting}
            onClick={() => createBusiness(true)}
            className="w-full h-12 rounded-full border-kem-teal text-kem-teal hover:bg-kem-teal/5 font-semibold"
          >
            Coba Dulu dengan Data Contoh (Kedai Demo K-eM)
          </Button>
        </div>
      </div>
    </div>
  );
}
