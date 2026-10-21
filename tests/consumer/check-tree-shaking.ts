import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

import solid from "@solidjs/vite-plugin";
import { build } from "vite";

const fixture = await mkdtemp(resolve(process.cwd(), "selective-import-"));
const iconNames: Record<string, string> = JSON.parse(
  await readFile(new URL("./icons.json", import.meta.url), "utf8"),
);
const unrelatedIcons = new Set(
  Object.keys(iconNames)
    .filter((name) => name !== "CheckIcon")
    .map((name) => `${name}.js`),
);
const unrelatedEngine = (id: string) =>
  /\/radix2solid-primitives\/dist\/client\/(?:accordion|alert-dialog|announce|avatar|calendar|checkbox|collapsible|collection|context-menu|date-picker|dialog|dismissable-layer|dropdown-menu|file-drop|focus-guards|focus-scope|form|hover-card|menu|menubar|navigation-menu|one-time-password-field|overlay|password-toggle-field|pointer-grace|popover|popper|portal|presence|radio-group|roving-focus|scroll-area|scroll-lock|select|slider|switch|tabs|toast|toggle-group|toolbar|tooltip)(?:-[^/]+)?\.js$/.test(
    id,
  ) || id.includes("@floating-ui/");
// Root Theme renders TooltipProvider, whose scope initialization also retains Popper contexts.
const requiredThemeContext = (id: string) =>
  /\/radix2solid-primitives\/dist\/client\/(?:tooltip|popper)(?:-[^/]+)?\.js$/.test(
    id,
  );
// Match Calendar's content-hashed implementation and the focus helper it intentionally shares.
const requiredCalendarModule =
  /\/radix2solid-primitives\/dist\/client\/(?:calendar(?:-[^/]+)?|focus-scope(?:-[^/]+)?)\.js$/;
const calendarImplementation =
  /\/radix2solid-primitives\/dist\/client\/calendar-[^/]+\.js$/;
const datePickerImplementation =
  /\/radix2solid-primitives\/dist\/client\/date-picker-[^/]+\.js$/;
const fileDropFamilyModule =
  /\/radix2solid-primitives\/dist\/client\/file-drop(?:-[^/]+)?\.js$/;
const requiredFileDropImplementation =
  /\/radix2solid-primitives\/dist\/client\/file-drop-[^/]+\.js$/;
const requiredFileDropFormValidity =
  /\/radix2solid-primitives\/dist\/client\/form-validity(?:-[^/]+)?\.js$/;
const scenes = [
  {
    name: "Toggle",
    source:
      "import { Toggle } from '@wsagency/radix2solid-primitives'; const Scene = () => <Toggle.Root>Bold</Toggle.Root>;",
    required: "/radix2solid-primitives/dist/client/toggle.js",
    excluded: unrelatedEngine,
  },
  {
    name: "CheckIcon",
    source:
      "import { CheckIcon } from '@wsagency/radix2solid-icons'; const Scene = () => <CheckIcon title='Saved' />;",
    required: "/radix2solid-icons/dist/client/CheckIcon.js",
    excluded: (id: string) =>
      unrelatedEngine(id) ||
      (id.includes("/radix2solid-icons/dist/client/") &&
        unrelatedIcons.has(id.slice(id.lastIndexOf("/") + 1))),
  },
  ...[
    "@wsagency/radix2solid-icons-extra",
    "@wsagency/radix2solid-icons-extra/FolderIcon",
  ].map((module) => ({
    name: module.endsWith("/FolderIcon")
      ? "FolderIcon/deep"
      : "FolderIcon/root",
    css: false,
    source: `import { FolderIcon } from '${module}'; const Scene = () => <FolderIcon title='Folder' />;`,
    required: "/radix2solid-icons-extra/dist/client/FolderIcon.js",
    excluded: (id: string) =>
      unrelatedEngine(id) ||
      id.includes("/radix2solid-icons/") ||
      /\/radix2solid-icons-extra\/dist\/client\/FolderOpenIcon\.js$/.test(id),
  })),
  {
    name: "Theme/Button",
    source:
      "import { Theme, Button } from '@wsagency/radix2solid-themes'; import '@wsagency/radix2solid-themes/styles.css'; const Scene = () => <Theme><Button>Save</Button></Theme>;",
    required: "/radix2solid-themes/dist/client/components/button.js",
    excluded: (id: string) =>
      (unrelatedEngine(id) && !requiredThemeContext(id)) ||
      /\/radix2solid-themes\/dist\/client\/components\/(?:dialog|select|slider|table|checkbox|theme-panel|scroll-area)(?:-[^/]+)?\.js$/.test(
        id,
      ),
    css: true,
  },
  {
    name: "Calendar",
    source: `import * as Calendar from '@wsagency/radix2solid-primitives/calendar';
      const Scene = () => <Calendar.Root today="2026-10-18" defaultViewMonth="2026-10">
        <Calendar.Header>
          <Calendar.PrevTrigger aria-label="Previous month" />
          <Calendar.Heading />
          <Calendar.NextTrigger aria-label="Next month" />
        </Calendar.Header>
        <Calendar.Grid>{state => <>
          <Calendar.Row>{state.weekdays.map(weekday => <Calendar.HeaderCell weekday={weekday.index}>{weekday.shortLabel}</Calendar.HeaderCell>)}</Calendar.Row>
          {state.weeks.map(week => <Calendar.Row>{week.map(day => day && <Calendar.Cell date={day.date}><Calendar.Day date={day.date} /></Calendar.Cell>)}</Calendar.Row>)}
        </>}</Calendar.Grid>
      </Calendar.Root>;`,
    required: calendarImplementation,
    excluded: (id: string) =>
      unrelatedEngine(id) && !requiredCalendarModule.test(id),
  },
  {
    name: "FileDrop",
    source: `import * as FileDrop from '@wsagency/radix2solid-primitives/file-drop';
      const Scene = () => <FileDrop.Root name="attachments" accept=".txt" required>
        <label for="consumer-file-drop">Attachments</label>
        <FileDrop.Input id="consumer-file-drop" />
        <FileDrop.Trigger>Browse files</FileDrop.Trigger>
      </FileDrop.Root>;`,
    required: requiredFileDropImplementation,
    excluded: (id: string) =>
      (unrelatedEngine(id) &&
        !fileDropFamilyModule.test(id) &&
        !requiredFileDropFormValidity.test(id)) ||
      calendarImplementation.test(id) ||
      datePickerImplementation.test(id),
  },
];
try {
  await writeFile(
    resolve(fixture, "index.html"),
    '<!doctype html><html><body><div id="root"></div><script type="module" src="/entry.tsx"></script></body></html>',
  );
  for (const scene of scenes) {
    const hasCss = "css" in scene && scene.css;
    await writeFile(
      resolve(fixture, "entry.tsx"),
      `import { render } from '@solidjs/web'; ${scene.source} render(() => <Scene />, document.getElementById('root')!);`,
    );
    await build({
      root: fixture,
      configFile: false,
      plugins: [
        solid({ ssr: true }),
        {
          name: "selective-native-consumer",
          generateBundle(_options, bundle) {
            const chunks = Object.values(bundle).filter(
              (output) => output.type === "chunk",
            );
            const rendered = chunks.flatMap((chunk) =>
              Object.entries(chunk.modules)
                .filter(([, module]) => module.renderedLength > 0)
                .map(([id]) => id),
            );
            const required = scene.required;
            assert(
              rendered.some((id) =>
                typeof required === "string"
                  ? id.endsWith(required)
                  : required.test(id),
              ),
              `${scene.name}: expected native implementation missing`,
            );
            assert.deepEqual(
              rendered.filter(scene.excluded),
              [],
              `${scene.name}: unrelated native implementations survived tree shaking`,
            );
            assert(
              !rendered.some(
                (id) =>
                  /\/node_modules\/(?:react|react-dom)(?:\/|$)/.test(id) ||
                  id.includes("/upstream/"),
              ),
              `${scene.name}: non-native runtime/source entered bundle`,
            );
            if (hasCss)
              assert(
                Object.values(bundle).some(
                  (output) =>
                    output.type === "asset" && output.fileName.endsWith(".css"),
                ),
                "Theme/Button: explicit CSS import was dropped",
              );
            console.log(
              `${scene.name}: ${chunks.reduce((sum, chunk) => sum + Buffer.byteLength(chunk.code), 0)} consumer JS bytes including runtime; selective implementations retained, unrelated widgets removed${hasCss ? ", CSS retained" : ""}.`,
            );
          },
        },
      ],
      build: { outDir: `dist-${scene.name.replace("/", "-")}` },
      logLevel: "warn",
    });
  }
} finally {
  await rm(fixture, { recursive: true, force: true });
}
