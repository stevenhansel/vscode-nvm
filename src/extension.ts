import * as vscode from 'vscode';
import {
  AvailableNodeVersionsProvider,
  AvailableVersionNode,
} from './components/availableNodeVersionsView';
import {
  InstalledNodeVersionsProvider,
  InstalledVersionNode,
} from './components/installedNodeVersionsView';
import { NVM } from './container/nvm';
import { NVMController } from './controllers/nvm';

const nvm = new NVM();
const nvmController = new NVMController();

let nvmBarItem: vscode.StatusBarItem;
let deleteQuickPick: vscode.QuickPick<vscode.QuickPickItem>;

export function activate(context: vscode.ExtensionContext) {
  const { subscriptions } = context;

  /** TreeProviders */
  const installedNodeVersionsProvider = new InstalledNodeVersionsProvider();
  const availableNodeVersionsProvider = new AvailableNodeVersionsProvider();

  const refreshTreeView = () => {
    installedNodeVersionsProvider.refresh();
    availableNodeVersionsProvider.refresh();
  };

  /** Tree Provider for NVM Explorer aka Sidebar for NVM  */
  vscode.window.registerTreeDataProvider(
    'installedNodeVersions',
    installedNodeVersionsProvider
  );
  vscode.window.createTreeView('installedNodeVersions', {
    treeDataProvider: installedNodeVersionsProvider,
  });
  vscode.commands.registerCommand(
    'vscode-nvm.installedNodeVersions.refreshEntry',
    () => installedNodeVersionsProvider.refresh()
  );
  vscode.commands.registerCommand(
    'vscode-nvm.installedNodeVersions.switchEntry',
    async (node: InstalledVersionNode) => {
      const version = node.label.trim();

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Switching to node ${version}...`,
          cancellable: true,
        },
        async () => {
          await nvmController.fetchAllVersions();
          return nvmController.switchNodeVersion(version, () => {
            refreshTreeView();
          });
        }
      );
    }
  );
  vscode.commands.registerCommand(
    'vscode-nvm.installedNodeVersions.deleteEntry',
    async (node: InstalledVersionNode) => {
      const version = node.label;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Deleting node ${version}...`,
          cancellable: true,
        },
        async () => {
          await nvmController.fetchAllVersions();
          return nvmController.deleteNodeVersion(version, () => {
            refreshTreeView();
          });
        }
      );
    }
  );

  vscode.window.registerTreeDataProvider(
    'availableNodeVersions',
    availableNodeVersionsProvider
  );
  vscode.window.createTreeView('availableNodeVersions', {
    treeDataProvider: availableNodeVersionsProvider,
  });

  vscode.commands.registerCommand(
    'vscode-nvm.availableNodeVersions.refreshEntry',
    () => availableNodeVersionsProvider.refresh()
  );

  vscode.commands.registerCommand(
    'vscode-nvm.availableNodeVersions.addNodeVersion',
    async (node: AvailableVersionNode) => {
      const version = node.label;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Installing node ${version}`,
          cancellable: true,
        },
        async () => {
          await nvmController.fetchAllVersions();
          return nvmController.addVersion(version, () => {
            refreshTreeView();
          });
        }
      );
    }
  );

  /** List of registered vscode-nvm commands */
  let commands: { [id: string]: () => void } = {
    addNodeVersion: async () => {
      const quickPick = vscode.window.createQuickPick();
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Fetching available node versions...',
          cancellable: true,
        },
        () => {
          return nvmController.fetchAllVersions();
        }
      );

      quickPick.items = nvm.versions.map((version) => ({ label: version }));
      quickPick.title = 'Install New Node Version';
      quickPick.placeholder = 'Select node version';

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
            return nvmController.addVersion(version, () => {
              quickPick.dispose();
              refreshTreeView();
            });
          }
        );
      });
      quickPick.show();
    },
    switchNodeVersion: async () => {
      const quickPick = vscode.window.createQuickPick();
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Fetching installed node versions...',
          cancellable: true,
        },
        () => nvmController.fetchAllVersions()
      );

      quickPick.items = nvm.installedVersions.map((version) => ({
        label: version,
      }));
      quickPick.title = 'Switch Node Version';
      quickPick.placeholder = 'Select node version';
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
            return nvmController.switchNodeVersion(version, () => {
              quickPick.dispose();
              refreshTreeView();
            });
          }
        );
      });
      quickPick.show();
    },
    deleteNodeVersion: async () => {
      deleteQuickPick = vscode.window.createQuickPick();
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Fetching installed node versions...',
          cancellable: true,
        },
        () => nvmController.fetchAllVersions()
      );

      deleteQuickPick.items = nvm.installedVersions.map((version) => ({
        label: version,
      }));
      deleteQuickPick.title = 'Delete Node Version';
      deleteQuickPick.placeholder = 'Select node version';
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
            return nvmController.deleteNodeVersion(version, () => {
              {
                deleteQuickPick.dispose();
                refreshTreeView();
              }
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

  // create a new status bar item that we can now manage
  nvmBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  nvmBarItem.command = 'vscode-nvm.showPalette';
  nvmBarItem.text = 'nvm';
  nvmBarItem.show();
  subscriptions.push(nvmBarItem);

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

      const quickPick = vscode.window.createQuickPick();
      quickPick.items = options.map((item) => ({
        label: item.label,
      }));
      quickPick.placeholder = 'Select nvm action';
      quickPick.onDidChangeSelection(async (selected) => {
        const [selectedItem] = selected;
        const selectedOption = options.find(
          (item) => item.label === selectedItem.label
        );
        if (selectedOption) {
          const command = `vscode-nvm.${selectedOption.command}`;
          quickPick.dispose();
          vscode.commands.executeCommand(command);
        }
      });

      quickPick.show();
    })
  );
}

export function deactivate() {}
