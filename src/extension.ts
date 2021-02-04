import { verify } from 'crypto';
import { version } from 'process';
import * as vscode from 'vscode';
import { NVM } from './utils/nvm';

const nvm = new NVM();
let nvmBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  const { subscriptions } = context;

  let commands: { [id: string]: () => void } = {
    addNodeVersion: async () => {
      const quickPick = vscode.window.createQuickPick();
      const nodeVersions = await nvm.fetchAvailableVersions();

      quickPick.items = nodeVersions.map((version) => ({ label: version }));
      quickPick.onDidChangeSelection(async (selected) => {
        const [item] = selected;
        const { label: version } = item;
        vscode.window.showInformationMessage(`Installing node ${version}`);
        const response = await nvm.installNewVersion(version as any);
        if (!response) {
          vscode.window.showInformationMessage(`Enter a valid version!`);
        } else {
          vscode.window.showInformationMessage(
            `Installed ${version} to your local nvm`
          );
        }
      });
      quickPick.show();
    },
    switchNodeVersion: async () => {
      const quickPick = vscode.window.createQuickPick();
      const nodeVersions = await nvm.fetchInstalledVersions();

      quickPick.items = nodeVersions.map((version) => ({ label: version }));
      quickPick.title = 'Swtich Node Version';
      quickPick.onDidChangeSelection(async (selected) => {
        const [item] = selected;
        const { label: version } = item;
        vscode.window.showInformationMessage(`Switching node ${version}`);
        const response = await nvm.switchVersion(version as any);
        if (!response) {
          vscode.window.showInformationMessage(`Enter a valid version!`);
        } else {
          vscode.window.showInformationMessage(
            `Switched node version to ${version}, Restart vscode for the change to take effect`
          );
        }
      });
      quickPick.show();
    },
    deleteNodeVersion: () => {
      console.log('deleting node version');
    },
  };

  // functions for toggling web views
  subscriptions.push(
    vscode.commands.registerCommand('vscode-nvm.addNodeVersion', () => {
      commands['addNodeVersion']();
    })
  );

  subscriptions.push(
    vscode.commands.registerCommand('vscode-nvm.switchNodeVersion', () => {
      commands['switchNodeVersion']();
    })
  );

  subscriptions.push(
    vscode.commands.registerCommand('vscode-nvm.deleteNodeVersion', () => {
      commands['deleteNodeVersion']();
    })
  );

  // subscriptions.push(disposable);
  subscriptions.push(
    vscode.commands.registerCommand('vscode-nvm.showPalette', () => {
      vscode.window.showQuickPick(
        ['Add node version', 'Switch node version', 'Delete node version'],
        {
          placeHolder: 'Select',
          onDidSelectItem: (item) => {
            vscode.window.showInformationMessage(item.toString());
          },
        }
      );
    })
  );

  // create a new status bar item that we can now manage
  nvmBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  nvmBarItem.command = 'vscode-nvm.showPalette';
  nvmBarItem.text = 'nvm - v0.4.5';
  nvmBarItem.show();
  subscriptions.push(nvmBarItem);
}

export function deactivate() {}
