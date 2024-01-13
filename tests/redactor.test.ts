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

  test('applyRegex(..) returns no replacements if no regexes match', async () => {
    const fileContents = `
    hello world
    expecting no matches
    `;
    const result = redactor.applyRegex('c:/random/1-trace.trace', fileContents);
    expect(result.replacements.length).toEqual(0);
  });

  test('applyRegex(..) returns replacements when a single regexes is matched', async () => {
    const fileContents = `
    hello world
    example.email+123@gmail.com,
    regex will find email above
    `;
    const result = redactor.applyRegex('c:/random/1-trace.trace', fileContents);
    expect(result.replacements.length).toEqual(1);
    expect(result.replacements[0]).toEqual({
      file: 'c:/random/1-trace.trace',
      regex: '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+,',
      matchCount: 1,
    });
    expect(result.fileContents).toEqual(
      '\n    hello world\n    <REDACTED>\n    regex will find email above\n    '
    );
  });

  test('applyRegex(..) returns replacements when multiple regexes are matched', async () => {
    const fileContents = `
    hello world
    example.email+123@gmail.com,
    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
    regex will find this.willalsobematched@yahoo.com, email above
    `;
    const result = redactor.applyRegex('c:/random/1-trace.trace', fileContents);
    expect(result.replacements.length).toEqual(2);
    expect(result.fileContents).toEqual(
      '\n    hello world\n    <REDACTED>\n    <REDACTED>\n    regex will find <REDACTED> email above\n    '
    );
    expect(result.replacements[0]).toEqual({
      file: 'c:/random/1-trace.trace',
      regex: '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+,',
      matchCount: 2,
    });
    expect(result.replacements[1]).toEqual({
      file: 'c:/random/1-trace.trace',
      regex: '(?:[\\w-]*\\.[\\w-]*\\.[\\w-]*)',
      matchCount: 1,
    });
  });

  test('applyEnvVarRegex(..) returns no replacements when no regexes match', async () => {
    const fileContents = `
    hello world
    example.email+123@gmail.com,
    regex will find email above
    `;
    const result = redactor.applyEnvVarRegex(
      'c:/random/1-trace.trace',
      fileContents
    );
    expect(result.replacements.length).toEqual(0);
  });

  test('applyEnvVarRegex(..) returns replacements when a single regex is matched', async () => {
    const redactor = new Redactor(traceFilesFolder, regexFile, {
      full_redaction: false,
      log_level: 'info',
      regexes: '',
      environment_variables: ['SUPER_SECRET_ENV'],
    });
    const fileContents = `
    hello world
    example.email+123@gmail.com,
    regex will find email above
    this text will be replaced
    `;
    process.env['SUPER_SECRET_ENV'] = 'this text will be replaced';
    const result = redactor.applyEnvVarRegex(
      'c:/random/1-trace.trace',
      fileContents
    );
    expect(result.replacements.length).toEqual(1);
    expect(result.replacements[0]).toEqual({
      file: 'c:/random/1-trace.trace',
      regex: 'SUPER_SECRET_ENV',
      matchCount: 1,
    });
    expect(result.fileContents).toEqual(
      '\n    hello world\n    example.email+123@gmail.com,\n    regex will find email above\n    th**********************ed\n    '
    );
  });

  test('applyEnvVarRegex(..) returns replacements when multiple regexes are matched', async () => {
    const redactor = new Redactor(traceFilesFolder, regexFile, {
      full_redaction: false,
      log_level: 'info',
      regexes: '',
      environment_variables: ['SUPER_SECRET_ENV', 'GOOGLE_API_KEY'],
    });
    process.env['SUPER_SECRET_ENV'] = 'this text will be replaced';
    process.env['GOOGLE_API_KEY'] = 'occurs many times';
    const fileContents = `
    hello world
    occurs many times
    example.email+123@gmail.com,
    regex will find email above occurs many times
    this text will be replaced
    `;

    const result = redactor.applyEnvVarRegex(
      'c:/random/1-trace.trace',
      fileContents
    );
    expect(result.replacements.length).toEqual(2);
    expect(result.replacements[0]).toEqual({
      file: 'c:/random/1-trace.trace',
      regex: 'SUPER_SECRET_ENV',
      matchCount: 1,
    });
    expect(result.replacements[1]).toEqual({
      file: 'c:/random/1-trace.trace',
      regex: 'GOOGLE_API_KEY',
      matchCount: 2,
    });
    expect(result.fileContents).toEqual(
      '\n    hello world\n    oc*************es\n    example.email+123@gmail.com,\n    regex will find email above oc*************es\n    th**********************ed\n    '
    );
  });

  test('parses regex from file into an array', async () => {
    expect(redactor.regexes).toEqual([
      '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+,',
      '(?:[\\w-]*\\.[\\w-]*\\.[\\w-]*)',
    ]);
  });
});
