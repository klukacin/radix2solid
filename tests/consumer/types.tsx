import { AccessibleIcon, Accordion, AlertDialog, Announce, AspectRatio, Avatar, Arrow, Checkbox, Collapsible, ContextMenu, Dialog, Direction, DropdownMenu, HoverCard, Label, Menubar, Popover, Portal, Progress, RadioGroup, Separator, Slot, Switch, Tabs, Toggle, ToggleGroup, Toolbar, Tooltip, VisuallyHidden } from '@wsagency/radix2solid-primitives';
import type { JSX } from '@solidjs/web';
import { CheckIcon, type IconProps } from '@wsagency/radix2solid-icons';
import * as Charts from '@wsagency/radix2solid-charts';
import GitHubLogoIcon, { GitHubLogoIcon as NamedGitHubLogoIcon } from '@wsagency/radix2solid-icons/GitHubLogoIcon';
import { Root as DialogRoot, Content as DialogContent, createDialogScope } from '@wsagency/radix2solid-primitives/dialog';
import { createPopoverScope } from '@wsagency/radix2solid-primitives/popover';
import { Root as AccessibleIconRoot } from '@wsagency/radix2solid-primitives/accessible-icon';
import { Root as AspectRatioRoot } from '@wsagency/radix2solid-primitives/aspect-ratio';
import { Root as LabelRoot } from '@wsagency/radix2solid-primitives/label';
import { Root as ProgressRoot, createProgressScope } from '@wsagency/radix2solid-primitives/progress';
import { Root as SeparatorRoot } from '@wsagency/radix2solid-primitives/separator';
import { Root as AvatarRoot, createAvatarScope, type AvatarImageProps } from '@wsagency/radix2solid-primitives/avatar';
import { Root as AnnounceRoot, type AnnounceProps } from '@wsagency/radix2solid-primitives/announce';
import { Root as CollapsibleRoot, createCollapsibleScope, type CollapsibleProps } from '@wsagency/radix2solid-primitives/collapsible';
import { Root as AccordionRoot, createAccordionScope, type AccordionSingleProps, type AccordionMultipleProps } from '@wsagency/radix2solid-primitives/accordion';
import { Root as CheckboxRoot, createCheckboxScope, type CheckedState, type unstable_CheckboxProviderProps, type unstable_CheckboxTriggerProps, type unstable_CheckboxBubbleInputProps } from '@wsagency/radix2solid-primitives/checkbox';
import { Root as SwitchRoot, createSwitchScope, type SwitchProps, type SwitchThumbProps, type unstable_SwitchProviderProps, type unstable_SwitchTriggerProps, type unstable_SwitchBubbleInputProps } from '@wsagency/radix2solid-primitives/switch';
import { Root as RadioGroupRoot, createRadioGroupScope, type RadioGroupProps, type RadioGroupItemProps, type unstable_RadioGroupItemProviderProps, type unstable_RadioGroupItemTriggerProps, type unstable_RadioGroupItemBubbleInputProps } from '@wsagency/radix2solid-primitives/radio-group';
import { Root as TabsRoot, createTabsScope, type TabsProps, type TabsListProps, type TabsTriggerProps, type TabsContentProps } from '@wsagency/radix2solid-primitives/tabs';
import { Root as ToggleGroupRoot, createToggleGroupScope, type ToggleGroupSingleProps, type ToggleGroupMultipleProps, type ToggleGroupItemProps } from '@wsagency/radix2solid-primitives/toggle-group';
import { Root as ToolbarRoot, createToolbarScope, type ToolbarProps, type ToolbarButtonProps, type ToolbarLinkProps, type ToolbarSeparatorProps, type ToolbarToggleGroupSingleProps, type ToolbarToggleGroupMultipleProps, type ToolbarToggleItemProps } from '@wsagency/radix2solid-primitives/toolbar';
import { Root as AlertDialogRoot, createAlertDialogScope, type AlertDialogProps, type AlertDialogTriggerProps, type AlertDialogPortalProps, type AlertDialogOverlayProps, type AlertDialogContentProps, type AlertDialogTitleProps, type AlertDialogDescriptionProps, type AlertDialogActionProps, type AlertDialogCancelProps } from '@wsagency/radix2solid-primitives/alert-dialog';
import { Root as HoverCardRoot, createHoverCardScope, type HoverCardProps, type HoverCardTriggerProps, type HoverCardPortalProps, type HoverCardContentProps, type HoverCardArrowProps } from '@wsagency/radix2solid-primitives/hover-card';
import { Root as TooltipRoot, createTooltipScope, type TooltipProviderProps, type TooltipProps, type TooltipTriggerProps, type TooltipPortalProps, type TooltipContentProps, type TooltipArrowProps } from '@wsagency/radix2solid-primitives/tooltip';
import * as DropdownParts from '@wsagency/radix2solid-primitives/dropdown-menu';
import * as ContextParts from '@wsagency/radix2solid-primitives/context-menu';
import * as MenubarParts from '@wsagency/radix2solid-primitives/menubar';
import * as NavigationParts from '@wsagency/radix2solid-primitives/navigation-menu';
import * as SelectParts from '@wsagency/radix2solid-primitives/select';
import { Tree, Combobox, Command, Splitter } from '@wsagency/radix2solid-primitives';
import * as TreeParts from '@wsagency/radix2solid-primitives/tree';
import * as ComboboxParts from '@wsagency/radix2solid-primitives/combobox';
import * as CommandParts from '@wsagency/radix2solid-primitives/command';
import * as SplitterParts from '@wsagency/radix2solid-primitives/splitter';
import { FolderIcon, FolderOpenIcon, type IconProps as ExtraIconProps } from '@wsagency/radix2solid-icons-extra';
import DeepFolderIcon from '@wsagency/radix2solid-icons-extra/FolderIcon';

const treeProps: TreeParts.TreeProps = {
  value: null, expandedValues: ['branch'] as readonly string[],
  onValueChange: value => { const accepted: string | null = value; void accepted; },
  onExpandedValuesChange: values => { const accepted: readonly string[] = values; void accepted; },
};
export const nextTreeConsumer = <Tree.Root {...treeProps} aria-label="Typed tree">
  <Tree.Item value="branch" textValue="Branch" hasChildren aria-level={1} aria-posinset={1} aria-setsize={-1}>
    <Tree.ItemText>Branch</Tree.ItemText><Tree.ItemIndicator>Selected</Tree.ItemIndicator>
    <Tree.ExpandTrigger aria-label="Expand branch" />
    <Tree.ItemGroup forceMount>
      <Tree.Item value="leaf" textValue="Leaf" asChild onActivate={event => event.preventDefault()}>
        {target => target('a', { href: '#leaf', ref: node => { node.href = '#leaf'; }, children: <Tree.ItemText>Leaf</Tree.ItemText> })}
      </Tree.Item>
    </Tree.ItemGroup>
  </Tree.Item>
</Tree.Root>;
export const treeParts = [TreeParts.Root, TreeParts.Item, TreeParts.ItemText, TreeParts.ItemIndicator, TreeParts.ItemGroup, TreeParts.ExpandTrigger, TreeParts.createTreeScope];
const extraProps: ExtraIconProps = { size: 24, title: 'Folder', color: 'tomato', width: 32 };
export const extraIconConsumer = <><FolderIcon {...extraProps} ref={node => { const svg: SVGSVGElement = node; void svg; }} /><FolderOpenIcon /><DeepFolderIcon /></>;
// @ts-expect-error Extra icon geometry is fixed; children are not accepted.
export const invalidExtraIcon = <FolderIcon>replacement</FolderIcon>;
// @ts-expect-error Tree does not have a multiple selection mode.
export const invalidTreeMode = <Tree.Root selectionMode="multiple" />;
// @ts-expect-error Tree has no checked-state alias.
export const invalidTreeProp = <Tree.Item value="leaf" textValue="Leaf" checked />;

const choiceItems: readonly ComboboxParts.ComboboxItem[] = [{ value: 'one', label: 'One' }];
export const typedChoice = <Combobox.Root items={choiceItems} value={null} query="" filter={false} name="choice" form="external">
  <Combobox.Input asChild>{target => target('input', { ref: node => { node.select(); }, 'aria-label': 'Choice' })}</Combobox.Input>
  <Combobox.Trigger asChild>{target => target('button', { children: 'Open' })}</Combobox.Trigger>
  <Combobox.Clear asChild>{target => target('button', { children: 'Clear' })}</Combobox.Clear>
  <Combobox.Portal container={null} forceMount><Combobox.Content forceMount side="bottom" onEscapeKeyDown={event => event.preventDefault()}>
    <Combobox.List><Combobox.Group><Combobox.Label>Choices</Combobox.Label>
      <Combobox.Item value="one" asChild>{target => target('button', { children: <><Combobox.ItemText /><Combobox.ItemIndicator>Selected</Combobox.ItemIndicator></> })}</Combobox.Item>
    </Combobox.Group><Combobox.Empty>No matches</Combobox.Empty></Combobox.List>
  </Combobox.Content></Combobox.Portal>
</Combobox.Root>;
export const filteredChoice = <ComboboxParts.Root items={choiceItems} filter={(item, query) => item.label.endsWith(query)} />;
export const typedCommand = <Command.Root search="" onSearchChange={search => { const text: string = search; void text; }} loop={false}>
  <Command.Input ref={node => node.focus()} />
  <Command.List><Command.Group><Command.Label>Actions</Command.Label>
    <Command.Item value="run" textValue="Run" onSelect={event => event.preventDefault()} asChild>
      {target => target('a', { href: '#run', ref: node => { node.href = '#run'; }, children: 'Run' })}
    </Command.Item>
  </Command.Group><Command.Empty>No actions</Command.Empty></Command.List>
</Command.Root>;
export const typedSplitter = <Splitter.Root unit="px" defaultSize={200} onSizeChange={size => { const px: number = size; void px; }} onSizeCommit={size => { const accepted: number = size; void accepted; }}>
  <Splitter.Panel side="primary" minSize={100} maxSize={400} collapsible collapsedSize={20}>Primary</Splitter.Panel>
  <Splitter.Handle aria-label="Resize panels" asChild>{target => target('div', { ref: node => { node.focus(); } })}</Splitter.Handle>
  <Splitter.Panel side="secondary" minSize={100}>Secondary</Splitter.Panel>
</Splitter.Root>;
export const percentageSplitter = <SplitterParts.Root unit="%" defaultSize={40} orientation="vertical" collapsed={false} onCollapsedChange={collapsed => { const accepted: boolean = collapsed; void accepted; }} />;
export const nextParts = [
  ComboboxParts.Root, ComboboxParts.Input, ComboboxParts.Trigger, ComboboxParts.Portal, ComboboxParts.Content, ComboboxParts.List, ComboboxParts.Item, ComboboxParts.ItemText, ComboboxParts.ItemIndicator, ComboboxParts.Group, ComboboxParts.Label, ComboboxParts.Empty, ComboboxParts.Clear, ComboboxParts.createComboboxScope,
  CommandParts.Root, CommandParts.Input, CommandParts.List, CommandParts.Group, CommandParts.Label, CommandParts.Item, CommandParts.Empty, CommandParts.createCommandScope,
  SplitterParts.Root, SplitterParts.Panel, SplitterParts.Handle, SplitterParts.createSplitterScope,
];
export type NewFamilyProps = [
  ComboboxParts.ComboboxProps, ComboboxParts.ComboboxInputProps, ComboboxParts.ComboboxTriggerProps, ComboboxParts.ComboboxPortalProps, ComboboxParts.ComboboxContentProps, ComboboxParts.ComboboxListProps, ComboboxParts.ComboboxItemProps, ComboboxParts.ComboboxItemTextProps, ComboboxParts.ComboboxItemIndicatorProps, ComboboxParts.ComboboxGroupProps, ComboboxParts.ComboboxLabelProps, ComboboxParts.ComboboxEmptyProps, ComboboxParts.ComboboxClearProps,
  CommandParts.CommandProps, CommandParts.CommandInputProps, CommandParts.CommandListProps, CommandParts.CommandGroupProps, CommandParts.CommandLabelProps, CommandParts.CommandItemProps, CommandParts.CommandEmptyProps,
  TreeParts.TreeProps, TreeParts.TreeItemProps, TreeParts.TreeItemTextProps, TreeParts.TreeItemIndicatorProps, TreeParts.TreeItemGroupProps, TreeParts.TreeExpandTriggerProps,
  SplitterParts.SplitterProps, SplitterParts.SplitterPanelProps, SplitterParts.SplitterHandleProps,
];
// @ts-expect-error Canonical data is required.
export const noChoiceData = <Combobox.Root />;
// @ts-expect-error A row requires a string key.
export const noChoiceKey = <Combobox.Item />;
// @ts-expect-error Choice keys are strings.
export const numericChoiceKey = <Combobox.Item value={1} />;
// @ts-expect-error Root owns Input value.
export const inputValue = <Combobox.Input value="text" />;
// @ts-expect-error Root owns Input defaultValue.
export const inputDefault = <Combobox.Input defaultValue="text" />;
// @ts-expect-error Root owns Input name.
export const inputName = <Combobox.Input name="choice" />;
// @ts-expect-error Root owns Input form association.
export const inputForm = <Combobox.Input form="external" />;
// @ts-expect-error Query is text.
export const numericQuery = <Combobox.Root items={choiceItems} query={1} />;
// @ts-expect-error Search is text.
export const numericSearch = <Command.Root search={1} />;
// @ts-expect-error Command selection is a cancellable Event.
export const invalidCommandAction = <Command.Item value="run" textValue="Run" onSelect={(value: string) => { void value; }} />;
// @ts-expect-error Command requires a key.
export const missingCommandKey = <Command.Item textValue="Run" />;
// @ts-expect-error Command requires explicit textValue.
export const missingCommandText = <Command.Item value="run" />;
// @ts-expect-error Command has no selected value.
export const commandValue = <Command.Root value="run" />;
// @ts-expect-error Command has no default selected value.
export const commandDefault = <Command.Root defaultValue="run" />;
// @ts-expect-error Command has no selected-value callback.
export const commandChange = <Command.Root onValueChange={() => {}} />;
// @ts-expect-error Command is not a form control.
export const commandName = <Command.Root name="command" />;
// @ts-expect-error Command has no form association.
export const commandForm = <Command.Root form="external" />;
// @ts-expect-error Command has no popup state.
export const commandOpen = <Command.Root open />;
// @ts-expect-error Command has no readOnly state.
export const commandReadonly = <Command.Root readOnly />;
// @ts-expect-error Splitter supports only percent or pixels.
export const invalidSplitterUnit = <Splitter.Root unit="rem" />;
// @ts-expect-error Splitter panel side is required.
export const missingSplitterSide = <Splitter.Panel />;
// @ts-expect-error No N-pane/snap API.
export const invalidSplitterSnap = <Splitter.Root snapPoints={[10, 20]} />;

function CustomTarget(props: JSX.AnchorHTMLAttributes<HTMLAnchorElement> & { token: string }) {
  return <a data-token={props.token} {...props} />;
}

export const consumer = <>
  <Toggle.Root onClick={event => {
    event.currentTarget.disabled = false;
    // @ts-expect-error A native button does not expose an anchor href.
    event.currentTarget.href = '/';
  }}>Native</Toggle.Root>
  <Toggle.Root<HTMLAnchorElement> asChild ref={element => { element.href = '/typed'; }}>
    {target => target(CustomTarget, { token: 'required', href: '/typed', children: 'Custom' })}
  </Toggle.Root>
  <Toggle.Root<HTMLAnchorElement> ref={element => {
    // @ts-expect-error Without asChild the host remains a button, regardless of the type argument.
    element.href = '/not-an-anchor';
  }}>Always native</Toggle.Root>
  <Slot.Root>{target => {
    // @ts-expect-error Custom component requirements must not disappear at the Slot boundary.
    target(CustomTarget, { href: '/missing-token' });
    // @ts-expect-error Native target attributes are checked against the selected tag.
    target('button', { href: '/invalid-button' });
    return target('a', { href: '/native', children: 'Link' });
  }}</Slot.Root>
  {/* @ts-expect-error asChild requires a target render function, not an already-created element. */}
  <Toggle.Root asChild><a href="/invalid">Invalid</a></Toggle.Root>
</>;

const dialogScope = createDialogScope()();
const popoverScope = createPopoverScope()();
export const layers = <Direction.Provider dir="rtl">
  <DialogRoot {...dialogScope} open={false} onOpenChange={open => { const requested: boolean = open; void requested; }}>
    <Dialog.Trigger {...dialogScope} ref={button => { button.disabled = false; }} onClick={event => {
      event.currentTarget.disabled = false;
      // @ts-expect-error Native dialog triggers are buttons, not anchors.
      event.currentTarget.href = '/';
    }}>Open</Dialog.Trigger>
    <Dialog.Trigger {...dialogScope} asChild>{target => target(CustomTarget, { token: 'dialog', href: '#dialog', children: 'Custom trigger' })}</Dialog.Trigger>
    {/* @ts-expect-error asChild requires a target render function, not an already-created element. */}
    <Dialog.Trigger {...dialogScope} asChild><a href="#invalid-dialog">Invalid</a></Dialog.Trigger>
    <Dialog.Portal {...dialogScope} container={document.createDocumentFragment()} forceMount>
      <Dialog.Overlay {...dialogScope} ref={element => { element.style.opacity = '1'; }} />
      <DialogContent {...dialogScope} forceMount onEscapeKeyDown={event => { event.key; event.preventDefault(); }}
        onPointerDownOutside={event => { const pointer: PointerEvent = event.detail.originalEvent; void pointer; }}
        onFocusOutside={event => { const focus: FocusEvent = event.detail.originalEvent; void focus; }}
        onInteractOutside={event => event.preventDefault()} onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()}>
        <Dialog.Title {...dialogScope}>Title</Dialog.Title><Dialog.Description {...dialogScope}>Description</Dialog.Description>
        <Dialog.Close {...dialogScope}>Close</Dialog.Close>
      </DialogContent>
    </Dialog.Portal>
  </DialogRoot>
  <Popover.Root {...popoverScope} modal={false} defaultOpen>
    <Popover.Anchor {...popoverScope} virtualRef={{ current: { getBoundingClientRect: () => new DOMRect(0, 0, 10, 10) } }} />
    <Popover.Trigger {...popoverScope}>Open popover</Popover.Trigger>
    {/* @ts-expect-error asChild requires a target render function, not an already-created element. */}
    <Popover.Trigger {...popoverScope} asChild><a href="#invalid-popover">Invalid</a></Popover.Trigger>
    <Popover.Portal {...popoverScope} container={document.createElement('div').attachShadow({ mode: 'open' })}>
      <Popover.Content {...popoverScope} side="top" align="end" collisionPadding={{ top: 8 }} onPlaced={() => {}}>
        <Popover.Title {...popoverScope}>Popover title</Popover.Title><Popover.Description {...popoverScope}>Popover description</Popover.Description>
        <Popover.Arrow {...popoverScope} fill="currentColor" ref={svg => { const native: SVGSVGElement = svg; void native; }} />
        <Popover.Close {...popoverScope}>Close popover</Popover.Close>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
  <Portal.Root container={document.body}><VisuallyHidden.Root>Accessible text</VisuallyHidden.Root></Portal.Root>
  <Arrow.Root width={12} height={6} ref={svg => { const native: SVGSVGElement = svg; void native; }} />
</Direction.Provider>;

const progressScope = createProgressScope()();
export const simpleControls = <>
  <AccessibleIconRoot label="Close">{target => target('svg', { viewBox: '0 0 32 32' })}</AccessibleIconRoot>
  {/* @ts-expect-error Native icon composition requires a single-target factory, not a pre-created SVG. */}
  <AccessibleIcon.Root label="Invalid"><svg /></AccessibleIcon.Root>
  <AspectRatioRoot ratio={16 / 9} ref={element => { const native: HTMLDivElement = element; void native; }}>Media</AspectRatioRoot>
  <AspectRatio.Root asChild>{target => target('article', { children: 'Custom media' })}</AspectRatio.Root>
  {/* @ts-expect-error Native asChild composition requires a target factory. */}
  <AspectRatio.Root asChild><article /></AspectRatio.Root>
  <LabelRoot for="consumer-input" ref={element => { element.htmlFor = 'consumer-input'; }}>Name</LabelRoot>
  <Label.Root onMouseDown={event => { event.currentTarget.htmlFor; }} asChild>{target => target('span', { children: 'Label text' })}</Label.Root>
  <ProgressRoot {...progressScope} value={null} max={80} getValueLabel={(value, max) => `${value}/${max}`}>
    <Progress.Indicator {...progressScope} ref={element => { const native: HTMLDivElement = element; void native; }} />
  </ProgressRoot>
  <SeparatorRoot orientation="vertical" decorative />
  <Separator.Root asChild>{target => target('span', { children: 'Separator' })}</Separator.Root>
</>;

const avatarScope = createAvatarScope()();
const imageProps: AvatarImageProps = { src: '/account.svg', crossorigin: true, referrerpolicy: 'no-referrer', onLoadingStatusChange: status => {
  const nativeStatus: 'idle' | 'loading' | 'loaded' | 'error' = status;
  void nativeStatus;
} };
const announceProps: AnnounceProps = { type: 'assertive', role: 'alert', 'aria-atomic': 'true', 'aria-relevant': 'additions text', regionIdentifier: 'notifications' };
export const lifecycles = <>
  <AvatarRoot {...avatarScope} ref={element => { const native: HTMLSpanElement = element; void native; }}>
    <Avatar.Image {...avatarScope} {...imageProps} ref={image => { image.naturalWidth; }} />
    <Avatar.Fallback {...avatarScope} delayMs={200}>Account initials</Avatar.Fallback>
  </AvatarRoot>
  <AnnounceRoot {...announceProps} ref={element => { const native: HTMLDivElement = element; void native; }}>Account changed</AnnounceRoot>
  <Announce.Root asChild>{target => target('section', { children: 'Custom notice' })}</Announce.Root>
  {/* @ts-expect-error Native announcement composition requires a target factory. */}
  <Announce.Root asChild><section /></Announce.Root>
</>;

const collapsibleScope = createCollapsibleScope()();
const accordionScope = createAccordionScope()();
const disclosureProps: CollapsibleProps = { defaultOpen: true, onOpenChange: open => { const requested: boolean = open; void requested; } };
const singleProps: AccordionSingleProps = { type: 'single', collapsible: true, value: 'first', onValueChange: value => { const requested: string = value; void requested; } };
const multipleProps: AccordionMultipleProps = { type: 'multiple', defaultValue: ['first'], onValueChange: value => { const requested: string[] = value; void requested; } };
export const disclosures = <>
  <CollapsibleRoot {...collapsibleScope} {...disclosureProps}>
    <Collapsible.Trigger {...collapsibleScope} onClick={event => { event.currentTarget.disabled; }} ref={button => { button.disabled; }}>Disclosure</Collapsible.Trigger>
    <Collapsible.Content {...collapsibleScope} forceMount style="color: red" asChild>{target => target('article', { children: 'Native disclosure' })}</Collapsible.Content>
    {/* @ts-expect-error Disclosure content requires the single-target factory when asChild is true. */}
    <Collapsible.Content asChild><article /></Collapsible.Content>
  </CollapsibleRoot>
  <AccordionRoot {...accordionScope} {...singleProps}>
    <Accordion.Item {...accordionScope} value="first" asChild>{target => target('section', { children: <Accordion.Header {...accordionScope}>
      <Accordion.Trigger {...accordionScope} asChild>{target => target(CustomTarget, { token: 'accordion', href: '#first', children: 'Accordion item' })}</Accordion.Trigger>
    </Accordion.Header> })}</Accordion.Item>
    <Accordion.Item {...accordionScope} value="second"><Accordion.Header {...accordionScope}><Accordion.Trigger {...accordionScope}>Second</Accordion.Trigger></Accordion.Header><Accordion.Content {...accordionScope} forceMount>Second content</Accordion.Content></Accordion.Item>
    {/* @ts-expect-error Item composition must preserve the native factory discriminator. */}
    <Accordion.Item value="invalid" asChild><section /></Accordion.Item>
    {/* @ts-expect-error Content composition must preserve the native factory discriminator. */}
    <Accordion.Content asChild><article /></Accordion.Content>
  </AccordionRoot>
  <Accordion.Root {...multipleProps} />
  {/* @ts-expect-error A multiple root accepts an array, never the single-root value shape. */}
  <Accordion.Root type="multiple" value="first" />
  {/* @ts-expect-error A single root accepts a string, never the multiple-root value shape. */}
  <Accordion.Root type="single" value={['first']} />
</>;

const checkboxScope = createCheckboxScope()();
const switchScope = createSwitchScope()();
const checkboxProviderProps: unstable_CheckboxProviderProps = { defaultChecked: 'indeterminate', onCheckedChange: checked => { const state: CheckedState = checked; void state; }, name: 'check', value: 'yes', form: 'outside' };
const checkboxTriggerProps: unstable_CheckboxTriggerProps = { onClick: event => { event.currentTarget.disabled; }, ref: button => { button.disabled; } };
const checkboxInputProps: unstable_CheckboxBubbleInputProps = { ref: input => { input.indeterminate; input.form; } };
const switchProps: SwitchProps = { defaultChecked: true, onCheckedChange: checked => { const state: boolean = checked; void state; } };
const switchProviderProps: unstable_SwitchProviderProps = { ...switchProps, name: 'notify', value: 'enabled', form: 'outside' };
const switchTriggerProps: unstable_SwitchTriggerProps = { onClick: event => { event.currentTarget.disabled; } };
const switchInputProps: unstable_SwitchBubbleInputProps = { ref: input => { input.checked; input.form; } };
const thumbProps: SwitchThumbProps = { ref: span => { const element: HTMLSpanElement = span; void element; }, style: 'opacity: .5' };
export const checkedControls = <>
  <CheckboxRoot {...checkboxScope} defaultChecked="indeterminate"><Checkbox.Indicator {...checkboxScope} forceMount style="color: red" /></CheckboxRoot>
  <Checkbox.unstable_Provider {...checkboxScope} {...checkboxProviderProps}>
    <Checkbox.unstable_CheckboxTrigger {...checkboxScope} {...checkboxTriggerProps} />
    <Checkbox.unstable_BubbleInput {...checkboxScope} {...checkboxInputProps} />
  </Checkbox.unstable_Provider>
  <SwitchRoot {...switchScope} {...switchProps}><Switch.Thumb {...switchScope} {...thumbProps} /></SwitchRoot>
  <Switch.unstable_SwitchProvider {...switchScope} {...switchProviderProps}>
    <Switch.unstable_Trigger {...switchScope} {...switchTriggerProps} />
    <Switch.unstable_SwitchBubbleInput {...switchScope} {...switchInputProps} />
  </Switch.unstable_SwitchProvider>
  <Checkbox.Root asChild>{target => target('button', { children: 'Native factory check' })}</Checkbox.Root>
  <Switch.Root asChild>{target => target('button', { children: 'Native factory switch' })}</Switch.Root>
  {/* @ts-expect-error A switch has no mixed state. */}
  <Switch.Root checked="indeterminate" />
  {/* @ts-expect-error Native button-backed controls require string values, not React input-array values. */}
  <Checkbox.Root value={['react-value']} />
  {/* @ts-expect-error Factory composition must retain the discriminator. */}
  <Checkbox.Root asChild><button /></Checkbox.Root>
  {/* @ts-expect-error Factory composition must retain the discriminator on split triggers. */}
  <Switch.unstable_Trigger asChild><button /></Switch.unstable_Trigger>
</>;

const radioScope = createRadioGroupScope()();
const radioProps: RadioGroupProps = { value: null, defaultValue: 'one', name: 'choice', form: 'external', required: true, dir: 'rtl', orientation: 'horizontal', loop: false, onValueChange: value => { const choice: string = value; void choice; } };
const radioItemProps: RadioGroupItemProps = { value: 'one', ref: button => { button.disabled; } };
const radioProviderProps: unstable_RadioGroupItemProviderProps = { value: 'two', disabled: true };
const radioTriggerProps: unstable_RadioGroupItemTriggerProps = { onClick: event => { event.currentTarget.disabled; } };
const radioInputProps: unstable_RadioGroupItemBubbleInputProps = { ref: input => { input.form; input.checked; } };
export const radioControls = <RadioGroupRoot {...radioScope} {...radioProps}>
  <RadioGroup.Item {...radioScope} {...radioItemProps}><RadioGroup.Indicator {...radioScope} forceMount style="color: red" /></RadioGroup.Item>
  <RadioGroup.unstable_ItemProvider {...radioScope} {...radioProviderProps}>
    <RadioGroup.unstable_RadioGroupItemTrigger {...radioScope} {...radioTriggerProps} />
    <RadioGroup.unstable_ItemBubbleInput {...radioScope} {...radioInputProps} />
  </RadioGroup.unstable_ItemProvider>
  <RadioGroup.Item {...radioScope} value="factory" asChild>{target => target('button', { children: 'Factory radio' })}</RadioGroup.Item>
  {/* @ts-expect-error Radio item values are required. */}
  <RadioGroup.Item />
  {/* @ts-expect-error Root value is a string or controlled null, not a multi-select array. */}
  <RadioGroup.Root value={['one']} />
  {/* @ts-expect-error Factory composition must retain the item discriminator. */}
  <RadioGroup.Item value="invalid" asChild><button /></RadioGroup.Item>
</RadioGroupRoot>;

const tabsScope = createTabsScope()();
const tabsProps: TabsProps = { value: 'one', activationMode: 'manual', dir: 'rtl', orientation: 'vertical' };
const tabsListProps: TabsListProps = { loop: false };
const tabsTriggerProps: TabsTriggerProps = { value: 'one', onKeyDown: event => { event.currentTarget.disabled; } };
const tabsContentProps: TabsContentProps = { value: 'one', forceMount: true, ref: node => { node.align; } };
const toggleScope = createToggleGroupScope()();
const singleToggleProps: ToggleGroupSingleProps = { type: 'single', value: 'one', onValueChange: value => { const selection: string = value; void selection; } };
const multipleToggleProps: ToggleGroupMultipleProps = { type: 'multiple', value: ['one'], onValueChange: values => { const selections: string[] = values; void selections; } };
const toggleItemProps: ToggleGroupItemProps = { value: 'one', ref: node => { node.disabled; } };
const toolbarScope = createToolbarScope()();
const toolbarProps: ToolbarProps = { loop: false, orientation: 'vertical', dir: 'rtl' };
const toolbarButtonProps: ToolbarButtonProps = { onClick: event => { event.currentTarget.disabled; } };
const toolbarLinkProps: ToolbarLinkProps = { href: '/native', ref: node => { node.href; } };
const toolbarSeparatorProps: ToolbarSeparatorProps = { decorative: false };
const toolbarSingleProps: ToolbarToggleGroupSingleProps = { type: 'single', defaultValue: 'one' };
const toolbarMultipleProps: ToolbarToggleGroupMultipleProps = { type: 'multiple', value: ['one'] };
const toolbarItemProps: ToolbarToggleItemProps = { value: 'one' };
export const composites = <>
  <TabsRoot {...tabsScope} {...tabsProps}><Tabs.List {...tabsScope} {...tabsListProps}><Tabs.Trigger {...tabsScope} {...tabsTriggerProps} /></Tabs.List><Tabs.Content {...tabsScope} {...tabsContentProps} /></TabsRoot>
  <ToggleGroupRoot {...toggleScope} {...singleToggleProps}><ToggleGroup.Item {...toggleScope} {...toggleItemProps} /></ToggleGroupRoot>
  <ToggleGroup.Root {...multipleToggleProps}><ToggleGroup.Item value="one" asChild>{target => target('button', { children: 'Factory toggle' })}</ToggleGroup.Item></ToggleGroup.Root>
  <ToolbarRoot {...toolbarScope} {...toolbarProps}><Toolbar.Button {...toolbarScope} {...toolbarButtonProps} /><Toolbar.Link {...toolbarScope} {...toolbarLinkProps} /><Toolbar.Separator {...toolbarScope} {...toolbarSeparatorProps} />
    <Toolbar.ToggleGroup {...toolbarScope} {...toolbarSingleProps}><Toolbar.ToggleItem {...toolbarScope} {...toolbarItemProps} /></Toolbar.ToggleGroup>
    <Toolbar.ToggleGroup {...toolbarScope} {...toolbarMultipleProps}><Toolbar.ToggleItem {...toolbarScope} value="one" asChild>{target => target('button', { children: 'Factory toolbar toggle' })}</Toolbar.ToggleItem></Toolbar.ToggleGroup>
  </ToolbarRoot>
  <Tabs.Content value="factory" asChild>{target => target('section', { children: 'Factory panel' })}</Tabs.Content>
  {/* @ts-expect-error Multiple groups require array state. */}
  <ToggleGroup.Root type="multiple" value="one" />
  {/* @ts-expect-error Single groups require scalar state. */}
  <Toolbar.ToggleGroup type="single" value={['one']} />
  {/* @ts-expect-error Required selection values remain mandatory. */}
  <Tabs.Trigger />
  {/* @ts-expect-error Factory content cannot be an already-created native element. */}
  <Tabs.Content value="invalid" asChild><section /></Tabs.Content>
  {/* @ts-expect-error Native links cannot erase their native event target. */}
  <Toolbar.Link onClick={event => { event.currentTarget.disabled; }} />
</>;

const alertScope = createAlertDialogScope()();
const alertProps: AlertDialogProps = { open: true, onOpenChange: value => { const next: boolean = value; void next; } };
const alertTriggerProps: AlertDialogTriggerProps = { ref: node => { node.disabled; } };
const alertPortalProps: AlertDialogPortalProps = { forceMount: true };
const alertOverlayProps: AlertDialogOverlayProps = { forceMount: true };
const alertContentProps: AlertDialogContentProps = { 'aria-labelledby': 'typed-alert-title', 'aria-describedby': 'typed-alert-description', onOpenAutoFocus: event => event.preventDefault(), onEscapeKeyDown: event => { event.key; } };
const alertTitleProps: AlertDialogTitleProps = { id: 'typed-alert-title' };
const alertDescriptionProps: AlertDialogDescriptionProps = { id: 'typed-alert-description' };
const alertActionProps: AlertDialogActionProps = { onClick: event => { event.currentTarget.disabled; } };
const alertCancelProps: AlertDialogCancelProps = { ref: node => { node.disabled; } };
export const nativeAlert = <AlertDialogRoot {...alertScope} {...alertProps}>
  <AlertDialog.Trigger {...alertScope} {...alertTriggerProps} />
  <AlertDialog.Portal {...alertScope} {...alertPortalProps}><AlertDialog.Overlay {...alertScope} {...alertOverlayProps} />
    <AlertDialog.Content {...alertScope} {...alertContentProps}><AlertDialog.Title {...alertScope} {...alertTitleProps} />
      <AlertDialog.Description {...alertScope} {...alertDescriptionProps} /><AlertDialog.Action {...alertScope} {...alertActionProps} />
      <AlertDialog.Cancel {...alertScope} {...alertCancelProps} asChild>{target => target('a', { href: '#keep', ref: node => { node.href; }, children: 'Factory Cancel' })}</AlertDialog.Cancel>
    </AlertDialog.Content>
  </AlertDialog.Portal>
  {/* @ts-expect-error AlertDialog cannot disable its modal ownership. */}
  <AlertDialog.Root modal={false} />
  {/* @ts-expect-error Outside pointer dismissal is deliberately not a consumer hook. */}
  <AlertDialog.Content onPointerDownOutside={event => event.preventDefault()} />
  {/* @ts-expect-error Native factory content cannot be an already-created element. */}
  <AlertDialog.Content asChild><div /></AlertDialog.Content>
</AlertDialogRoot>;

const hoverScope = createHoverCardScope()();
const hoverProps: HoverCardProps = { openDelay: 30, closeDelay: 60, onOpenChange: value => { const next: boolean = value; void next; } };
const hoverTriggerProps: HoverCardTriggerProps = { href: '/profile', ref: node => { node.href; }, onPointerEnter: event => { event.currentTarget.href; } };
const hoverPortalProps: HoverCardPortalProps = { forceMount: true, container: document.createDocumentFragment() };
const hoverContentProps: HoverCardContentProps = { side: 'left', onPointerDownOutside: event => { event.detail.originalEvent.pointerType; } };
const hoverArrowProps: HoverCardArrowProps = { ref: node => { node.ownerSVGElement; } };
export const nativeHover = <HoverCardRoot {...hoverScope} {...hoverProps}>
  <HoverCard.Trigger {...hoverScope} {...hoverTriggerProps} />
  <HoverCard.Portal {...hoverScope} {...hoverPortalProps}><HoverCard.Content {...hoverScope} {...hoverContentProps}>
    <HoverCard.Arrow {...hoverScope} {...hoverArrowProps} />
  </HoverCard.Content></HoverCard.Portal>
  <HoverCard.Trigger asChild>{target => target('button', { ref: node => { node.disabled; }, children: 'Factory preview trigger' })}</HoverCard.Trigger>
  {/* @ts-expect-error Popper placement callbacks are not a public HoverCard content hook. */}
  <HoverCard.Content onPlaced={() => {}} />
  {/* @ts-expect-error HoverCard uses the native single-target factory, not element cloning. */}
  <HoverCard.Trigger asChild><a /></HoverCard.Trigger>
</HoverCardRoot>;

const tooltipScope = createTooltipScope()();
const tooltipProviderProps: TooltipProviderProps = { children: null, delayDuration: 100, skipDelayDuration: 0, disableHoverableContent: true };
const tooltipProps: TooltipProps = { defaultOpen: true, onOpenChange: value => { const next: boolean = value; void next; } };
const tooltipTriggerProps: TooltipTriggerProps = { ref: node => { node.disabled; }, onPointerMove: event => { event.currentTarget.disabled; } };
const tooltipPortalProps: TooltipPortalProps = { forceMount: true };
const tooltipContentProps: TooltipContentProps = { 'aria-label': 'Detailed description', onEscapeKeyDown: event => { event.key; }, onPointerDownOutside: event => { event.detail.originalEvent.pointerType; } };
const tooltipArrowProps: TooltipArrowProps = { ref: node => { node.ownerSVGElement; } };
export const nativeTooltip = <Tooltip.Provider {...tooltipScope} {...tooltipProviderProps}>
  <TooltipRoot {...tooltipScope} {...tooltipProps}><Tooltip.Trigger {...tooltipScope} {...tooltipTriggerProps} />
    <Tooltip.Portal {...tooltipScope} {...tooltipPortalProps}><Tooltip.Content {...tooltipScope} {...tooltipContentProps}>
      <Tooltip.Arrow {...tooltipScope} {...tooltipArrowProps} />
    </Tooltip.Content></Tooltip.Portal>
    <Tooltip.Content aria-label="Factory description" asChild>{target => target('section', { children: 'Factory visible child' })}</Tooltip.Content>
    {/* @ts-expect-error Placement is not a public Tooltip callback. */}
    <Tooltip.Content onPlaced={() => {}} />
    {/* @ts-expect-error The native content factory cannot clone an already-created element. */}
    <Tooltip.Content asChild><div /></Tooltip.Content>
  </TooltipRoot>
</Tooltip.Provider>;

const dropdownScope = DropdownParts.createDropdownMenuScope()();
const dropdownProps: DropdownParts.DropdownMenuProps = { defaultOpen: true, onOpenChange: next => { const open: boolean = next; void open; } };
export const nativeDropdown = <DropdownParts.Root {...dropdownScope} {...dropdownProps}>
  <DropdownMenu.Trigger {...dropdownScope} ref={node => { node.disabled; }} />
  <DropdownMenu.Portal {...dropdownScope} forceMount><DropdownMenu.Content {...dropdownScope} onPointerDownOutside={event => { event.detail.originalEvent.pointerType; }}>
    <DropdownMenu.Label {...dropdownScope}>Actions</DropdownMenu.Label><DropdownMenu.Group {...dropdownScope}>
      <DropdownMenu.Item {...dropdownScope} textValue="save" onSelect={event => {
        event.preventDefault();
        // @ts-expect-error itemSelect is a cancelable native Event, not a pointer event.
        event.pointerType;
      }} asChild>{target => target('a', { href: '/save', children: 'Save' })}</DropdownMenu.Item>
      <DropdownMenu.CheckboxItem {...dropdownScope} checked="indeterminate" onCheckedChange={next => { const checked: boolean = next; void checked; }}><DropdownMenu.ItemIndicator {...dropdownScope} /></DropdownMenu.CheckboxItem>
      <DropdownMenu.RadioGroup {...dropdownScope} value="first" onValueChange={next => { const value: string = next; void value; }}><DropdownMenu.RadioItem {...dropdownScope} value="first" /></DropdownMenu.RadioGroup>
      <DropdownMenu.Separator {...dropdownScope} /><DropdownMenu.Arrow {...dropdownScope} ref={node => { node.ownerSVGElement; }} />
      <DropdownMenu.Sub {...dropdownScope} defaultOpen><DropdownMenu.SubTrigger {...dropdownScope} disabled /><DropdownMenu.SubContent {...dropdownScope} loop /></DropdownMenu.Sub>
    </DropdownMenu.Group>
  </DropdownMenu.Content></DropdownMenu.Portal>
  {/* @ts-expect-error Native Trigger is a button, not an anchor. */}
  <DropdownMenu.Trigger href="/invalid" />
  {/* @ts-expect-error Item requires the native factory, not cloned JSX. */}
  <DropdownMenu.Item asChild><a /></DropdownMenu.Item>
  {/* @ts-expect-error Radio item values are required. */}
  <DropdownMenu.RadioItem />
</DropdownParts.Root>;

const contextScope = ContextParts.createContextMenuScope()();
const contextProps: ContextParts.ContextMenuProps = { open: true, modal: false, dir: 'rtl', onOpenChange: next => { const open: boolean = next; void open; } };
export const nativeContext = <ContextParts.Root {...contextScope} {...contextProps}>
  <ContextMenu.Trigger {...contextScope} disabled ref={node => { node.innerText; }} />
  <ContextMenu.Portal {...contextScope}><ContextMenu.Content {...contextScope} onCloseAutoFocus={event => event.preventDefault()}>
    <ContextMenu.Label {...contextScope} /><ContextMenu.Group {...contextScope}><ContextMenu.Item {...contextScope} onSelect={event => event.preventDefault()} />
      <ContextMenu.CheckboxItem {...contextScope} checked><ContextMenu.ItemIndicator {...contextScope} /></ContextMenu.CheckboxItem>
      <ContextMenu.RadioGroup {...contextScope}><ContextMenu.RadioItem {...contextScope} value="first" /></ContextMenu.RadioGroup>
      <ContextMenu.Separator {...contextScope} /><ContextMenu.Arrow {...contextScope} />
      <ContextMenu.Sub {...contextScope}><ContextMenu.SubTrigger {...contextScope} /><ContextMenu.SubContent {...contextScope} /></ContextMenu.Sub>
    </ContextMenu.Group>
  </ContextMenu.Content></ContextMenu.Portal>
  {/* @ts-expect-error ContextMenu does not accept DropdownMenu's defaultOpen contract. */}
  <ContextMenu.Root defaultOpen />
  {/* @ts-expect-error A native span trigger does not expose button disabled state through its ref. */}
  <ContextMenu.Trigger ref={node => { node.disabled; }} />
</ContextParts.Root>;

const barScope = MenubarParts.createMenubarScope()();
const barProps: MenubarParts.MenubarProps = { defaultValue: 'file', loop: false, dir: 'rtl', onValueChange: next => { const value: string = next; void value; } };
export const nativeMenubar = <MenubarParts.Root {...barScope} {...barProps}>
  <Menubar.Menu {...barScope} value="file"><Menubar.Trigger {...barScope} disabled ref={node => { node.disabled; }} />
    <Menubar.Portal {...barScope}><Menubar.Content {...barScope} onEntryFocus={event => event.preventDefault()}>
      <Menubar.Label {...barScope} /><Menubar.Group {...barScope}><Menubar.Item {...barScope} onSelect={event => event.preventDefault()} />
        <Menubar.CheckboxItem {...barScope} checked="indeterminate"><Menubar.ItemIndicator {...barScope} /></Menubar.CheckboxItem>
        <Menubar.RadioGroup {...barScope}><Menubar.RadioItem {...barScope} value="first" /></Menubar.RadioGroup>
        <Menubar.Separator {...barScope} /><Menubar.Arrow {...barScope} />
        <Menubar.Sub {...barScope}><Menubar.SubTrigger {...barScope} /><Menubar.SubContent {...barScope} /></Menubar.Sub>
      </Menubar.Group>
    </Menubar.Content></Menubar.Portal>
  </Menubar.Menu>
  {/* @ts-expect-error Menubar uses value, not a DropdownMenu open boolean. */}
  <Menubar.Root open />
</MenubarParts.Root>;

const navigationScope = NavigationParts.createNavigationMenuScope()();
const navigationProps: NavigationParts.NavigationMenuProps = { defaultValue: 'docs', orientation: 'vertical', dir: 'rtl', activationMode: 'manual', delayDuration: 100, skipDelayDuration: 0, onValueChange: next => { const value: string = next; void value; } };
export const nativeNavigation = <NavigationParts.Root {...navigationScope} {...navigationProps} ref={node => { node.ariaLabel; }}>
  <NavigationParts.List {...navigationScope} asChild>{target => target('ul', { children:
    <NavigationParts.Item {...navigationScope} value="docs">
      <NavigationParts.Trigger {...navigationScope} disabled ref={node => { node.disabled; }} />
      <NavigationParts.Content {...navigationScope} forceMount onFocusOutside={event => { event.detail.originalEvent.relatedTarget; }}>
        <NavigationParts.Link {...navigationScope} active onSelect={event => {
          event.preventDefault(); event.target;
          // @ts-expect-error Navigation selection is a native Event, not a pointer event.
          event.pointerType;
        }} asChild>{target => target('a', { href: '/docs', children: 'Documentation' })}</NavigationParts.Link>
        <NavigationParts.Sub {...navigationScope} defaultValue="sub" disableToggle={false} activationMode="manual" class="native-sub" style={{ color: 'red' }} ref={node => { const div: HTMLDivElement = node; div.align; }}><NavigationParts.List {...navigationScope}><NavigationParts.Item {...navigationScope}><NavigationParts.Trigger {...navigationScope} /><NavigationParts.Content {...navigationScope} /></NavigationParts.Item></NavigationParts.List></NavigationParts.Sub>
      </NavigationParts.Content>
    </NavigationParts.Item>
  })}</NavigationParts.List>
  <NavigationParts.Indicator {...navigationScope} forceMount ref={node => { node.offsetLeft; }} />
  <NavigationParts.Viewport {...navigationScope} asChild>{target => target('section', { children: <span>Decoration</span> })}</NavigationParts.Viewport>
  {/* @ts-expect-error NavigationMenu selection is a string, not an open boolean. */}
  <NavigationParts.Root open />
  {/* @ts-expect-error Native Trigger is a button, not an anchor. */}
  <NavigationParts.Trigger href="/invalid" />
  {/* @ts-expect-error disableToggle belongs to the Sub root, not an individual Trigger. */}
  <NavigationParts.Trigger disableToggle />
  {/* @ts-expect-error asChild accepts a native factory, not cloned JSX. */}
  <NavigationParts.Content asChild><section /></NavigationParts.Content>
</NavigationParts.Root>;

const selectScope = SelectParts.createSelectScope()();
const selectProps: SelectParts.SelectProps = { defaultValue: 'one', defaultOpen: true, dir: 'rtl', name: 'choice', form: 'external', autoComplete: 'country', required: true, onValueChange: next => { const value: string = next; void value; } };
const selectProviderProps: SelectParts.unstable_SelectProviderProps = selectProps;
const selectInputProps: SelectParts.unstable_SelectBubbleInputProps = { name: 'split', form: 'external' };
export const nativeSelect = <SelectParts.Root {...selectScope} {...selectProps}>
  <SelectParts.Trigger {...selectScope} ref={node => { node.disabled; }} asChild>{target => target('button', { children: <SelectParts.Value {...selectScope} placeholder={<span>Choose</span>} asChild>{target => target('span', {})}</SelectParts.Value> })}</SelectParts.Trigger>
  <SelectParts.Icon {...selectScope} />
  <SelectParts.Portal {...selectScope} forceMount><SelectParts.Content {...selectScope} forceMount position="popper" collisionPadding={10} onPointerDownOutside={event => { event.detail.originalEvent.pointerType; }} onCloseAutoFocus={event => event.preventDefault()} asChild>
    {target => target('section', { children: <SelectParts.Viewport {...selectScope} nonce="nonce">
      <SelectParts.Group {...selectScope}><SelectParts.Label {...selectScope} />
        <SelectParts.Item {...selectScope} value="one" textValue="First" disabled onPointerUp={event => event.currentTarget.focus()}>
          <SelectParts.ItemText {...selectScope} asChild>{target => target('strong', { children: 'Rich option' })}</SelectParts.ItemText>
          <SelectParts.ItemIndicator {...selectScope} />
        </SelectParts.Item>
        <SelectParts.Item {...selectScope} value="" />
      </SelectParts.Group>
      <SelectParts.Separator {...selectScope} />
    </SelectParts.Viewport> })}
  </SelectParts.Content></SelectParts.Portal>
  <SelectParts.ScrollUpButton {...selectScope} /><SelectParts.ScrollDownButton {...selectScope} /><SelectParts.Arrow {...selectScope} />
  <SelectParts.unstable_Provider {...selectProviderProps}><SelectParts.unstable_SelectBubbleInput {...selectInputProps} asChild>{target => target('select', {})}</SelectParts.unstable_SelectBubbleInput></SelectParts.unstable_Provider>
  {/* @ts-expect-error Select values remain strings. */}
  <SelectParts.Root value={false} />
  {/* @ts-expect-error Native Trigger is a button, not an anchor. */}
  <SelectParts.Trigger href="/invalid" />
  {/* @ts-expect-error Native options require an explicit string value. */}
  <SelectParts.Item />
  {/* @ts-expect-error Content uses a native target factory, not cloned JSX. */}
  <SelectParts.Content asChild><section /></SelectParts.Content>
</SelectParts.Root>;

import { unstable_PasswordToggleField as PasswordParts } from '@wsagency/radix2solid-primitives';
import { Root as PasswordRoot, type PasswordToggleFieldProps, type PasswordToggleFieldInputProps, type PasswordToggleFieldToggleProps, type PasswordToggleFieldSlotProps, type PasswordToggleFieldIconProps } from '@wsagency/radix2solid-primitives/password-toggle-field';
const passwordProps: PasswordToggleFieldProps = { defaultVisible: false, onVisibilityChange: visible => { const value: boolean = visible; void value; } };
const passwordInputProps: PasswordToggleFieldInputProps = { name: 'secret', form: 'external', autoComplete: 'new-password' };
const passwordToggleProps: PasswordToggleFieldToggleProps = { 'aria-label': 'Reveal', ref: node => { node.disabled; } };
const passwordSlotProps: PasswordToggleFieldSlotProps = { render: ({ visible }) => <span>{visible ? 'Hide' : 'Show'}</span> };
const passwordIconProps: PasswordToggleFieldIconProps = { visible: target => target('svg', {}), hidden: target => target('svg', {}) };
export const nativePassword = <PasswordRoot {...passwordProps}>
  <PasswordParts.Input {...passwordInputProps} ref={node => { node.setSelectionRange(0, 1); }} asChild>{target => target('input', {})}</PasswordParts.Input>
  <PasswordParts.Toggle {...passwordToggleProps} asChild>{target => target('button', { children: <PasswordParts.Slot {...passwordSlotProps} /> })}</PasswordParts.Toggle>
  <PasswordParts.Icon {...passwordIconProps} ref={node => { node.viewBox.baseVal; }} />
  {/* @ts-expect-error The historical callback typo is not a native compatibility API. */}
  <PasswordParts.Root onVisiblityChange={() => {}} />
  {/* @ts-expect-error Password Input owns its native type. */}
  <PasswordParts.Input type="text" />
  {/* @ts-expect-error Native asChild requires a target factory, not cloned JSX. */}
  <PasswordParts.Toggle asChild><button /></PasswordParts.Toggle>
  {/* @ts-expect-error Icon representations are native factories, not cloned SVG elements. */}
  <PasswordParts.Icon visible={<svg />} hidden={target => target('svg', {})} />
</PasswordRoot>;

import { unstable_OneTimePasswordField as OTPParts } from '@wsagency/radix2solid-primitives';
import { Root as OTPRoot, type OneTimePasswordFieldProps, type OneTimePasswordFieldInputProps, type OneTimePasswordFieldHiddenInputProps, type InputValidationType } from '@wsagency/radix2solid-primitives/one-time-password-field';
const otpValidation: InputValidationType = 'alphanumeric';
const otpProps: OneTimePasswordFieldProps = { validationType: otpValidation, form: 'code-form', name: 'code', autoSubmit: true, onAutoSubmit: code => { code.toUpperCase(); } };
const otpInputProps: OneTimePasswordFieldInputProps = { index: 0, onInvalidChange: character => { character.toLowerCase(); } };
const otpHiddenProps: OneTimePasswordFieldHiddenInputProps = { ref: node => { node.form; } };
export const nativeOTP = <OTPRoot {...otpProps} asChild>{target => target('section', { children: <>
  <OTPParts.Input {...otpInputProps} ref={node => { node.select(); }} asChild>{input => input('input', {})}</OTPParts.Input>
  <OTPParts.HiddenInput {...otpHiddenProps} />
  {/* @ts-expect-error Character inputs cannot replace Root's aggregate authority. */}
  <OTPParts.Input value="1" />
  {/* @ts-expect-error Native readonly behavior belongs to Root. */}
  <OTPParts.Input readonly />
  {/* @ts-expect-error Validation uses the four upstream values. */}
  <OTPParts.Root validationType="email" />
  {/* @ts-expect-error Native factories do not clone consumer JSX. */}
  <OTPParts.Input asChild><input /></OTPParts.Input>
</> })}</OTPRoot>;

import { Slider as SliderParts } from '@wsagency/radix2solid-primitives';
import { Root as SliderRoot, type SliderProps, type SliderTrackProps, type SliderRangeProps, type SliderThumbProps, type unstable_SliderThumbProviderProps, type unstable_SliderThumbTriggerProps, type unstable_SliderBubbleInputProps } from '@wsagency/radix2solid-primitives/slider';
const sliderScope = SliderParts.createSliderScope()();
const sliderProps: SliderProps = { defaultValue: [10, 30], name: 'range', form: 'external', min: 0, max: 100, step: .1, minStepsBetweenThumbs: 2, preserveThumbOrder: true, orientation: 'vertical', dir: 'rtl', inverted: true, onValueCommit: values => { const value: number = values[0]!; void value; } };
const sliderTrackProps: SliderTrackProps = { ref: node => { node.offsetWidth; } };
const sliderRangeProps: SliderRangeProps = { 'aria-hidden': 'true' };
const sliderThumbProps: SliderThumbProps = { name: 'first', 'aria-label': 'First' };
const sliderProviderProps: unstable_SliderThumbProviderProps = { name: 'split' };
const sliderTriggerProps: unstable_SliderThumbTriggerProps = { ref: node => { node.focus(); } };
const sliderInputProps: unstable_SliderBubbleInputProps = { ref: node => { node.form; } };
export const nativeSlider = <SliderRoot {...sliderScope} {...sliderProps} asChild>{target => target('div', { children: <>
  <SliderParts.Track {...sliderScope} {...sliderTrackProps} asChild>{track => track('span', { children: <SliderParts.Range {...sliderScope} {...sliderRangeProps} /> })}</SliderParts.Track>
  <SliderParts.Thumb {...sliderScope} {...sliderThumbProps} asChild>{thumb => thumb('span', {})}</SliderParts.Thumb>
  <SliderParts.unstable_ThumbProvider {...sliderScope} {...sliderProviderProps}><SliderParts.unstable_ThumbTrigger {...sliderScope} {...sliderTriggerProps} /><SliderParts.unstable_BubbleInput {...sliderScope} {...sliderInputProps} asChild>{input => input('input', {})}</SliderParts.unstable_BubbleInput></SliderParts.unstable_ThumbProvider>
  {/* @ts-expect-error Slider values are a numeric array, not a scalar. */}
  <SliderParts.Root value={10} />
  {/* @ts-expect-error BubbleInput receives its numeric value from its thumb owner. */}
  <SliderParts.unstable_BubbleInput value="10" />
  {/* @ts-expect-error Native factories do not clone consumer JSX. */}
  <SliderParts.Thumb asChild><span /></SliderParts.Thumb>
</> })}</SliderRoot>;

import { ScrollArea as ScrollParts } from '@wsagency/radix2solid-primitives';
import { Root as ScrollRoot, type ScrollAreaProps, type ScrollAreaViewportProps, type ScrollAreaContentProps, type ScrollAreaScrollbarProps, type ScrollAreaThumbProps, type ScrollAreaCornerProps } from '@wsagency/radix2solid-primitives/scroll-area';
const scrollScope = ScrollParts.createScrollAreaScope()();
const scrollProps: ScrollAreaProps = { type: 'scroll', dir: 'rtl', scrollHideDelay: 100 };
const scrollViewportProps: ScrollAreaViewportProps = { nonce: 'consumer-nonce', disableImplicitContentElement: true, ref: node => { node.scrollTop; } };
const scrollContentProps: ScrollAreaContentProps = { ref: node => { node.offsetHeight; } };
const scrollBarProps: ScrollAreaScrollbarProps = { orientation: 'horizontal', forceMount: true };
const scrollThumbProps: ScrollAreaThumbProps = { forceMount: true };
const scrollCornerProps: ScrollAreaCornerProps = { ref: node => { node.offsetWidth; } };
export const nativeScroll = <ScrollRoot {...scrollScope} {...scrollProps} asChild>{target => target('section', { children: <>
  <ScrollParts.Viewport {...scrollScope} {...scrollViewportProps} asChild>{viewport => viewport('article', { children: <ScrollParts.Content {...scrollScope} {...scrollContentProps} asChild>{content => content('div', { children: 'Measured content' })}</ScrollParts.Content> })}</ScrollParts.Viewport>
  <ScrollParts.Scrollbar {...scrollScope} {...scrollBarProps} asChild>{bar => bar('div', { children: <ScrollParts.Thumb {...scrollScope} {...scrollThumbProps} /> })}</ScrollParts.Scrollbar>
  <ScrollParts.Corner {...scrollScope} {...scrollCornerProps} />
  {/* @ts-expect-error Visibility has the four upstream modes. */}
  <ScrollParts.Root type="manual" />
  {/* @ts-expect-error Scrollbar axes are horizontal or vertical. */}
  <ScrollParts.Scrollbar orientation="both" />
  {/* @ts-expect-error Native factories do not clone consumer JSX. */}
  <ScrollParts.Viewport asChild><div /></ScrollParts.Viewport>
</> })}</ScrollRoot>;

import { Form as FormParts } from '@wsagency/radix2solid-primitives';
import { Root as FormRoot, type FormProps, type FormFieldProps, type FormLabelProps, type FormControlProps, type FormMessageProps, type FormValidityStateProps, type FormSubmitProps } from '@wsagency/radix2solid-primitives/form';
const formScope = FormParts.createFormScope()();
const formProps: FormProps = { onClearServerErrors: () => {}, onSubmit: event => { event.currentTarget.requestSubmit(); } };
const formFieldProps: FormFieldProps = { name: 'email', serverInvalid: true };
const formLabelProps: FormLabelProps = { for: 'email' };
const formControlProps: FormControlProps = { required: true, type: 'email', ref: node => { node.setCustomValidity(''); } };
const formMessageProps: FormMessageProps = { match: (value, data) => Promise.resolve(value === data.get('other')), forceMatch: false };
const formValidityProps: FormValidityStateProps = { children: validity => validity?.valid ? 'Valid' : 'Invalid' };
const formSubmitProps: FormSubmitProps = { ref: node => { node.form; } };
export const nativeForm = <FormRoot {...formScope} {...formProps} asChild>{target => target('form', { children: <>
  <FormParts.Field {...formScope} {...formFieldProps}>
    <FormParts.Label {...formScope} {...formLabelProps} />
    <FormParts.Control {...formScope} {...formControlProps} asChild>{input => input('input', {})}</FormParts.Control>
    <FormParts.Message {...formScope} {...formMessageProps} /><FormParts.Message {...formScope} match="valid" />
    <FormParts.ValidityState {...formScope} {...formValidityProps} />
  </FormParts.Field>
  <FormParts.Submit {...formScope} {...formSubmitProps} />
  {/* @ts-expect-error Fields require their associated native name. */}
  <FormParts.Field />
  {/* @ts-expect-error customError is represented by a function matcher, not a builtin match. */}
  <FormParts.Message match="customError" />
  {/* @ts-expect-error Native factories do not clone consumer JSX. */}
  <FormParts.Control asChild><input /></FormParts.Control>
</> })}</FormRoot>;

import { Toast as ToastParts } from '@wsagency/radix2solid-primitives';
import { Provider as NotificationProvider, type ToastProviderProps, type ToastViewportProps, type ToastProps, type ToastTitleProps, type ToastDescriptionProps, type ToastActionProps, type ToastCloseProps } from '@wsagency/radix2solid-primitives/toast';
const notificationScope = ToastParts.createToastScope()();
const notificationProviderProps: ToastProviderProps = { duration: Infinity, swipeDirection: 'left', swipeThreshold: 40, label: 'Notification' };
const notificationViewportProps: ToastViewportProps = { hotkey: ['altKey', 'KeyN'], label: 'Notifications ({hotkey})', ref: node => { node.start; } };
const notificationProps: ToastProps = { type: 'background', duration: 1200, onPause: () => {}, onResume: () => {}, onEscapeKeyDown: event => event.preventDefault(), onSwipeEnd: event => { event.currentTarget.value; event.detail.originalEvent.pointerType; event.detail.delta.x; event.preventDefault(); } };
const notificationTitleProps: ToastTitleProps = { ref: node => { node.align; } };
const notificationDescriptionProps: ToastDescriptionProps = { children: 'Saved' };
const notificationActionProps: ToastActionProps = { altText: 'Undo from history' };
const notificationCloseProps: ToastCloseProps = { onClick: event => { event.currentTarget.form; } };
export const nativeNotifications = <NotificationProvider {...notificationScope} {...notificationProviderProps}>
  <ToastParts.Root {...notificationScope} {...notificationProps} asChild>{target => target('li', { children: <>
    <ToastParts.Title {...notificationScope} {...notificationTitleProps} />
    <ToastParts.Description {...notificationScope} {...notificationDescriptionProps} />
    <ToastParts.Action {...notificationScope} {...notificationActionProps} asChild>{button => button('button', { children: 'Undo' })}</ToastParts.Action>
    <ToastParts.Close {...notificationScope} {...notificationCloseProps} />
  </> })}</ToastParts.Root>
  <ToastParts.Viewport {...notificationScope} {...notificationViewportProps} asChild>{target => target('ol', {})}</ToastParts.Viewport>
  {/* @ts-expect-error Action alternatives are required for accessible announcements. */}
  <ToastParts.Action />
  {/* @ts-expect-error Toast priority is not the native list item type. */}
  <ToastParts.Root type="a" />
  {/* @ts-expect-error Native factories do not clone consumer JSX. */}
  <ToastParts.Close asChild><button /></ToastParts.Close>
</NotificationProvider>;

const nativeIconProps: IconProps = {
  size: '2em', width: 24, color: 'tomato', title: 'Completed',
  ref: node => { const svg: SVGSVGElement | undefined = node; svg?.createSVGPoint(); },
  onClick: event => { const svg: SVGSVGElement = event.currentTarget; svg.getScreenCTM(); }
};
export const nativeIcons = <>
  <CheckIcon {...nativeIconProps} /><GitHubLogoIcon aria-label="GitHub" />
  <NamedGitHubLogoIcon {...nativeIconProps} aria-label="Named deep GitHub" />
  {/* @ts-expect-error Icon children are generated vector geometry, not a cloning API. */}
  <CheckIcon><path /></CheckIcon>
  {/* @ts-expect-error Icons use native SVG refs and props, not asChild factories. */}
  <CheckIcon asChild />
</>;

import * as Themes from '@wsagency/radix2solid-themes';
import { Root as ThemedCalloutRoot, type RootProps as ThemedCalloutRootProps } from '@wsagency/radix2solid-themes/components/callout';
import { buttonPropDefs as themedButtonProps, breakpoints as themedBreakpoints } from '@wsagency/radix2solid-themes/props';
import { extractProps as extractThemeProps } from '@wsagency/radix2solid-themes/helpers';
const standalonePanelProps: Themes.unstable_ThemePanelContentProps = { as: 'span', gap: '4' };
const themedCalloutProps: ThemedCalloutRootProps = { size: Object.freeze({ md: '3' }), m: '-2' };
void extractThemeProps({ size: '2' }, themedButtonProps); void themedBreakpoints.includes('md');
export const nativeThemes = <Themes.Theme accentColor="indigo" appearance="light" scaling="110%">
  <Themes.Text as="label" for="themed-input" ref={node => { const label: HTMLLabelElement | undefined = node; label?.control; }}>Native label</Themes.Text>
  <Themes.Text as="p" ref={node => { const paragraph: HTMLParagraphElement | undefined = node; paragraph?.align; }}>Paragraph</Themes.Text>
  <Themes.Button loading disabled={false} asChild>{target => target(CustomTarget, { token: 'theme', href: '#theme', children: 'Native target' })}</Themes.Button>
  <ThemedCalloutRoot {...themedCalloutProps}><Themes.Callout.Icon /><Themes.Callout.Text ref={node => { const paragraph: HTMLParagraphElement | undefined = node; paragraph?.align; }}>Callout</Themes.Callout.Text></ThemedCalloutRoot>
  <Themes.Avatar fallback="TS" alt="Account" ref={node => { const image: HTMLImageElement | undefined = node; image?.naturalWidth; }} />
  <Themes.ScrollArea dir="rtl" ref={node => { const viewport: HTMLDivElement | undefined = node; viewport?.scrollTop; }}>Scroll content</Themes.ScrollArea>
  <Themes.Skeleton asChild>{target => target('button', { children: 'Loading target' })}</Themes.Skeleton>
  <Themes.Theme scaling="115%" customAccent="calm" accentColor="custom"><Themes.Button color="custom">Custom</Themes.Button><Themes.Theme scaling="87.5%" /></Themes.Theme>
  {/* @ts-expect-error Theme scaling requires an explicit percentage unit. */}
  <Themes.Theme scaling="1.25" />
  {/* @ts-expect-error Required Avatar fallback cannot disappear behind optional metadata. */}
  <Themes.Avatar />
  {/* @ts-expect-error Native Theme composition requires a target factory, not an existing element. */}
  <Themes.Button asChild><a /></Themes.Button>
  {/* @ts-expect-error Callout.Text is a paragraph, not a label or a factory host. */}
  <Themes.Callout.Text for="not-a-label" />
</Themes.Theme>;

export const nativeInteractiveThemes = <Themes.Theme>
  <Themes.ThemePanel defaultOpen />
  <Themes.unstable_ThemePanelContent {...standalonePanelProps} ref={(node: HTMLSpanElement | undefined) => { node?.title; }} />
  <Themes.TextField.Root ref={node => { const input: HTMLInputElement | undefined = node; input?.selectionStart; }}>
    <Themes.TextField.Slot side="right"><Themes.Button>Submit</Themes.Button></Themes.TextField.Slot>
  </Themes.TextField.Root>
  <Themes.CheckboxGroup.Root name="native-group" value={['one']} onValueChange={value => { const selection: string[] = value; selection.join(','); }}>
    <Themes.CheckboxGroup.Item value="one">One</Themes.CheckboxGroup.Item>
  </Themes.CheckboxGroup.Root>
  <Themes.Select.Root name="native-select" defaultValue="one"><Themes.Select.Trigger placeholder="Choose" />
    <Themes.Select.Content><Themes.Select.Item value="one"><Themes.Em>One</Themes.Em></Themes.Select.Item></Themes.Select.Content>
  </Themes.Select.Root>
  <Themes.Dialog.Root><Themes.Dialog.Trigger>{target => target(Themes.Button, { children: 'Open' })}</Themes.Dialog.Trigger>
    <Themes.Dialog.Content><Themes.Dialog.Title>Title</Themes.Dialog.Title><Themes.Dialog.Description>Description</Themes.Dialog.Description>
      <Themes.Dialog.Close>{target => target(Themes.Button, { children: 'Close' })}</Themes.Dialog.Close>
    </Themes.Dialog.Content>
  </Themes.Dialog.Root>
  <Themes.Tooltip content="Native target">{target => target(CustomTarget, { token: 'tooltip', href: '#target', children: 'Target' })}</Themes.Tooltip>
  {/* @ts-expect-error Themed dialogs retain the upstream always-modal contract. */}
  <Themes.Dialog.Root modal={false} />
  {/* @ts-expect-error Themed alert dialogs also retain the upstream always-modal contract. */}
  <Themes.AlertDialog.Root modal={false} />
  {/* @ts-expect-error TextField exposes an input ref, not a textarea. */}
  <Themes.TextField.Root ref={(node: HTMLTextAreaElement | undefined) => { node?.rows; }} />
  {/* @ts-expect-error Tooltip targets require native composition factories, not rendered elements. */}
  <Themes.Tooltip content="Invalid target"><button>Target</button></Themes.Tooltip>
</Themes.Theme>;

export const nativeCharts = <Charts.ResponsiveContainer width="100%" height={300} initialDimension={{ width: 500, height: 300 }}
  onResize={(width, height) => { const dimensions: number[] = [width, height]; void dimensions; }}>
  <Charts.ComposedChart data={[{ name: 'A', value: 10 }]} syncId="typed" syncMethod="value" accessibilityLayer title="Typed chart">
    <Charts.XAxis dataKey="name" scale="band" interval={0} />
    <Charts.YAxis domain={[0, 50]} allowDataOverflow />
    <Charts.Bar dataKey="value" stackId="total" isAnimationActive={false}
      shape={props => <Charts.Rectangle {...props} />}><Charts.Cell fill="#123456" /></Charts.Bar>
    <Charts.Line dataKey="value" isAnimationActive="auto" onAnimationEnd={() => {}} />
    <Charts.Tooltip content={props => <span>{props.active ? String(props.label) + ':' + props.payload.map(item => item.value).join(',') : ''}</span>} />
    <Charts.Legend /><Charts.Brush onChange={range => { const start: number | undefined = range.startIndex; void start; }} />
  </Charts.ComposedChart>
</Charts.ResponsiveContainer>;
// @ts-expect-error Chart dimensions accept numbers or percentages, not arbitrary CSS lengths.
export const invalidFixedChart = <Charts.LineChart width="wide" height={300} />;
// @ts-expect-error Treemap does not implement a separate update-animation toggle.
export const invalidTreemapUpdateAnimation = <Charts.Treemap isUpdateAnimationActive />;
