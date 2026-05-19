import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EditorMode } from './mode';
import { CommandManager } from './command/command';

export interface EditorState {
  scene: Three.Scene;
  isDragging: boolean;
  camera: Three.PerspectiveCamera;
  renderer: Three.WebGLRenderer;
  controls: OrbitControls;
  viewport: {
    container: HTMLElement;
    resizeObserver: ResizeObserver;
    animationFrameId: number | null;
  };
  ui: {
    sidebar: HTMLElement | null;
    divider: HTMLElement | null;
    isResizingSidebar: boolean;
  };
  selection: {
    object: Three.Object3D | null;
  };
  mode: EditorMode;
  commandManager: CommandManager;
}

let activeState: EditorState | null = null;

export function setEditorState(state: EditorState): EditorState {
  activeState = state;
  return activeState;
}

export function getEditorState(): EditorState {
  if (!activeState) {
    throw new Error('Editor state has not been initialized.');
  }

  return activeState;
}

export function clearEditorState(): void {
  activeState = null;
}

export function setSelectedObject(object: Three.Object3D | null): void {
  getEditorState().selection.object = object;
}
