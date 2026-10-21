import autoprefixer from "autoprefixer";
import postcssCombineDuplicatedSelectors from "postcss-combine-duplicated-selectors";
import postcssCustomMedia from "postcss-custom-media";
import postcssDiscardEmpty from "postcss-discard-empty";
import postcssImport from "postcss-import";
import postcssNesting from "postcss-nesting";

import postcssBreakpoints from "./postcss-breakpoints.js";
import postcssWhitespace from "./postcss-whitespace.js";

export default {
  plugins: [
    postcssImport(),
    postcssNesting(),
    postcssBreakpoints(),
    postcssCustomMedia(),
    postcssCombineDuplicatedSelectors(),
    postcssDiscardEmpty(),
    postcssWhitespace(),
    autoprefixer(),
  ],
};
