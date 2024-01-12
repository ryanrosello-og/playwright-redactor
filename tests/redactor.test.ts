import {describe, expect, test} from 'vitest';
import {Redactor} from '../src/Redactor';
import path from 'path';

const traceFilesFolder = path.join(__dirname, 'test_data', 'trace_files_many');
const regexFile = path.join(__dirname, 'test_data', 'regex_redact.txt');

describe('redactor', () => {
  test('finds all zip files contained in a folder', async () => {
    const redactor = new Redactor(traceFilesFolder, regexFile);
    const zipFiles = redactor.getAllZipFiles(traceFilesFolder);
    expect(zipFiles.length).toEqual(3);
  });

  test('parses regex from file into an array', async () => {
    const redactor = new Redactor(traceFilesFolder, regexFile);
    expect(redactor.regexes).toEqual([
      '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+,',
      '^(?:[\\w-]*\\.[\\w-]*\\.[\\w-]*)$',
    ]);
  });
});
