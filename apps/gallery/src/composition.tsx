import { createContext, createRoot, createSignal, createUniqueId, onSettled, Show, useContext, type Element } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { Dialog, Slot, Toggle } from '@wsagency/radix2solid-primitives';
import { Layers, IndependentLayers } from './layers.js';
import { Controls } from './controls.js';
import { Menus } from './menus.js';
import { Selects } from './select.js';
import { Advanced } from './advanced.js';
import { Assets } from './assets.js';
import { Themes } from './themes.js';
import { ThemeInteractions } from './theme-interactions.js';
import { ThemeExtensions } from './theme-extensions.js';
import { Charts } from './charts.js';

function CustomLink(props: JSX.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a data-custom-target="true" {...props} />;
}

const SlotDialogContext = createContext('outside');
function SlotDialogTarget(props: JSX.HTMLAttributes<HTMLElement>): Element {
  return <SlotDialogContext value="inside"><section data-slot-custom-dialog {...props} /></SlotDialogContext>;
}
function SlotDialogChildren(): Element {
  const context = useContext(SlotDialogContext);
  const id = createUniqueId();
  return <>
    <Dialog.Title>Hydrated custom slot title</Dialog.Title>
    <Dialog.Description>Hydrated custom slot description</Dialog.Description>
    <span id={id} data-slot-context>{context}</span>
  </>;
}

type RefConsumer = 'plain' | 'parent' | 'child' | 'dialog';

function RefComposition(): Element {
  const [calls, setCalls] = createSignal({ plain: 0, parent: 0, child: 0, dialog: 0 });
  const count = (name: RefConsumer) => (_element: HTMLButtonElement) => {
    setCalls(previous => ({ ...previous, [name]: previous[name] + 1 }));
  };
  const [replacementCalls, setReplacementCalls] = createSignal({ plain: 0, parent: 0, child: 0, dialog: 0 });
  const replacement = (name: RefConsumer) => (element: HTMLButtonElement) => {
    element.setAttribute(`data-${name}-ref-consumer`, 'replacement');
    setReplacementCalls(previous => ({ ...previous, [name]: previous[name] + 1 }));
  };
  const [plainRef, setPlainRef] = createSignal(() => count('plain'));
  const [parentRef, setParentRef] = createSignal(() => count('parent'));
  const [childRef, setChildRef] = createSignal<JSX.Ref<HTMLButtonElement>>([count('child')]);
  const [dialogRef, setDialogRef] = createSignal(() => count('dialog'));
  const plainProps = { get ref() { return plainRef(); } };
  const parentProps = { get ref() { return parentRef(); } };
  const dialogProps = { get ref() { return dialogRef(); } };
  const [version, setVersion] = createSignal(0);
  const [atomicCalls, setAtomicCalls] = createSignal({ dialog: 0, parent: 0, child: 0 });
  const atomicDialogRef = (_element: HTMLButtonElement) => {
    setAtomicCalls(previous => ({ ...previous, dialog: previous.dialog + 1 }));
  };
  const atomicParentRef = (_element: HTMLButtonElement) => {
    setAtomicCalls(previous => ({ ...previous, parent: previous.parent + 1 }));
  };
  const atomicChildRef = (_element: HTMLButtonElement) => {
    setAtomicCalls(previous => ({ ...previous, child: previous.child + 1 }));
  };
  const atomicDialogProps = () => ({ ref: atomicDialogRef, 'data-version': version() });
  const atomicSlotProps = () => ({ ref: atomicParentRef, 'data-version': version() });

  return <section aria-label="Native ref consumers">
    <Toggle.Root {...plainProps}>Plain ref toggle</Toggle.Root>
    <Toggle.Root asChild {...parentProps}>
      {target => target('button', { get ref() { return childRef(); }, children: 'Composite ref toggle' })}
    </Toggle.Root>
    <Dialog.Root>
      <Dialog.Trigger {...dialogProps}>Dialog ref trigger</Dialog.Trigger>
    </Dialog.Root>
    <button onClick={() => {
      setPlainRef(() => replacement('plain'));
      setParentRef(() => replacement('parent'));
      setChildRef([[replacement('child')]]);
      setDialogRef(() => replacement('dialog'));
    }}>Replace native refs</button>
    <output id="ref-calls">{JSON.stringify(calls())}</output>
    <output id="replacement-ref-calls">{JSON.stringify(replacementCalls())}</output>
    <Dialog.Root>
      <Dialog.Trigger {...atomicDialogProps()}>Atomic dialog ref trigger</Dialog.Trigger>
    </Dialog.Root>
    <Toggle.Root asChild {...atomicSlotProps()}>
      {target => target('button', { ref: atomicChildRef, children: 'Atomic composite ref toggle' })}
    </Toggle.Root>
    <button onClick={() => setVersion(previous => previous + 1)}>Update atomic props</button>
    <output id="atomic-ref-calls">{JSON.stringify(atomicCalls())}</output>
  </section>;
}

export function Composition(): Element {
  const [parent, accept] = createSignal(false);
  const [requests, setRequests] = createSignal<string[]>([]);
  const [callback, replace] = createSignal<(value: boolean) => void>(() => value => setRequests(previous => [...previous, `old:${value}`]));
  const [order, setOrder] = createSignal<string[]>([]);
  const [updated, setUpdated] = createSignal(false);
  const [initial, changeInitial] = createSignal(false);
  const [mounted, setMounted] = createSignal(true);
  const [remountRequests, setRemountRequests] = createSignal(0);
  const [loading, setLoading] = createSignal(false);
  const [invalid, setInvalid] = createSignal<string[]>([]);
  const [refs, setRefs] = createSignal('awaiting');
  const [boundOrder, setBoundOrder] = createSignal<string[]>([]);
  let parentHost: HTMLAnchorElement | undefined;
  let childHost: HTMLAnchorElement | undefined;
  const id = createUniqueId();
  onSettled(() => { setRefs(parentHost && parentHost === childHost ? 'same host' : 'wrong host'); });

  return <main>
    <h1>Native Solid 2 composition</h1>
    <section aria-label="Controlled state">
      <Toggle.Root pressed={parent()} onPressedChange={callback()}>Controlled</Toggle.Root>
      <button onClick={() => replace(() => next => {
        setRequests(previous => [...previous, `new:${next}`]); accept(next);
      })}>Replace callback and accept</button>
      <output id="requests">{requests().join(',')}</output>
      <Toggle.Root onClick={event => event.preventDefault()}>Cancelled</Toggle.Root>
      <Toggle.Root asChild onClick={() => setOrder(previous => [...previous, 'parent'])}>
        {target => target('button', {
          children: 'Slotted cancel',
          onClick: event => { setOrder(previous => [...previous, 'child']); event.preventDefault(); }
        })}
      </Toggle.Root>
      <output id="order">{order().join(',')}</output>
    </section>
    <section aria-label="Custom target">
      <Toggle.Root<HTMLAnchorElement> asChild disabled={updated()} class={updated() ? 'updated' : 'parent'}
        style={{ color: 'red', 'padding-left': '4px' }} aria-describedby="parent-help shared"
        ref={element => { parentHost = element; }}>
        {target => target(CustomLink, {
          get href() { return updated() ? '#updated' : '#initial'; },
          class: 'child', style: { color: 'blue' }, 'aria-describedby': 'child-help shared',
          role: 'button', onKeyDown: event => { if (event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } },
          ref: element => { childHost = element; }, children: 'Custom target'
        })}
      </Toggle.Root>
      <button onClick={() => setUpdated(true)}>Update target</button>
      <output id="refs">{refs()}</output>
      <p id="parent-help">Parent description</p><p id="child-help">Child description</p><p id="shared">Shared description</p>
    </section>
    <section aria-label="Defaults">
      <Toggle.Root type={undefined} pressed={undefined} defaultPressed={initial()}>Defaulted</Toggle.Root>
      <button onClick={() => changeInitial(true)}>Change default</button>
    </section>
    <section id="loading-target" aria-label="Loading composition">
      <Show when={mounted()}>
        <Toggle.Root asChild onPressedChange={() => setRemountRequests(previous => previous + 1)}
          children={Slot.Slottable({
            child: target => target('button', { children: 'Label' }),
            leading: <span data-leading>Leading </span>, trailing: <span data-trailing> Trailing</span>,
            children: content => <>{loading() ? 'Loading' : content}</>
          })} />
      </Show>
      <button onClick={() => { setMounted(false); setTimeout(() => setMounted(true), 0); }}>Remount target</button>
      <button onClick={() => setLoading(true)}>Load content</button>
      <output id="remount-requests">{remountRequests()}</output>
    </section>
    <section aria-label="Invalid composition">
      <button onClick={() => {
        const failures: string[] = [];
        const cases: [string, Slot.SlotRender][] = [
          ['missing', () => null],
          ['multiple', target => { target('button', {}); return target('button', {}); }],
          ['substituted', target => { target('button', {}); return []; }]
        ];
        for (const [name, children] of cases) {
          try {
            createRoot(dispose => {
              try { Slot.Root({ children }); } finally { dispose(); }
            });
          } catch (error) { if (error instanceof TypeError) failures.push(name); else throw error; }
        }
        setInvalid(failures);
      }}>Check invalid composition</button>
      <output id="invalid-results">{invalid().join(',')}</output>
    </section>
    <section aria-label="Bound native handlers">
      <Toggle.Root asChild class={{ parent: true, excluded: false }} style={{ color: 'red', 'font-weight': '700' }}
        onClick={[(data: string) => setBoundOrder(previous => [...previous, data]), 'parent-data']}>
        {target => target('button', {
          class: ['child', { badge: true }], style: 'color:blue', children: 'Bound target',
          onClick: [(data: string, event: MouseEvent) => {
            setBoundOrder(previous => [...previous, data]); event.preventDefault();
          }, 'child-data']
        })}
      </Toggle.Root>
      <output id="bound-order">{boundOrder().join(',')}</output>
    </section>
    <RefComposition />
    <Toggle.Root id={id} data-id-proof aria-describedby={`${id}-description`}>Identity root A</Toggle.Root>
    <p id={`${id}-description`}>Stable server description</p>
    <Dialog.Root defaultOpen modal={false}>
      <Dialog.Content asChild onOpenAutoFocus={event => event.preventDefault()}>{target => target('section', {
        ...{ 'data-slot-dialog': '' },
        get children() {
          return [
            <Dialog.Title>Hydrated slot title</Dialog.Title>,
            <Dialog.Description>Hydrated slot description</Dialog.Description>
          ];
        }
      })}</Dialog.Content>
    </Dialog.Root>
    <Dialog.Root defaultOpen modal={false}>
      <Dialog.Content asChild onOpenAutoFocus={event => event.preventDefault()}>{target => target(SlotDialogTarget, {
        get children() { return <SlotDialogChildren />; }
      })}</Dialog.Content>
    </Dialog.Root>
    <Layers />
    <Controls />
    <Menus />
    <Selects />
    <Advanced />
    <Assets />
    <Themes />
    <ThemeInteractions />
    <ThemeExtensions />
    <Charts />
  </main>;
}

export function SecondRoot(): Element {
  const id = createUniqueId();
  return <section aria-label="Independent root">
    <Toggle.Root id={id} data-id-proof>Second root</Toggle.Root>
    <IndependentLayers />
  </section>;
}
