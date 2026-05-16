import { Color } from 'three';

export const editorConfig = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 4, y: 3, z: 5 },
  },
  renderer: {
    backgroundColor: new Color(0x333333),
  },
  orbitControls: {
    minDistance: 1,
    maxDistance: 1000,
    screenSpacePanning: false,
  },
  sidebar: {
    minWidth: 150,
    maxWidth: 0.8 * window.innerWidth,
  },
} as const;
