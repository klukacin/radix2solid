import { omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { tableRootPropDefs, tableRowPropDefs, tableCellPropDefs } from './table.props.js';
import { extractProps } from '../helpers/extract-props.js';
import { getResponsiveClassNames } from '../helpers/get-responsive-styles.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { ScrollArea } from './scroll-area.js';

const rootDefs = omit(tableRootPropDefs, 'layout');
export type RootProps = Omit<ComponentProps<'div'>, RemovedProps> & MarginProps & GetPropDefTypes<typeof tableRootPropDefs>;
export function Root(props: RootProps): Element {
  const parsed = extractProps(props, rootDefs, marginPropDefs);
  const forwarded = omit(parsed, 'layout', 'children');
  return <div {...forwarded} class={['rt-TableRoot', parsed.class]}><ScrollArea>
    <table class={['rt-TableRootTable', getResponsiveClassNames({ value: props.layout,
      className: tableRootPropDefs.layout.className, propValues: tableRootPropDefs.layout.values })]}>{props.children}</table>
  </ScrollArea></div>;
}
export type HeaderProps = Omit<ComponentProps<'thead'>, RemovedProps>;
export function Header(props: HeaderProps): Element {
  return <thead {...props} class={['rt-TableHeader', props.class]} />;
}
export type BodyProps = Omit<ComponentProps<'tbody'>, RemovedProps>;
export function Body(props: BodyProps): Element {
  return <tbody {...props} class={['rt-TableBody', props.class]} />;
}
export type RowProps = Omit<ComponentProps<'tr'>, RemovedProps> & GetPropDefTypes<typeof tableRowPropDefs>;
export function Row(props: RowProps): Element {
  const parsed = extractProps(props, tableRowPropDefs);
  return <tr {...parsed} class={['rt-TableRow', parsed.class]} />;
}
export type CellProps = Omit<ComponentProps<'td'>, RemovedProps | 'width'> & GetPropDefTypes<typeof tableCellPropDefs>;
export function Cell(props: CellProps): Element {
  const parsed = extractProps(props, tableCellPropDefs);
  return <td {...parsed} class={['rt-TableCell', parsed.class]} />;
}
export type ColumnHeaderCellProps = Omit<ComponentProps<'th'>, RemovedProps | 'width'> & GetPropDefTypes<typeof tableCellPropDefs>;
export function ColumnHeaderCell(props: ColumnHeaderCellProps): Element {
  const parsed = extractProps(props, tableCellPropDefs);
  return <th scope="col" {...parsed} class={['rt-TableCell', 'rt-TableColumnHeaderCell', parsed.class]} />;
}
export type RowHeaderCellProps = Omit<ComponentProps<'th'>, RemovedProps | 'width'> & GetPropDefTypes<typeof tableCellPropDefs>;
export function RowHeaderCell(props: RowHeaderCellProps): Element {
  const parsed = extractProps(props, tableCellPropDefs);
  return <th scope="row" {...parsed} class={['rt-TableCell', 'rt-TableRowHeaderCell', parsed.class]} />;
}
