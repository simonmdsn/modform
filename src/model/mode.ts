export const editorModes = {
  object: 0,
  edge: 1,
  face: 2,
  vertex: 3
} as const;

export const editorModeNames = Object.keys(editorModes) as (keyof typeof editorModes)[];

export type EditorMode = keyof typeof editorModes;