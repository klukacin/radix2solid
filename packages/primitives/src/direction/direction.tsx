import { createContext, useContext, type Accessor, type Element } from 'solid-js';

export type Direction = 'ltr' | 'rtl';
export interface DirectionProviderProps { dir: Direction; children?: Element }
const DirectionContext = createContext<Accessor<Direction>>(() => 'ltr');

export function DirectionProvider(props: DirectionProviderProps): Element {
  return <DirectionContext value={() => props.dir}>{props.children}</DirectionContext>;
}
export function useDirection(local: Accessor<Direction | undefined> = () => undefined): Accessor<Direction> {
  const inherited = useContext(DirectionContext);
  return () => local() ?? inherited();
}
