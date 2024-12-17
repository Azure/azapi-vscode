import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import { ClientHandler } from './clientHandler';
import { ServerPath } from './serverPath';
import { config } from './vscodeUtils';

const brand = `Terraform AzApi Provider`;
const outputChannel = vscode.window.createOutputChannel(brand);

let reporter: TelemetryReporter;
let clientHandler: ClientHandler;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const manifest = context.extension.packageJSON;
  reporter = new TelemetryReporter(manifest.appInsightsConnectionString);
  context.subscriptions.push(reporter);

  reporter.sendRawTelemetryEvent('activated', {
    activationEvents: manifest.activationEvents,
    main: manifest.main,
    version: manifest.version,
  });

  const lsPath = new ServerPath(context);
  clientHandler = new ClientHandler(lsPath, outputChannel, reporter);

  // Subscriptions
  context.subscriptions.push(
    vscode.commands.registerCommand('azapi.enableLanguageServer', async () => {
      if (!enabled()) {
        const currentConfig: any = config('azapi').get('languageServer');
        currentConfig.external = true;
        await config('azapi').update('languageServer', currentConfig, vscode.ConfigurationTarget.Global);
        startLanguageServer();
      }
    }),
    vscode.commands.registerCommand('azapi.disableLanguageServer', async () => {
      if (enabled()) {
        const currentConfig: any = config('azapi').get('languageServer');
        currentConfig.external = false;
        await config('azapi').update('languageServer', currentConfig, vscode.ConfigurationTarget.Global);
        stopLanguageServer();
      }
    }),
    vscode.workspace.onDidChangeTextDocument(async (event: vscode.TextDocumentChangeEvent) => {
      if (event.document.languageId !== 'terraform') {
        return;
      }

      const lsClient = clientHandler.getClient();
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

        if (!areEqualIgnoringWhitespace(contentChange.text, clipboardText)) {
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
      if (event.affectsConfiguration('azapi')) {
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
  reporter.sendRawTelemetryEvent('deactivated');
  if (clientHandler === undefined) {
    return;
  }

  return clientHandler.stopClient();
}

async function startLanguageServer() {
  try {
    await clientHandler.startClient();
  } catch (error) {
    console.log(error); // for test failure reporting
    reporter.sendTelemetryErrorEvent('startLanguageServer', {
      err: `${error}`,
    });
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
  } catch (error) {
    console.log(error); // for test failure reporting
    reporter.sendTelemetryErrorEvent('stopLanguageServer', {
      err: `${error}`,
    });
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : error);
    } else if (typeof error === 'string') {
      vscode.window.showErrorMessage(error);
    }
  }
}

function enabled(): boolean {
  return config('azapi').get('languageServer.external', true);
}

function isEmptyOrWhitespace(s: string): boolean {
  return /^\s*$/.test(s);
}

function areEqualIgnoringWhitespace(a: string, b: string): boolean {
  return removeWhitespace(a) === removeWhitespace(b);
}

function removeWhitespace(s: string): string {
  return s.replace(/\s*/g, '');
}
