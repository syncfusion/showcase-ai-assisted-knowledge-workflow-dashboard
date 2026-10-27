/* =====================================================================
   Tiny markdown-to-HTML helper for article bodies. The fixture's bodies are
   written in a small, predictable subset of markdown — headings, paragraphs,
   bullet lists, and bold inline runs — so we render them directly rather
   than pulling in a full library and its 50 KB of JavaScript. The output is
   sanitised for the only inline marks this corpus actually uses: `**` and
   nothing else, so a stray angle bracket cannot reach the DOM.
   ===================================================================== */

const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (m) => ESCAPE[m] ?? m);

/** Replace **bold** spans with <strong>, the only inline mark used. */
function inline(s: string): string {
  const escaped = escapeHtml(s);
  return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function renderMarkdown(md: string): string {
  const lines = escapeHtml(md).split(/\r?\n/);
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      // Ordered list — use the same <ul> with style for simplicity.
      if (!inList) {
        out.push('<ul style="list-style: decimal; padding-left: 22px">');
        inList = true;
      }
      out.push(`<li>${inline(line.replace(/^\d+\.\s/, ""))}</li>`);
      continue;
    }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join("\n");
}