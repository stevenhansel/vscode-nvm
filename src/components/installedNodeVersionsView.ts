import * as vscode from 'vscode';
import { NVM } from '../container/nvm';

export class InstalledNodeVersionsProvider
  implements vscode.TreeDataProvider<InstalledVersionNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    InstalledVersionNode | undefined | void
  > = new vscode.EventEmitter<InstalledVersionNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    InstalledVersionNode | undefined | void
  > = this._onDidChangeTreeData.event;

  constructor(private readonly nvm = new NVM()) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: InstalledVersionNode): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<InstalledVersionNode[]> {
    return Promise.resolve(this.getInstalledNodeVersions());
  }

  private async getInstalledNodeVersions(): Promise<InstalledVersionNode[]> {
    const currentVersion = await this.nvm.fetchCurrentVersion();
    const installedVersions = await this.nvm.fetchInstalledVersions();

    return installedVersions.map((v) =>
      !(v === currentVersion.replace(/\s+/g, ''))
        ? new InstalledVersionNode(v.trim())
        : new ActiveInstalledVersionNode(v.trim())
    );
  }
}

export class InstalledVersionNode extends vscode.TreeItem {
  constructor(public readonly label: string) {
    super(label);
    this.tooltip = this.label;
  }
  contextValue = 'installedVersionNode';
}
export class ActiveInstalledVersionNode extends vscode.TreeItem {
  constructor(public readonly label: string) {
    super(label);
    this.tooltip = this.label;
    this.description = 'active';
  }
  contextValue = 'activeInstalledVersionNode';
}
