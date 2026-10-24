// noinspection JSUnusedGlobalSymbols

import { render } from 'pele';
import { defineHastPlugin, defineMdastPlugin } from 'satteri';
import type { SatteriPeleOptions } from './types';

const NAMESPACE = 'satteri-pele';
const DATA_KEY = 'data-satteri-pele';

declare module 'satteri' {
  interface DataMap {
    'satteri-pele': {
      // an auto increment id, for avoiding accidental svg reference
      nextId: number;
    };
  }
}

export const peleMdast = (options: SatteriPeleOptions = {}) => {
  const languages = options.languages ?? ['mermaid'];
  return defineMdastPlugin({
    name: NAMESPACE,
    before(_root, ctx) {
      ctx.data[NAMESPACE] = { nextId: 0 };
    },
    code(node, ctx) {
      if (typeof node.lang !== 'string' || !languages.includes(node.lang)) {
        return;
      }
      ctx.replaceNode(node, {
        type: 'MermaidPlaceholder',
        children: [],
        data: {
          hName: 'pre',
          hProperties: {
            [DATA_KEY]: node.value,
          },
        },
      });
    },
  });
};

export const peleHast = (options: SatteriPeleOptions = {}) => {
  return defineHastPlugin({
    name: NAMESPACE,
    element: {
      filter: ['pre'],
      visit(node, ctx) {
        const data = ctx.data[NAMESPACE];
        const source = node.properties[DATA_KEY];
        if (!data || typeof source !== 'string') return;

        const prefix = options.renderOptions?.idPrefix ?? NAMESPACE;
        const { svg } = render(source, {
          ...options.renderOptions,
          idPrefix: `${prefix}-${data.nextId}`,
        });
        data.nextId++;
        ctx.replaceNode(node, { type: 'raw', value: svg });
      },
    },
  });
};
