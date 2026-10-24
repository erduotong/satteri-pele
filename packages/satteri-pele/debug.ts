import { markdownToHtml } from 'satteri';
import { peleHast, peleMdast } from './src';

const source = ['```mermaid', 'flowchart LR', '  A --> B', '```'].join('\n');

const result = markdownToHtml(source, {
  mdastPlugins: [peleMdast()],
  hastPlugins: [peleHast()],
});

console.log(result.html);
