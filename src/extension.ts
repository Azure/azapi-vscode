import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { ClientHandler } from './clientHandler';
import { ServerPath } from './serverPath';
import { config } from './vscodeUtils';

const brand = `Terraform AzApi Provider`;
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

  // Subscriptions
  context.subscriptions.push(
    vscode.commands.registerCommand('azapi.enableLanguageServer', async () => {
      if (!enabled()) {
        const current = config('azapi').get('languageServer');
        await config('azapi').update(
          'languageServer',
          Object.assign(current, { external: true }),
          vscode.ConfigurationTarget.Global,
        );
      }
      startLanguageServer();
    }),
    vscode.commands.registerCommand('azapi.disableLanguageServer', async () => {
      if (enabled()) {
        const current = config('azapi').get('languageServer');
        await config('azapi').update(
          'languageServer',
          Object.assign(current, { external: false }),
          vscode.ConfigurationTarget.Global,
        );
      }
      stopLanguageServer();
    }),
    vscode.workspace.onDidChangeTextDocument(async (event: vscode.TextDocumentChangeEvent) => {
      if (event.document.languageId !== 'terraform') {
        return;
      }

      let lsClient = clientHandler.getClient();
      if (!lsClient) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (
        event.reason !== vscode.TextDocumentChangeReason.Redo &&
        event.reason !== vscode.TextDocumentChangeReason.Undo &&
        event.document === editor?.document &&
        event.contentChanges.length === 1
      ) {
        const contentChange = event.contentChanges[0];

        // Ignore deletions and trivial changes
        if (contentChange.text.length < 2 || isEmptyOrWhitespace(contentChange.text)) {
          return;
        }

        const clipboardText = await vscode.env.clipboard.readText();

        if (contentChange.text !== clipboardText) {
          return;
        }

        try {
          const result: any = await lsClient.client.sendRequest('workspace/executeCommand', {
            command: 'azapi.convertJsonToAzapi',
            arguments: [`jsonContent=${clipboardText}`],
          });

          await editor.edit((editBuilder) => {
            const startPoint = contentChange.range.start;
            const endPoint = editor.selection.active;
            const replaceRange = new vscode.Range(startPoint, endPoint);
            editBuilder.replace(replaceRange, result.hclcontent);
          });
        } catch (error) {
          outputChannel.appendLine(`Error converting JSON to AzApi: ${error}`);
        }
      }
    }),
    vscode.workspace.onDidChangeConfiguration(async (event: vscode.ConfigurationChangeEvent) => {
      if (event.affectsConfiguration('terraform') || event.affectsConfiguration('azapi-lsp')) {
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
  return config('azapi').get('languageServer.external', false);
}

function isEmptyOrWhitespace(s: string): boolean {
  return /^\s*$/.test(s);
}
