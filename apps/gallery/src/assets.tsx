import { createSignal, type Element } from 'solid-js';
import { AccessibilityIcon, CheckIcon, SlashIcon, SketchLogoIcon, PanelLeftIcon, PanelRightIcon } from '@wsagency/radix2solid-icons';
import svgDownload from '@wsagency/radix2solid-icons/icons/accessibility.svg?url';
import { blue, blueDark, blueA, blueDarkA, blueP3, blueDarkP3 } from '@radix-ui/colors';
import '@radix-ui/colors/blue.css';
import '@radix-ui/colors/blue-dark.css';
import '@radix-ui/colors/blue-alpha.css';
import '@radix-ui/colors/blue-dark-alpha.css';

export function Assets(): Element {
  const [large, setLarge] = createSignal(false), [named, setNamed] = createSignal(true);
  const [reference, setReference] = createSignal('unmounted');
  return <section aria-label="Native icons and reused Colors">
    <h2>Icons and Colors</h2>
    <button onClick={() => setLarge(value => !value)}>Change icon size and color</button>
    <button onClick={() => setNamed(value => !value)}>Change icon accessible title</button>
    <div style={{ color: 'rgb(12, 34, 56)' }}>
      <AccessibilityIcon id="asset-accessibility" size={large() ? 32 : 15} color={large() ? 'tomato' : undefined}
        title={named() ? 'Accessible person' : undefined} ref={node => setReference(node?.localName ?? 'unmounted')} />
      <CheckIcon id="asset-check" size={40} width={23} height={19} aria-label="Completed" />
      <SlashIcon id="asset-slash" stroke="purple" />
      <SketchLogoIcon id="asset-logo" title="Sketch logo" />
      <PanelLeftIcon id="asset-panel-left" /><PanelRightIcon id="asset-panel-right" />
    </div>
    <output id="asset-ref">{reference()}</output>
    <a href={svgDownload} download="accessibility.svg">Download original Accessibility SVG</a>
    <div class="light" id="asset-light" style={{ background: 'var(--blue-2)', color: 'var(--blue-12)' }}>Light blue</div>
    <div class="dark" id="asset-dark" style={{ background: 'var(--blue-2)', color: 'var(--blue-12)' }}>Dark blue</div>
    <output id="asset-color-exports">{JSON.stringify({ light: blue.blue2, dark: blueDark.blue2, alpha: blueA.blueA3, darkAlpha: blueDarkA.blueA3, p3: blueP3.blue2, darkP3: blueDarkP3.blue2 })}</output>
  </section>;
}
