# Terraform azurerm-restapi Provider Visual Studio Code Extension

The Terraform azurerm-restapi Provider Visual Studio Code (VS Code) extension adds editing features like completion/hover/diagnositics for [terraform-provider-azurerm-restapi](https://github.com/Azure/terraform-provider-azurerm-restapi) Terraform files using the [Terraform azurerm-restapi Provider Language Server](https://github.com/ms-henglu/azurerm-restapi-lsp).

## Features

- Manages installation and updates of the [Terraform azurerm-restapi Provider Language Server](https://github.com/ms-henglu/azurerm-restapi-lsp), exposing its features:
- Completion when input `type` in `azurerm-restapi` resources
- Completion when input `body` in `azurerm-restapi` resources, limitation: it only works when use `jsonencode` function to build the JSON
- Show hint when hover on `type`, `body` and properties defined inside `body`
- Diagnostics to indicate schema errors as you type


## Configuration

This extension offers several configuration options. To modify these, navigate to the extension view within VS Code, select the settings cog and choose Extension settings, or alternatively, modify the `.vscode/settings.json` file in the root of your working directory. 

## Telemetry

We use telemetry to send error reports to our team, so we can respond more effectively. If you want to [disable this setting](https://code.visualstudio.com/docs/getstarted/telemetry#_disable-telemetry-reporting), add `"telemetry.enableTelemetry": false` to your settings.json and that will turn off all telemetry in VSCode. You can also [monitor what's being sent](https://code.visualstudio.com/docs/getstarted/telemetry#_output-channel-for-telemetry-events) in your logs.

## Release History

See the [CHANGELOG](https://github.com/ms-henglu/azurerm-restapi-vscode/blob/develop/CHANGELOG.md) for more information.
