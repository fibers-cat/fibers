import fileManifest from '@/data/materials.json';
import type { UIKey } from '@/i18n';

export type Material = {
  path: string;
  title: string;
  titleKey: UIKey | null;
  extension: string;
  sizeBytes: number;
  subjectAcronym: string | null;
};

export type MaterialGroup = { titleKey: UIKey; materials: Material[] };

const displayTitleKeys: Record<string, UIKey> = {
  'bases-de-dades/indice.txt': 'materials.displayTitles.index',
  'documentacio-ajuda/indice.txt': 'materials.displayTitles.indexDocumentation',
  'matematiques-2/indice.txt': 'materials.displayTitles.index',
  'probabilitat-estadistica/indice.txt': 'materials.displayTitles.index',
  'recuperacions/indice.txt': 'materials.displayTitles.indexRecoveries',
  'sistemes-operatius/indice.txt': 'materials.displayTitles.index',
  'xarxes-de-computadors/indice.txt': 'materials.displayTitles.index',
  'probabilitat-estadistica/texto.txt': 'materials.displayTitles.supplementaryNotes',
  'recuperacions/texto.txt': 'materials.displayTitles.supplementaryNotes',
  'sistemes-operatius/texto.txt': 'materials.displayTitles.supplementaryNotes',
  'bases-de-dades/preview.png': 'materials.displayTitles.sqlPreview',
  'convalidacions.txt': 'materials.displayTitles.convalidations',
  'opinions i consells.txt': 'materials.displayTitles.opinionsAndAdvice',
};

const fileManifestTyped = fileManifest as Array<
  Omit<Material, 'subjectAcronym' | 'titleKey'> & { subjectCode: string | null }
>;

export const materials: Material[] = fileManifestTyped.map((material) => ({
  path: material.path,
  extension: material.extension,
  sizeBytes: material.sizeBytes,
  subjectAcronym: material.subjectCode,
  title: material.title,
  titleKey: displayTitleKeys[material.path] ?? null,
}));

export function materialsForSubject(acronym: string): Material[] {
  return materials.filter((material) => material.subjectAcronym === acronym);
}

export const generalMaterials = materials.filter((material) => material.subjectAcronym === null);

export function materialCountForSubject(acronym: string): number {
  return materials.filter((material) => material.subjectAcronym === acronym).length;
}

export function getMaterialGroups(items: Material[]): MaterialGroup[] {
  const groups = new Map<UIKey, Material[]>();
  for (const material of items) {
    const section = getMaterialSection(material);
    groups.set(section, [...(groups.get(section) ?? []), material]);
  }
  return Array.from(groups, ([titleKey, groupedMaterials]) => ({ titleKey, materials: groupedMaterials }));
}

export function getMaterialSection(material: Material): UIKey {
  const fileName = material.path.split('/').at(-1) ?? '';
  const folder = material.path.split('/')[0];

  if (folder === 'recuperacions') return 'materials.sections.recoveries';
  if (material.subjectAcronym === null) {
    if (folder === 'documentacio-ajuda') return 'materials.sections.helpDocumentation';
    if (folder === 'recuperacions') return 'materials.sections.recoveries';
    return 'materials.sections.generalDocuments';
  }
  if (fileName === 'indice.txt' || fileName === 'texto.txt' || fileName === 'preview.png') return 'materials.sections.supplementary';
  if (material.subjectAcronym === 'BD') {
    if (/procedimientos|disparadores/i.test(fileName)) return 'materials.sections.proceduresAndTriggers';
    if (/jdbc/i.test(fileName)) return 'materials.sections.jdbc';
    return 'materials.sections.sql';
  }
  if (material.subjectAcronym === 'XC') {
    if (/seguiment/i.test(fileName)) return 'materials.sections.trackingExercises';
    if (/xml/i.test(fileName)) return 'materials.sections.transversal';
    return 'materials.sections.chapterSummaries';
  }
  if (material.subjectAcronym === 'EDA') {
    return /\.(cpp|c)$/i.test(fileName) ? 'materials.sections.sortingAlgorithms' : 'materials.sections.algorithmAnalysis';
  }
  if (material.subjectAcronym === 'SO') return 'materials.sections.laboratories';
  if (material.subjectAcronym === 'PE') return 'materials.sections.estatus';
  if (material.subjectAcronym === 'AC') return 'materials.sections.labMaterials';
  if (material.subjectAcronym === 'EEE') return 'materials.sections.economicsManualAnswers';
  if (material.subjectAcronym === 'M2') return 'materials.sections.syllabusAndRecoveries';
  return 'materials.sections.subjectMaterials';
}

export function materialUrl(material: Material): string {
  return `/files/${material.path.split('/').map(encodeURIComponent).join('/')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(0)} KB`;
  return `${(kilobytes / 1024).toFixed(1)} MB`;
}
