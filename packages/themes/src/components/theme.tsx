import { createContext, createSignal, createEffect, merge, omit, untrack, useContext, type Element } from 'solid-js';
import { isServer, type ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@wsagency/radix2solid-primitives/internal';
import { DirectionProvider } from '@wsagency/radix2solid-primitives/direction';
import { TooltipProvider } from '@wsagency/radix2solid-primitives/tooltip';
import { getMatchingGrayColor } from '../helpers/get-matching-gray-color.js';
import type { ComposedProps } from '../helpers/component-props.js';
import { themePropDefs } from './theme.props.js';
import type { ThemeOwnProps } from './theme.props.js';

type ThemeSettings = Required<Pick<ThemeOwnProps, 'appearance' | 'accentColor' | 'grayColor' | 'panelBackground' | 'radius' | 'scaling'>>;
interface ThemeChangeHandlers {
  onAppearanceChange: (value: ThemeSettings['appearance']) => void;
  onAccentColorChange: (value: ThemeSettings['accentColor']) => void;
  onGrayColorChange: (value: ThemeSettings['grayColor']) => void;
  onPanelBackgroundChange: (value: ThemeSettings['panelBackground']) => void;
  onRadiusChange: (value: ThemeSettings['radius']) => void;
  onScalingChange: (value: ThemeSettings['scaling']) => void;
}
export interface ThemeContextValue extends ThemeSettings, ThemeChangeHandlers {
  resolvedGrayColor: ThemeSettings['grayColor'];
}
export type ThemeProps = ComposedProps<Omit<ComponentProps<'div'>, 'dir' | 'color'> & ThemeOwnProps>;
export const ThemeContext = createContext<ThemeContextValue | null>(null);
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('`useThemeContext` must be used within a `Theme`');
  return context;
}

export function Theme(props: ThemeProps): Element {
  return useContext(ThemeContext) ? <ThemeImpl {...props} /> :
    <TooltipProvider delayDuration={200}><DirectionProvider dir="ltr"><ThemeRoot {...props} /></DirectionProvider></TooltipProvider>;
}

function ThemeRoot(props: ThemeProps): Element {
  const [appearance, setAppearance] = createSignal(untrack(() => props.appearance ?? themePropDefs.appearance.default));
  const [accentColor, setAccentColor] = createSignal(untrack(() => props.accentColor ?? themePropDefs.accentColor.default));
  const [grayColor, setGrayColor] = createSignal(untrack(() => props.grayColor ?? themePropDefs.grayColor.default));
  const [panelBackground, setPanelBackground] = createSignal(untrack(() => props.panelBackground ?? themePropDefs.panelBackground.default));
  const [radius, setRadius] = createSignal(untrack(() => props.radius ?? themePropDefs.radius.default));
  const [scaling, setScaling] = createSignal(untrack(() => props.scaling ?? themePropDefs.scaling.default));
  if (!isServer) {
    createEffect(() => props.appearance ?? themePropDefs.appearance.default, value => { setAppearance(value); }, { transparent: true });
    createEffect(() => props.accentColor ?? themePropDefs.accentColor.default, value => { setAccentColor(value); }, { transparent: true });
    createEffect(() => props.grayColor ?? themePropDefs.grayColor.default, value => { setGrayColor(value); }, { transparent: true });
    createEffect(() => props.panelBackground ?? themePropDefs.panelBackground.default, value => { setPanelBackground(value); }, { transparent: true });
    createEffect(() => props.radius ?? themePropDefs.radius.default, value => { setRadius(value); }, { transparent: true });
    createEffect(() => props.scaling ?? themePropDefs.scaling.default, value => { setScaling(value); }, { transparent: true });
  }
  const forwarded = merge(omit(props, 'appearance', 'accentColor', 'grayColor', 'panelBackground', 'radius', 'scaling'), {
    isRoot: true,
    get appearance() { return appearance(); }, get accentColor() { return accentColor(); }, get grayColor() { return grayColor(); },
    get panelBackground() { return panelBackground(); }, get radius() { return radius(); }, get scaling() { return scaling(); },
    onAppearanceChange: setAppearance, onAccentColorChange: setAccentColor, onGrayColorChange: setGrayColor,
    onPanelBackgroundChange: setPanelBackground, onRadiusChange: setRadius, onScalingChange: setScaling
  });
  return <ThemeImpl {...forwarded} />;
}

// Nested Themes are read-only settings views, matching upstream; ThemePanel passes the captured root context.
const readOnlyChange = () => {};
type ThemeImplProps = ThemeProps & Partial<ThemeChangeHandlers> & { isRoot?: boolean };
function ThemeImpl(props: ThemeImplProps): Element {
  const parent = useContext(ThemeContext);
  const context: ThemeContextValue = {
    get appearance() { return props.appearance ?? parent?.appearance ?? themePropDefs.appearance.default; },
    get accentColor() { return props.accentColor ?? parent?.accentColor ?? themePropDefs.accentColor.default; },
    get grayColor() { return props.grayColor ?? parent?.resolvedGrayColor ?? themePropDefs.grayColor.default; },
    get resolvedGrayColor() { return context.grayColor === 'auto' ? getMatchingGrayColor(context.accentColor) : context.grayColor; },
    get panelBackground() { return props.panelBackground ?? parent?.panelBackground ?? themePropDefs.panelBackground.default; },
    get radius() { return props.radius ?? parent?.radius ?? themePropDefs.radius.default; },
    get scaling() { return props.scaling ?? parent?.scaling ?? themePropDefs.scaling.default; },
    get onAppearanceChange() { return props.onAppearanceChange ?? readOnlyChange; },
    get onAccentColorChange() { return props.onAccentColorChange ?? readOnlyChange; },
    get onGrayColorChange() { return props.onGrayColorChange ?? readOnlyChange; },
    get onPanelBackgroundChange() { return props.onPanelBackgroundChange ?? readOnlyChange; },
    get onRadiusChange() { return props.onRadiusChange ?? readOnlyChange; },
    get onScalingChange() { return props.onScalingChange ?? readOnlyChange; }
  };
  const forwarded = merge({
    as: 'div' as const,
    get ['data-is-root-theme']() { return props.isRoot ? 'true' : 'false'; },
    get ['data-accent-color']() { return context.accentColor; }, get ['data-gray-color']() { return context.resolvedGrayColor; },
    get ['data-has-background']() { return (props.hasBackground ?? (props.isRoot || props.appearance === 'light' || props.appearance === 'dark')) ? 'true' : 'false'; },
    get ['data-panel-background']() { return context.panelBackground; }, get ['data-radius']() { return context.radius; },
    get ['data-scaling']() { return context.scaling; }
  }, omit(props, 'isRoot', 'hasBackground', 'appearance', 'accentColor', 'grayColor', 'panelBackground', 'radius', 'scaling',
    'onAppearanceChange', 'onAccentColorChange', 'onGrayColorChange', 'onPanelBackgroundChange', 'onRadiusChange', 'onScalingChange'), {
    get class() { return ['radix-themes', { light: context.appearance === 'light', dark: context.appearance === 'dark' }, props.class]; }
  });
  return <ThemeContext value={context}><Primitive {...forwarded as PrimitiveProps<'div'>} /></ThemeContext>;
}
