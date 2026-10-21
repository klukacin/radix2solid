import assert from "node:assert/strict";
import { test } from "node:test";

import { renderToString } from "@solidjs/web";
import { Theme, type ThemeProps } from "@wsagency/radix2solid-themes";
import { createComponent } from "solid-js";

const render = (props: ThemeProps) =>
  renderToString(() => createComponent(Theme, props));

test("server themes serialize independent percentage factors and inherited palette identities", () => {
  const html = render({
    accentColor: "custom",
    customAccent: "calm",
    scaling: "115%",
    get children() {
      return [
        createComponent(Theme, {
          id: "sidebar",
          scaling: "90%",
          children: "Sidebar",
        }),
        createComponent(Theme, {
          id: "content",
          scaling: "120%",
          customAccent: "brand-b",
          children: "Content",
        }),
        createComponent(Theme, {
          id: "inherited",
          accentColor: "jade",
          children: "Inherited",
        }),
      ];
    },
  });
  assert.match(html, /data-custom-accent="calm"/);
  assert.match(html, /--radix-scaling:\s*1\.15/);
  for (const [id, identity, factor] of [
    ["sidebar", "calm", "0.9"],
    ["content", "brand-b", "1.2"],
    ["inherited", "calm", "1.15"],
  ]) {
    const element = [...html.matchAll(/<div\b[^>]*>/g)].find(([tag]) =>
      tag.includes(`id="${id}"`),
    )?.[0];
    assert.ok(element, id);
    assert.ok(element.includes(`data-custom-accent="${identity}"`), element);
    assert.match(
      element,
      new RegExp(
        `--radix-scaling:\\s*${factor.replace(".", "\\.")}(?:;|&|"|\\s)`,
      ),
    );
  }
  assert.match(html, /data-gray-color="gray"/);
});

test("server themes reject invalid scaling and ambiguous custom identities instead of silently falling back", () => {
  for (const scaling of [
    "0%",
    "-1%",
    "Infinity%",
    "NaN%",
    "",
    "100",
    "1px",
    "1e999%",
    "1e-999%",
  ]) {
    assert.throws(
      () => render({ scaling: scaling as ThemeProps["scaling"] }),
      /scaling/i,
      scaling,
    );
  }
  for (const scaling of ["87.5%", "1.15e2%", "120%"] as const)
    assert.match(render({ scaling }), /--radix-scaling:/);
  for (const customAccent of ["", "space name", "#color", "1brand"]) {
    assert.throws(
      () => render({ customAccent }),
      /customAccent/i,
      customAccent,
    );
  }
  assert.throws(() => render({ accentColor: "custom" }), /customAccent/i);
  const html = render({ scaling: "115%", style: "--scaling: 1.3; color: red" });
  assert.match(html, /--scaling:\s*1\.3/);
  assert.match(html, /--radix-scaling:\s*1\.15/);
});
