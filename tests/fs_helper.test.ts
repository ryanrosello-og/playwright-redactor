import {describe, expect, test} from 'vitest';
import path from 'path';
import {
  Result,
  cleanFolder,
  deleteFile,
  fileCount,
  findFilesInDirectory,
  getZipTargetFolder,
  readFile,
  unzip,
  writeToFile,
  zip,
} from '../src/fs_helper';
import {statSync} from 'fs';
import {fileExists} from '../src/cli_prechecks';

describe('fs_helper', () => {
  test('findFilesInDirectory(...) return array of in scope files for replacement', async () => {
    const dirPath = path.join(__dirname, 'test_data', 'for_zipping', 'trace');
    const result = findFilesInDirectory(dirPath, [
      '.trace',
      '.stacks',
      '.network',
    ]);
    expect(result.length).toEqual(4);
  });

  test('writeToFile(...) write string contents of a file', async () => {
    const fileToWrite = path.join(
      __dirname,
      'test_data',
      'test_file_for_writing.txt'
    );
    deleteFile(fileToWrite);
    const result: Result<string> = writeToFile(fileToWrite, 'hello world');
    expect(result.success).toEqual(true);
    expect(result.data).toEqual(undefined);
    expect(result.error).toEqual(undefined);
  });

  test('writeToFile(...) returns an error when writing to file does not succeed', async () => {
    const result: Result<string> = writeToFile(
      '/this/file/is/fake.txt',
      'hello world'
    );
    expect(result.success).toEqual(false);
    expect(result.data).toEqual(undefined);
    expect(result.error).toEqual(
      "ENOENT: no such file or directory, open '/this/file/is/fake.txt'"
    );
  });

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

  test('fileExists(...) returns false when no path is supplied', async () => {
    const result = fileExists(undefined);
    expect(result).toEqual(false);
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

  test('zip(...) an entire folder', async () => {
    const zipFolder = path.join(__dirname, 'test_data', 'for_zipping', 'trace');
    const zipFile = `${zipFolder}.zip`;
    deleteFile(zipFile);

    zip(zipFolder);
    expect(statSync(zipFile).isFile()).toEqual(true);
    expect(statSync(zipFile).size).toEqual(1106997);
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
