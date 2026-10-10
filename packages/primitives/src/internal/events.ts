/** Accept the renderer's callback or [callback, data] native handler form. */
export function callEventHandler(handler: unknown, ...args: unknown[]): unknown {
  if (typeof handler === 'function') return handler(...args);
  if (Array.isArray(handler) && typeof handler[0] === 'function') return handler[0](handler[1], ...args);
}

export function composeEventHandlers<E extends Event>(consumer: () => unknown, internal: (event: E) => void): (event: E) => void {
  return event => {
    callEventHandler(consumer(), event);
    if (!event.defaultPrevented) internal(event);
  };
}

/** Invoke the consumer during real DOM dispatch, so target and cancellation remain native. */
export function dispatchCancelableEvent<E extends Event>(target: EventTarget, event: E, consumer?: (event: E) => void): E {
  if (consumer) target.addEventListener(event.type, consumer as EventListener, { once: true });
  target.dispatchEvent(event);
  return event;
}
