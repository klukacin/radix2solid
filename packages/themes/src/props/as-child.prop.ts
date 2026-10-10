import type { PropDef } from './prop-def.js';

const asChildPropDef = {
  /**
   * Composes the component into its immediate child instead of rendering its own HTML element.
   * Provide a single-target native Slot render function.
   */
  asChild: {
    type: 'boolean',
  },
} satisfies {
  asChild: PropDef<boolean>;
};

export { asChildPropDef };
