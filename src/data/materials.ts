import fileManifest from '@/data/materials.json';

export type Material = {
  path: string;
  title: string;
  extension: string;
  sizeBytes: number;
  subjectCode: string | null;
};

export type MaterialGroup = { title: string; materials: Material[] };

const displayTitles: Record<string, string> = {
  'bases-de-dades/indice.txt': 'Índex de materials',
  'documentacio-ajuda/indice.txt': 'Índex de documentació',
  'matematiques-2/indice.txt': 'Índex de materials',
  'probabilitat-estadistica/indice.txt': 'Índex de materials',
  'recuperacions/indice.txt': 'Índex de recuperacions',
  'sistemes-operatius/indice.txt': 'Índex de materials',
  'xarxes-de-computadors/indice.txt': 'Índex de materials',
  'probabilitat-estadistica/texto.txt': 'Notes complementàries',
  'recuperacions/texto.txt': 'Notes complementàries',
  'sistemes-operatius/texto.txt': 'Notes complementàries',
  'bases-de-dades/preview.png': 'Vista prèvia SQL',
  'convalidacions.txt': 'Convalidacions',
  'opinions i consells.txt': 'Opinions i consells',
};

const fileManifestTyped = fileManifest as Material[];

export const materials: Material[] = fileManifestTyped.map((material) => ({
  ...material,
  title: displayTitles[material.path] ?? material.title,
}));

export function materialsForSubject(code: string): Material[] {
  return materials.filter((material) => material.subjectCode === code);
}

export const generalMaterials = materials.filter((material) => material.subjectCode === null);

export function materialCountForSubject(code: string): number {
  return materials.filter((material) => material.subjectCode === code).length;
}

export function getMaterialGroups(items: Material[]): MaterialGroup[] {
  const groups = new Map<string, Material[]>();
  for (const material of items) {
    const section = getMaterialSection(material);
    groups.set(section, [...(groups.get(section) ?? []), material]);
  }
  return Array.from(groups, ([title, groupedMaterials]) => ({ title, materials: groupedMaterials }));
}

export function getMaterialSection(material: Material): string {
  const fileName = material.path.split('/').at(-1) ?? '';
  const folder = material.path.split('/')[0];

  if (folder === 'recuperacions') return 'Recuperacions';
  if (material.subjectCode === null) {
    if (folder === 'documentacio-ajuda') return 'Documentació d’ajuda';
    if (folder === 'recuperacions') return 'Recuperacions';
    return 'Documents generals';
  }
  if (fileName === 'indice.txt' || fileName === 'texto.txt' || fileName === 'preview.png') return 'Material complementari';
  if (material.subjectCode === 'BD') {
    if (/procedimientos|disparadores/i.test(fileName)) return 'Procediments i disparadors';
    if (/jdbc/i.test(fileName)) return 'Java Database Connectivity';
    return 'SQL i àlgebra relacional';
  }
  if (material.subjectCode === 'XC') {
    if (/seguiment/i.test(fileName)) return 'Exercicis de seguiment';
    if (/xml/i.test(fileName)) return 'Transversal';
    return 'Resums de capítols';
  }
  if (material.subjectCode === 'EDA') {
    return /\.(cpp|c)$/i.test(fileName) ? 'Algorismes d’ordenació' : 'Anàlisi d’algorismes';
  }
  if (material.subjectCode === 'SO') return 'Laboratoris';
  if (material.subjectCode === 'PE') return 'E-status';
  if (material.subjectCode === 'AC') return 'Materials de laboratori';
  if (material.subjectCode === 'EEE') return 'Respostes del manual d’economia';
  if (material.subjectCode === 'M2') return 'Temari i recuperacions';
  return 'Materials de l’assignatura';
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
