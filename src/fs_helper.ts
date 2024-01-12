import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

export function unzip(filePath: string) {
  const zip = new AdmZip(filePath);
  const fileName = path.basename(filePath);
  const extension = path.extname(filePath);
  const outputFolder = path.join(
    path.dirname(filePath),
    fileName.replace(extension, '')
  );
  zip.extractAllTo(outputFolder);
}

export function cleanFolder(directoryPath: fs.PathLike) {
  if (fs.existsSync(directoryPath)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fs.readdirSync(directoryPath).forEach((file, _index) => {
      const curPath = path.join(String(directoryPath), file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        cleanFolder(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

export function fileCount(dirPath: fs.PathLike) {
  let count = 0;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(String(dirPath), file);

    if (fs.statSync(filePath).isDirectory()) {
      count += fileCount(filePath);
    } else {
      count++;
    }
  });

  return count;
}
