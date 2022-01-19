import { installTerraformLS } from '../../installer/installer';
import { reporter } from './mocks/reporter';
import { Build, Release } from '../../types';

jest.mock('../../installer/detector');
describe('azurerm-restapi-lsp installer', () => {
  describe('should install', () => {
    test('when valid version is passed', async () => {
      const expectedBuild: Build = {
        downloadUrl:
          'https://github.com/ms-henglu/azurerm-restapi-lsp/releases/download/v0.0.1/azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
        name: 'azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
      };

      const expectedRelease: Release = {
        version: 'v0.0.1',
        assets: [expectedBuild],
      };

      await installTerraformLS('installPath', expectedRelease, reporter);
    });
  });
});
