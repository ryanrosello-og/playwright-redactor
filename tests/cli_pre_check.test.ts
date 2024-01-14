import {describe, expect, test} from 'vitest';
import path from 'path';
import {doPreChecks} from '../src/cli_prechecks';

const validConfigFile = path.join(__dirname, 'test_data', 'conf.json');
const inValidConfigFile = path.join(
  __dirname,
  'test_data',
  'invalid_config.json'
);
const validRegexFile = path.join(__dirname, 'test_data', 'regex_redact.txt');
const validTraceFilesFolder = path.join(
  __dirname,
  'test_data',
  'for_redacting',
  'working'
);

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

  test('throws an error when the regexes file does not exist', async () => {
    const result = await doPreChecks(
      '/this/file/does/not/exist.txt',
      validTraceFilesFolder,
      validConfigFile
    );
    expect(result.status).toEqual('error');
    expect(result.message).toContain(
      'The text file containing the regexes does not exist:'
    );
  });

  test('throws an error when the trace folder does not exist', async () => {
    const result = await doPreChecks(
      validRegexFile,
      '/this/folder/does/not/exist',
      validConfigFile
    );
    expect(result.status).toEqual('error');
    expect(result.message).toContain(
      'Trace file folder path does not exist: /this/folder/does/not/exist:\n      Use --trace-files <path> e.g. --trace-files="./trace_files/"'
    );
  });

  test('throws an error when the config file schema is not valid', async () => {
    const result = await doPreChecks(
      validRegexFile,
      validTraceFilesFolder,
      inValidConfigFile
    );
    expect(result.status).toEqual('error');
    expect(result.message).toContain(
      'Config file is not valid: {\n  "issues": [\n    {\n      "code": "invalid_type",\n      "expected": "boolean",\n      "received": "string",\n      "path": [\n        "full_redaction"\n      ],\n      "message": "Expected boolean, received string"\n    }\n  ],\n  "name": "ZodError"\n}'
    );
  });

  test('returns status of "ok" when all checks succeed', async () => {
    const result = await doPreChecks(
      validRegexFile,
      validTraceFilesFolder,
      validConfigFile
    );
    expect(result.status).toEqual('ok');
    expect(result.configPath).toEqual(validConfigFile);
    expect(result.traceFilesFolderPath).toEqual(validTraceFilesFolder);
    expect(result.config).toEqual({
      log_level: 'info',
      environment_variables: [
        'SUPER_SECRET_PASSWORD',
        'SUPER_SECRET_API_KEY',
        'MY_APP_SECRET',
        'SALESFORCE_API_KEY',
      ],
      full_redaction: true,
    });
  });

  test('should log a warning to the console if one or more of the environment variables is not defined', async () => {
    const result = await doPreChecks(
      validRegexFile,
      validTraceFilesFolder,
      validConfigFile
    );
    expect(result.allEnvironmentVariablesDefined).toBeFalsy();
  });
});
