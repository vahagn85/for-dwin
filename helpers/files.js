import path from "path";
import { promises as fs } from "fs";
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`Deleted ${filePath}`);
  } catch (error) {
    console.error(`Got an error trying to delete the file: ${error.message}`);
  }
}
async function existsFile(pathName) {
  try {
    await fs.access(pathName);
    return true;
  } catch {
    return false;
  }
}
async function ensureFolder(folderPath, recurs = false) {
  try {
    await fs.mkdir(folderPath, { recursive: recurs });
    await fs.mkdir(folderPath);
  } catch (e) {
    return false;
  }
}
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Images only!");
  }
}

const saveFile = async (file, folder) => {
  try {
    const data = await fs.readFile(file.filepath);
    await fs.writeFile(`${folder}/${file.newFilename}`, data);
    await fs.unlink(file.filepath);
    return;
  } catch (err) {
    console.error(err, "saveFile");
  }
};

export { deleteFile, existsFile, checkFileType, ensureFolder, saveFile };
