import { setEditorState } from './model/state';
import { populateDefaultScene } from './scene/default-scene';
import { setupSidebarDivider } from './ui/sidebar-divider';
import { createViewport, startViewport } from './viewport/viewport';

export function bootEditor(): void {
  const container = document.getElementById('canvas-container');

  if (!container) {
    throw new Error('Missing #canvas-container');
  }

  const state = setEditorState(createViewport(container));

  populateDefaultScene(state);
  setupSidebarDivider(state);
  startViewport(state);
}
