import {describe, expect, test} from 'vitest';
import path from 'path';
import {doPreChecks} from '../src/cli_prechecks';

const validConfigFile = path.join(__dirname, 'test_data', 'conf.json');

const validRegexFile = path.join(__dirname, 'test_data', 'regex_redact.txt');
describe('CLI app - pre-check', () => {
  test('throws an error when the config file does not exist', async () => {
    const result = await doPreChecks(
      validRegexFile,
      validConfigFile,
      'does-not-exist.json'
    );
    expect(result.status).toEqual('error');
    expect(result.message).toContain('Config file does not exist');
  });
});
