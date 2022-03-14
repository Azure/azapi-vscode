import axios from 'axios';
import * as path from 'path';
import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import { pathExists } from './detector';
import * as fs from 'fs';
import * as unzip from 'unzip-stream';
import { Build, Release } from '../types';

export async function installTerraformLS(
  installPath: string,
  release: Release,
  reporter: TelemetryReporter,
): Promise<void> {
  reporter.sendTelemetryEvent('installingLs', { terraformLsVersion: release.version });

  const zipfile = path.resolve(installPath, `azapi-lsp_${release.version}.zip`);
  const os = getPlatform();
  const arch = getArch();

  let build: Build | undefined;
  for (const i in release.assets) {
    if (release.assets[i].name.endsWith(`${os}_${arch}.zip`)) {
      build = release.assets[i];
      break;
    }
  }

  if (!build) {
    throw new Error(`Install error: no matching azapi-lsp binary for ${os}/${arch}`);
  }

  // On brand new extension installs, there isn't a directory until we execute here
  // Create it if it doesn't exist so the downloader can unpack
  if ((await pathExists(installPath)) === false) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(installPath));
  }

  console.log(build);

  // Download and unpack async inside the VS Code notification window
  // This will show in the statusbar for the duration of the download and unpack
  // This was the most non-distuptive choice that still provided some status to the user
  return vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Window,
      title: 'Installing azapi-lsp',
    },
    async (progress) => {
      // download zip
      progress.report({ increment: 30 });
      await axios.get(build!.downloadUrl, { responseType: 'stream' }).then(function (response) {
        const fileWritePipe = fs.createWriteStream(zipfile);
        response.data.pipe(fileWritePipe);
        return new Promise<void>((resolve, reject) => {
          fileWritePipe.on('close', () => resolve());
          response.data.on('error', reject);
        });
      });

      // verify
      progress.report({ increment: 30 });

      // unzip
      const fileExtension = os === "windows" ? ".exe" : "";
      const unversionedName = path.resolve(installPath, `azapi-lsp${fileExtension}`);
      progress.report({ increment: 20 });
      const fileReadStream = fs.createReadStream(zipfile);
      const unzipPipe = unzip.Extract({ path: installPath });
      fileReadStream.pipe(unzipPipe);
      await new Promise<void>((resolve, reject) => {
        unzipPipe.on('close', () => {
          fs.chmodSync(unversionedName, '755');
          return resolve();
        });
        fileReadStream.on('error', reject);
      });

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
  // platform | terraform-ls  | extension platform | vs code editor
  //    --    |           --  |         --         | --
  // macOS    | darwin_amd64  | darwin_x64         | ✅
  // macOS    | darwin_arm64  | darwin_arm64       | ✅
  // Linux    | linux_amd64   | linux_x64          | ✅
  // Linux    | linux_arm     | linux_armhf        | ✅
  // Linux    | linux_arm64   | linux_arm64        | ✅
  // Windows  | windows_386   | win32_ia32         | ✅
  // Windows  | windows_amd64 | win32_x64          | ✅
  // Windows  | windows_arm64 | win32_arm64        | ✅
  const arch = process.arch;

  if (arch === 'ia32') {
    return '386';
  }
  if (arch === 'x64') {
    return 'amd64';
  }
  if (arch === 'armhf') {
    return 'arm';
  }

  return arch;
}
