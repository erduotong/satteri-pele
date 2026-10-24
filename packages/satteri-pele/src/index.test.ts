import { render } from 'pele';
import { markdownToHtml } from 'satteri';
import { expect, it } from 'vitest';
import type { SatteriPeleOptions } from './index';
import { peleHast, peleMdast } from './index';

const flowchart = `flowchart LR
accTitle: Example
accDescr: A simple flowchart
A --> B`;

const codeBlock = (language: string, source: string) => `
\`\`\`${language}
${source}
\`\`\`
`;

const convert = (source: string, options: SatteriPeleOptions = {}) =>
  markdownToHtml(source, {
    mdastPlugins: [peleMdast(options)],
    hastPlugins: [peleHast(options)],
  }).html;

const getSvgIds = (svg: string) =>
  [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);

it('renders a Mermaid code block as an inline SVG', () => {
  const { svg } = render(flowchart, { idPrefix: 'satteri-pele-0' });
  const html = convert(codeBlock('mermaid', flowchart));

  expect(html.trimEnd()).toBe(svg);
});

it('preserves other code blocks alongside a Mermaid diagram', () => {
  const otherCode = [
    codeBlock('js', 'console.log("hello");'),
    codeBlock('python', 'print("hello")'),
    codeBlock('', 'plain code'),
  ].join('\n\n');
  const source = [codeBlock('mermaid', flowchart), otherCode].join('\n\n');

  const html = convert(source);

  expect(html.match(/<svg\b/g)).toHaveLength(1);
  expect(html).toContain(markdownToHtml(otherCode).html);
});

it('renders mmd only when it is included in custom languages', () => {
  const source = codeBlock('mmd', flowchart);

  expect(convert(source)).toBe(markdownToHtml(source).html);
  expect(convert(source, { languages: ['mmd'] })).toMatch(/^<svg\b/);

  const mermaidSource = codeBlock('mermaid', flowchart);
  expect(convert(mermaidSource, { languages: ['mmd'] })).toBe(
    markdownToHtml(mermaidSource).html,
  );
});

it.each([
  { idPrefix: undefined, expectedPrefix: 'satteri-pele-0-' },
  { idPrefix: 'article', expectedPrefix: 'article-0-' },
])(
  'prefixes SVG IDs with $expectedPrefix when renderOptions.idPrefix is $idPrefix',
  ({ idPrefix, expectedPrefix }) => {
    const html = convert(codeBlock('mermaid', flowchart), {
      renderOptions: { idPrefix },
    });
    const ids = getSvgIds(html);

    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(id.startsWith(expectedPrefix)).toBe(true);
    }
    expect(html).toContain(`aria-labelledby="${expectedPrefix}`);
  },
);

it('keeps SVG IDs unique and references local to each diagram', () => {
  const sankey = `sankey

A,B,10
B,C,5`;
  const source = [flowchart, flowchart, sankey, sankey]
    .map((diagram) => codeBlock('mermaid', diagram))
    .join('\n\n');
  const html = convert(source);
  const svgs = [...html.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map(
    (match) => match[0],
  );
  const ids = svgs.flatMap(getSvgIds);

  expect(svgs).toHaveLength(4);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);

  for (const svg of svgs) {
    const localIds = new Set(getSvgIds(svg));
    const urlReferences = [...svg.matchAll(/url\(#([^)]+)\)/g)].map(
      (match) => match[1],
    );
    const ariaReferences = [
      ...svg.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g),
    ].flatMap((match) => match[1].split(/\s+/));
    const references = [...urlReferences, ...ariaReferences];

    expect(localIds.size).toBeGreaterThan(0);
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      expect(localIds.has(reference)).toBe(true);
    }
  }
});
