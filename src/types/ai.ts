export type ToneType = "formal" | "casual" | "funny" | "professional";

export interface ToneOption {
  id: ToneType;
  label: string;
  icon: string;
  iconClassName: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  { id: "formal", label: "Trang trọng", icon: "👔", iconClassName: "text-blue-500" },
  { id: "professional", label: "Chuyên nghiệp", icon: "💼", iconClassName: "text-purple-500" },
  { id: "casual", label: "Thân thiện", icon: "😊", iconClassName: "text-green-500" },
  { id: "funny", label: "Hài hước", icon: "😂", iconClassName: "text-yellow-500" },
];
