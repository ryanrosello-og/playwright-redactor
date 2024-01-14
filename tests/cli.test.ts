import {describe, expect, test} from 'vitest';
import {execSync} from 'child_process';
// eslint-disable-next-line node/no-unsupported-features/node-builtins
import fs, {copyFileSync} from 'fs';
import path from 'path';
import {cleanFolder} from '../src/fs_helper';

describe('CLI app', () => {
  test('logs successful message after completion', async () => {
    const workingFolder = setupWorkingFolder();
    const cliCommand = `npx ts-node ./src/cli.ts -c "./tests/test_data/cli/conf.json" -t "${workingFolder}" -r "./tests/test_data/cli/regex_redact.txt"`;
    const output = execSync(cliCommand, {encoding: 'utf-8'});

    expect(output).toContain('✅ Redactor completed');
    expect(output).toContain('Total matches: 258');
    expect(output).toContain('Total files: 2');

    function setupWorkingFolder() {
      const workingFolder = path.join(__dirname, 'test_data', 'cli', 'working');
      cleanFolder(workingFolder);
      // recreate working folder and data
      try {
        fs.mkdirSync(workingFolder, {recursive: true});
        copyFileSync(
          path.join(
            __dirname,
            'test_data',
            'cli',
            'baseline_test_1',
            'trace.zip'
          ),
          path.join(workingFolder, 'baseline.zip')
        );
        copyFileSync(
          path.join(
            __dirname,
            'test_data',
            'cli',
            'baseline_test_2',
            'trace.zip'
          ),
          path.join(workingFolder, 'baseline2.zip')
        );
      } catch (err) {
        throw new Error(err);
      }
      return workingFolder;
    }
  });
});
