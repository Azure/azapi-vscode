import { mocked } from 'ts-jest/utils';
import { exec as execOrg } from '../../utils';
import { getRelease as getReleaseOrg, Release } from '@hashicorp/js-releases';
import { getLsVersion, isValidVersionString, getRequiredVersionRelease } from '../../installer/detector';

jest.mock('../../utils');
jest.mock('@hashicorp/js-releases');

const exec = mocked(execOrg);
const getRelease = mocked(getReleaseOrg);

describe('terraform release detector', () => {
  test('returns valid release', async () => {
    const name = 'azurerm-restapi-lsp';
    const shasums = 'azurerm-restapi-lsp_0.24.0_SHA256SUMS';
    const shasums_signature = 'azurerm-restapi-lsp_0.24.0_SHA256SUMS.72D7468F.sig';
    const version = '0.24.0';
    const buildInfo = {
      arch: 'amd64',
      filename: 'azurerm-restapi-lsp_0.24.0_windows_amd64.zip',
      name: 'azurerm-restapi-lsp',
      os: 'windows',
      url: 'https://releases.hashicorp.com/azurerm-restapi-lsp/0.24.0/azurerm-restapi-lsp_0.24.0_windows_amd64.zip',
      version: '0.24.0',
    };

    getRelease.mockImplementationOnce(async () => {
      return {
        builds: [buildInfo],
        name: name,
        shasums: shasums,
        shasums_signature: shasums_signature,
        version: version,
        getBuild: jest.fn(),
        download: jest.fn(),
        verify: jest.fn(),
        unpack: jest.fn(),
        calculateFileSha256Sum: jest.fn(),
        downloadSha256Sum: jest.fn(),
      };
    });

    const expected = {
      builds: [buildInfo],
      name: name,
      shasums: shasums,
      shasums_signature: shasums_signature,
      version: version,
    };

    const result = await getRequiredVersionRelease('0.24.0');

    expect(result).toMatchObject(expected);
  });

  test('returns latest if invalid version', async () => {
    const name = 'azurerm-restapi-lsp';
    const shasums = 'azurerm-restapi-lsp_0.24.0_SHA256SUMS';
    const shasums_signature = 'azurerm-restapi-lsp_0.24.0_SHA256SUMS.72D7468F.sig';
    const version = '0.24.0';
    const buildInfo = {
      arch: 'amd64',
      filename: 'azurerm-restapi-lsp_0.24.0_windows_amd64.zip',
      name: 'azurerm-restapi-lsp',
      os: 'windows',
      url: 'https://releases.hashicorp.com/azurerm-restapi-lsp/0.24.0/azurerm-restapi-lsp_0.24.0_windows_amd64.zip',
      version: '0.24.0',
    };

    getRelease
      .mockImplementationOnce(() => {
        throw new Error('invalid version');
      })
      .mockImplementationOnce(async () => {
        return {
          builds: [buildInfo],
          name: name,
          shasums: shasums,
          shasums_signature: shasums_signature,
          version: version,
          getBuild: jest.fn(),
          download: jest.fn(),
          verify: jest.fn(),
          unpack: jest.fn(),
          calculateFileSha256Sum: jest.fn(),
          downloadSha256Sum: jest.fn(),
        };
      });

    const expected = {
      builds: [buildInfo],
      name: name,
      shasums: shasums,
      shasums_signature: shasums_signature,
      version: version,
    };

    const result = await getRequiredVersionRelease('10000.24.0');

    expect(result).toMatchObject(expected);
    expect(getRelease).toBeCalledTimes(2);
  });
});

describe('terraform detector', () => {
  test('returns valid version with valid path', async () => {
    exec.mockImplementationOnce(async () => {
      return {
        stdout: '{"version": "1.2.3"}',
        stderr: '',
      };
    });
    const result = await getLsVersion('installPath');
    expect(result).toBe('1.2.3');
  });

  test('returns undefined with invalid path', async () => {
    const result = await getLsVersion('installPath');
    expect(result).toBe(undefined);
  });
});

describe('version detector', () => {
  test('detect valid version', async () => {
    const result = isValidVersionString('1.2.3');
    expect(result).toBeTruthy();
  });

  test('detect invalid version', async () => {
    const result = isValidVersionString('1f');
    expect(result).toBeFalsy();
  });

  test('detect valid semver version', async () => {
    const result = isValidVersionString('1.2.3-alpha');
    expect(result).toBeTruthy();
  });

  test('detect invalid semver version', async () => {
    const result = isValidVersionString('1.23-alpha');
    expect(result).toBeFalsy();
  });
});
