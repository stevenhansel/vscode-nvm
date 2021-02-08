import { promisify } from 'util';
import * as child from 'child_process';
import * as vscode from 'vscode';

const exec = promisify(child.exec);

const versionPattern = /(v\d\d\.\d\d\.\d)/g;
const installedVersionPattern = /(v\d+\.\d+\.\d+)|(system)/g;

export class NVM {
  currentVersion: string = '';
  versions: string[] = [];
  installedVersions: string[] = [];
  githubLink = 'https://github.com/nvm-sh/nvm';

  constructor() {
    this.initialize();
  }

  async initialize() {
    if (!(await this.isNvmInstalled())) {
      const action = 'Install';
      vscode.window
        .showInformationMessage(
          'nvm is not installed in your local machine, please install nvm',
          action
        )
        .then((selectedAction) => {
          if (selectedAction === action) {
            vscode.env.openExternal(vscode.Uri.parse(this.githubLink));
          }
        });
    }
    this.currentVersion = await this.fetchCurrentVersion();
    this.versions = await this.fetchAvailableVersions();
    this.installedVersions = await this.fetchInstalledVersions();
  }

  nvmCommandBuilder = (command: string): string =>
    `source ~/.nvm/nvm.sh && ${command}`;

  async isNvmInstalled(): Promise<boolean> {
    const command = this.nvmCommandBuilder('nvm');
    return new Promise((resolve) => {
      exec(command)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  async fetchAvailableVersions(): Promise<string[]> {
    const command = this.nvmCommandBuilder('nvm ls-remote');
    const { stdout } = await exec(command);

    const parsed = stdout.match(versionPattern);
    const installedVersions = await this.fetchInstalledVersions();
    const availableVersions = parsed?.filter(
      (p) => !installedVersions.includes(p)
    );

    this.versions = availableVersions ?? [];
    return !!availableVersions ? availableVersions : [];
  }

  async installNewVersion(version: string): Promise<boolean> {
    const validate = this.versions.find((v) => v === version);
    if (!validate) {
      return false;
    }

    const command = this.nvmCommandBuilder(`nvm install ${version}`);
    const { stdout } = await exec(command);

    console.log(stdout);

    return true;
  }

  async fetchCurrentVersion(): Promise<string> {
    const command = this.nvmCommandBuilder(`nvm current`);
    const { stdout } = await exec(command);
    return stdout;
  }

  async fetchInstalledVersions(): Promise<string[]> {
    const command = this.nvmCommandBuilder('nvm ls');
    const { stdout } = await exec(command);

    let parsed = stdout.match(installedVersionPattern);
    if (parsed) {
      parsed.splice(parsed.indexOf('system'), Number.MAX_VALUE);
    }

    this.installedVersions = parsed?.map((p) => p.trim()) ?? [];
    return !!parsed ? parsed : [];
  }

  async switchVersion(version: string): Promise<boolean> {
    const validate = this.installedVersions.find((v) => v === version);
    if (!validate) {
      return false;
    }

    const command = this.nvmCommandBuilder(`nvm alias default ${version}`);
    await exec(command);
    return true;
  }

  async deleteVersion(version: string): Promise<boolean> {
    const validate = this.installedVersions.find((v) => v === version);

    if (!validate) {
      return false;
    }
    const command = this.nvmCommandBuilder(`nvm uninstall ${version}`);

    try {
      await exec(command);
    } catch (e) {
      console.log('There was a problem...');
      return false;
    }

    return true;
  }
}
