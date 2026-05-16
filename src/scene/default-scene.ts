import * as Three from 'three';
import type { EditorState } from '../model/state';
import { editorLayers } from './layers';

export function populateDefaultScene(state: EditorState): void {
  const cube = createStarterCube();
  const grid = new Three.GridHelper(10, 10, 0x666666, 0x444444);
  const axes = new Three.AxesHelper(2);
  const ambientLight = new Three.AmbientLight(0xffffff, 0.7);
  const directionalLight = new Three.DirectionalLight(0xffffff, 1.2);

  cube.name = 'Cube';
  grid.name = 'Grid';
  axes.name = 'Axes';
  grid.layers.set(editorLayers.helper);
  axes.layers.set(editorLayers.helper);
  ambientLight.name = 'Ambient Light';
  directionalLight.name = 'Key Light';
  directionalLight.position.set(4, 6, 5);

  state.scene.add(cube, grid, axes, ambientLight, directionalLight);
  state.selection.object = cube;
}

function createStarterCube(): Three.Mesh {
  const geometry = new Three.BoxGeometry();
  const material = new Three.MeshStandardMaterial({
    color: 0x777777,
    roughness: 0.55,
    metalness: 0.05,
  });

  return new Three.Mesh(geometry, material);
}
