export const DEFAULT_CHAT_WALLPAPER_CLASS =
  "bg-[linear-gradient(120deg,_rgba(245,245,200,0.75)_0%,_rgba(184,220,185,0.78)_45%,_rgba(143,198,169,0.8)_100%)] dark:bg-[linear-gradient(120deg,_rgba(30,41,59,0.9)_0%,_rgba(22,78,99,0.85)_50%,_rgba(30,58,138,0.82)_100%)]";

const createPresetDataUrl = (id: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><metadata>${id}</metadata><rect width="1600" height="1000" fill="#e0f2fe"/></svg>`,
  )}`;

export const WALLPAPER_PRESETS = [
  {
    id: "default",
    label: "Mặc định",
    value: null,
    preview: "linear-gradient(120deg, rgba(245,245,200,0.9), rgba(143,198,169,0.9))",
    backgroundImage: "",
  },
  {
    id: "morning",
    label: "Sớm mai",
    value: createPresetDataUrl("morning"),
    preview: "linear-gradient(135deg, #fef3c7 0%, #bae6fd 48%, #bbf7d0 100%)",
    backgroundImage:
      "radial-gradient(circle at top left, rgba(255,255,255,0.65), transparent 34%), linear-gradient(135deg, #fef3c7 0%, #bae6fd 48%, #bbf7d0 100%)",
  },
  {
    id: "lotus",
    label: "Hoa sen",
    value: createPresetDataUrl("lotus"),
    preview: "linear-gradient(135deg, #fbcfe8 0%, #ddd6fe 48%, #bfdbfe 100%)",
    backgroundImage:
      "radial-gradient(circle at 80% 12%, rgba(255,255,255,0.72), transparent 28%), linear-gradient(135deg, #fbcfe8 0%, #ddd6fe 48%, #bfdbfe 100%)",
  },
  {
    id: "mint",
    label: "Bạc hà",
    value: createPresetDataUrl("mint"),
    preview: "linear-gradient(135deg, #ccfbf1 0%, #dcfce7 50%, #e0f2fe 100%)",
    backgroundImage:
      "linear-gradient(135deg, rgba(20,184,166,0.28) 0%, transparent 32%), linear-gradient(135deg, #ccfbf1 0%, #dcfce7 50%, #e0f2fe 100%)",
  },
  {
    id: "peach",
    label: "Đào nhạt",
    value: createPresetDataUrl("peach"),
    preview: "linear-gradient(135deg, #fed7aa 0%, #fecdd3 48%, #fde68a 100%)",
    backgroundImage:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6), transparent 30%), linear-gradient(135deg, #fed7aa 0%, #fecdd3 48%, #fde68a 100%)",
  },
  {
    id: "sky",
    label: "Trời xanh",
    value: createPresetDataUrl("sky"),
    preview: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 42%, #f0f9ff 100%)",
    backgroundImage:
      "radial-gradient(circle at 70% 18%, rgba(255,255,255,0.85), transparent 22%), linear-gradient(135deg, #dbeafe 0%, #bfdbfe 42%, #f0f9ff 100%)",
  },
  {
    id: "dusk",
    label: "Chiều tím",
    value: createPresetDataUrl("dusk"),
    preview: "linear-gradient(135deg, #312e81 0%, #7c3aed 48%, #fb7185 100%)",
    backgroundImage:
      "radial-gradient(circle at 16% 18%, rgba(255,255,255,0.16), transparent 24%), linear-gradient(135deg, #312e81 0%, #7c3aed 48%, #fb7185 100%)",
  },
  {
    id: "graphite",
    label: "Than chì",
    value: createPresetDataUrl("graphite"),
    preview: "linear-gradient(135deg, #111827 0%, #334155 48%, #0f172a 100%)",
    backgroundImage:
      "linear-gradient(135deg, rgba(148,163,184,0.2) 0%, transparent 34%), linear-gradient(135deg, #111827 0%, #334155 48%, #0f172a 100%)",
  },
];

export const getWallpaperPresetByValue = (value?: string | null) =>
  WALLPAPER_PRESETS.find((preset) => preset.value === value) || null;

export const getWallpaperPresetValue = (id: string) =>
  WALLPAPER_PRESETS.find((preset) => preset.id === id)?.value || null;
