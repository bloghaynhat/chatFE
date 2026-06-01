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
    theme: null,
  },
  {
    id: "morning",
    label: "Sớm mai",
    value: createPresetDataUrl("morning"),
    preview: "linear-gradient(135deg, #fef3c7 0%, #bae6fd 48%, #bbf7d0 100%)",
    backgroundImage:
      "radial-gradient(circle at top left, rgba(255,255,255,0.65), transparent 34%), linear-gradient(135deg, #fef3c7 0%, #bae6fd 48%, #bbf7d0 100%)",
    theme: {
      mine: "shadow-sm self-end bg-sky-100 text-slate-900 rounded-br-md border border-sky-200/80",
      other: "shadow-sm self-start bg-white/95 text-slate-800 rounded-bl-md border border-sky-100",
      sender: "text-sky-700",
      quoteMine: "bg-sky-50/95",
      quoteOther: "bg-sky-50/85",
      quoteBarMine: "bg-sky-600",
      quoteBarOther: "bg-sky-500",
      quoteTitleMine: "text-sky-700",
      quoteTitleOther: "text-sky-700",
      quoteTextMine: "text-sky-900/75",
      quoteTextOther: "text-slate-600",
      revoked:
        "border-sky-200/90 bg-sky-50/75 text-sky-700 dark:border-sky-300/30 dark:bg-sky-950/35 dark:text-sky-200",
    },
  },
  {
    id: "lotus",
    label: "Hoa sen",
    value: createPresetDataUrl("lotus"),
    preview: "linear-gradient(135deg, #fbcfe8 0%, #ddd6fe 48%, #bfdbfe 100%)",
    backgroundImage:
      "radial-gradient(circle at 80% 12%, rgba(255,255,255,0.72), transparent 28%), linear-gradient(135deg, #fbcfe8 0%, #ddd6fe 48%, #bfdbfe 100%)",
    theme: {
      mine: "shadow-sm self-end bg-fuchsia-100 text-slate-900 rounded-br-md border border-fuchsia-200/80",
      other: "shadow-sm self-start bg-white/95 text-slate-800 rounded-bl-md border border-violet-100",
      sender: "text-fuchsia-700",
      quoteMine: "bg-fuchsia-50/95",
      quoteOther: "bg-violet-50/85",
      quoteBarMine: "bg-fuchsia-600",
      quoteBarOther: "bg-violet-500",
      quoteTitleMine: "text-fuchsia-700",
      quoteTitleOther: "text-violet-700",
      quoteTextMine: "text-fuchsia-950/75",
      quoteTextOther: "text-slate-600",
      revoked:
        "border-fuchsia-200/90 bg-fuchsia-50/75 text-fuchsia-700 dark:border-fuchsia-300/30 dark:bg-fuchsia-950/35 dark:text-fuchsia-200",
    },
  },
  {
    id: "mint",
    label: "Bạc hà",
    value: createPresetDataUrl("mint"),
    preview: "linear-gradient(135deg, #ccfbf1 0%, #dcfce7 50%, #e0f2fe 100%)",
    backgroundImage:
      "linear-gradient(135deg, rgba(20,184,166,0.28) 0%, transparent 32%), linear-gradient(135deg, #ccfbf1 0%, #dcfce7 50%, #e0f2fe 100%)",
    theme: {
      mine: "shadow-sm self-end bg-emerald-100 text-slate-900 rounded-br-md border border-emerald-200/80",
      other: "shadow-sm self-start bg-white/95 text-slate-800 rounded-bl-md border border-teal-100",
      sender: "text-emerald-700",
      quoteMine: "bg-emerald-50/95",
      quoteOther: "bg-teal-50/85",
      quoteBarMine: "bg-emerald-600",
      quoteBarOther: "bg-teal-500",
      quoteTitleMine: "text-emerald-700",
      quoteTitleOther: "text-teal-700",
      quoteTextMine: "text-emerald-950/75",
      quoteTextOther: "text-slate-600",
      revoked:
        "border-emerald-200/90 bg-emerald-50/75 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-950/35 dark:text-emerald-200",
    },
  },
  {
    id: "peach",
    label: "Đào nhạt",
    value: createPresetDataUrl("peach"),
    preview: "linear-gradient(135deg, #fed7aa 0%, #fecdd3 48%, #fde68a 100%)",
    backgroundImage:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6), transparent 30%), linear-gradient(135deg, #fed7aa 0%, #fecdd3 48%, #fde68a 100%)",
    theme: {
      mine: "shadow-sm self-end bg-orange-100 text-slate-900 rounded-br-md border border-orange-200/80",
      other: "shadow-sm self-start bg-white/95 text-slate-800 rounded-bl-md border border-rose-100",
      sender: "text-orange-700",
      quoteMine: "bg-orange-50/95",
      quoteOther: "bg-rose-50/85",
      quoteBarMine: "bg-orange-600",
      quoteBarOther: "bg-rose-500",
      quoteTitleMine: "text-orange-700",
      quoteTitleOther: "text-rose-700",
      quoteTextMine: "text-orange-950/75",
      quoteTextOther: "text-slate-600",
      revoked:
        "border-orange-200/90 bg-orange-50/75 text-orange-700 dark:border-orange-300/30 dark:bg-orange-950/35 dark:text-orange-200",
    },
  },
  {
    id: "sky",
    label: "Trời xanh",
    value: createPresetDataUrl("sky"),
    preview: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 42%, #f0f9ff 100%)",
    backgroundImage:
      "radial-gradient(circle at 70% 18%, rgba(255,255,255,0.85), transparent 22%), linear-gradient(135deg, #dbeafe 0%, #bfdbfe 42%, #f0f9ff 100%)",
    theme: {
      mine: "shadow-sm self-end bg-blue-100 text-slate-900 rounded-br-md border border-blue-200/80",
      other: "shadow-sm self-start bg-white/95 text-slate-800 rounded-bl-md border border-blue-100",
      sender: "text-blue-700",
      quoteMine: "bg-blue-50/95",
      quoteOther: "bg-sky-50/85",
      quoteBarMine: "bg-blue-600",
      quoteBarOther: "bg-sky-500",
      quoteTitleMine: "text-blue-700",
      quoteTitleOther: "text-sky-700",
      quoteTextMine: "text-blue-950/75",
      quoteTextOther: "text-slate-600",
      revoked:
        "border-blue-200/90 bg-blue-50/75 text-blue-700 dark:border-blue-300/30 dark:bg-blue-950/35 dark:text-blue-200",
    },
  },
  {
    id: "dusk",
    label: "Chiều tím",
    value: createPresetDataUrl("dusk"),
    preview: "linear-gradient(135deg, #312e81 0%, #7c3aed 48%, #fb7185 100%)",
    backgroundImage:
      "radial-gradient(circle at 16% 18%, rgba(255,255,255,0.16), transparent 24%), linear-gradient(135deg, #312e81 0%, #7c3aed 48%, #fb7185 100%)",
    theme: {
      mine: "shadow-sm self-end bg-violet-200 text-slate-950 rounded-br-md border border-violet-100/80",
      other: "shadow-sm self-start bg-white text-slate-900 rounded-bl-md border border-violet-100/80",
      sender: "text-violet-200",
      quoteMine: "bg-white/70",
      quoteOther: "bg-violet-50/95",
      quoteBarMine: "bg-violet-700",
      quoteBarOther: "bg-violet-500",
      quoteTitleMine: "text-violet-800",
      quoteTitleOther: "text-violet-700",
      quoteTextMine: "text-slate-800/80",
      quoteTextOther: "text-slate-700",
      revoked:
        "border-violet-100/90 bg-white/95 text-violet-700 dark:border-violet-200/60 dark:bg-white/90 dark:text-violet-700",
    },
  },
  {
    id: "graphite",
    label: "Than chì",
    value: createPresetDataUrl("graphite"),
    preview: "linear-gradient(135deg, #111827 0%, #334155 48%, #0f172a 100%)",
    backgroundImage:
      "linear-gradient(135deg, rgba(148,163,184,0.2) 0%, transparent 34%), linear-gradient(135deg, #111827 0%, #334155 48%, #0f172a 100%)",
    theme: {
      mine: "shadow-sm self-end bg-slate-200 text-slate-950 rounded-br-md border border-slate-100/80",
      other: "shadow-sm self-start bg-slate-50/95 text-slate-900 rounded-bl-md border border-slate-200/70",
      sender: "text-slate-200",
      quoteMine: "bg-slate-50/85",
      quoteOther: "bg-slate-100/95",
      quoteBarMine: "bg-slate-700",
      quoteBarOther: "bg-slate-500",
      quoteTitleMine: "text-slate-800",
      quoteTitleOther: "text-slate-700",
      quoteTextMine: "text-slate-700",
      quoteTextOther: "text-slate-600",
      revoked:
        "border-slate-300/60 bg-slate-900/45 text-slate-100 dark:border-slate-300/50 dark:bg-slate-900/55 dark:text-slate-100",
    },
  },
];

export const getWallpaperPresetByValue = (value?: string | null) =>
  WALLPAPER_PRESETS.find((preset) => preset.value === value) || null;

export const getWallpaperPresetValue = (id: string) =>
  WALLPAPER_PRESETS.find((preset) => preset.id === id)?.value || null;

export const getWallpaperPresetTheme = (value?: string | null) =>
  getWallpaperPresetByValue(value)?.theme || null;
