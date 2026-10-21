import { useCallback, useMemo, useState } from "react";
import { Highlight, type Language, type PrismTheme } from "prism-react-renderer";
import IconButton from "@mui/material/IconButton";
import AppTooltip from "@/components/shared/AppTooltip";
import CheckRounded from "@mui/icons-material/CheckRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import FormatListNumberedRounded from "@mui/icons-material/FormatListNumberedRounded";
import { languageLabel, safeLanguage } from "@/data/codeLanguage";
import { copyText } from "@/services/clipboard";
import { useTranslations, type Locale } from "@/i18n";

type Props = {
  code: string;
  language?: Language;
  /** Label shown on the corner; derived from the language when missing. */
  label?: string;
  /** Wraps long lines instead of scrolling horizontally. */
  wrap?: boolean;
  /** Shows the language name on the top-right corner. */
  showLabel?: boolean;
  locale: Locale;
  className?: string;
};

/**
 * Dark palette tuned to the site colours (ink background, coral accents).
 * Token types follow the Prism naming.
 */
const darkTheme: PrismTheme = {
  plain: {
    color: "#e6edf3",
    backgroundColor: "#20242c",
  },
  styles: [
    {
      types: ["comment", "prolog", "cdata", "doctype"],
      style: { color: "#8b929d", fontStyle: "italic" },
    },
    {
      types: ["keyword", "operator", "important", "atrule", "selector"],
      style: { color: "#ff8a8e" },
    },
    {
      types: ["string", "char", "attr-value", "template-string"],
      style: { color: "#a5d6ff" },
    },
    {
      types: ["number", "boolean", "constant", "symbol", "unit"],
      style: { color: "#79c0ff" },
    },
    {
      types: ["function", "method", "macro"],
      style: { color: "#d2a8ff" },
    },
    {
      types: ["class-name", "type", "namespace", "builtin"],
      style: { color: "#7ee787" },
    },
    {
      types: ["property", "attr-name", "variable", "parameter", "tag"],
      style: { color: "#ffa657" },
    },
    {
      types: ["punctuation"],
      style: { color: "#b9c2cf" },
    },
    {
      types: ["deleted"],
      style: { color: "#ffdcd7", backgroundColor: "#67060c" },
    },
    {
      types: ["inserted"],
      style: { color: "#aff5b4", backgroundColor: "#033a16" },
    },
  ],
};

/** Light counterpart of the dark palette. */
const lightTheme: PrismTheme = {
  plain: {
    color: "#24292f",
    backgroundColor: "#f7f8fa",
  },
  styles: [
    {
      types: ["comment", "prolog", "cdata", "doctype"],
      style: { color: "#6e7781", fontStyle: "italic" },
    },
    {
      types: ["keyword", "operator", "important", "atrule", "selector"],
      style: { color: "#cf222e" },
    },
    {
      types: ["string", "char", "attr-value", "template-string"],
      style: { color: "#0a3069" },
    },
    {
      types: ["number", "boolean", "constant", "symbol", "unit"],
      style: { color: "#0550ae" },
    },
    {
      types: ["function", "method", "macro"],
      style: { color: "#8250df" },
    },
    {
      types: ["class-name", "type", "namespace", "builtin"],
      style: { color: "#953800" },
    },
    {
      types: ["property", "attr-name", "variable", "parameter", "tag"],
      style: { color: "#116329" },
    },
    {
      types: ["punctuation"],
      style: { color: "#57606a" },
    },
    {
      types: ["deleted"],
      style: { color: "#82071e", backgroundColor: "#ffebe9" },
    },
    {
      types: ["inserted"],
      style: { color: "#116329", backgroundColor: "#dafbe1" },
    },
  ],
};

/**
 * Renders a code block with syntax highlighting. Prism does the tokenizing,
 * so the markup is a `<pre><code>` with one `<span>` per token.
 */
export default function CodeBlock({
  code,
  language = "text",
  label,
  wrap = false,
  showLabel = true,
  locale,
  className,
}: Props) {
  const t = useTranslations(locale);
  const [light, setLight] = useState(false);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [copied, setCopied] = useState(false);

  const resolved = safeLanguage(language);
  const content = useMemo(() => code.replace(/\n+$/, ""), [code]);
  const theme = light ? lightTheme : darkTheme;

  const copy = useCallback(async () => {
    const done = await copyText(content);
    setCopied(done);
    if (done) window.setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const classes = ["code-block"];
  classes.push(light ? "code-block--light" : "code-block--dark");
  if (wrap) classes.push("code-block--wrap");
  if (!lineNumbers) classes.push("code-block--no-lines");
  if (className) classes.push(className);

  return (
    <div className={classes.join(" ")}>
      <div className="code-block-toolbar">
        {showLabel && (
          <span className="code-block-label">
            {label ?? languageLabel(resolved)}
          </span>
        )}
        <div className="code-block-actions">
          <AppTooltip title={t("codeBlock.toggleLines")} arrow>
            <IconButton
              size="small"
              className={lineNumbers ? "code-block-action is-active" : "code-block-action"}
              aria-label={t("codeBlock.toggleLines")}
              aria-pressed={lineNumbers}
              onClick={() => setLineNumbers((value) => !value)}
            >
              <FormatListNumberedRounded fontSize="small" />
            </IconButton>
          </AppTooltip>
          <AppTooltip title={light ? t("codeBlock.darkMode") : t("codeBlock.lightMode")} arrow>
            <IconButton
              size="small"
              className="code-block-action"
              aria-label={light ? t("codeBlock.darkMode") : t("codeBlock.lightMode")}
              onClick={() => setLight((value) => !value)}
            >
              {light ? (
                <DarkModeRounded fontSize="small" />
              ) : (
                <LightModeRounded fontSize="small" />
              )}
            </IconButton>
          </AppTooltip>
          <AppTooltip title={copied ? t("codeBlock.copied") : t("codeBlock.copy")} arrow>
            <IconButton
              size="small"
              className={copied ? "code-block-action is-active" : "code-block-action"}
              aria-label={copied ? t("codeBlock.copied") : t("codeBlock.copy")}
              onClick={() => void copy()}
            >
              {copied ? (
                <CheckRounded fontSize="small" />
              ) : (
                <ContentCopyRounded fontSize="small" />
              )}
            </IconButton>
          </AppTooltip>
        </div>
      </div>
      <Highlight code={content} language={resolved} theme={theme}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="code-block-pre" style={theme.plain}>
            <code className="code-block-code">
              {tokens.map((line, index) => {
                const lineProps = getLineProps({ line });
                return (
                  <span
                    key={index}
                    {...lineProps}
                    className={`code-block-line ${lineProps.className ?? ""}`.trim()}
                  >
                    {lineNumbers && (
                      <span className="code-block-lineno" aria-hidden="true">
                        {index + 1}
                      </span>
                    )}
                    <span className="code-block-text">
                      {line.map((token, tokenIndex) => {
                        const tokenProps = getTokenProps({ token });
                        return (
                          <span
                            key={tokenIndex}
                            {...tokenProps}
                            className={tokenProps.className}
                          />
                        );
                      })}
                    </span>
                  </span>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}
