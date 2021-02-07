import * as vscode from 'vscode';
import { NVMProvider } from './components/nvmView';
import { NVM } from './container/nvm';

const nvm = new NVM();
let nvmBarItem: vscode.StatusBarItem;
let deleteQuickPick: vscode.QuickPick<vscode.QuickPickItem>;

export function activate(context: vscode.ExtensionContext) {
  const { subscriptions } = context;

  /** Tree Provider for NVM Explorer aka Sidebar for NVM  */
  vscode.window.registerTreeDataProvider('nvm', new NVMProvider());
  vscode.window.createTreeView('nvm', {
    treeDataProvider: new NVMProvider(),
  });

  /** List of registered vscode-nvm commands */
  let commands: { [id: string]: () => void } = {
    addNodeVersion: async () => {
      const quickPick = vscode.window.createQuickPick();
      let nodeVersions: string[] = [];
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Fetching available node versions...',
          cancellable: true,
        },
        () => {
          return new Promise((resolve, reject) => {
            nvm
              .fetchAvailableVersions()
              .then((versions) => {
                nodeVersions = versions;
                resolve(versions);
              })
              .catch((err) => reject(err));
          });
        }
      );

      quickPick.items = nodeVersions.map((version) => ({ label: version }));
      quickPick.onDidChangeSelection(async (selected) => {
        const [item] = selected;
        const { label: version } = item;
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Installing node ${version}`,
            cancellable: true,
          },
          () => {
            return new Promise((resolve, reject) => {
              nvm
                .installNewVersion(version as any)
                .then((res) => {
                  if (res) {
                    vscode.window.showInformationMessage(
                      `Installed ${version} to your local nvm`
                    );
                    resolve(res);
                  } else {
                    vscode.window.showInformationMessage(
                      `Enter a valid version!`
                    );
                    reject(res);
                  }
                })
                .catch((err) => {
                  reject(err);
                });
              quickPick.dispose();
            });
          }
        );
      });
      quickPick.show();
    },
    switchNodeVersion: async () => {
      const quickPick = vscode.window.createQuickPick();
      let nodeVersions: string[] = [];
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Fetching installed node versions...',
          cancellable: true,
        },
        () => {
          return new Promise((resolve, reject) => {
            nvm
              .fetchInstalledVersions()
              .then((versions) => {
                nodeVersions = versions;
                resolve(versions);
              })
              .catch((err) => reject(err));
          });
        }
      );

      quickPick.items = nodeVersions.map((version) => ({ label: version }));
      quickPick.title = 'Switch Node Version';
      quickPick.onDidChangeSelection(async (selected) => {
        const [item] = selected;
        const { label: version } = item;
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Switching to node ${version}...`,
            cancellable: true,
          },
          () => {
            return new Promise((resolve, reject) => {
              nvm
                .switchVersion(version)
                .then((res) => {
                  if (res) {
                    vscode.window.showInformationMessage(
                      `Switched node version to ${version}, Restart vscode for the change to take effect`
                    );
                    resolve(res);
                  } else {
                    vscode.window.showInformationMessage(
                      `Enter a valid version!`
                    );
                    reject(res);
                  }
                })
                .catch((err) => {
                  reject(err);
                });
              quickPick.dispose();
            });
          }
        );
      });
      quickPick.show();
    },
    deleteNodeVersion: async () => {
      deleteQuickPick = vscode.window.createQuickPick();
      let nodeVersions: string[] = [];
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Fetching installed node versions...',
          cancellable: true,
        },
        () => {
          return new Promise((resolve, reject) => {
            nvm
              .fetchInstalledVersions()
              .then((versions) => {
                nodeVersions = versions;
                resolve(versions);
              })
              .catch((err) => reject(err));
          });
        }
      );

      deleteQuickPick.items = nodeVersions.map((version) => ({
        label: version,
      }));
      deleteQuickPick.title = 'Delete Node Version';
      deleteQuickPick.onDidChangeSelection(async (selected) => {
        const [item] = selected;
        const { label: version } = item;
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Deleting node ${version}...`,
            cancellable: true,
          },
          () => {
            return new Promise((resolve, reject) => {
              nvm
                .deleteVersion(version)
                .then((res) => {
                  if (res) {
                    vscode.window.showInformationMessage(
                      `Deleted node version ${version}`
                    );
                    resolve(res);
                  } else {
                    vscode.window.showInformationMessage(
                      `Error deleting version`
                    );
                    reject(res);
                  }
                })
                .catch((err) => {
                  reject(err);
                });
              deleteQuickPick.dispose();
            });
          }
        );
      });
      deleteQuickPick.show();
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

  subscriptions.push(
    vscode.commands.registerCommand('vscode-nvm.showPalette', () => {
      const options: {
        label: string;
        command: string;
      }[] = [
        {
          label: 'Add a node version',
          command: 'addNodeVersion',
        },
        {
          label: 'Switch node version',
          command: 'switchNodeVersion',
        },
        {
          label: 'Delete a node version',
          command: 'deleteNodeVersion',
        },
      ];
      vscode.window.showQuickPick(
        options.map((item) => item.label),
        {
          placeHolder: 'Select',
          onDidSelectItem: (selectedItem) => {
            const selectedOption = options.find(
              (item) => item.label === selectedItem
            );
            if (selectedOption) {
              const command = `vscode-nvm.${selectedOption.command}`;
              vscode.commands.executeCommand(command);
            }
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
