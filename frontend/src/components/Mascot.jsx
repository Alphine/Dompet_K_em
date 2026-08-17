const MASCOT_MAP = {
  happy: "/mascot/robot-dompet-senang.png",
  smile: "/mascot/robot-dompet-senyum.png",
  thinking: "/mascot/robot-dompet-berpikir.png",
  analyzing: "/mascot/robot-dompet-analisis.png",
  saving: "/mascot/robot-dompet-hemat.png",
  reminder: "/mascot/robot-dompet-ingatkan.png",
  alert: "/mascot/robot-dompet-waspada.png",
  sad: "/mascot/robot-dompet-sedih.png",
  surprised: "/mascot/robot-dompet-kaget.png",
  sleepy: "/mascot/robot-dompet-tidur.png",
  celebrating: "/mascot/robot-dompet-bersemangat.png",
  normal: "/mascot/robot-dompet-normal.png",
  loading: "/mascot/robot-dompet-loading.png",
  angry: "/mascot/robot-dompet-marah.png",
  amazed: "/mascot/robot-dompet-kagum.png",
  disappointed: "/mascot/robot-dompet-kecewa.png",
};

export function Mascot({ expression = "normal", className = "w-24 h-24", alt = "K-eM" }) {
  const src = MASCOT_MAP[expression] || MASCOT_MAP.normal;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid={`mascot-${expression}`}
      draggable={false}
    />
  );
}
