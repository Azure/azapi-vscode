import { installTerraformLS } from '../../installer/installer';
import { reporter } from './mocks/reporter';
import { Build, Release } from '../../types';

jest.mock('../../installer/detector');
describe('azurerm-restapi-lsp installer', () => {
  describe('should install', () => {
    test('when valid version is passed', async () => {
      const expectedRelease: Release = getRelease('v0.0.1');

      await installTerraformLS('installPath', expectedRelease, reporter);
    });
  });
});

function getRelease(version: string): Release {
  return {
    version: version,
    assets: [
      {
        downloadUrl: `https://github.com/ms-henglu/azurerm-restapi-lsp/releases/download/${version}/azurerm-restapi-lsp_${version}_windows_amd64.zip`,
        name: `azurerm-restapi-lsp_${version}_windows_amd64.zip`,
      },
      {
        downloadUrl: `https://github.com/ms-henglu/azurerm-restapi-lsp/releases/download/${version}/azurerm-restapi-lsp_${version}_darwin_amd64.zip`,
        name: `azurerm-restapi-lsp_${version}_darwin_amd64.zip`,
      },
      {
        downloadUrl: `https://github.com/ms-henglu/azurerm-restapi-lsp/releases/download/${version}/azurerm-restapi-lsp_${version}_linux_amd64.zip`,
        name: `azurerm-restapi-lsp_${version}_windows_amd64.zip`,
      },
    ],
  };
}
