import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { ClientHandler } from './clientHandler';
import { DEFAULT_LS_VERSION, isValidVersionString } from './installer/detector';
import { ServerPath } from './serverPath';
import { config } from './vscodeUtils';

const brand = `Terraform azurerm-restapi Provider`;
const outputChannel = vscode.window.createOutputChannel(brand);
export let terraformStatus: vscode.StatusBarItem;

let reporter: TelemetryReporter;
let clientHandler: ClientHandler;

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
      startLanguageServer();
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
      stopLanguageServer();
    }),
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
    startLanguageServer();
  }
}

export async function deactivate(): Promise<void> {
  if (clientHandler === undefined) {
    return;
  }

  return clientHandler.stopClient();
}

async function startLanguageServer() {
  try {
    await clientHandler.startClient();
    vscode.commands.executeCommand('setContext', 'terraform.showTreeViews', true);
  } catch (error) {
    console.log(error); // for test failure reporting
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : error);
    } else if (typeof error === 'string') {
      vscode.window.showErrorMessage(error);
    }
  }
}

async function stopLanguageServer() {
  try {
    await clientHandler.stopClient();
    vscode.commands.executeCommand('setContext', 'terraform.showTreeViews', false);
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
