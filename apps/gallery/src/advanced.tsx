import { createRoot, createSignal, Show, type Element } from 'solid-js';
import { Portal as NativePortal } from '@solidjs/web';
import { Checkbox, Dialog, Form, ScrollArea, Slider, Toast, unstable_PasswordToggleField as Password, unstable_OneTimePasswordField as OTP } from '@wsagency/radix2solid-primitives';
import { createLayer, registerLayerBranch } from '@wsagency/radix2solid-primitives/internal';
import { Checkbox as ThemedCheckbox, Theme } from '@wsagency/radix2solid-themes';

export function Advanced(): Element {
  const [secret, setSecret] = createSignal('selection-secret');
  const [cancelReset, setCancelReset] = createSignal(false);
  const [cancelToggle, setCancelToggle] = createSignal(false);
  const [submissions, setSubmissions] = createSignal<string[]>([]);
  const [visible, setVisible] = createSignal(false);
  const [accept, setAccept] = createSignal(false);
  const [latest, setLatest] = createSignal(false);
  const [requests, setRequests] = createSignal<string[]>([]);
  const [controlledId, setControlledId] = createSignal('controlled-secret');
  const request = (source: string, next: boolean) => { setRequests(previous => [...previous, `${source}:${next}`]); if (accept()) setVisible(next); };
  const [validation, setValidation] = createSignal<OTP.InputValidationType>('numeric');
  const [otpDisabled, setOtpDisabled] = createSignal(false), [otpReadOnly, setOtpReadOnly] = createSignal(false);
  const [otpRtl, setOtpRtl] = createSignal(false), [otpCancelReset, setOtpCancelReset] = createSignal(false);
  const [otpVertical, setOtpVertical] = createSignal(false);
  const [otpEvents, setOtpEvents] = createSignal<string[]>([]), [otpInvalid, setOtpInvalid] = createSignal<string[]>([]);
  const [controlledCode, setControlledCode] = createSignal('12'), [acceptCode, setAcceptCode] = createSignal(false);
  const [codeRequests, setCodeRequests] = createSignal<string[]>([]);
  const [sliderDisabled, setSliderDisabled] = createSignal(false), [sliderPreserve, setSliderPreserve] = createSignal(false);
  const [sliderRtl, setSliderRtl] = createSignal(false), [sliderInverted, setSliderInverted] = createSignal(false);
  const [sliderCancelReset, setSliderCancelReset] = createSignal(false), [sliderEvents, setSliderEvents] = createSignal<string[]>([]);
  const [sliderValue, setSliderValue] = createSignal([25]), [sliderAccept, setSliderAccept] = createSignal(false);
  const [sliderRequests, setSliderRequests] = createSignal<string[]>([]);
  const sliderStyle = { position: 'relative', display: 'flex', 'align-items': 'center', width: '240px', height: '24px' } as const;
  const thumbStyle = { display: 'block', width: '20px', height: '20px', background: 'gray', 'border-radius': '50%' };
  const [scrollType, setScrollType] = createSignal<'always' | 'auto' | 'hover' | 'scroll'>('always');
  const [scrollRtl, setScrollRtl] = createSignal(false), [scrollMounted, setScrollMounted] = createSignal(true);
  const [scrollHorizontal, setScrollHorizontal] = createSignal(true), [scrollOverflow, setScrollOverflow] = createSignal(true);
  const [formServerError, setFormServerError] = createSignal(false), [formCancelReset, setFormCancelReset] = createSignal(false);
  const [formEvents, setFormEvents] = createSignal<string[]>([]), [formMatches, setFormMatches] = createSignal<string[]>([]);
  const [formFieldMounted, setFormFieldMounted] = createSignal(true);
  const [requireExternalFormField, setRequireExternalFormField] = createSignal(false);
  const [changedFormDefaults, setChangedFormDefaults] = createSignal(false);
  const [primitiveConfirmations, setPrimitiveConfirmations] = createSignal<string[]>([]);
  const [themedConfirmations, setThemedConfirmations] = createSignal<string[]>([]);
  const [asyncServerError, setAsyncServerError] = createSignal(false);
  const [extraMatcher, setExtraMatcher] = createSignal(false);
  const remoteChecks: { value: string; resolve: (invalid: boolean) => void }[] = [];
  const remoteMatch = (value: string) => {
    setFormMatches(previous => [...previous, value]);
    return value.startsWith('remote') ? new Promise<boolean>(resolve => remoteChecks.push({ value, resolve })) : false;
  };
  return <section aria-label="Native advanced controls">
    <section aria-label="Native password field">
      <form id="password-form" onSubmit={event => { event.preventDefault(); setSubmissions(previous => [...previous, String(new FormData(event.currentTarget).get('secret'))]); }} onReset={event => { if (cancelReset()) event.preventDefault(); }}>
        <button type="submit">Submit secret</button><button type="reset">Reset secret</button>
      </form>
      <label><input type="checkbox" checked={cancelReset()} onChange={event => setCancelReset(event.currentTarget.checked)} />Cancel password reset</label>
      <label><input type="checkbox" checked={cancelToggle()} onChange={event => setCancelToggle(event.currentTarget.checked)} />Cancel password toggle</label>
      <Password.Root>
        <Password.Input aria-label="Secret" id="password-secret" name="secret" form="password-form" value={secret()} onInput={event => setSecret(event.currentTarget.value)} />
        <Password.Toggle onClick={event => { if (cancelToggle()) event.preventDefault(); }}><Password.Slot render={({ visible }) => <span>{visible ? 'Hide secret' : 'Reveal secret'}</span>} /></Password.Toggle>
        <Password.Icon data-password-icon width="16" height="16" visible={target => target('svg', { viewBox: '0 0 10 10', id: 'password-visible-icon', children: <circle cx="5" cy="5" r="4" /> })} hidden={target => target('svg', { viewBox: '0 0 10 10', id: 'password-hidden-icon', children: <path d="M0 0L10 10" /> })} />
      </Password.Root>
      <output id="password-submissions">{submissions().join(',')}</output>
      <label><input type="checkbox" checked={accept()} onChange={event => setAccept(event.currentTarget.checked)} />Accept password requests</label>
      <button onClick={() => setLatest(true)}>Replace password callback</button>
      <button onClick={() => setControlledId('updated-controlled-secret')}>Update password input ID</button>
      <Password.Root id={controlledId()} visible={visible()} onVisibilityChange={latest() ? next => request('latest', next) : next => request('old', next)}>
        <Password.Input aria-label="Controlled secret" value="controlled-secret" asChild>{target => target('input', {})}</Password.Input>
        <Password.Toggle aria-label="Controlled visibility" asChild>{target => target('button', { children: 'Toggle controlled' })}</Password.Toggle>
      </Password.Root>
      <output id="password-requests">{requests().join(',')}</output>
    </section>
    <section aria-label="Native one-time password">
      <form id="otp-form" onSubmit={event => { event.preventDefault(); setOtpEvents(previous => [...previous, `submit:${new FormData(event.currentTarget).get('code')}`]); }} onReset={event => { if (otpCancelReset()) event.preventDefault(); }}>
        <button type="submit">Submit code</button><button type="reset">Reset code</button>
      </form>
      <label for="otp-validation">Code validation</label><select id="otp-validation" value={validation()} onChange={event => setValidation(event.currentTarget.value as OTP.InputValidationType)}><option value="numeric">Numeric</option><option value="alpha">Alpha</option><option value="alphanumeric">Alphanumeric</option><option value="none">Custom XYZ</option></select>
      <label><input type="checkbox" checked={otpDisabled()} onChange={event => setOtpDisabled(event.currentTarget.checked)} />Disable code</label>
      <label><input type="checkbox" checked={otpReadOnly()} onChange={event => setOtpReadOnly(event.currentTarget.checked)} />Read-only code</label>
      <label><input type="checkbox" checked={otpRtl()} onChange={event => setOtpRtl(event.currentTarget.checked)} />RTL code</label>
      <label><input type="checkbox" checked={otpVertical()} onChange={event => setOtpVertical(event.currentTarget.checked)} />Vertical code</label>
      <label><input type="checkbox" checked={otpCancelReset()} onChange={event => setOtpCancelReset(event.currentTarget.checked)} />Cancel code reset</label>
      <OTP.Root aria-label="Verification code" name="code" form="otp-form" validationType={validation()} sanitizeValue={value => value.toUpperCase().replace(/[^XYZ]/g, '')} disabled={otpDisabled()} readOnly={otpReadOnly()} dir={otpRtl() ? 'rtl' : 'ltr'} orientation={otpVertical() ? 'vertical' : 'horizontal'} autoSubmit onAutoSubmit={value => setOtpEvents(previous => [...previous, `auto:${value}`])}>
        <OTP.Input index={0} aria-label="Code 1" onInvalidChange={value => setOtpInvalid(previous => [...previous, value])} />
        <OTP.Input index={1} aria-label="Code 2" /><OTP.Input index={2} aria-label="Code 3" /><OTP.Input index={3} aria-label="Code 4" />
        <OTP.HiddenInput data-otp-aggregate />
      </OTP.Root>
      <output id="otp-events">{otpEvents().join(',')}</output><output id="otp-invalid">{otpInvalid().join(',')}</output>
      <label><input type="checkbox" checked={acceptCode()} onChange={event => setAcceptCode(event.currentTarget.checked)} />Accept code requests</label>
      <OTP.Root value={controlledCode()} onValueChange={value => { setCodeRequests(previous => [...previous, value]); if (acceptCode()) setControlledCode(value); }} asChild>
        {target => target('div', { id: 'controlled-code', children: <><OTP.Input index={0} aria-label="Controlled code 1" asChild>{input => input('input', {})}</OTP.Input><OTP.Input index={1} aria-label="Controlled code 2" /><OTP.Input index={2} aria-label="Controlled code 3" /><OTP.HiddenInput /></> })}
      </OTP.Root>
      <output id="otp-requests">{codeRequests().join(',')}</output>
    </section>
    <section aria-label="Native slider">
      <form id="slider-form" onReset={event => { if (sliderCancelReset()) event.preventDefault(); }} onSubmit={event => { event.preventDefault(); setSliderEvents(previous => [...previous, `submit:${new FormData(event.currentTarget).getAll('levels[]').join(':')}`]); }}>
        <button type="reset">Reset slider</button><button type="submit">Submit slider</button>
      </form>
      <label><input type="checkbox" checked={sliderDisabled()} onChange={event => setSliderDisabled(event.currentTarget.checked)} />Disable slider</label>
      <label><input type="checkbox" checked={sliderPreserve()} onChange={event => setSliderPreserve(event.currentTarget.checked)} />Preserve thumb order</label>
      <label><input type="checkbox" checked={sliderRtl()} onChange={event => setSliderRtl(event.currentTarget.checked)} />RTL slider</label>
      <label><input type="checkbox" checked={sliderInverted()} onChange={event => setSliderInverted(event.currentTarget.checked)} />Invert slider</label>
      <label><input type="checkbox" checked={sliderCancelReset()} onChange={event => setSliderCancelReset(event.currentTarget.checked)} />Cancel slider reset</label>
      <Slider.Root data-slider-root name="levels" form="slider-form" defaultValue={[20, 80]} minStepsBetweenThumbs={1} step={10} disabled={sliderDisabled()} preserveThumbOrder={sliderPreserve()} dir={sliderRtl() ? 'rtl' : 'ltr'} inverted={sliderInverted()} style={sliderStyle} onValueChange={value => setSliderEvents(previous => [...previous, `change:${value.join(':')}`])} onValueCommit={value => setSliderEvents(previous => [...previous, `commit:${value.join(':')}`])}>
        <Slider.Track style={{ width: '100%', height: '4px', background: 'silver', position: 'relative' }}><Slider.Range data-slider-range style={{ position: 'absolute', height: '100%', background: 'gray' }} /></Slider.Track>
        <Slider.Thumb aria-label="Lower level" style={thumbStyle} /><Slider.Thumb aria-label="Upper level" style={thumbStyle} />
      </Slider.Root>
      <output id="slider-events">{sliderEvents().join(',')}</output>
      <Slider.Root min={1000} max={101000} step={5000} defaultValue={[49000]} style={sliderStyle}><Slider.Track style={{ width: '100%', height: '4px', background: 'silver' }} /><Slider.Thumb aria-label="Offset level" style={thumbStyle} /></Slider.Root>
      <Slider.Root data-vertical-slider orientation="vertical" defaultValue={[30]} inverted={sliderInverted()} style={{ position: 'relative', display: 'block', width: '24px', height: '180px' }}><Slider.Track style={{ display: 'block', width: '4px', height: '100%', background: 'silver' }} /><Slider.Thumb aria-label="Vertical level" style={thumbStyle} /></Slider.Root>
      <label><input type="checkbox" checked={sliderAccept()} onChange={event => setSliderAccept(event.currentTarget.checked)} />Accept slider requests</label>
      <Slider.Root value={sliderValue()} onValueChange={value => { setSliderRequests(previous => [...previous, value.join(':')]); if (sliderAccept()) setSliderValue(value); }} name="controlled-level" form="slider-form" style={sliderStyle} asChild>
        {target => target('div', { children: <><Slider.Track asChild>{track => track('span', {})}</Slider.Track><Slider.unstable_ThumbProvider><Slider.unstable_ThumbTrigger aria-label="Controlled level" style={thumbStyle} asChild>{thumb => thumb('span', {})}</Slider.unstable_ThumbTrigger><Slider.unstable_BubbleInput data-controlled-level /></Slider.unstable_ThumbProvider></> })}
      </Slider.Root>
      <output id="slider-requests">{sliderRequests().join(',')}</output>
    </section>
    <section aria-label="Native scroll area">
      <label for="scroll-type">Scrollbar visibility</label><select id="scroll-type" value={scrollType()} onChange={event => setScrollType(event.currentTarget.value as 'always' | 'auto' | 'hover' | 'scroll')}><option value="always">Always</option><option value="auto">Auto</option><option value="hover">Hover</option><option value="scroll">Scroll</option></select>
      <label><input type="checkbox" checked={scrollRtl()} onChange={event => setScrollRtl(event.currentTarget.checked)} />RTL scroll area</label>
      <label><input type="checkbox" checked={scrollHorizontal()} onChange={event => setScrollHorizontal(event.currentTarget.checked)} />Horizontal scrollbar</label>
      <label><input type="checkbox" checked={scrollOverflow()} onChange={event => setScrollOverflow(event.currentTarget.checked)} />Overflow scroll content</label>
      <button onClick={() => setScrollMounted(value => !value)}>Toggle scroll area</button>
      <Show when={scrollMounted()}><ScrollArea.Root data-scroll-root type={scrollType()} dir={scrollRtl() ? 'rtl' : 'ltr'} scrollHideDelay={80} style={{ width: '220px', height: '140px', position: 'relative' }}>
        <ScrollArea.Viewport aria-label="Scrollable content" tabindex={0} style={{ width: '200px', height: '120px', 'scroll-behavior': 'auto' }} asChild>
          {target => target('div', { id: 'factory-scroll-viewport', children: <div style={{ width: scrollOverflow() ? '480px' : '100px', height: scrollOverflow() ? '600px' : '60px' }}><p style={{ margin: 0 }}>Scrollable native content</p><Show when={scrollOverflow()}><button>Inside scroll area</button></Show></div> })}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar data-scroll-y orientation="vertical" style={{ width: '12px', height: '120px', background: 'silver' }}><ScrollArea.Thumb data-scroll-thumb-y style={{ width: '100%', background: 'gray' }} /></ScrollArea.Scrollbar>
        <Show when={scrollHorizontal()}><ScrollArea.Scrollbar data-scroll-x orientation="horizontal" style={{ height: '12px', width: '200px', background: 'silver' }}><ScrollArea.Thumb data-scroll-thumb-x style={{ height: '100%', background: 'gray' }} /></ScrollArea.Scrollbar></Show>
        <ScrollArea.Corner data-scroll-corner style={{ background: 'gray' }} />
      </ScrollArea.Root></Show>
      <ScrollArea.Root type="always" style={{ width: '100px', height: '60px', position: 'relative' }}><ScrollArea.Viewport disableImplicitContentElement aria-label="Explicit scroll content" style={{ width: '80px', height: '50px' }}><ScrollArea.Content data-explicit-scroll-content style={{ width: '180px', height: '100px' }}>Explicit measurement element</ScrollArea.Content></ScrollArea.Viewport><ScrollArea.Scrollbar style={{ width: '10px' }}><ScrollArea.Thumb /></ScrollArea.Scrollbar></ScrollArea.Root>
    </section>
    <section aria-label="Native form validation">
      <label><input type="checkbox" checked={formCancelReset()} onChange={event => setFormCancelReset(event.currentTarget.checked)} />Cancel validation reset</label>
      <label><input type="checkbox" checked={requireExternalFormField()} onChange={event => setRequireExternalFormField(event.currentTarget.checked)} />Require external validation field</label>
      <label><input type="checkbox" checked={asyncServerError()} onChange={event => setAsyncServerError(event.currentTarget.checked)} />Reject validation submission asynchronously</label>
      <button onClick={() => setFormServerError(true)}>Set server error</button>
      <button onClick={() => remoteChecks.shift()?.resolve(true)}>Reject oldest email</button>
      <button onClick={() => remoteChecks.pop()?.resolve(false)}>Accept newest email</button>
      <button onClick={() => setFormFieldMounted(value => !value)}>Toggle validation field</button>
      <button onClick={() => setExtraMatcher(value => !value)}>Toggle unrelated email matcher</button>
      <Form.Root id="validation-form" onClearServerErrors={() => { setFormServerError(false); setFormEvents(previous => [...previous, 'clear']); }} onSubmit={event => {
        event.preventDefault();
        setFormEvents(previous => [...previous, `submit:${new FormData(event.currentTarget).get('email')}`]);
        if (asyncServerError()) setTimeout(() => setFormServerError(true), 0);
      }} onReset={event => { if (formCancelReset()) event.preventDefault(); }}>
        <label><input name="deny" type="checkbox" />Reject matching form data</label>
        <Show when={formFieldMounted()}><Form.Field name="email" serverInvalid={formServerError()}>
          <Form.Label>Validation email</Form.Label>
          <Form.Control type="email" required aria-describedby="email-help email-help" asChild>{target => target('input', {})}</Form.Control>
          <span id="email-help">A native email address</span>
          <Form.Message match="valueMissing">Email required</Form.Message>
          <Form.Message match="typeMismatch">Email type mismatch</Form.Message>
          <Form.Message match={(value, data) => value.includes('taken') || data.get('deny') === 'on'}>Email unavailable</Form.Message>
          <Form.Message match={remoteMatch}>Remote email unavailable</Form.Message>
          <Show when={extraMatcher()}><Form.Message match={() => false}>Additional email error</Form.Message></Show>
          <Show when={formServerError()}><Form.Message forceMatch>Server email error</Form.Message></Show>
          <Form.ValidityState>{validity => <output id="email-validity">{validity === undefined ? 'untouched' : validity.valid ? 'valid' : 'invalid'}</output>}</Form.ValidityState>
        </Form.Field></Show>
        <Form.Field name="other"><Form.Label>Second required field</Form.Label><Form.Control required /><Form.Message match="valueMissing">Second field required</Form.Message></Form.Field>
        <Form.Label name="outside" for="outside-form-input">Explicit form field</Form.Label>
        <Form.Control name="outside" id="outside-form-input" defaultValue={changedFormDefaults() ? 'revised' : 'outside'} />
        <Form.Message name="outside">Outside field instructions</Form.Message>
        <Form.Control name="choice" type="checkbox" defaultChecked={!changedFormDefaults()} defaultValue={changedFormDefaults() ? 'revised' : 'initial'} aria-label="Native default choice" asChild>{target => target('input', {})}</Form.Control>
        <button type="button" onClick={() => setChangedFormDefaults(value => !value)}>Change native form defaults</button>
        <NativePortal><section aria-label="External form controls"><Form.Control name="external" form="validation-form" aria-label="External validation field" required={requireExternalFormField()} /></section></NativePortal>
        <Form.Submit asChild>{target => target('button', { children: 'Submit validation form' })}</Form.Submit>
        <button type="reset">Reset validation form</button>
      </Form.Root>
      <output id="form-events">{formEvents().join(',')}</output><output id="form-matches">{formMatches().join(',')}</output>
    </section>
    <section aria-label="Required delete confirmation">
      <form id="primitive-confirm-form" onSubmit={event => { event.preventDefault(); setPrimitiveConfirmations(previous => [...previous, String(new FormData(event.currentTarget).get('confirm'))]); }}>
        <Checkbox.Root aria-label="Primitive delete confirmation" name="confirm" value="delete" required />
        <button type="submit">Submit primitive confirmation</button><button type="reset">Reset primitive confirmation</button>
      </form>
      <output id="primitive-confirmations">{primitiveConfirmations().join(',')}</output>
      <Theme>
        <form id="themed-confirm-form" onSubmit={event => { event.preventDefault(); setThemedConfirmations(previous => [...previous, String(new FormData(event.currentTarget).get('confirm'))]); }}>
          <ThemedCheckbox aria-label="Themed delete confirmation" name="confirm" value="delete" required />
          <button type="submit">Submit themed confirmation</button><button type="reset">Reset themed confirmation</button>
        </form>
      </Theme>
      <output id="themed-confirmations">{themedConfirmations().join(',')}</output>
    </section>
    <NotificationScenarios />
  </section>;
}

function NotificationScenarios(): Element {
  const [first, setFirst] = createSignal(false), [second, setSecond] = createSignal(false), [timed, setTimed] = createSignal(false);
  const [duration, setDuration] = createSignal(Infinity), [cancelEscape, setCancelEscape] = createSignal(false), [cancelSwipe, setCancelSwipe] = createSignal(false);
  const [events, setEvents] = createSignal<string[]>([]), [accept, setAccept] = createSignal(false), [controlled, setControlled] = createSignal(false);
  const [requests, setRequests] = createSignal<string[]>([]);
  const [branchCleanup, setBranchCleanup] = createSignal('unchecked');
  const record = (value: string) => setEvents(previous => [...previous, value]);
  return <section aria-label="Native notifications">
    <button onClick={() => { setFirst(true); setSecond(true); }}>Show stacked notifications</button>
    <button onClick={() => { setDuration(Infinity); setTimed(true); }}>Show timed notification</button>
    <button onClick={() => setControlled(true)}>Show controlled notification</button>
    <label><input type="checkbox" checked={cancelEscape()} onChange={event => setCancelEscape(event.currentTarget.checked)} />Cancel notification Escape</label>
    <label><input type="checkbox" checked={cancelSwipe()} onChange={event => setCancelSwipe(event.currentTarget.checked)} />Cancel notification swipe</label>
    <label><input type="checkbox" checked={accept()} onChange={event => setAccept(event.currentTarget.checked)} />Accept notification requests</label>
    <Toast.Provider duration={Infinity}>
      <Toast.Root open={first()} onOpenChange={setFirst} data-toast-first onClick={() => record('click')} onEscapeKeyDown={event => { if (cancelEscape()) event.preventDefault(); }} onSwipeStart={() => record('start')} onSwipeMove={() => record('move')} onSwipeCancel={() => record('cancel')} onSwipeEnd={event => { record('end'); if (cancelSwipe()) event.preventDefault(); }} style={{ width: '300px', padding: '12px', border: '1px solid gray', background: 'Canvas', color: 'CanvasText' }}>
        <Toast.Title>First notification</Toast.Title><Toast.Description>Saved first record<span hidden>Hidden announcement</span></Toast.Description>
        <Toast.Action altText="Undo from history" asChild>{target => target('button', { children: 'Undo first record' })}</Toast.Action>
        <Toast.Close aria-label="Dismiss first notification">Close</Toast.Close>
      </Toast.Root>
      <Toast.Root open={second()} onOpenChange={setSecond} data-toast-second type="background" style={{ width: '300px', padding: '12px', border: '1px solid gray', background: 'Canvas', color: 'CanvasText' }}>
        <Toast.Title>Second notification</Toast.Title><Toast.Description>Saved second record</Toast.Description>
        <Toast.Close aria-label="Dismiss second notification">Close</Toast.Close>
      </Toast.Root>
      <Toast.Root open={timed()} onOpenChange={setTimed} data-toast-timed duration={duration()} onPause={() => record('pause')} onResume={() => record('resume')} style={{ width: '300px', padding: '12px', background: 'Canvas', color: 'CanvasText' }}>
        <Toast.Title>Timed notification</Toast.Title><button onClick={() => setDuration(900)}>Use finite notification duration</button>
        <button onClick={() => setDuration(0)}>Use provider notification duration</button>
        <Toast.Close aria-label="Dismiss timed notification">Close</Toast.Close>
      </Toast.Root>
      <Toast.Root open={controlled()} onOpenChange={value => { setRequests(previous => [...previous, String(value)]); if (accept()) setControlled(value); }} data-toast-controlled>
        <Toast.Title>Controlled notification</Toast.Title><Toast.Close aria-label="Dismiss controlled notification">Close</Toast.Close>
      </Toast.Root>
      <NativePortal><Toast.Viewport label="Notifications ({hotkey})" data-toast-viewport style={{ position: 'fixed', right: '12px', bottom: '12px', width: '340px', margin: 0, padding: '12px', 'z-index': 10000, 'list-style': 'none' }} /></NativePortal>
      <Dialog.Root><Dialog.Trigger>Open notification dialog</Dialog.Trigger><Dialog.Portal><Dialog.Overlay style={{ position: 'fixed', inset: 0, background: '#0004' }} /><Dialog.Content style={{ position: 'fixed', left: '20px', top: '20px', padding: '20px', background: 'Canvas' }}><Dialog.Title>Notification dialog</Dialog.Title><Dialog.Description>Notifications remain interactive outside this modal.</Dialog.Description><button>Modal notification field</button><Dialog.Close>Close notification dialog</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
    </Toast.Provider>
    <output id="toast-events">{events().join(',')}</output><output id="toast-requests">{requests().join(',')}</output>
    <button>After notifications</button>
    <button onClick={async () => {
      const host = document.createElement('div'), branch = document.createElement('span');
      document.body.append(host, branch);
      let layer!: ReturnType<typeof createLayer>, deactivate!: () => void, dispose!: () => void;
      createRoot(cleanup => {
        dispose = cleanup;
        const [active, setActive] = createSignal(true);
        deactivate = () => setActive(false);
        layer = createLayer(() => host, { active, modal: () => false, trigger: () => undefined, dismiss: deactivate, kind: 'layer', focusScope: false });
      });
      let unregister: (() => void) | undefined;
      try {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        unregister = registerLayerBranch(branch);
        if (!layer.branches.has(branch)) throw new Error('Live branch was not registered');
        deactivate();
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        unregister();
        setBranchCleanup(layer.branches.has(branch) ? 'retained' : 'released');
      } finally { unregister?.(); dispose(); host.remove(); branch.remove(); }
    }}>Check notification branch cleanup</button>
    <output id="toast-branch-cleanup">{branchCleanup()}</output>
  </section>;
}
