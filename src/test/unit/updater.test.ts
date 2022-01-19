import * as vscode from 'vscode';
import { mocked } from 'ts-jest/utils';
import { updateOrInstall } from '../../installer/updater';
import { reporter } from './mocks/reporter';
import { installTerraformLS } from '../../installer/installer';
import {
  getRequiredVersionRelease as getRequiredVersionReleaseOrig,
  isValidVersionString as isValidVersionStringOrig,
  pathExists as pathExistsOrig,
  getLsVersion as getLsVersionOrig,
} from '../../installer/detector';
import { ServerPath } from '../../serverPath';
import { lsPathMock } from './mocks/serverPath';

jest.mock('../../installer/detector');
jest.mock('../../installer/installer');

const getConfiguration = mocked(vscode.workspace.getConfiguration);
const pathExists = mocked(pathExistsOrig);
const isValidVersionString = mocked(isValidVersionStringOrig);
const getRequiredVersionRelease = mocked(getRequiredVersionReleaseOrig);
const getLsVersion = mocked(getLsVersionOrig);
// @ts-ignore
const lsPath: ServerPath & typeof lsPathMock = lsPathMock;

describe('azurerm-restapi-lsp updater', () => {
  describe('should install', () => {
    test('on fresh install', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        update: jest.fn(),
      }));

      pathExists
        .mockImplementationOnce(async () => false) // stg not present
        .mockImplementationOnce(async () => false); // prod not present

      isValidVersionString.mockImplementationOnce(() => true);
      getRequiredVersionRelease.mockImplementationOnce(async () => {
        return {
          version: 'v0.0.1',
          assets: [
            {
              downloadUrl:
                'https://github.com/ms-henglu/azurerm-restapi-lsp/releases/download/v0.0.1/azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
              name: 'azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
            },
          ],
        };
      });
      await updateOrInstall('v0.0.1', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(1);
      expect(vscode.workspace.getConfiguration).toBeCalledTimes(1);
      expect(lsPath.stgBinPath).toBeCalledTimes(1);
      expect(lsPath.installPath).toBeCalledTimes(1);
    });

    test('ls version not found', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        then: jest.fn(),
        update: jest.fn(),
      }));
      pathExists
        .mockImplementationOnce(async () => false) // stg not present
        .mockImplementationOnce(async () => true); // prod present

      isValidVersionString.mockImplementationOnce(() => true);

      getLsVersion.mockImplementationOnce(async () => undefined);
      getRequiredVersionRelease.mockImplementationOnce(async () => {
        return {
          version: 'v0.0.1',
          assets: [
            {
              downloadUrl:
                'https://github.com/ms-henglu/azurerm-restapi-lsp/releases/download/v0.0.1/azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
              name: 'azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
            },
          ],
        };
      });
      await updateOrInstall('v0.0.1', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(1);
    });

    test('with out of date ls', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        then: jest.fn(),
        update: jest.fn(),
      }));
      pathExists
        .mockImplementationOnce(async () => false) // stg not present
        .mockImplementationOnce(async () => true); // prod present

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });

      getLsVersion.mockImplementationOnce(async () => 'v0.0.1');
      getRequiredVersionRelease.mockImplementationOnce(async () => {
        return {
          version: 'v0.0.2',
          assets: [
            {
              downloadUrl:
                'https://github.com/ms-henglu/azurerm-restapi-lsp/releases/download/v0.0.2/azurerm-restapi-lsp_0.0.2_windows_amd64.zip',
              name: 'azurerm-restapi-lsp_0.0.2_windows_amd64.zip',
            },
          ],
        };
      });
      await updateOrInstall('v0.0.2', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(1);
    });
  });

  describe('should not install', () => {
    test('instead move staging to prod', async () => {
      // this mimics the stging path being present, which should trigger a rename
      pathExists.mockImplementationOnce(async () => true);

      getRequiredVersionRelease.mockImplementationOnce(async () => {
        return {
          version: 'v0.0.1',
          assets: [
            {
              downloadUrl:
                'https://github.com/ms-henglu/azurerm-restapi-lsp/releases/download/v0.0.1/azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
              name: 'azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
            },
          ],
        };
      });
      await updateOrInstall('v0.0.1', lsPath, reporter);

      // expect stg to be renamed to prod
      expect(vscode.workspace.fs.rename).toBeCalledTimes(1);

      expect(vscode.workspace.getConfiguration).toBeCalledTimes(0);
    });

    test('ls present and autoupdate is false', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return false;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        then: jest.fn(),
        update: jest.fn(),
      }));

      lsPath.installPath.mockImplementationOnce(() => 'installPath');
      lsPath.stgBinPath.mockImplementationOnce(() => 'stgbinpath');

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });
      pathExists
        .mockImplementationOnce(async () => false) // stg
        .mockImplementationOnce(async () => true); // prod

      getRequiredVersionRelease.mockImplementationOnce(async () => {
        return {
          version: 'v0.0.1',
          assets: [
            {
              downloadUrl:
                'https://github.com/ms-henglu/azurerm-restapi-lsp/releases/download/v0.0.1/azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
              name: 'azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
            },
          ],
        };
      });
      await updateOrInstall('v0.0.1', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(vscode.workspace.getConfiguration).toBeCalledTimes(1);
      expect(vscode.workspace.fs.rename).toBeCalledTimes(0);
      expect(getRequiredVersionRelease).toBeCalledTimes(0);
    });

    test('invlaid azurerm-restapi-lsp verison', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        then: jest.fn(),
        update: jest.fn(),
      }));

      lsPath.installPath.mockImplementationOnce(() => 'installPath');
      lsPath.stgBinPath.mockImplementationOnce(() => 'stgbinpath');

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });
      pathExists
        .mockImplementationOnce(async () => false) // stg
        .mockImplementationOnce(async () => false); // prod

      getRequiredVersionRelease.mockImplementationOnce(() => {
        throw new Error('wahtever');
      });
      await updateOrInstall('v0.0.1', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(getRequiredVersionRelease).toBeCalledTimes(1);
      expect(reporter.sendTelemetryException).toBeCalledTimes(1);
      expect(vscode.workspace.getConfiguration).toBeCalledTimes(1);
      expect(vscode.workspace.fs.rename).toBeCalledTimes(0);
    });

    test('with current ls version', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        then: jest.fn(),
        update: jest.fn(),
      }));
      pathExists
        .mockImplementationOnce(async () => false) // stg not present
        .mockImplementationOnce(async () => true); // prod present

      isValidVersionString.mockImplementationOnce(() => true);

      getLsVersion.mockImplementationOnce(async () => 'v0.0.1');
      getRequiredVersionRelease.mockImplementationOnce(async () => {
        return {
          version: 'v0.0.1',
          assets: [
            {
              downloadUrl:
                'https://github.com/ms-henglu/azurerm-restapi-lsp/releases/download/v0.0.1/azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
              name: 'azurerm-restapi-lsp_0.0.1_windows_amd64.zip',
            },
          ],
        };
      });

      await updateOrInstall('v0.0.1', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(0);
    });
  });
});
