import solidV2Strict from "eslint-plugin-solid/configs/v2-strict";
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["eslint-plugin-solid"],
  settings: solidV2Strict.settings,
  rules: {
    ...solidV2Strict.rules,
    "solid/reactivity": [
      "warn",
      {
        customReactiveFunctions: [
          "composeEventHandlers",
          "registerInStore",
          "createChartEffect",
        ],
      },
    ],
  },
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: "error",
  },
  overrides: [
    {
      files: ["tests/consumer/types.tsx"],
      rules: {
        "no-unused-expressions": "off",
      },
    },
  ],
});
