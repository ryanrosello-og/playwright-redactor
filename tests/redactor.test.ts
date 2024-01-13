import {beforeEach, describe, expect, test} from 'vitest';
import {Redactor} from '../src/Redactor';
import path from 'path';

const traceFilesFolder = path.join(__dirname, 'test_data', 'trace_files_many');
const regexFile = path.join(__dirname, 'test_data', 'regex_redact.txt');
const configFile = path.join(__dirname, 'test_data', 'conf.json');
let redactor: Redactor;

describe('redactor', () => {
  beforeEach(() => {
    redactor = new Redactor(traceFilesFolder, regexFile, configFile);
  });

  test('finds all zip files contained in a folder', async () => {
    const zipFiles = redactor.getAllZipFiles(traceFilesFolder);
    expect(zipFiles.length).toEqual(3);
  });

  test('applyPartialRedaction when the length of string to redact is greater than 4 characters', async () => {
    const redactor = new Redactor(traceFilesFolder, regexFile, {
      full_redaction: false,
      log_level: 'info',
      regexes: '',
      environment_variables: [],
    });
    const result = redactor.applyPartialRedaction('hello world');
    expect(result).toEqual('he*******ld');
  });

  test('applyPartialRedaction when the length of string to redact is less than 4 characters', async () => {
    const redactor = new Redactor(traceFilesFolder, regexFile, {
      full_redaction: false,
      log_level: 'info',
      regexes: '',
      environment_variables: [],
    });
    const result = redactor.applyPartialRedaction('test');
    expect(result).toEqual('****');
  });

  test('parses regex from file into an array', async () => {
    expect(redactor.regexes).toEqual([
      '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+,',
      '^(?:[\\w-]*\\.[\\w-]*\\.[\\w-]*)$',
    ]);
  });
});
