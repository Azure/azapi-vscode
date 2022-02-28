terraform {
  required_providers {
    azapi = {
      source = "Azure/azapi"
    }
  }
}

provider "azapi" {
}

provider "azurerm" {
  features{}
}


resource "azurerm_resource_group" "example" {
  name     = "henglu22114-resources"
  location = "West Europe"
}

resource "azapi_resource" "test" {
  type = "Microsoft.Addons/supportProviders/supportPlanTypes@"
}
