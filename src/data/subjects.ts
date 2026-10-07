export type TeachingLanguage = 'ca' | 'es' | 'en';

export type SubjectSpecialty =
  | 'Computació'
  | 'Enginyeria de Computadors'
  | 'Enginyeria del Software'
  | "Sistemes d'informació"
  | 'Tecnologies de la informació';

export type Subject = {
  id: string;
  slug: string;
  acronym: string;
  code: string | null;
  name: string;
  category: string;
  description: string;
  languages: TeachingLanguage[];
  specialty: SubjectSpecialty | null;
  is_current: boolean;
};

export const subjectLanguageNames: Record<TeachingLanguage, string> = {
  ca: 'Català',
  es: 'Castellà',
  en: 'Anglès',
};
