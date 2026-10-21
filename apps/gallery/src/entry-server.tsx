import { escape, generateHydrationScript, renderToString } from "@solidjs/web";

import { Composition, SecondRoot } from "./composition.js";

export function renderPage(
  nonce: string,
  clientEntry = "/src/entry-client.tsx",
  mode: "ssr" | "csr" = "ssr",
  stylesheets?: readonly string[],
  initiallyOpenDatePicker = false,
): string {
  const first =
    mode === "ssr"
      ? renderToString(
          () => (
            <Composition initiallyOpenDatePicker={initiallyOpenDatePicker} />
          ),
          { renderId: "a-", nonce },
        )
      : "";
  const second =
    mode === "ssr"
      ? renderToString(() => <SecondRoot />, { renderId: "b-", nonce })
      : "";
  const bootstrap = mode === "ssr" ? generateHydrationScript({ nonce }) : "";
  const styles =
    stylesheets
      ?.map((href) => `<link rel="stylesheet" href="${escape(href, true)}">`)
      .join("") ?? "";
  return `<!doctype html><html lang="en" data-render-mode="${mode}" data-date-picker-initially-open="${initiallyOpenDatePicker}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Native Solid 2 composition</title><style>body{font:16px system-ui;max-width:900px;margin:2rem auto;padding:0 1rem}section{margin:1rem 0;padding:1rem;border:1px solid #888;border-radius:8px}button,a,output{margin:4px}output{display:block}button{padding:8px}</style>${styles}${bootstrap}</head><body><div id="root-a">${first}</div><div id="root-b">${second}</div><script type="module" nonce="${nonce}" src="${clientEntry}"></script></body></html>`;
}
