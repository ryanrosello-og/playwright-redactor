import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

export type Result<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function zip(zipFolderPath: string) {
  const zip = new AdmZip();
  zip.addLocalFolder(zipFolderPath);
  zip.writeZip(`${zipFolderPath}.zip`);
}

export function getZipTargetFolder(zipFilePath: string) {
  return zipFilePath.replace('.zip', '');
}

export function writeToFile(
  filePath: string,
  fileContents: string
): Result<string> {
  try {
    fs.writeFileSync(filePath, fileContents);
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export function readFile(filePath: string): Result<string> {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export function unzip(zipFilePath: string) {
  const zip = new AdmZip(zipFilePath);
  const outputFolder = getZipTargetFolder(zipFilePath);
  zip.extractAllTo(outputFolder);
}

export function deleteFile(directoryPath: fs.PathLike) {
  if (fs.existsSync(directoryPath)) {
    fs.unlinkSync(directoryPath);
  }
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
