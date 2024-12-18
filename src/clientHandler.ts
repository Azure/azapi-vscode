import ShortUniqueId from 'short-unique-id';
import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import {
  DocumentSelector,
  Executable,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  ServerOptions,
  State,
} from 'vscode-languageclient/node';
import { ServerPath } from './serverPath';
import { TelemetryFeature } from './telemetry';
import { config } from './vscodeUtils';

export interface TerraformLanguageClient {
  commandPrefix: string;
  client: LanguageClient;
}

/**
 * ClientHandler maintains lifecycles of language clients
 * based on the server's capabilities
 */
export class ClientHandler {
  private shortUid: ShortUniqueId = new ShortUniqueId();
  private tfClient: TerraformLanguageClient | undefined;
  private commands: string[] = [];

  constructor(
    private lsPath: ServerPath,
    private outputChannel: vscode.OutputChannel,
    private reporter: TelemetryReporter,
  ) {}

  public async startClient(): Promise<vscode.Disposable> {
    console.log('Starting client');

    this.tfClient = await this.createTerraformClient();
    const disposable = this.tfClient.client.start();

    await this.tfClient.client.onReady();

    this.reporter.sendRawTelemetryEvent('startClient', {
      usePathToBinary: `${this.lsPath.hasCustomBinPath()}`,
    });

    const initializeResult = this.tfClient.client.initializeResult;
    if (initializeResult !== undefined) {
      this.commands = initializeResult.capabilities.executeCommandProvider?.commands ?? [];
    }

    return disposable;
  }

  private async createTerraformClient(): Promise<TerraformLanguageClient> {
    const commandPrefix = this.shortUid.seq();

    const initializationOptions = this.getInitializationOptions(commandPrefix);

    const serverOptions = await this.getServerOptions();

    const documentSelector: DocumentSelector = [{ scheme: 'file', language: 'terraform' }];

    const clientOptions: LanguageClientOptions = {
      documentSelector: documentSelector,
      initializationOptions: initializationOptions,
      initializationFailedHandler: (error) => {
        this.reporter.sendTelemetryErrorEvent('initializationFailed', {
          err: `${error}`,
        });
        return false;
      },
      outputChannel: this.outputChannel,
      revealOutputChannelOn: RevealOutputChannelOn.Never,
    };

    const id = `terraform`;
    const client = new LanguageClient(id, serverOptions, clientOptions);

    if (vscode.env.isTelemetryEnabled) {
      client.registerFeature(new TelemetryFeature(client, this.reporter));
    }

    client.onDidChangeState((event) => {
      console.log(`Client: ${State[event.oldState]} --> ${State[event.newState]}`);
      if (event.newState === State.Stopped) {
        this.reporter.sendRawTelemetryEvent('stopClient');
      }
    });

    return { commandPrefix, client };
  }

  private async getServerOptions(): Promise<ServerOptions> {
    const cmd = await this.lsPath.resolvedPathToBinary();
    const serverArgs = config('azapi').get<string[]>('languageServer.args', []);
    const executable: Executable = {
      command: cmd,
      args: serverArgs,
      options: {},
    };
    const serverOptions: ServerOptions = {
      run: executable,
      debug: executable,
    };
    this.outputChannel.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')}`);
    return serverOptions;
  }

  private getInitializationOptions(commandPrefix: string) {
    const initializationOptions = {
      commandPrefix,
    };
    return initializationOptions;
  }

  public async stopClient(): Promise<void> {
    if (this.tfClient?.client === undefined) {
      return;
    }
    await this.tfClient.client.stop();
    console.log('Client stopped');
  }

  public getClient(): TerraformLanguageClient | undefined {
    return this.tfClient;
  }

  public clientSupportsCommand(cmdName: string): boolean {
    return this.commands.includes(cmdName);
  }
}
