import { editorConfig } from '../config/editor-config';
import type { EditorState } from '../model/state';
import { resizeViewport } from '../viewport/viewport';

export function setupSidebarDivider(state: EditorState): void {
  const divider = document.getElementById('divider');
  const sidebar = document.getElementById('sidebar');

  state.ui.divider = divider;
  state.ui.sidebar = sidebar;

  if (!divider || !sidebar) {
    return;
  }

  divider.addEventListener('mousedown', () => {
    state.ui.isResizingSidebar = true;
  });

  window.addEventListener('mouseup', () => {
    state.ui.isResizingSidebar = false;
  });

  window.addEventListener('mousemove', (event) => {
    if (!state.ui.isResizingSidebar) {
      return;
    }

    const newWidth = clamp(
      window.innerWidth - event.clientX,
      editorConfig.sidebar.minWidth,
      editorConfig.sidebar.maxWidth
    );

    sidebar.style.width = `${newWidth}px`;
    resizeViewport(state);
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
