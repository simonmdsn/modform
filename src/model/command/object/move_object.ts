import { Object3D, Vector3 } from "three";
import { Command } from "../command";

export class MoveObjectCommand implements Command {

    private _oldPosition: Vector3;
    private _newPosition: Vector3;

    constructor(
        private object: Object3D,
        oldPosition: Vector3,
        newPosition: Vector3,
    ) {
        // clone inputs to prevent external mutation after construction
        this._oldPosition = oldPosition.clone();
        this._newPosition = newPosition.clone();
    }

    do(): void {
        this.object.position.copy(this._newPosition);
    }

    undo(): void {
        this.object.position.copy(this._oldPosition);
    }
}