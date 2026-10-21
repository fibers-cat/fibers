/**
 * Copies text to the clipboard.
 *
 * The async Clipboard API is only available in secure contexts, so there is a
 * fallback for `http://` origins and older browsers.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Falls back to the legacy command below.
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    // `execCommand` is deprecated but still the only option outside secure
    // contexts, so the legacy signature is used on purpose.
    const legacy = document as unknown as {
      execCommand: (commandId: string) => boolean;
    };
    const copied = legacy.execCommand("copy");
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}
