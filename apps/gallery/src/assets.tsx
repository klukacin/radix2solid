import {
  blue,
  blueDark,
  blueA,
  blueDarkA,
  blueP3,
  blueDarkP3,
} from "@radix-ui/colors";
import {
  AccessibilityIcon,
  CheckIcon,
  SlashIcon,
  SketchLogoIcon,
  PanelLeftIcon,
  PanelRightIcon,
} from "@wsagency/radix2solid-icons";
import { FolderIcon, FolderOpenIcon } from "@wsagency/radix2solid-icons-extra";
import folderDownload from "@wsagency/radix2solid-icons-extra/icons/folder.svg?url";
import svgDownload from "@wsagency/radix2solid-icons/icons/accessibility.svg?url";
import { createSignal, type Element } from "solid-js";

import "@radix-ui/colors/blue.css";
import "@radix-ui/colors/blue-dark.css";
import "@radix-ui/colors/blue-alpha.css";
import "@radix-ui/colors/blue-dark-alpha.css";

export function Assets(): Element {
  const [large, setLarge] = createSignal(false),
    [named, setNamed] = createSignal(true);
  const [reference, setReference] = createSignal("unmounted");
  const [folderReference, setFolderReference] = createSignal("none"),
    [folderEvent, setFolderEvent] = createSignal("none");
  // Native refs run before attributes are applied, so the captured node is only inspected after mount, on a trusted click.
  let folderNode: SVGSVGElement | undefined;
  return (
    <section aria-label="Native icons and reused Colors">
      <h2>Icons and Colors</h2>
      <button onClick={() => setLarge((value) => !value)}>
        Change icon size and color
      </button>
      <button onClick={() => setNamed((value) => !value)}>
        Change icon accessible title
      </button>
      <div style={{ color: "rgb(12, 34, 56)" }}>
        <AccessibilityIcon
          id="asset-accessibility"
          size={large() ? 32 : 15}
          color={large() ? "tomato" : undefined}
          title={named() ? "Accessible person" : undefined}
          ref={(node) => setReference(node?.localName ?? "unmounted")}
        />
        <CheckIcon
          id="asset-check"
          size={40}
          width={23}
          height={19}
          aria-label="Completed"
        />
        <SlashIcon
          id="asset-slash"
          stroke="purple"
        />
        <SketchLogoIcon
          id="asset-logo"
          title="Sketch logo"
        />
        <PanelLeftIcon id="asset-panel-left" />
        <PanelRightIcon id="asset-panel-right" />
        <FolderIcon
          id="asset-folder"
          title={named() ? "Project folder" : undefined}
          color={large() ? "tomato" : undefined}
          ref={(node) => {
            folderNode = node;
          }}
          onClick={(event) => {
            setFolderEvent(`${event.type} ${event.currentTarget.localName}`);
            setFolderReference(
              !folderNode
                ? "unmounted"
                : folderNode === event.currentTarget
                  ? `${folderNode.localName}#${folderNode.id}`
                  : "detached",
            );
          }}
        />
        <FolderOpenIcon id="asset-folder-open" />
      </div>
      <output id="asset-ref">{reference()}</output>
      <output id="asset-folder-ref">{folderReference()}</output>
      <output id="asset-folder-event">{folderEvent()}</output>
      <a
        href={svgDownload}
        download="accessibility.svg"
      >
        Download original Accessibility SVG
      </a>
      <a
        href={folderDownload}
        download="folder.svg"
      >
        Download original Folder SVG
      </a>
      <div
        class="light"
        id="asset-light"
        style={{ background: "var(--blue-2)", color: "var(--blue-12)" }}
      >
        Light blue
      </div>
      <div
        class="dark"
        id="asset-dark"
        style={{ background: "var(--blue-2)", color: "var(--blue-12)" }}
      >
        Dark blue
      </div>
      <output id="asset-color-exports">
        {JSON.stringify({
          light: blue.blue2,
          dark: blueDark.blue2,
          alpha: blueA.blueA3,
          darkAlpha: blueDarkA.blueA3,
          p3: blueP3.blue2,
          darkP3: blueDarkP3.blue2,
        })}
      </output>
    </section>
  );
}
