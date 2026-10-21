import { hydrate, render } from '@solidjs/web';
import { Composition, SecondRoot } from './composition.js';

const first = document.getElementById('root-a');
const second = document.getElementById('root-b');
const initiallyOpenDatePicker = document.documentElement.dataset.datePickerInitiallyOpen === 'true';
if (!first || !second) throw new Error('Gallery requires both root containers.');
if (document.documentElement.dataset.renderMode === 'csr') {
  render(() => <Composition initiallyOpenDatePicker={initiallyOpenDatePicker} />, first, undefined, { renderId: 'a-' });
  render(() => <SecondRoot />, second, undefined, { renderId: 'b-' });
} else {
  hydrate(() => <Composition initiallyOpenDatePicker={initiallyOpenDatePicker} />, first, { renderId: 'a-' });
  hydrate(() => <SecondRoot />, second, { renderId: 'b-' });
}
