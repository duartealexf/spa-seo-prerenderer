import fsExtra, { WriteFileOptions, CopyOptions } from 'fs-extra';
import { join, dirname, basename, extname } from 'path';

export class Filesystem {
  /**
   * Return given file's extension name.
   * @param filepath
   */
  public static extname(filepath: string): string {
    return extname(filepath).toLowerCase();
  }

  /**
   * Return given file's filename, without extension.
   * @param filepath
   */
  public static basename(filepath: string): string {
    const ext = extname(filepath);
    let base = basename(filepath);
    base = base.substr(0, base.length - ext.length);
    return base;
  }

  /**
   * Return given file's directory, without filename or extension.
   * @param filepath
   */
  public static dirname(filepath: string): string {
    return dirname(filepath);
  }

  /**
   * Return given file's name, with extension.
   * @param filepath
   */
  public static filename(filepath: string): string {
    return basename(filepath);
  }

  /**
   * Return whether or not the path is a directory.
   * @param path Path to file or directory.
   */
  public static async isDirectory(path: string): Promise<boolean> {
    const isDir: boolean = await new Promise((resolve) => {
      fsExtra.stat(path, (err, stat) => {
        if (err) {
          resolve(false);
        }

        resolve(stat.isDirectory());
      });
    });

    return isDir;
  }

  /**
   * Ensure directory is created.
   * @param pathParts
   */
  public static async ensureDir(...pathParts: string[]): Promise<void> {
    const path = join(...pathParts);
    await new Promise(async (resolve) => {
      const exists = await Filesystem.exists(...pathParts);

      if (!exists) {
        try {
          fsExtra.mkdirpSync(path);
          return resolve();
        } catch (err) {
          if (err.code === 'EEXIST') {
            return resolve();
          }
          throw new Error(`Error when creating ${path} directory: ${JSON.stringify(err)}`);
        }
      }
      return resolve();
    });
  }

  /**
   * Create a blank file if it does not exist. If file exists, it does nothing.
   * Can throw an error if file is not writeable.
   * @param filepath
   */
  public static async ensureFile(filepath: string): Promise<void> {
    if (!(await Filesystem.exists(filepath))) {
      await Filesystem.write(filepath, '');
    } else {
      await Filesystem.append(filepath, '');
    }
  }

  /**
   * Get whether file or directory exists.
   * @param pathParts
   */
  public static async exists(...pathParts: string[]): Promise<boolean> {
    const path = join(...pathParts);

    const exists = await new Promise<boolean>(async (resolve) => {
      fsExtra.stat(path, (err) => {
        if (!err) {
          resolve(true);
          return;
        }

        if (err.code === 'ENOENT') {
          resolve(false);
        } else {
          throw new Error(`Error when checking path ${path}: ${JSON.stringify(err)}`);
        }
      });
    });
    return exists;
  }

  /**
   * Delete file or directory.
   * @param path
   */
  public static async delete(path: string): Promise<void> {
    await new Promise(async (resolve) => {
      fsExtra.stat(path, (statErr, stat) => {
        if (statErr) {
          if (statErr.code === 'ENOENT') {
            resolve();
            return;
          }
          throw new Error(`Error when checking path ${path}: ${JSON.stringify(statErr)}`);
        }

        if (stat.isDirectory()) {
          fsExtra.remove(path, (rmDirErr) => {
            if (!rmDirErr) {
              resolve();
              return;
            }
            throw new Error(`Error when removing directory ${path}: ${JSON.stringify(rmDirErr)}`);
          });
        } else {
          fsExtra.unlink(path, (unlinkErr) => {
            if (!unlinkErr) {
              resolve();
              return;
            }
            throw new Error(`Error when removing file ${path}: ${JSON.stringify(unlinkErr)}`);
          });
        }
      });
    });
  }

  /**
   * Empties directory in given path by deleting it and recreating.
   * @param path
   */
  public static async emptyDirectory(path: string): Promise<void> {
    await Filesystem.delete(path);
    return Filesystem.ensureDir(path);
  }

  /**
   * Read file and return its contents as string.
   * @param filepath
   */
  public static async read(filepath: string): Promise<string> {
    return new Promise((resolve) => {
      fsExtra.readFile(filepath, (err, contents) => {
        if (err) {
          throw new Error(`Error when reading file from path ${filepath}: ${JSON.stringify(err)}`);
        }
        resolve(contents.toString());
      });
    });
  }

  /**
   * Write file.
   * @param file Filepath to be written to.
   * @param data Data to write to file.
   * @param options Write options.
   */
  public static async write(
    file: string,
    data: string,
    options: string | WriteFileOptions = {},
  ): Promise<void> {
    const directory = Filesystem.dirname(file);
    await Filesystem.ensureDir(directory);

    return new Promise((resolve) => {
      fsExtra.writeFile(file, data, options, (err) => {
        if (err) {
          throw new Error(`Error when writing file: ${JSON.stringify(err)}`);
        }
        resolve();
      });
    });
  }

  /**
   * Append data to file.
   * @param file Filepath to be written to.
   * @param data Data to write to file.
   */
  public static async append(file: string, data: string): Promise<void> {
    const directory = Filesystem.dirname(file);
    await Filesystem.ensureDir(directory);

    return new Promise((resolve) => {
      fsExtra.appendFile(file, data, (err) => {
        if (err) {
          throw new Error(`Error when writing file: ${JSON.stringify(err)}`);
        }
        resolve();
      });
    });
  }

  /**
   * Move file in disk.
   * @param oldPath Current path of file.
   * @param newPath New path to move to.
   */
  public static async move(oldPath: string, newPath: string): Promise<void> {
    return new Promise((r) => {
      fsExtra.move(oldPath, newPath, (err) => {
        if (err) {
          throw new Error(`Error when moving file: ${JSON.stringify(err)}`);
        }
        r();
      });
    });
  }

  /**
   * Copy file.
   * @param src Current path of file.
   * @param dest New path to copy to.
   * @param options Copy options.
   */
  public static async copy(src: string, dest: string, options: CopyOptions = {}): Promise<void> {
    return new Promise((r) => {
      fsExtra.copy(src, dest, options, (err) => {
        if (err) {
          throw new Error(`Error when copying file from ${src} to ${dest}: ${JSON.stringify(err)}`);
        }
        r();
      });
    });
  }

  /**
   * Read and return contents of given directory.
   * @param directory
   */
  public static async ls(directory: string): Promise<string[]> {
    const files = await new Promise<string[]>((resolve) => {
      fsExtra.readdir(directory, (err, contents) => {
        if (err) {
          throw new Error(`Error when reading path ${directory}: ${JSON.stringify(err)}`);
        }

        resolve(contents);
      });
    });

    return files;
  }
}
