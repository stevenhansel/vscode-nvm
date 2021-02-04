import { promisify } from 'util';
import * as child from 'child_process';
const exec = promisify(child.exec);

const versionPattern = /(v\d\d\.\d\d\.\d)/g;
const installedVersionPattern = /(v\d+\.\d+\.\d+)|(system)/g;

export class NVM {
  versions: string[] = [];
  installedVersions: string[] = [];

  constructor() {
    this.initialize();
  }

  async initialize() {
    this.versions = await this.fetchAvailableVersions();
    this.installedVersions = await this.fetchInstalledVersions();
  }

  nvmCommandBuilder = (command: string): string =>
    `source ~/.nvm/nvm.sh && ${command}`;

  async fetchAvailableVersions(): Promise<string[]> {
    if (this.versions.length > 0) {
      return this.versions;
    } else {
      const command = this.nvmCommandBuilder('nvm ls-remote');
      const { stdout } = await exec(command);

      const parsed = stdout.match(versionPattern);
      return !!parsed ? parsed : [];
    }
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

  async fetchInstalledVersions(): Promise<string[]> {
    if (this.installedVersions.length > 0) {
      return this.installedVersions;
    } else {
      const command = this.nvmCommandBuilder('nvm ls');
      const { stdout } = await exec(command);

      let parsed = stdout.match(installedVersionPattern);
      if (parsed) {
        parsed.splice(parsed.indexOf("system"), Number.MAX_VALUE);
      }

      return !!parsed ? parsed : [];
    }
  }

  async switchVersion(version: string): Promise<boolean> {
    const validate = this.installedVersions.find((v) => v === version);
    if (!validate) {
      return false;
    }
    
    const command = this.nvmCommandBuilder(`nvm alias default ${version}`);
    const { stdout } = await exec(command);
    return true;
  }
}
