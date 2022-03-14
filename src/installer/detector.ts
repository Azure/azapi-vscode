import * as semver from 'semver';
import * as vscode from 'vscode';
import { exec } from '../utils';
import axios from 'axios';
import { Build, Release } from '../types';

export const DEFAULT_LS_VERSION = 'latest';

export function isValidVersionString(value: string): boolean {
  return semver.validRange(value, { includePrerelease: true, loose: true }) !== null;
}
export async function getLsVersion(binPath: string): Promise<string | undefined> {
  try {
    const jsonCmd: { stdout: string } = await exec(binPath, ['version', '-json']);
    const jsonOutput = JSON.parse(jsonCmd.stdout);
    return jsonOutput.version.replace('-dev', '');
  } catch (err) {
    // assume older version of LS which didn't have json flag
    // return undefined as regex matching isn't useful here
    // if it's old enough to not have the json version, we would be updating anyway
    return undefined;
  }
}

export async function getRequiredVersionRelease(versionString: string): Promise<Release> {
  try {
    const response = await axios.get('https://api.github.com/repos/Azure/azapi-lsp/releases', {
      headers: {
        Authorization: 'token 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',
      },
    });
    if (response.status == 200 && response.data.length != 0) {
      if (versionString == 'latest') {
        return toRelease(response.data[0]);
      } else {
        const versions = [];
        for (const i in response.data) {
          versions.push(response.data[i].tag_name);
        }
        const matchedVersion = semver.maxSatisfying(versions, versionString);
        for (const i in response.data) {
          if (response.data[i].tag_name == matchedVersion) {
            return toRelease(response.data[i]);
          }
        }
        console.log(`Found no matched release of azapi-lsp, version: ${versionString}`);
        vscode.window.showWarningMessage(`Found no matched release of azapi-lsp, use latest`);
        return toRelease(response.data[0]);
      }
    }
    vscode.window.showWarningMessage(`Found no releases of azapi-lsp`);
  } catch (err) {
    vscode.window.showErrorMessage(`Error loading releases of azapi-lsp`);
    throw err;
  }

  throw new Error('no valid release');
}

function toRelease(data: any): Release {
  const assets: Build[] = [];
  for (const i in data.assets) {
    assets.push({
      name: data.assets[i].name,
      downloadUrl: data.assets[i].browser_download_url,
    });
  }
  return {
    version: data.name,
    assets: assets,
  };
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    return true;
  } catch (error) {
    return false;
  }
}
