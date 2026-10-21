import { createSignal, Errored, Show, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { FileDrop, FileDropInput, FileDropTrigger } from '@wsagency/radix2solid-primitives/file-drop';
import * as Form from '@wsagency/radix2solid-primitives/form';

type DynamicConflictKind = 'root-name' | 'root-form' | 'owner-name' | 'owner-form' | 'raw-child-name' | 'raw-child-form';

function DynamicConflictProbe(props: { kind: DynamicConflictKind; label: string }): Element {
  const [rootName, setRootName] = createSignal('docs');
  const [rootForm, setRootForm] = createSignal(`file-drop-f2-dynamic-${props.kind}-form`);
  const [ownerName, setOwnerName] = createSignal('docs');
  const [ownerForm, setOwnerForm] = createSignal(`file-drop-f2-dynamic-${props.kind}-form`);
  const [childName, setChildName] = createSignal('docs');
  const [childForm, setChildForm] = createSignal(`file-drop-f2-dynamic-${props.kind}-form`);
  const formId = `file-drop-f2-dynamic-${props.kind}-form`;
  const otherFormId = `${formId}-other`;
  const makeConflict = () => {
    switch (props.kind) {
      case 'root-name': setRootName('other-docs'); break;
      case 'root-form': setRootForm(otherFormId); break;
      case 'owner-name': setOwnerName('other-docs'); break;
      case 'owner-form': setOwnerForm(otherFormId); break;
      case 'raw-child-name': setChildName('other-docs'); break;
      case 'raw-child-form': setChildForm(otherFormId); break;
    }
  };
  return <div>
    <button type="button" onClick={makeConflict}>Make F2 {props.label} conflict</button>
    <Errored fallback={error => {
      const failure = error();
      if (!(failure instanceof TypeError)) throw failure;
      return <div role="alert" aria-label="F2 dynamic configuration rejected" />;
    }}>
      <form id={otherFormId} />
      <Form.Root id={formId}>
        <Form.Field name={ownerName()}>
          <FileDrop id={`${formId}-zone`} name={rootName()} form={rootForm()}>
            <Form.Control id={`${formId}-input`} form={ownerForm()} aria-label={`Dynamic ${props.label} FileDrop input`} asChild>
              {target => target(FileDropInput, {
                asChild: true,
                children: inputTarget => inputTarget('input', {
                  get name() { return childName(); },
                  get form() { return childForm(); }
                })
              })}
            </Form.Control>
          </FileDrop>
        </Form.Field>
      </Form.Root>
    </Errored>
  </div>;
}

function DynamicTriggerDisabledProbe(): Element {
  const [rootDisabled, setRootDisabled] = createSignal(true);
  const [triggerDisabled, setTriggerDisabled] = createSignal(false);
  return <>
    <FileDrop id="file-drop-f2-disabled-precedence" name="disabled-precedence" disabled={rootDisabled()}>
      <FileDropInput id="file-drop-f2-disabled-precedence-input" aria-label="Disabled precedence test files" />
      <FileDropTrigger disabled={triggerDisabled()}>F2 effective-disabled trigger</FileDropTrigger>
    </FileDrop>
    <button type="button" onClick={() => setRootDisabled(value => !value)}>Toggle F2 Trigger Root disabled</button>
    <button type="button" onClick={() => setTriggerDisabled(value => !value)}>Toggle F2 Trigger native disabled</button>
  </>;
}


export function FileDropExamples(): Element {
  const [singleFiles, setSingleFiles] = createSignal<readonly File[]>([]);
  const [singleChanges, setSingleChanges] = createSignal(0);
  const [singleRejection, setSingleRejection] = createSignal('');
  const [preventNextDrop, setPreventNextDrop] = createSignal(false);
  const [multipleFiles, setMultipleFiles] = createSignal<readonly File[]>([]);
  const [multipleRejection, setMultipleRejection] = createSignal('');
  const [controlledFiles, setControlledFiles] = createSignal<readonly File[]>([]);
  const [proposedFiles, setProposedFiles] = createSignal<readonly File[]>([]);
  const [autoAcceptProposals, setAutoAcceptProposals] = createSignal(false);
  const [reentrantReplacement, setReentrantReplacement] = createSignal(false);
  const [f2Accept, setF2Accept] = createSignal('.txt');
  const [f2Multiple, setF2Multiple] = createSignal(false);
  const [f2Disabled, setF2Disabled] = createSignal(false);
  const [f2Rejections, setF2Rejections] = createSignal(0);
  const [f2Proposals, setF2Proposals] = createSignal(0);
  const [f2InputEvents, setF2InputEvents] = createSignal(0);
  const [f2ChangeEvents, setF2ChangeEvents] = createSignal(0);
  const [adoptRejectedCandidate, setAdoptRejectedCandidate] = createSignal(false);
  const [narrowAcceptOnNextProposal, setNarrowAcceptOnNextProposal] = createSignal(false);
  let f2NativeInput: HTMLInputElement | undefined;
  const [cancelDefaultReset, setCancelDefaultReset] = createSignal(false);
  const [externalForm, setExternalForm] = createSignal('file-drop-f2-external-form');
  const [pendingMounted, setPendingMounted] = createSignal(true);
  const [pendingProposals, setPendingProposals] = createSignal(0);
  const [defaultMounted, setDefaultMounted] = createSignal(true);
  const [defaultProposals, setDefaultProposals] = createSignal(0);
  const [defaultEvents, setDefaultEvents] = createSignal(0);
  const [disposedFiles] = createSignal<readonly File[]>([]);
  const [configConflict, setConfigConflict] = createSignal<'target-name' | 'field-name' | 'target-form' | 'control-form'>();
  const pendingFileChecks: ((invalid: boolean) => void)[] = [];
  const [pendingFileCheckCount, setPendingFileCheckCount] = createSignal(0);
  const pendingPublicChecks: ((invalid: boolean) => void)[] = [];
  const [pendingPublicCheckCount, setPendingPublicCheckCount] = createSignal(0);
  const [holdPublicValidation, setHoldPublicValidation] = createSignal(false);
  const [publicMatcherMounted, setPublicMatcherMounted] = createSignal(true);
  const sameMetadataFile = (contents: string) => new File([contents], 'same.txt', { type: 'text/plain', lastModified: 0 });
  const [defaultA] = createSignal<readonly File[]>(isServer ? [] : [new File(['alpha'], 'alpha.txt', { type: 'text/plain', lastModified: 0 })]);
  const [defaultB] = createSignal<readonly File[]>(isServer ? [] : [new File(['bravo'], 'bravo.txt', { type: 'text/plain', lastModified: 0 })]);
  return <section aria-label="Native FileDrop">
    <form id="file-drop-form">
      <FileDrop id="file-drop-zone" name="file-drop-files" accept=".txt" required multiple={false}
        onValueChange={files => { setSingleFiles(files); setSingleChanges(count => count + 1); }}
        onReject={rejection => setSingleRejection(rejection.reason)}
        onDrop={event => { if (preventNextDrop()) event.preventDefault(); }}>
        <label for="file-drop-input">Choose files</label>
        <p id="file-drop-description">Required text file (.txt); choose one file.</p>
        <FileDropInput id="file-drop-input" aria-label="Choose files" aria-describedby="file-drop-description" />
        <FileDropTrigger>Browse files</FileDropTrigger>
        <span data-file-drop-nested>Drop files here</span>
        <output id="file-drop-selection">{singleFiles().map(file => file.name).join(',')}</output>
        <output id="file-drop-change-count">{singleChanges()}</output>
        <output id="file-drop-rejections">{singleRejection()}</output>
      </FileDrop>
    </form>
    <button type="button" onClick={() => setPreventNextDrop(true)}>Prevent next drop processing</button>
    <form id="file-drop-multiple-form">
      <FileDrop id="file-drop-multiple-zone" name="multiple-file-drop-files" accept=".txt" multiple
        onValueChange={setMultipleFiles} onReject={rejection => setMultipleRejection(rejection.reason)}>
        <label for="file-drop-multiple-input">Choose multiple files</label>
        <p id="file-drop-multiple-description">Text files (.txt); multiple files are allowed.</p>
        <FileDropInput id="file-drop-multiple-input" aria-label="Choose multiple files" aria-describedby="file-drop-multiple-description" />
        <FileDropTrigger>Browse multiple files</FileDropTrigger>
        <span data-file-drop-nested>Drop files here</span>
        <output id="file-drop-multiple-selection">{multipleFiles().map(file => file.name).join(',')}</output>
        <output id="file-drop-multiple-rejections">{multipleRejection()}</output>
      </FileDrop>
    </form>
    <section aria-label="Native FileDrop F2">
      <Form.Root id="file-drop-f2-form">
        <Form.Field name="docs">
          <FileDrop id="file-drop-f2-zone" name="docs" form="file-drop-f2-form" accept={f2Accept()} required
            multiple={f2Multiple()} disabled={f2Disabled()} value={controlledFiles()}
            onValueChange={files => {
              setProposedFiles(files); setF2Proposals(count => count + 1);
              if (narrowAcceptOnNextProposal()) {
                setControlledFiles(files);
                setF2Accept('.json');
                setNarrowAcceptOnNextProposal(false);
              } else if (reentrantReplacement()) {
                setControlledFiles(files);
                setControlledFiles([new File(['latest'], 'latest.txt', { type: 'text/plain', lastModified: 0 })]);
                setReentrantReplacement(false);
              } else if (autoAcceptProposals()) { setControlledFiles(files); setAutoAcceptProposals(false); }
            }}
            onReject={rejection => {
              setF2Rejections(count => count + 1);
              if (adoptRejectedCandidate()) {
                setControlledFiles(rejection.files);
                setAdoptRejectedCandidate(false);
              }
            }}>
            <Form.Label>Documents</Form.Label>
            <p id="file-drop-f2-wrapper-description">Required single document.</p>
            <p id="file-drop-f2-child-description">Provisional upload matcher.</p>
            <Form.Control id="file-drop-f2-input" type="file" form="file-drop-f2-form" aria-describedby="file-drop-f2-wrapper-description"
              ref={node => { f2NativeInput = node; }} asChild onInput={() => setF2InputEvents(count => count + 1)} onChange={() => setF2ChangeEvents(count => count + 1)}>
              {target => target(FileDropInput, {
                asChild: true,
                children: inputTarget => inputTarget('input', {
                  id: 'file-drop-f2-masked-id', name: 'docs', form: 'file-drop-f2-form',
                  type: 'text', multiple: true, accept: '.txt,.exe', required: false, disabled: true, readonly: true,
                  value: '', defaultValue: '',
                  'aria-describedby': 'file-drop-f2-child-description',
                  onInput: () => setF2InputEvents(count => count + 1),
                  onChange: () => setF2ChangeEvents(count => count + 1)
                })
              })}
            </Form.Control>
            <FileDropTrigger>Browse F2 files</FileDropTrigger>
            <button type="button" onClick={() => f2NativeInput?.focus()}>Focus captured F2 input</button>
            <output aria-label="F2 controlled selection">{controlledFiles().map(file => file.name).join(',')}</output>
            <output aria-label="F2 proposal count">{f2Proposals()}</output>
            <output aria-label="F2 rejection count">{f2Rejections()}</output>
            <output aria-label="F2 raw input count">{f2InputEvents()}</output>
            <output aria-label="F2 raw change count">{f2ChangeEvents()}</output>
            <Form.ValidityState>{validity => <output aria-label="F2 public custom error">{String(!!validity?.customError)}</output>}</Form.ValidityState>
            <output aria-label="F2 provisional matcher pending">{pendingFileCheckCount()}</output>
            <Show when={publicMatcherMounted()}>
              <Form.Message match={(_value, data) => {
                const file = data.get('docs');
                if (!(file instanceof File)) return false;
                if (holdPublicValidation()) {
                  return new Promise<boolean>(resolve => {
                    pendingPublicChecks.push(resolve);
                    setPendingPublicCheckCount(pendingPublicChecks.length);
                  });
                }
                return file.text().then(contents => contents === 'evil'
                  ? new Promise<boolean>(resolve => {
                    pendingFileChecks.push(resolve);
                    setPendingFileCheckCount(pendingFileChecks.length);
                  })
                  : false);
              }}>Current accepted files invalid</Form.Message>
            </Show>
          </FileDrop>
        </Form.Field>
        <button type="button" onClick={() => {
          const file = sameMetadataFile('kept');
          setControlledFiles([file]); setProposedFiles([file]);
        }}>Keep accepted same-name file</button>
        <button type="button" onClick={() => setControlledFiles([sameMetadataFile('good')])}>Replace accepted same-name file</button>
        <button type="button" onClick={() => setControlledFiles(proposedFiles())}>Adopt proposed files</button>
        <button type="button" onClick={() => setF2Accept(value => value === '.txt' ? '.exe' : '.txt')}>Toggle accepted extension</button>
        <button type="button" onClick={() => setControlledFiles([
          new File(['one'], 'one.txt', { type: 'text/plain', lastModified: 0 }),
          new File(['two'], 'two.txt', { type: 'text/plain', lastModified: 0 })
        ])}>Set accepted two files</button>
        <button type="button" onClick={() => setControlledFiles([...controlledFiles()])}>Rewrap accepted File list</button>
        <button type="button" onClick={() => setReentrantReplacement(true)}>Adopt candidate then replace it</button>
        <button type="button" onClick={() => setF2Multiple(value => !value)}>Toggle accepted multiple</button>
        <button type="button" onClick={() => setAutoAcceptProposals(true)}>Accept next proposal immediately</button>
        <button type="button" onClick={() => setAdoptRejectedCandidate(true)}>Adopt rejected F2 candidate</button>
        <button type="button" onClick={() => {
          setF2Accept('.txt,.json');
          setF2Multiple(false);
          setHoldPublicValidation(false);
          setControlledFiles([new File(['kept'], 'kept.txt', { type: 'text/plain', lastModified: 0 })]);
        }}>Prepare exact F2 policy transition</button>
        <button type="button" onClick={() => setNarrowAcceptOnNextProposal(true)}>Adopt next proposal and narrow accept to .json</button>
        <button type="button" onClick={() => setF2Disabled(value => !value)}>Toggle F2 disabled</button>
        <button type="button" disabled={pendingFileCheckCount() === 0} onClick={() => {
          const resolve = pendingFileChecks.shift();
          if (resolve) {
            setPendingFileCheckCount(pendingFileChecks.length);
            resolve(true);
          }
        }}>Resolve provisional matcher</button>
        <button type="submit">Submit F2 form</button>
        <button type="reset">Reset F2 form</button>
      </Form.Root>
      <output aria-label="F2 public matcher pending">{pendingPublicCheckCount()}</output>
      <button type="button" onClick={() => setHoldPublicValidation(true)}>Hold public Form validations</button>
      <button type="button" disabled={pendingPublicCheckCount() === 0} onClick={() => {
        const pending = pendingPublicChecks.splice(0);
        setPendingPublicCheckCount(0);
        for (const resolve of pending) resolve(true);
      }}>Resolve all held Form validations</button>
      <button type="button" onClick={() => setPublicMatcherMounted(false)}>Unmount F2 Form.Message</button>
      <form id="file-drop-f2-external-form" />
      <form id="file-drop-f2-other-form" />
      <FileDrop id="file-drop-f2-external" name="external-files" form={externalForm()}>
        <FileDropInput id="file-drop-f2-external-input" aria-label="External form files" />
      </FileDrop>
      <button type="button" onClick={() => setExternalForm(value => value === 'file-drop-f2-external-form' ? 'file-drop-f2-other-form' : 'file-drop-f2-external-form')}>
        Reassociate external form
      </button>
      <Show when={defaultMounted()}>
        <form id="file-drop-f2-default-form" onReset={event => { if (cancelDefaultReset()) event.preventDefault(); }}>
          <FileDrop id="file-drop-f2-default-a" name="default-a-files" defaultValue={defaultA()}
            onValueChange={() => setDefaultProposals(count => count + 1)}>
            <FileDropInput id="file-drop-f2-default-a-input" aria-label="Default alpha files" onInput={() => setDefaultEvents(count => count + 1)}
              onChange={() => setDefaultEvents(count => count + 1)} />
          </FileDrop>
          <FileDrop id="file-drop-f2-default-b" name="default-b-files" defaultValue={defaultB()}
            onValueChange={() => setDefaultProposals(count => count + 1)}>
            <FileDropInput id="file-drop-f2-default-b-input" aria-label="Default bravo files" onInput={() => setDefaultEvents(count => count + 1)}
              onChange={() => setDefaultEvents(count => count + 1)} />
          </FileDrop>
          <button type="reset">Reset default files</button>
        </form>
      </Show>
      <button type="button" onClick={() => setDefaultMounted(value => !value)}>Toggle default instances</button>
      <button type="button" onClick={() => setCancelDefaultReset(value => !value)}>Toggle reset cancellation</button>
      <output aria-label="F2 default proposals">{defaultProposals()}</output>
      <output aria-label="F2 default events">{defaultEvents()}</output>
      <div onChange={event => {
        if ((event.target as HTMLInputElement).id === 'file-drop-f2-disposed-input') setPendingMounted(false);
      }}>
        <Show when={pendingMounted()}>
          <FileDrop id="file-drop-f2-disposed" name="disposed-files" value={disposedFiles()}
            onValueChange={() => setPendingProposals(count => count + 1)}>
            <FileDropInput id="file-drop-f2-disposed-input" aria-label="Disposed lifecycle test files" />
          </FileDrop>
        </Show>
      </div>
      <output aria-label="F2 disposed proposals">{pendingProposals()}</output>
      <Errored fallback={error => {
        const failure = error();
        if (!(failure instanceof TypeError)) throw failure;
        return <div role="alert" aria-label="FileDrop composition rejected">{failure.message}</div>;
      }}>
        <button type="button" onClick={() => setConfigConflict('target-name')}>Mount conflicting target name</button>
        <button type="button" onClick={() => setConfigConflict('field-name')}>Mount masked field name</button>
        <button type="button" onClick={() => setConfigConflict('target-form')}>Mount conflicting target form</button>
        <button type="button" onClick={() => setConfigConflict('control-form')}>Mount conflicting Form.Control form</button>
        <Show when={configConflict() === 'target-name'}>
          <Form.Root id="file-drop-f2-invalid-name-form">
            <FileDrop id="file-drop-f2-invalid-name" name="docs">
              <Form.Control name="docs" asChild>
                {target => target(FileDropInput, { asChild: true, children: inputTarget =>
                  inputTarget('input', { name: 'other-name' }) })}
              </Form.Control>
            </FileDrop>
          </Form.Root>
        </Show>
        <Show when={configConflict() === 'field-name'}>
          <Form.Root id="file-drop-f2-masked-field-form">
            <Form.Field name="different-field">
              <FileDrop id="file-drop-f2-masked-field" name="docs">
                <Form.Control asChild>
                  {target => target(FileDropInput, { asChild: true, children: inputTarget =>
                    inputTarget('input', { name: 'docs' }) })}
                </Form.Control>
              </FileDrop>
            </Form.Field>
          </Form.Root>
        </Show>
        <Show when={configConflict() === 'target-form'}>
          <Form.Root id="file-drop-f2-invalid-form">
            <FileDrop id="file-drop-f2-invalid-association" name="docs" form="file-drop-f2-invalid-form">
              <Form.Control name="docs" form="file-drop-f2-invalid-form" asChild>
                {target => target(FileDropInput, { asChild: true, children: inputTarget =>
                  inputTarget('input', { name: 'docs', form: 'other-form' }) })}
              </Form.Control>
            </FileDrop>
          </Form.Root>
        </Show>
        <Show when={configConflict() === 'control-form'}>
          <Form.Root id="file-drop-f2-invalid-control-form">
            <FileDrop id="file-drop-f2-invalid-control-association" name="docs" form="file-drop-f2-invalid-control-form">
              <Form.Control name="docs" form="other-form" asChild>
                {target => target(FileDropInput, { asChild: true, children: inputTarget =>
                  inputTarget('input', { name: 'docs', form: 'file-drop-f2-invalid-control-form' }) })}
              </Form.Control>
            </FileDrop>
          </Form.Root>
        </Show>
      </Errored>
      <section aria-label="F2 dynamic name and form conflicts">
        <DynamicConflictProbe kind="root-name" label="Root name" />
        <DynamicConflictProbe kind="root-form" label="Root form" />
        <DynamicConflictProbe kind="owner-name" label="owner name" />
        <DynamicConflictProbe kind="owner-form" label="owner form" />
        <DynamicConflictProbe kind="raw-child-name" label="raw-child name" />
        <DynamicConflictProbe kind="raw-child-form" label="raw-child form" />
      </section>
      <DynamicTriggerDisabledProbe />
    </section>
  </section>;
}
