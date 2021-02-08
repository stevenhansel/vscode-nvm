import * as vscode from 'vscode';
import { NVM } from '../container/nvm';

export class AvailableNodeVersionsProvider
  implements vscode.TreeDataProvider<AvailableVersionNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    AvailableVersionNode | undefined | void
  > = new vscode.EventEmitter<AvailableVersionNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AvailableVersionNode | undefined | void
  > = this._onDidChangeTreeData.event;

  constructor(private readonly nvm = new NVM()) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: AvailableVersionNode): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<AvailableVersionNode[]> {
    return Promise.resolve(this.getAvailableNodeVersions());
  }

  private async getAvailableNodeVersions(): Promise<AvailableVersionNode[]> {
    const items: AvailableVersionNode[] = [];
    const versions = await this.nvm.fetchAvailableVersions();
    for (const version of versions) {
      items.push(new AvailableVersionNode(version));
    }

    return items;
  }
}

export class AvailableVersionNode extends vscode.TreeItem {
  constructor(public readonly label: string) {
    super(label);
    this.tooltip = `${this.label}`;
  }
  contextValue = "availableVersionNode";
}
