// Types of the forms showcase.
export interface ShowcaseFormType {
  name: string;
  email: string;
  bio: string;
  role: string;
  phoneCountry: string;
  preferredLanguage: string;
  isActive: boolean;
  acceptTerms: boolean;
  startDate: string;
  meetingAt: string;
  openTime: string;
  code: string;
  skills: string[];
  plan: string;
  title: Record<string, string>;
  summary: Record<string, string>;
  content: string;
  pageBody: Record<string, string>;
  csvFile: File | null;
  photos: File[];
}
