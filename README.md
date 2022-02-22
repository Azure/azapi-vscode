# Terraform azurerm-restapi Provider Visual Studio Code Extension

The Terraform azurerm-restapi Provider Visual Studio Code (VS Code) extension adds editing features like completion/hover/diagnositics for [terraform-provider-azurerm-restapi](https://github.com/Azure/terraform-provider-azurerm-restapi) Terraform files using the [Terraform azurerm-restapi Provider Language Server](https://github.com/ms-henglu/azurerm-restapi-lsp).

## Features

- Manages installation and updates of the [Terraform azurerm-restapi Provider Language Server](https://github.com/ms-henglu/azurerm-restapi-lsp), exposing its features:
- Completion when input `type` in `azurerm-restapi` resources
- Completion when input `body` in `azurerm-restapi` resources, limitation: it only works when use `jsonencode` function to build the JSON
- Show hint when hover on `type`, `body` and properties defined inside `body`
- Diagnostics to indicate schema errors as you type

## Usage

The [Terraform azurerm-restapi Provider Language Server](https://github.com/ms-henglu/azurerm-restapi-lsp) hasn't been released, so it can only be tested
in local for now.

### For Test Only
1. Download vsix file from releases, and install it as VSCode extension.
2. Clone [Terraform azurerm-restapi Provider Language Server](https://github.com/ms-henglu/azurerm-restapi-lsp) to local
3. Run `go install` under project folder
4. Add the following configuration to vscode setting file.
```
   "azurerm-restapi.languageServer": {
        "external": true,
        "pathToBinary": "C:\\Users\\henglu\\go\\bin\\azurerm-restapi-lsp.exe",  //file path to language server
        "args": [
            "serve"
        ],
        "trace.server": "messages"
    },
```

### Local Development

0. Prerequisites: golang >1.16, node v14.x.x, npm > 6.0.0
1. Clone [Terraform azurerm-restapi Provider Language Server](https://github.com/ms-henglu/azurerm-restapi-lsp) to local
2. Run `go install` under project folder
3. Add the following configuration to vscode setting file.
```
   "azurerm-restapi.languageServer": {
        "external": true,
        "pathToBinary": "C:\\Users\\henglu\\go\\bin\\azurerm-restapi-lsp.exe",  //file path to language server
        "args": [
            "serve"
        ],
        "trace.server": "messages"
    },
```
4. Clone this project to local
5. Run `npm install` to download dependencies
6. Run `code .` to open this project in VSCode
7. Press `F5`, it will open a new VSCode Window, you can test its features in it.


## Configuration

This extension offers several configuration options. To modify these, navigate to the extension view within VS Code, select the settings cog and choose Extension settings, or alternatively, modify the `.vscode/settings.json` file in the root of your working directory. 

## Telemetry

We use telemetry to send error reports to our team, so we can respond more effectively. If you want to [disable this setting](https://code.visualstudio.com/docs/getstarted/telemetry#_disable-telemetry-reporting), add `"telemetry.enableTelemetry": false` to your settings.json and that will turn off all telemetry in VSCode. You can also [monitor what's being sent](https://code.visualstudio.com/docs/getstarted/telemetry#_output-channel-for-telemetry-events) in your logs.

## Release History

See the [CHANGELOG](https://github.com/ms-henglu/azurerm-restapi-vscode/blob/develop/CHANGELOG.md) for more information.
