import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, X, Loader2 } from "lucide-react";
import api, { BACKEND_URL } from "@/lib/api";
import { Label } from "@/components/ui/label";

export default function ReceiptUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/uploads", formData, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(res.data.url);
    } catch (err) {
      toast.error("Gagal mengunggah foto struk");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>Foto Struk (opsional)</Label>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" data-testid="receipt-file-input" className="hidden" onChange={handleFile} />
      {!value ? (
        <button
          type="button"
          data-testid="receipt-upload-button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-1.5 w-full h-24 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-kem-muted hover:border-kem-teal"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          <span className="text-xs">{uploading ? "Mengunggah..." : "Ambil / Pilih Foto"}</span>
        </button>
      ) : (
        <div className="mt-1.5 relative w-24 h-24" data-testid="receipt-preview">
          <img src={`${BACKEND_URL}${value}`} alt="Struk" className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
          <button type="button" data-testid="receipt-remove-button" onClick={() => onChange(null)} className="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 text-red-500">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
