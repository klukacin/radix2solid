import { dynamic } from "@solidjs/web";

// Conditional title templates are HTML; the native factory preserves the SVG namespace.
export const IconTitle = dynamic(() => "title", { static: true });
