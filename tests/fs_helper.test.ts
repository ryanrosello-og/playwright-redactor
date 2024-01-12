import {describe, expect, test} from 'vitest';
import path from 'path';
import {cleanFolder, fileCount, unzip} from '../src/fs_helper';

describe('fs_helper', () => {
  test('extracts contents of a trace file', async () => {
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
