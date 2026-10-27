/* =====================================================================
   SfTextBox — thin wrapper around Syncfusion TextBoxComponent.
   Used for the global header search and other single-line inputs.
   ===================================================================== */

import { TextBoxComponent } from "@syncfusion/ej2-react-inputs";
import type { ChangeEventHandler } from "react";

interface SfTextBoxProps {
  id?: string;
  value?: string;
  placeholder?: string;
  ariaLabel?: string;
  cssClass?: string;
  floatLabelType?: "Auto" | "Always" | "Never";
  showClearButton?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  htmlAttributes?: Record<string, string>;
}

export function SfTextBox({
  id,
  value,
  placeholder,
  ariaLabel,
  cssClass = "sf-textbox",
  showClearButton = true,
  onChange,
  htmlAttributes,
}: SfTextBoxProps) {
  // The React wrapper exposes `cssClass` at runtime but the strict TS
  // declaration file in 35.1.37 omits it. Cast to keep call-sites tidy.
  const tbProps = {
    id,
    value,
    placeholder,
    cssClass,
    showClearButton,
    onChange,
    htmlAttributes: {
      ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      ...(htmlAttributes ?? {}),
    },
  } as unknown as React.ComponentProps<typeof TextBoxComponent>;

  return <TextBoxComponent {...tbProps} />;
}
