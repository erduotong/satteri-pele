import type { RenderOptions } from 'pele';

export interface SatteriPeleOptions {
  /**
   *
   * @default ["mermaid"]
   */
  languages?: readonly string[];

  renderOptions?: RenderOptions;
}
