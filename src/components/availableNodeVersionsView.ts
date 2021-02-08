import * as vscode from 'vscode';
import { NVM } from '../container/nvm';

export class AvailableNodeVersionsProvider
  implements vscode.TreeDataProvider<Versions> {
  constructor(private readonly nvm = new NVM()) {}

  getTreeItem(element: Versions): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Versions): Thenable<Versions[]> {
    return Promise.resolve(this.getAvailableNodeVersions());
  }

  private async getAvailableNodeVersions(): Promise<Versions[]> {
    const items: Versions[] = [];
    const versions = await this.nvm.fetchAvailableVersions();
    for (const version of versions) {
      items.push(new Versions(version));
    }

    return items;
  }
}

class Versions extends vscode.TreeItem {
  constructor(public readonly label: string) {
    super(label);
    this.tooltip = `${this.label}`;
  }
}
