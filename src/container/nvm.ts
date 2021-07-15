import { promisify } from 'util';
import * as child from 'child_process';
import * as vscode from 'vscode';
import * as os from 'os';

const exec = promisify(child.exec);

const versionPattern = /(v\d\d\.\d\d\.\d)/g;
const installedVersionPattern = /(v\d+\.\d+\.\d+)|(system)/g;

const windowsVersionPattern = /(\d|\.)+/g;
const windowsCurrentVersionPattern = /\* (\d+.)+/g;
const windowsInstalledVersionPattern = /(\d+\.\d+\.\d+)/g;
const isWindows = os.platform() === 'win32';

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

  nvmCommandBuilder = (command: string): string => {
    if (isWindows) {
      command = command.replace('nvm', '').trimStart();
      return `"%appdata%\\nvm\\nvm.exe" ${command}`;
    }
    return `source ~/.nvm/nvm.sh && ${command}`;
  };

  async isNvmInstalled(): Promise<boolean> {
    const command = this.nvmCommandBuilder('nvm');
    return new Promise((resolve) => {
      if(isWindows) {
        exec(command, {shell: 'cmd'})
        .then(() => resolve(true))
        .catch(() => resolve(false));
      } 
      else {
        exec(command)
        .then(() => resolve(true))
        .catch(() => resolve(false));
      }
    });
  }

  async fetchAvailableVersions(): Promise<string[]> {
    let command;
    if (isWindows) {
      command = this.nvmCommandBuilder('nvm list available');
    } else { 
      command = this.nvmCommandBuilder('nvm ls-remote');
    }
    const { stdout } = await exec(command);

    let parsed;
    if(isWindows) {
      parsed = stdout.match(windowsVersionPattern)?.sort((a, b) => {
        return parseInt(b.split('.')[0]) - parseInt(a.split('.')[0]);
      }).filter(i => {
        const versionParts = i.split('.').map(part => parseInt(part));
        if((versionParts[0] === 0 && versionParts[1] === 9 || versionParts[1] === 11) || versionParts.length < 3){
          return false;
        } else {
          return true;
        }
      });
    } else {
      parsed = stdout.match(versionPattern);
    }
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
    let command;
    if(isWindows) {
      command = this.nvmCommandBuilder(`nvm list`);
      const { stdout } = await exec(command);
      const parsed = stdout.match(windowsCurrentVersionPattern)?.[0].split('*')[1].trim() || '';
      return parsed;
    } else {
      command = this.nvmCommandBuilder(`nvm current`);
      const { stdout } = await exec(command);
      return stdout;
    }
  }

  async fetchInstalledVersions(): Promise<string[]> {
    const command = this.nvmCommandBuilder('nvm ls');
    vscode.window.showInformationMessage(
      'attempting command:' + command);
    const { stdout } = await exec(command);

    let parsed;
    if(isWindows) {
      parsed = stdout.match(windowsInstalledVersionPattern);
    } else {
      parsed = stdout.match(installedVersionPattern);
      if (parsed) {
        parsed.splice(parsed.indexOf('system'), Number.MAX_VALUE);
      }
    }

    this.installedVersions = parsed?.map((p) => p.trim()) ?? [];
    return !!parsed ? parsed : [];
  }

  async switchVersion(version: string): Promise<boolean> {
    const validate = this.installedVersions.find((v) => v === version);
    if (!validate) {
      return false;
    }

    let command;
    if(isWindows) { command = this.nvmCommandBuilder(`nvm use ${version}`); }
    else {command = this.nvmCommandBuilder(`nvm alias default ${version}`); } 
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
