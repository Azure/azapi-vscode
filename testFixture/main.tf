terraform {
  required_providers {
    azurerm-restapi = {
      source = "Azure/azurerm-restapi"
    }
  }
}

provider "azurerm-restapi" {
}

provider "azurerm" {
  features{}
}


resource "azurerm_resource_group" "example" {
  name     = "henglu22114-resources"
  location = "West Europe"
}

resource "azurerm-restapi_resource" "test" {
  type = "Microsoft.Addons/supportProviders/supportPlanTypes@"
}
