import {describe, expect, test} from 'vitest';
import path from 'path';
import {
  Result,
  cleanFolder,
  fileCount,
  getZipTargetFolder,
  readFile,
  unzip,
} from '../src/fs_helper';

describe('fs_helper', () => {
  test('readFile(...) able to read contents of a file', async () => {
    const fileToRead = path.join(
      __dirname,
      'test_data',
      'test_file_for_reading.txt'
    );
    const result: Result<string> = readFile(fileToRead);
    expect(result.success).toEqual(true);
    expect(result.data).toEqual(
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s"
    );
  });

  test('readFile(...) should fail when attempting to read non-existent file', async () => {
    const fileToRead = path.join(__dirname, 'test_data', 'does_not_exist.txt');
    const result: Result<string> = readFile(fileToRead);
    expect(result.success).toEqual(false);
    expect(result.error).toContain('ENOENT: no such file or directory');
  });

  test('getZipTargetFolder(..) determine zip target folder based on the zip file path', async () => {
    const zipFilePath = '/tmp/trace.zip';
    const targetFolder = getZipTargetFolder(zipFilePath);
    expect(targetFolder).toEqual('/tmp/trace');
  });

  test('unzip(...) extracts contents of a trace file', async () => {
    const targetFolder = path.join(
      __dirname,
      'test_data',
      'trace_files_single',
      'trace'
    );
    cleanFolder(targetFolder);
    const traceFile = path.join(
      __dirname,
      'test_data',
      'trace_files_single',
      'trace.zip'
    );
    unzip(traceFile);
    expect(fileCount(targetFolder)).toEqual(41);
  });
});
