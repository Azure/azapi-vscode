import { Release } from '@hashicorp/js-releases';
import axios from 'axios';
import * as path from 'path';
import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { pathExists } from './detector';
import * as fs from 'fs';
import * as unzip from 'unzip-stream'

export async function installTerraformLS1(
  installPath: string,
  release: any,
  extensionVersion: string,
  vscodeVersion: string,
  reporter: TelemetryReporter,
): Promise<void> {
  reporter.sendTelemetryEvent('installingLs', { terraformLsVersion: release.version });

  const zipfile = path.resolve(installPath, `azurerm-restapi-lsp_${release.tag_name}.zip`);
  const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscodeVersion}`;
  const os = getPlatform();
  const arch = getArch();

  let build : any
  for (var i in release.assets) {
    if (release.assets[i].name.endsWith(`${os}_${arch}.zip`)) {
      build = release.assets[i]
      break
    }
  }

  if (!build) {
    throw new Error(`Install error: no matching azurerm-restapi-lsp binary for ${os}/${arch}`);
  }


  // On brand new extension installs, there isn't a directory until we execute here
  // Create it if it doesn't exist so the downloader can unpack
  if ((await pathExists(installPath)) === false) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(installPath));
  }

  console.log(build)

  // Download and unpack async inside the VS Code notification window
  // This will show in the statusbar for the duration of the download and unpack
  // This was the most non-distuptive choice that still provided some status to the user
  return vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Window,
      title: 'Installing azurerm-restapi-lsp',
    },
    async (progress) => {
      progress.report({ increment: 30 });
      await axios.get(build.browser_download_url, {responseType: 'stream'})
      .then(function (response) {
        return response.data.pipe(fs.createWriteStream(zipfile));
    });

      progress.report({ increment: 30 });
      //await release.verify(zipfile, build.filename);

      progress.report({ increment: 20 });
      //await release.unpack(installPath, zipfile);
      fs.createReadStream(zipfile).pipe(unzip.Extract({ path: installPath }));

      progress.report({ increment: 10 });
      //return vscode.workspace.fs.delete(vscode.Uri.file(zipfile));
    },
  );

}

export async function installTerraformLS(
  installPath: string,
  release: Release,
  extensionVersion: string,
  vscodeVersion: string,
  reporter: TelemetryReporter,
): Promise<void> {
  reporter.sendTelemetryEvent('installingLs', { terraformLsVersion: release.version });

  const zipfile = path.resolve(installPath, `azurerm-restapi-lsp_v${release.version}.zip`);
  const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscodeVersion}`;
  const os = getPlatform();
  const arch = getArch();
  const build = release.getBuild(os, arch);

  if (!build) {
    throw new Error(`Install error: no matching azurerm-restapi-lsp binary for ${os}/${arch}`);
  }

  // On brand new extension installs, there isn't a directory until we execute here
  // Create it if it doesn't exist so the downloader can unpack
  if ((await pathExists(installPath)) === false) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(installPath));
  }

  // Download and unpack async inside the VS Code notification window
  // This will show in the statusbar for the duration of the download and unpack
  // This was the most non-distuptive choice that still provided some status to the user
  return vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Window,
      title: 'Installing azurerm-restapi-lsp',
    },
    async (progress) => {
      progress.report({ increment: 30 });
      await release.download(build.url, zipfile, userAgent);

      progress.report({ increment: 30 });
      await release.verify(zipfile, build.filename);

      progress.report({ increment: 20 });
      await release.unpack(installPath, zipfile);

      progress.report({ increment: 10 });
      return vscode.workspace.fs.delete(vscode.Uri.file(zipfile));
    },
  );
}

function getPlatform(): string {
  const platform = process.platform.toString();
  if (platform === 'win32') {
    return 'windows';
  }
  if (platform === 'sunos') {
    return 'solaris';
  }
  return platform;
}

function getArch(): string {
  const arch = process.arch;

  if (arch === 'ia32') {
    return '386';
  }
  if (arch === 'x64') {
    return 'amd64';
  }

  return arch;
}
