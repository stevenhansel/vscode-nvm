import { NVM } from '../container/nvm';
import * as vscode from 'vscode';

export class NVMController {
  constructor(private readonly nvm = new NVM()) {}

  async fetchAllVersions() {
    await this.fetchAvailableVersions();
    await this.fetchInstalledNodeVersions();
  }

  fetchAvailableVersions() {
    return new Promise((resolve, reject) => {
      this.nvm
        .fetchAvailableVersions()
        .then((versions) => {
          resolve(versions);
        })
        .catch((err) => reject(err));
    });
  }

  fetchInstalledNodeVersions() {
    return new Promise((resolve, reject) => {
      this.nvm
        .fetchInstalledVersions()
        .then((versions) => {
          resolve(versions);
        })
        .catch((err) => reject(err));
    });
  }

  addVersion(version: string, callback?: any) {
    return new Promise((resolve, reject) => {
      this.nvm
        .installNewVersion(version)
        .then((res) => {
          if (res) {
            vscode.window.showInformationMessage(
              `Installed ${version} to your local nvm`
            );
            if (callback) {
              callback();
            }
            resolve(res);
          } else {
            vscode.window.showInformationMessage(`Enter a valid version!`);
            reject(res);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  switchNodeVersion(version: string, callback?: () => void) {
    return new Promise((resolve, reject) => {
      this.nvm
        .switchVersion(version)
        .then((res) => {
          if (res) {
            const action = 'Reload';
            vscode.window
              .showInformationMessage(
                `Switched node version to ${version}. Restart vscode for the change to take effect`,
                action
              )
              .then((selectedAction) => {
                if (selectedAction === action) {
                  vscode.commands.executeCommand(
                    'workbench.action.reloadWindow'
                  );
                }
              });
            if (callback) {
              callback();
            }

            resolve(res);
          } else {
            vscode.window.showInformationMessage(`Enter a valid version!`);
            reject(res);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  deleteNodeVersion(version: string, callback?: () => void) {
    return new Promise((resolve, reject) => {
      this.nvm
        .deleteVersion(version)
        .then((res) => {
          if (res) {
            vscode.window.showInformationMessage(
              `Deleted node version ${version}`
            );
            if (callback) {
              callback();
            }
            resolve(res);
          } else {
            vscode.window.showInformationMessage(`Error deleting version`);
            reject(res);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
