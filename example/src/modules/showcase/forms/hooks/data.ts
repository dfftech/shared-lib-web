// Default values and options of the forms showcase.
import type { OptionType } from "dff-util";
import type { ShowcaseFormType } from "./types.ts";

export const showcaseInitValues: ShowcaseFormType = {
  name: "",
  email: "",
  bio: "",
  role: "",
  phoneCountry: "IN",
  preferredLanguage: "hi-IN",
  isActive: true,
  acceptTerms: false,
  startDate: "",
  meetingAt: "",
  openTime: "09:00",
  code: "",
  skills: ["react"],
  plan: "pro",
  title: { "en-US": "Welcome" },
  summary: {},
  content: "## Hello\n\nThis is **markdown** with a list:\n\n- one\n- two",
  pageBody: { "en-US": "# About us\n\nWe build *shared* UI." },
  csvFile: null,
  photos: [],
};

export function getDefaultShowcase(): ShowcaseFormType {
  return { ...showcaseInitValues };
}

export const showcaseRoleOptions: OptionType[] = [
  { key: "admin", label: "Admin", lang: { fr: "Administrateur", ar: "مسؤول" } },
  { key: "editor", label: "Editor", lang: { fr: "Éditeur", ar: "محرر" } },
  { key: "viewer", label: "Viewer", lang: { fr: "Lecteur", ar: "مشاهد" } },
];

export const showcaseSkillOptions: OptionType[] = [
  { key: "react", label: "React", icon: "⚛️" },
  { key: "typescript", label: "TypeScript", icon: "🔷" },
  { key: "tailwind", label: "Tailwind CSS", icon: "🌬️" },
  { key: "daisyui", label: "DaisyUI", icon: "🌼" },
  { key: "signals", label: "Signals", icon: "📡" },
];

export const showcasePlanOptions: OptionType[] = [
  { key: "free", label: "Free" },
  { key: "pro", label: "Pro" },
  { key: "enterprise", label: "Enterprise", disabled: true },
];
