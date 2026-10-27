/* =====================================================================
   Syncfusion Rich Text Editor wrapper — used in the Knowledge authoring
   drawer. The Syncfusion RTE is heavy; it is lazy-loaded by the page.
   ===================================================================== */

import { HtmlEditor, Image, Inject, Link, QuickToolbar, RichTextEditorComponent, Toolbar } from "@syncfusion/ej2-react-richtexteditor";
import { useTheme } from "@/components/shell/ThemeContext";

interface Props {
  value?: string;
  onChange?: (html: string) => void;
}

export function SfRte({ value = "", onChange }: Props) {
  const { theme } = useTheme();
  return (
    <div className="sf-host">
      <RichTextEditorComponent
        id="sf-rte"
        height={320}
        value={value}
        {...({ theme: theme === "dark" ? "Tailwind3Dark" : "Tailwind3" } as Record<string, unknown>)}
        change={(e: { value?: string }) => onChange?.(e.value ?? "")}
        toolbarSettings={{
          items: ["Bold", "Italic", "Underline", "StrikeThrough", "|" , "Formats", "Alignments", "OrderedList", "UnorderedList", "|" , "CreateLink", "Image", "|" , "SourceCode", "Undo", "Redo"],
        }}
      >
        <Inject services={[Toolbar, Link, Image, HtmlEditor, QuickToolbar]} />
      </RichTextEditorComponent>
    </div>
  );
}
