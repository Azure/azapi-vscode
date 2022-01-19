import { mocked } from 'ts-jest/utils';
import { exec as execOrg } from '../../utils';
import { getLsVersion, isValidVersionString, getRequiredVersionRelease } from '../../installer/detector';

jest.mock('../../utils');

const exec = mocked(execOrg);

describe('terraform release detector', () => {
  test('returns valid release', async () => {
    const version = 'v0.0.1';
    const result = await getRequiredVersionRelease(version);
    expect(result.version).toMatch(version);
    expect(result.assets.length).toBeGreaterThan(0);
  });

  test('returns latest if invalid version', async () => {
    const resultWithInvalidVersion = await getRequiredVersionRelease('v10000.24.0');
    const resultLatest = await getRequiredVersionRelease('latest');
    expect(resultLatest.version.length).toBeGreaterThan(0);
    expect(resultWithInvalidVersion).toMatchObject(resultLatest);
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
