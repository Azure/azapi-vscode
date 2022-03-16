# Terraform AzApi Provider Visual Studio Code Extension

The Terraform AzApi Provider Visual Studio Code (VS Code) extension adds editing features like completion/hover/diagnositics for [terraform-provider-azapi](https://github.com/Azure/terraform-provider-azapi) Terraform files using the [Terraform AzApi Provider Language Server](https://github.com/Azure/azapi-lsp).

## Features

- Manages the [Terraform AzApi Provider Language Server](https://github.com/Azure/azapi-lsp), exposing its features:
- Completion of `azapi` resources and data sources
- Completion of allowed azure resource types when input `type` in `azapi` resources
- Completion of allowed azure resource properties when input `body` in `azapi` resources, limitation: it only works when use `jsonencode` function to build the JSON
- Show hint when hover on `azapi` resources
- Diagnostics to indicate schema errors as you type


## Configuration

This extension offers several configuration options. To modify these, navigate to the extension view within VS Code, select the settings cog and choose Extension settings, or alternatively, modify the `.vscode/settings.json` file in the root of your working directory. 

## Telemetry

We use telemetry to send error reports to our team, so we can respond more effectively. If you want to [disable this setting](https://code.visualstudio.com/docs/getstarted/telemetry#_disable-telemetry-reporting), add `"telemetry.enableTelemetry": false` to your settings.json and that will turn off all telemetry in VSCode. You can also [monitor what's being sent](https://code.visualstudio.com/docs/getstarted/telemetry#_output-channel-for-telemetry-events) in your logs.

## Release History

See the [CHANGELOG](https://github.com/Azure/azapi-vscode/blob/develop/CHANGELOG.md) for more information.

## Local development
0. Prerequisites: golang >1.16, node 16.X, npm 8.X
1. Clone [Terraform AzApi Provider Language Server](https://github.com/Azure/azapi-lsp) to local
2. Run `go install` under project folder
3. Add the following configuration to vscode setting file.
```
   "azapi.languageServer": {
        "external": true,
        "pathToBinary": "C:\\Users\\henglu\\go\\bin\\azapi-lsp.exe",  //file path to language server
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
