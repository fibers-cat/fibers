import { Prism, type Language } from "prism-react-renderer";

/** A language Prism can highlight plus the label shown in the code block. */
export type CodeLanguage = {
  language: Language;
  label: string;
};

const plain: CodeLanguage = { language: "text", label: "Text" };

/**
 * Languages shipped with prism-react-renderer, keyed by file extension.
 * Java falls back to the C-like grammar: the bundle has no Java grammar, but
 * comments, strings, numbers and operators are highlighted all the same.
 */
const extensionLanguages: Record<string, CodeLanguage> = {
  c: { language: "c", label: "C" },
  h: { language: "c", label: "C" },
  cpp: { language: "cpp", label: "C++" },
  cc: { language: "cpp", label: "C++" },
  cxx: { language: "cpp", label: "C++" },
  hpp: { language: "cpp", label: "C++" },
  hh: { language: "cpp", label: "C++" },
  java: { language: "clike", label: "Java" },
  js: { language: "javascript", label: "JavaScript" },
  mjs: { language: "javascript", label: "JavaScript" },
  jsx: { language: "jsx", label: "JSX" },
  ts: { language: "typescript", label: "TypeScript" },
  tsx: { language: "tsx", label: "TSX" },
  py: { language: "python", label: "Python" },
  sql: { language: "sql", label: "SQL" },
  xml: { language: "markup", label: "XML" },
  html: { language: "markup", label: "HTML" },
  svg: { language: "markup", label: "SVG" },
  json: { language: "json", label: "JSON" },
  css: { language: "css", label: "CSS" },
  yml: { language: "yaml", label: "YAML" },
  yaml: { language: "yaml", label: "YAML" },
  md: { language: "markdown", label: "Markdown" },
  go: { language: "go", label: "Go" },
  rs: { language: "rust", label: "Rust" },
  kt: { language: "kotlin", label: "Kotlin" },
  swift: { language: "swift", label: "Swift" },
  graphql: { language: "graphql", label: "GraphQL" },
};

const javaMarkers = [
  /^\s*import\s+(?:java|javax)\.[\w.]+(?:\.\*)?;/m,
  /^\s*package\s+[\w.]+;/m,
  /\bpublic\s+static\s+void\s+main\s*\(/,
  /\bpublic\s+(?:final\s+|abstract\s+)?(?:class|interface|enum)\s+\w+/,
  /\bclass\s+\w+\s+extends\s+\w+/,
  /System\.out\.print/,
  /\bcatch\s*\(\s*\w*(?:Exception|Error)\w*\s+\w+\s*\)/,
];

const sqlStatements =
  /\b(select|insert\s+into|update|delete\s+from|create\s+table|create\s+(?:or\s+replace\s+)?(?:procedure|function|trigger)|drop\s+table|alter\s+table|commit|rollback)\b/gi;

/** Returns the language of a file from its extension. */
export function languageFromFileName(fileName: string): CodeLanguage {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return extensionLanguages[extension] ?? plain;
}

/**
 * Guesses the language of a file without a known extension: mostly `.txt`
 * notes that mix prose with code snippets.
 */
export function detectLanguage(content: string): CodeLanguage {
  const sample = content.slice(0, 20000);
  if (!sample.trim()) return plain;
  if (/^\s*[{[]/.test(sample)) return { language: "json", label: "JSON" };
  if (/<\?xml|<\/[a-zA-Z][\w:-]*>/.test(sample)) {
    return { language: "markup", label: "XML" };
  }
  if (javaMarkers.some((marker) => marker.test(sample))) {
    return { language: "clike", label: "Java" };
  }
  const statements = sample.match(sqlStatements);
  if (statements && statements.length >= 2) {
    return { language: "sql", label: "SQL" };
  }
  return plain;
}

/** Returns a language Prism can actually highlight. */
export function safeLanguage(language: Language): Language {
  return Prism.languages[language] ? language : "text";
}

/** Short label of a language, used when the caller does not provide one. */
export function languageLabel(language: Language): string {
  switch (language) {
    case "c":
      return "C";
    case "cpp":
      return "C++";
    case "clike":
      return "C-like";
    case "javascript":
      return "JavaScript";
    case "typescript":
      return "TypeScript";
    case "markup":
      return "HTML";
    case "python":
      return "Python";
    case "yaml":
      return "YAML";
    case "markdown":
      return "Markdown";
    case "graphql":
      return "GraphQL";
    default:
      return language.toUpperCase();
  }
}
