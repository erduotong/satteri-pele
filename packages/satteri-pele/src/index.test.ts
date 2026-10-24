import { defineHastPlugin, markdownToHtml } from 'satteri';
import { expect, it } from 'vitest';
import { peleHast, peleMdast } from './plugin';

it('查看转换结果', () => {
  const source = ['```mermaid', 'flowchart LR', '  A --> B', '```'].join('\n');

  const result = markdownToHtml(source, {
    mdastPlugins: [peleMdast({})],
    hastPlugins: [peleHast({})],
  });

  console.log(result.html);
});
