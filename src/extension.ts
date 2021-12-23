import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { ClientHandler } from './clientHandler';
import { GenerateBugReportCommand } from './commands/generateBugReport';
import { DEFAULT_LS_VERSION, isValidVersionString } from './installer/detector';
import { updateOrInstall } from './installer/updater';
import { ServerPath } from './serverPath';
import { SingleInstanceTimeout } from './utils';
import { config } from './vscodeUtils';

const brand = `Terraform azurerm-restapi Provider`;
const outputChannel = vscode.window.createOutputChannel(brand);
export let terraformStatus: vscode.StatusBarItem;

let reporter: TelemetryReporter;
let clientHandler: ClientHandler;
const languageServerUpdater = new SingleInstanceTimeout();

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const manifest = context.extension.packageJSON;
  terraformStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  reporter = new TelemetryReporter(context.extension.id, manifest.version, manifest.appInsightsKey);
  context.subscriptions.push(reporter);

  const lsPath = new ServerPath(context);
  clientHandler = new ClientHandler(lsPath, outputChannel, reporter);

  if (config('azurerm-restapi').has('languageServer.requiredVersion')) {
    const langServerVer = config('azurerm-restapi').get('languageServer.requiredVersion', DEFAULT_LS_VERSION);
    if (!isValidVersionString(langServerVer)) {
      vscode.window.showWarningMessage(
        `The Terraform Language Server Version string '${langServerVer}' is not a valid semantic version and will be ignored.`,
      );
    }
  }

  // Subscriptions
  context.subscriptions.push(
    vscode.commands.registerCommand('azurerm-restapi.enableLanguageServer', async () => {
      if (!enabled()) {
        const current = config('azurerm-restapi').get('languageServer');
        await config('azurerm-restapi').update(
          'languageServer',
          Object.assign(current, { external: true }),
          vscode.ConfigurationTarget.Global,
        );
      }
      await updateLanguageServer(manifest.version, lsPath);
      return clientHandler.startClient();
    }),
    vscode.commands.registerCommand('azurerm-restapi.disableLanguageServer', async () => {
      if (enabled()) {
        const current = config('azurerm-restapi').get('languageServer');
        await config('azurerm-restapi').update(
          'languageServer',
          Object.assign(current, { external: false }),
          vscode.ConfigurationTarget.Global,
        );
      }
      languageServerUpdater.clear();
      return clientHandler.stopClient();
    }),
    new GenerateBugReportCommand(context),
    vscode.workspace.onDidChangeConfiguration(async (event: vscode.ConfigurationChangeEvent) => {
      if (event.affectsConfiguration('terraform') || event.affectsConfiguration('azurerm-restapi-lsp')) {
        const reloadMsg = 'Reload VSCode window to apply language server changes';
        const selected = await vscode.window.showInformationMessage(reloadMsg, 'Reload');
        if (selected === 'Reload') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      }
    }),
  );

  if (enabled()) {
    try {
      await updateLanguageServer(manifest.version, lsPath);
      vscode.commands.executeCommand('setContext', 'terraform.showTreeViews', true);
    } catch (error) {
      if (error instanceof Error) {
        reporter.sendTelemetryException(error);
      }
    }
  }
}

export async function deactivate(): Promise<void> {
  if (clientHandler === undefined) {
    return;
  }

  return clientHandler.stopClient();
}

async function updateLanguageServer(extVersion: string, lsPath: ServerPath, scheduled = false) {
  if (config('extensions').get<boolean>('autoCheckUpdates', true) === true) {
    console.log('Scheduling check for language server updates...');
    const hour = 1000 * 60 * 60;
    languageServerUpdater.timeout(function () {
      updateLanguageServer(extVersion, lsPath, true);
    }, 24 * hour);
  }

  if (lsPath.hasCustomBinPath()) {
    // skip install check if user has specified a custom path to the LS
    // with custom paths we *need* to start the lang client always
    await clientHandler.startClient();
    return;
  }

  try {
    await updateOrInstall(
      config('azurerm-restapi').get('languageServer.requiredVersion', DEFAULT_LS_VERSION),
      extVersion,
      vscode.version,
      lsPath,
      reporter,
    );

    // On scheduled checks, we download to stg and do not replace prod path
    // So we *do not* need to stop or start the LS
    if (scheduled) {
      return;
    }

    // On fresh starts we *need* to start the lang client always
    await clientHandler.startClient();
  } catch (error) {
    console.log(error); // for test failure reporting
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : error);
    } else if (typeof error === 'string') {
      vscode.window.showErrorMessage(error);
    }
  }
}

function enabled(): boolean {
  return config('azurerm-restapi').get('languageServer.external', false);
}
