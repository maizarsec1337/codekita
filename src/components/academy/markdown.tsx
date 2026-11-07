import { Fragment, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export const headingId = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export function tableOfContents(content: string) {
  // Strip fences so headings inside examples do not become navigation items.
  return content.replace(/```[^\n]*\n[\s\S]*?```/g, "").split("\n").filter((line) => /^##?\s/.test(line)).map((line, index) => ({ title: line.replace(/^#+\s/, ""), id: `${headingId(line.replace(/^#+\s/, ""))}-${index}` }));
}
function inline(text: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith("`") ? <code key={index} className="rounded bg-accent px-1.5 py-0.5 font-mono text-[.85em] text-codekita-secondary">{part.slice(1, -1)}</code> : part.startsWith("**") ? <strong className="font-semibold text-foreground" key={index}>{part.slice(2, -2)}</strong> : <Fragment key={index}>{part}</Fragment>);
}
function highlight(code: string) {
  // React text nodes only: never evaluate code or inject HTML from curriculum.
  return code.split(/("[^"\n]*"|'[^'\n]*'|\/\/[^\n]*|#[^\n]*|\b(?:const|let|function|return|if|else|import|from|def|class|for|in|true|false|null)\b|\b\d+(?:\.\d+)?\b)/g).map((part, index) => <span key={index} className={/^["']/.test(part) ? "text-primary" : /^(\/\/|#)/.test(part) ? "text-muted-foreground" : /^(const|let|function|return|if|else|import|from|def|class|for|in|true|false|null)$/.test(part) ? "text-codekita-purple" : /^\d/.test(part) ? "text-codekita-secondary" : undefined}>{part}</span>);
}
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [message, setMessage] = useState("");
  return <div className="my-6 min-w-0 overflow-hidden rounded-xl border border-border bg-background"><div className="flex items-center justify-between border-b border-border px-4 py-2"><span className="font-mono text-[10px] text-muted-foreground">{language || "code"}</span><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { void navigator.clipboard.writeText(code).then(() => setMessage("Copied"), () => setMessage("Copy unavailable")); }}>{message === "Copied" ? <Check size={13} /> : <Copy size={13} />}<span className="ml-2" aria-live="polite">{message || "Copy"}</span></Button></div><pre className="overflow-x-auto p-5 font-mono text-xs leading-7 text-foreground"><code>{highlight(code)}</code></pre></div>;
}
// Deliberately limited Markdown dialect: headings, paragraphs, lists, tables, fenced code.
// Raw HTML, arbitrary URLs, images, and scripts are rendered as text, never injected.
export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n"), blocks: React.ReactNode[] = [];
  let heading = 0;
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    if (line.startsWith("```")) {
      const language = line.slice(3).trim(), code: string[] = []; index++;
      while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
      index++; blocks.push(<CodeBlock key={index} language={language} code={code.join("\n")} />); continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      const title = line.replace(/^#+\s/, "");
      const major = /^##?\s/.test(line);
      blocks.push(major ? <h2 key={index} id={`${headingId(title)}-${heading++}`}>{inline(title)}</h2> : <h3 key={index}>{inline(title)}</h3>); index++; continue;
    }
    if (line.startsWith("|") && lines[index + 1]?.match(/^\|[\s:|-]+\|$/)) {
      const cells = (row: string) => row.split("|").slice(1, -1).map((cell) => cell.trim());
      const headers = cells(line), rows: string[][] = []; index += 2;
      while (index < lines.length && lines[index].startsWith("|")) rows.push(cells(lines[index++]));
      blocks.push(<div className="overflow-x-auto rounded-lg border border-border" key={index}><table className="w-full text-left text-sm"><thead className="bg-accent text-foreground"><tr>{headers.map((cell, cellIndex) => <th scope="col" className="px-4 py-2" key={cellIndex}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr className="border-t border-border" key={rowIndex}>{row.map((cell, cellIndex) => <td className="px-4 py-2" key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>); continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s/.test(lines[index])) items.push(lines[index++].slice(2));
      blocks.push(<ul key={index} className="list-disc space-y-2 pl-5">{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ul>); continue;
    }
    const paragraph: string[] = [line]; index++;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3}\s|```|\||[-*]\s)/.test(lines[index])) paragraph.push(lines[index++]);
    blocks.push(<p key={index}>{inline(paragraph.join(" "))}</p>);
  }
  return <div className="lesson-content">{blocks}</div>;
}