import * as vscode from 'vscode';

let nvmBarItem: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {

	let commands: { [id: string]: () => void } = {
		addNodeVersion: () => {
			console.log("adding node version");
		},
		switchNodeVersion: () => {
			console.log("switching node version");
		},
		deleteNodeVersion: () => {
			console.log("deleting node version");
		}
	};

	// functions for toggling web views
	subscriptions.push(vscode.commands.registerCommand("vscode-nvm.addNodeVersion", () => {
		commands["addNodeVersion"]();
	}));

	subscriptions.push(vscode.commands.registerCommand("vscode-nvm.switchNodeVersion", () => {
		commands["switchNodeVersion"]();
	}));

	subscriptions.push(vscode.commands.registerCommand("vscode-nvm.deleteNodeVersion", () => {
		commands["deleteNodeVersion"]();
	}));

	// subscriptions.push(disposable);
	subscriptions.push(vscode.commands.registerCommand("vscode-nvm.showPalette", () => {
		vscode.window.showQuickPick(["Add node version", "Switch node version", "Delete node version"], {
			placeHolder: "Select",
			onDidSelectItem: (item) => {
				vscode.window.showInformationMessage(item.toString());

			},

		});
	}));

	// create a new status bar item that we can now manage
	nvmBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	nvmBarItem.command = "vscode-nvm.showPalette";
	nvmBarItem.text = "nvm - v0.4.5";
	nvmBarItem.show();
	subscriptions.push(nvmBarItem);

}

export function deactivate() { }
