import { TransformControls } from "three/examples/jsm/Addons.js";
import { EditorState } from "./state";
import { Layers, Vector3 } from "three";
import { editorLayers } from "../scene/layers";
import { MoveObjectCommand } from "./command/object/move_object";

export function setupObjectMode(state: EditorState): void {
    state.mode = 'object';
    setupKeybindings(state);
    transformControls = new TransformControls(state.camera, state.renderer.domElement);
    transformControls?.addEventListener('dragging-changed', (event) => {
        state.controls.enabled = !event.value;
        console.log(`TransformControls dragging state changed: ${event.value}`);
        // when dragging starts, capture the original position so we can create
        // a single MoveObjectCommand when dragging ends (avoids spamming commands
        // on every objectChange event)
        if (event.value) {
            const obj = state.selection.object;
            if (obj) {
                transformStartPosition = obj.position.clone();
            }
        } else {
            // dragging ended
            const obj = state.selection.object;
            if (transformStartPosition && obj) {
                const newPos = obj.position.clone();
                // only push a command if the position actually changed
                if (!transformStartPosition.equals(newPos)) {
                    state.commandManager.doCommand(new MoveObjectCommand(obj, transformStartPosition, newPos));
                }
            }
            transformStartPosition = null;
        }
    });
}

let activeObjectModeState: 'translate' | 'rotate' | 'scale' | null = null;
let transformControls: TransformControls | null = null;
let transformStartPosition: Vector3 | null = null;

function setupKeybindings(state: EditorState): void {
    window.addEventListener('keydown', (event) => {
        if (event.key === 't') {
            if (activeObjectModeState === 'translate') {
                activeObjectModeState = null;
                transformControls?.detach();
                console.log('Exiting translate mode');
                return;
            }
            if (state.selection.object === null) {
                console.log('No object selected to transform');
                transformControls?.detach();
                return;
            }
            activeObjectModeState = 'translate';
            transformControls?.setMode('translate');
            transformControls?.getHelper().layers.set(editorLayers.helper);
            transformControls?.attach(state.selection.object);
            state.scene.add(transformControls!.getHelper());
            console.log('Switching to translate mode');
        } else if (event.key === 'r') {
            if (activeObjectModeState === 'rotate') {
                activeObjectModeState = null;
                console.log('Exiting rotate mode');
                return;
            }
            if (state.selection.object === null) {
                console.log('No object selected to transform');
                return;
            }
            activeObjectModeState = 'rotate';
            transformControls?.setMode('rotate');
            transformControls?.getHelper().layers.set(editorLayers.helper);
            transformControls?.attach(state.selection.object);
            state.scene.add(transformControls!.getHelper());
            console.log('Switching to rotate mode');
        } else if (event.key === 's') {
            if (activeObjectModeState === 'scale') {
                activeObjectModeState = null;
                console.log('Exiting scale mode');
                return;
            }
            if (state.selection.object === null) {
                console.log('No object selected to transform');
                return;
            }
            activeObjectModeState = 'scale';
            transformControls?.setMode('scale');
            transformControls?.getHelper().layers.set(editorLayers.helper);
            transformControls?.attach(state.selection.object);
            state.scene.add(transformControls!.getHelper());
            console.log('Switching to scale mode');
        }
    });
}