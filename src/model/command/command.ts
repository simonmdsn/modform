export interface Command {
    do(): void;
    undo(): void;
}

export class CommandManager {
    private commandStack: Command[] = []
    private undoStack: Command[] = []

    doCommand(command: Command): void {
        command.do();
        this.commandStack.push(command);
        this.undoStack = [];
    }

    undoCommand(command: Command): void {
        if (this.undoStack.length > 0) {
            const cmd = this.undoStack.pop();
            cmd?.undo();
        }
    }

    undo(): void {
        console.log(`Attempting to undo command. Command stack size: ${this.commandStack.length}, Undo stack size: ${this.undoStack.length}`);
        if (this.commandStack.length > 0) {
            const command = this.commandStack.pop();
            command?.undo();
            if (command) {
                console.log(`Undoing command. Command stack size: ${this.commandStack.length}, Undo stack size: ${this.undoStack.length}`);
                this.undoStack.push(command);
            }
        }
    }

     redo(): void {
        if (this.undoStack.length > 0) {
            const command = this.undoStack.pop();
            command?.do();
            if (command) {
                this.commandStack.push(command);
            }
        }
    }
}