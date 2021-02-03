import * as vscode from 'vscode';

let nvmBarItem: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {

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
