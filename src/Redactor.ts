import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
export class Redactor {
  regexes: string[] = [];
  constructor(
    private traceFolderPath: string,
    private regexFile: string
  ) {
    const data = fs.readFileSync(this.regexFile, 'utf8');
    this.regexes = data.split('\n');
  }

  redact(): string {
    const result = {
      totalFiles: 0,
      totalFilesRedacted: 0,
      redactions: [],
    };

    console.log('🚀 ---------------------------------------🚀');
    console.log('🚀 ~ Redactor ~ redact ~ result:', result);
    console.log('🚀 ---------------------------------------🚀');

    // for each trace file in the folder:
    //   unzip to a temp folder
    //     for each file in the temp folder:
    //       for each regex in the regex file: (or munge all regex into single regex)
    //         if full_redact or partial_redact:
    //            do regex replace on the file
    //       for each env var in the environment_variables array
    //         if full_redact or partial_redact:
    //            do regex replace on the file
    //       save the file
    //   re-zip the file using original name
    //   delete the temp folder
    //   update the stats
    const traceFiles = this.getAllZipFiles(this.traceFolderPath);

    console.log('🚀 -----------------------------------------------🚀');
    console.log('🚀 ~ Redactor ~ redact ~ traceFiles:', traceFiles);
    console.log('🚀 -----------------------------------------------🚀');

    return 'todo';
  }

  unzip(filePath: string) {
    const zip = new AdmZip(filePath);
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath);
    const outputFolder = path.join(
      path.dirname(filePath),
      fileName.replace(extension, '')
    );
    zip.extractAllTo(outputFolder);
  }

  getAllZipFiles(dirPath: string, zipFiles?: string[]): string[] {
    const files = fs.readdirSync(dirPath);

    zipFiles = zipFiles || [];

    files.forEach(file => {
      if (fs.statSync(dirPath + '/' + file).isDirectory()) {
        zipFiles = this.getAllZipFiles(dirPath + '/' + file, zipFiles);
      } else {
        if (path.extname(file) === '.zip') {
          zipFiles.push(path.join(dirPath, '/', file));
        }
      }
    });

    return zipFiles;
  }
}
