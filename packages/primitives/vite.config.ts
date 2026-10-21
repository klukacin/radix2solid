import { resolve } from "node:path";

import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [solid({ ssr: true })],
  build: {
    outDir: isSsrBuild ? "dist/server" : "dist/client",
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        slot: resolve(import.meta.dirname, "src/slot/index.ts"),
        toggle: resolve(import.meta.dirname, "src/toggle/index.ts"),
        direction: resolve(import.meta.dirname, "src/direction/index.ts"),
        portal: resolve(import.meta.dirname, "src/portal/index.ts"),
        "visually-hidden": resolve(
          import.meta.dirname,
          "src/visually-hidden/index.ts",
        ),
        arrow: resolve(import.meta.dirname, "src/arrow/index.ts"),
        dialog: resolve(import.meta.dirname, "src/dialog/index.ts"),
        popover: resolve(import.meta.dirname, "src/popover/index.ts"),
        "alert-dialog": resolve(
          import.meta.dirname,
          "src/alert-dialog/index.ts",
        ),
        "hover-card": resolve(import.meta.dirname, "src/hover-card/index.ts"),
        tooltip: resolve(import.meta.dirname, "src/tooltip/index.ts"),
        "dropdown-menu": resolve(
          import.meta.dirname,
          "src/dropdown-menu/index.ts",
        ),
        "context-menu": resolve(
          import.meta.dirname,
          "src/context-menu/index.ts",
        ),
        menubar: resolve(import.meta.dirname, "src/menubar/index.ts"),
        "navigation-menu": resolve(
          import.meta.dirname,
          "src/navigation-menu/index.ts",
        ),
        select: resolve(import.meta.dirname, "src/select/index.ts"),
        combobox: resolve(import.meta.dirname, "src/combobox/index.ts"),
        command: resolve(import.meta.dirname, "src/command/index.ts"),
        tree: resolve(import.meta.dirname, "src/tree/index.ts"),
        splitter: resolve(import.meta.dirname, "src/splitter/index.ts"),
        "password-toggle-field": resolve(
          import.meta.dirname,
          "src/password-toggle-field/index.ts",
        ),
        "one-time-password-field": resolve(
          import.meta.dirname,
          "src/one-time-password-field/index.ts",
        ),
        slider: resolve(import.meta.dirname, "src/slider/index.ts"),
        "scroll-area": resolve(import.meta.dirname, "src/scroll-area/index.ts"),
        form: resolve(import.meta.dirname, "src/form/index.ts"),
        calendar: resolve(import.meta.dirname, "src/calendar/index.ts"),
        "date-picker": resolve(import.meta.dirname, "src/date-picker/index.ts"),
        "file-drop": resolve(import.meta.dirname, "src/file-drop/index.ts"),
        toast: resolve(import.meta.dirname, "src/toast/index.ts"),
        "accessible-icon": resolve(
          import.meta.dirname,
          "src/accessible-icon/index.ts",
        ),
        "aspect-ratio": resolve(
          import.meta.dirname,
          "src/aspect-ratio/index.ts",
        ),
        label: resolve(import.meta.dirname, "src/label/index.ts"),
        progress: resolve(import.meta.dirname, "src/progress/index.ts"),
        separator: resolve(import.meta.dirname, "src/separator/index.ts"),
        avatar: resolve(import.meta.dirname, "src/avatar/index.ts"),
        announce: resolve(import.meta.dirname, "src/announce/index.ts"),
        collapsible: resolve(import.meta.dirname, "src/collapsible/index.ts"),
        accordion: resolve(import.meta.dirname, "src/accordion/index.ts"),
        checkbox: resolve(import.meta.dirname, "src/checkbox/index.ts"),
        switch: resolve(import.meta.dirname, "src/switch/index.ts"),
        "radio-group": resolve(import.meta.dirname, "src/radio-group/index.ts"),
        tabs: resolve(import.meta.dirname, "src/tabs/index.ts"),
        "toggle-group": resolve(
          import.meta.dirname,
          "src/toggle-group/index.ts",
        ),
        toolbar: resolve(import.meta.dirname, "src/toolbar/index.ts"),
        internal: resolve(import.meta.dirname, "src/internal/index.ts"),
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    minify: false,
    rolldownOptions: {
      external: [/^solid-js(?:\/|$)/, /^@solidjs\//, /^@floating-ui\//],
    },
  },
}));
