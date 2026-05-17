import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { editorConfig } from '../config/editor-config';
import type { EditorState } from '../model/state';
import { editorLayers } from '../scene/layers';
import { setupObjectMode } from '../model/object_mode';
import { CommandManager } from '../model/command/command';

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
    mode: 'object',
    commandManager: new CommandManager(),
  };

  setupObjectMode(state);
  container.appendChild(renderer.domElement);
  resizeObserver.observe(container);
  resizeViewport(state);
  container.addEventListener('click', createOnClickSelectionHandler(state));
  setupGlobalKeybindings(state);

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
      // implement mode face/edge/vertex selection and highlighting here
      //showVertices(state.selection.object as Three.Mesh, state);

    } else {
      state.selection.object = null;
    }
  };
}

function getSelectedTriangleVertices(intersection: Three.Intersection): Float32Array | null {
  const mesh = intersection.object as Three.Mesh;
  const geometry = mesh.geometry as Three.BufferGeometry;

  const position = geometry.getAttribute("position");
  const index = geometry.index;
  const face = intersection.face;

  if (!face) return null;

  const vertices = new Float32Array(9);

  const vertexIndices = index
    ? [
      index.getX(face.a),
      index.getX(face.b),
      index.getX(face.c),
    ]
    : [face.a, face.b, face.c];

  for (let i = 0; i < 3; i++) {
    const vi = vertexIndices[i];

    vertices[i * 3 + 0] = position.getX(vi);
    vertices[i * 3 + 1] = position.getY(vi);
    vertices[i * 3 + 2] = position.getZ(vi);
  }

  return vertices;
}

function highlightFace(vertices: Float32Array, object: Three.Object3D): Three.Mesh {
  const highlightMaterial = new Three.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.5, side: Three.DoubleSide });
  highlightMaterial.polygonOffset = true;
  highlightMaterial.polygonOffsetFactor = -1;
  highlightMaterial.polygonOffsetUnits = -1;
  highlightMaterial.depthWrite = false;
  const selectedFaceGeometry = new Three.BufferGeometry();
  selectedFaceGeometry.setAttribute('position', new Three.BufferAttribute(vertices, 3));

  const selectedFaceMesh = new Three.Mesh(selectedFaceGeometry, highlightMaterial);
  selectedFaceMesh.layers.set(editorLayers.helper);
  selectedFaceMesh.position.copy((object as Three.Mesh).position);
  selectedFaceMesh.rotation.copy((object as Three.Mesh).rotation);
  selectedFaceMesh.scale.copy((object as Three.Mesh).scale);

  return selectedFaceMesh;
}

function createFaceHighlightFromGroup(
  mesh: Three.Mesh,
  materialIndex: number
): Three.Mesh | null {
  const geometry = mesh.geometry as Three.BufferGeometry;
  const position = geometry.getAttribute("position");
  const index = geometry.index;

  if (!index) return null;

  const group = geometry.groups.find(
    g => g.materialIndex === materialIndex
  );

  if (!group) return null;

  const vertices: number[] = [];

  for (let i = group.start; i < group.start + group.count; i++) {
    const vi = index.getX(i);

    vertices.push(
      position.getX(vi),
      position.getY(vi),
      position.getZ(vi)
    );
  }

  const highlightGeometry = new Three.BufferGeometry();

  highlightGeometry.setAttribute(
    "position",
    new Three.Float32BufferAttribute(vertices, 3)
  );

  highlightGeometry.computeVertexNormals();

  const material = new Three.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.35,
    side: Three.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const highlight = new Three.Mesh(highlightGeometry, material);

  highlight.position.copy(mesh.position);
  highlight.rotation.copy(mesh.rotation);
  highlight.scale.copy(mesh.scale);

  return highlight;
}

function showVertices(mesh: Three.Mesh, scene: Three.Scene): Three.Group {
  const group = new Three.Group();

  const geometry = mesh.geometry as Three.BufferGeometry;
  const position = geometry.getAttribute("position");

  for (let i = 0; i < position.count; i++) {
    const vertex = new Three.Vector3().fromBufferAttribute(
      position,
      i
    );

    // Convert local geometry coordinates → world coordinates
    vertex.applyMatrix4(mesh.matrixWorld);

    const marker = new Three.Mesh(
      new Three.SphereGeometry(0.02),
      new Three.MeshBasicMaterial({
        color: 0x111111,
      })
    );

    marker.position.copy(vertex);

    group.add(marker);
  }

  scene.add(group);

  return group;
}

function setupGlobalKeybindings(state: EditorState) {
  window.addEventListener('keydown', (event) => {
    if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
      if (event.shiftKey) {
        state.commandManager.redo();
      } else {
        state.commandManager.undo();
      }
    }
  });
}
