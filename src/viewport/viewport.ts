import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { editorConfig } from '../config/editor-config';
import type { EditorState } from '../model/state';
import { editorLayers } from '../scene/layers';

export function createViewport(container: HTMLElement): EditorState {
  const scene = new Three.Scene();
  const camera = createCamera(container);
  const renderer = createRenderer(container);
  const controls = createOrbitControls(camera, renderer);
  const resizeObserver = new ResizeObserver(() => resizeViewport(state));

  const state: EditorState = {
    scene,
    camera,
    renderer,
    controls,
    viewport: {
      container,
      resizeObserver,
      animationFrameId: null,
    },
    ui: {
      sidebar: null,
      divider: null,
      isResizingSidebar: false,
    },
    selection: {
      object: null,
    },
  };

  container.appendChild(renderer.domElement);
  resizeObserver.observe(container);
  resizeViewport(state);
  container.addEventListener('click', createOnClickSelectionHandler(state));

  return state;
}

export function startViewport(state: EditorState): void {
  const renderFrame = () => {
    state.viewport.animationFrameId = requestAnimationFrame(renderFrame);
    state.controls.update();
    state.renderer.render(state.scene, state.camera);
  };

  renderFrame();
}

export function resizeViewport(state: EditorState): void {
  const { container } = state.viewport;
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (width === 0 || height === 0) {
    return;
  }

  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(width, height, false);
}

export function disposeViewport(state: EditorState): void {
  if (state.viewport.animationFrameId !== null) {
    cancelAnimationFrame(state.viewport.animationFrameId);
  }

  state.viewport.resizeObserver.disconnect();
  state.controls.dispose();
  state.renderer.dispose();
  state.renderer.domElement.remove();
}

function createCamera(container: HTMLElement): Three.PerspectiveCamera {
  const camera = new Three.PerspectiveCamera(
    editorConfig.camera.fov,
    container.clientWidth / container.clientHeight,
    editorConfig.camera.near,
    editorConfig.camera.far
  );

  camera.layers.enable(editorLayers.selectable);
  camera.layers.enable(editorLayers.helper);
  camera.position.set(
    editorConfig.camera.position.x,
    editorConfig.camera.position.y,
    editorConfig.camera.position.z
  );
  camera.lookAt(0, 0, 0);

  return camera;
}

function createRenderer(container: HTMLElement): Three.WebGLRenderer {
  const renderer = new Three.WebGLRenderer({ antialias: true });

  renderer.setClearColor(editorConfig.renderer.backgroundColor);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight, false);

  return renderer;
}

function createOrbitControls(
  camera: Three.Camera,
  renderer: Three.WebGLRenderer
): OrbitControls {
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.screenSpacePanning = editorConfig.orbitControls.screenSpacePanning;
  controls.minDistance = editorConfig.orbitControls.minDistance;
  controls.maxDistance = editorConfig.orbitControls.maxDistance;

  return controls;
}

function createOnClickSelectionHandler(state: EditorState): (event: MouseEvent) => void {
  return (event: MouseEvent) => {
    const { camera, scene, renderer } = state;
    const mouse = new Three.Vector2();
    const raycaster = new Three.Raycaster();
    const canvasBounds = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;
    
    raycaster.layers.set(editorLayers.selectable);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      state.selection.object = intersects[0].object;
      console.log(`Selected object: ${state.selection.object.name || state.selection.object.id}`);
    } else {
      state.selection.object = null;
    }
  };
}
