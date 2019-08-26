import fsExtra, { WriteFileOptions, CopyOptions } from 'fs-extra';
import { join, dirname, basename, extname } from 'path';

class Filesystem {
  private driver: string;
  private directory: string;

  constructor(driver: 'fs' | 's3', directory: string) {
    this.driver = driver;
    this.directory = directory;
  }

  /**
   * Return given file's extension name.
   * @param filepath
   */
  public extname(filepath: string): string {
    return extname(filepath).toLowerCase();
  }

  /**
   * Return given file's filename, without extension.
   * @param filepath
   */
  basename(filepath: string): string {
    const ext = extname(filepath);
    let base = basename(filepath);
    base = base.substr(0, base.length - ext.length);
    return base;
  }

  /**
   * Return given file's directory, without filename or extension.
   * @param filepath
   */
  dirname(filepath: string): string {
    return dirname(filepath);
  }

  /**
   * Return given file's name, with extension.
   * @param filepath
   */
  filename(filepath: string): string {
    return basename(filepath);
  }

  /**
   * Return whether or not the path is a directory.
   * @param path Path to file or directory.
   */
  async isDirectory(path: string) {
    const isDir = await new Promise((resolve) => {
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
  async ensureDir(...pathParts: string[]): Promise<void> {
    const path = join(...pathParts);
    await new Promise(async (resolve) => {
      const exists = await this.exists(...pathParts);

      if (!exists) {
        try {
          fsExtra.mkdirpSync(path);
          return resolve();
        } catch (err) {
          if (err.code === 'EEXIST') {
            return resolve();
          }
          throw new Error(
            `Error when creating ${path} directory: ${JSON.stringify(err)}`,
          );
        }
      }
      return resolve();
    });
  }

  /**
   * Ensure directory is created.
   * @param pathParts
   */
  async ensureDirectory(...pathParts: string[]): Promise<void> {
    const newPath = [this.directory, ...pathParts];
    await this.ensureDir(...newPath);
  }

  /**
   * Where file or directory exists.
   * @param pathParts
   */
  async exists(...pathParts: string[]): Promise<boolean> {
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
          throw new Error(
            `Error when checking path ${path}: ${JSON.stringify(err)}`,
          );
        }
      });
    });
    return exists;
  }

  /**
   * Delete file or directory.
   * @param path
   */
  async delete(path: string): Promise<void> {
    await new Promise(async (resolve) => {
      fsExtra.stat(path, (statErr, stat) => {
        if (statErr) {
          if (statErr.code === 'ENOENT') {
            resolve();
            return;
          }
          throw new Error(
            `Error when checking path ${path}: ${JSON.stringify(statErr)}`,
          );
        }

        if (stat.isDirectory()) {
          fsExtra.remove(path, (rmDirErr) => {
            if (!rmDirErr) {
              resolve();
              return;
            }
            throw new Error(
              `Error when removing directory ${path}: ${JSON.stringify(
                rmDirErr,
              )}`,
            );
          });
        } else {
          fsExtra.unlink(path, (unlinkErr) => {
            if (!unlinkErr) {
              resolve();
              return;
            }
            throw new Error(
              `Error when removing file ${path}: ${JSON.stringify(unlinkErr)}`,
            );
          });
        }
      });
    });
  }

  /**
   * Empties directory in given path by deleting it and recreating.
   * @param path
   */
  async emptyDirectory(path: string): Promise<void> {
    await this.delete(path);
    return this.ensureDir(path);
  }

  /**
   * Read file and return its contents as string.
   * @param filepath
   */
  async read(filepath: string): Promise<string> {
    return new Promise((resolve) => {
      fsExtra.readFile(filepath, (err, contents) => {
        if (err) {
          throw new Error(
            `Error when reading file from path ${filepath}: ${JSON.stringify(
              err,
            )}`,
          );
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
  async write(
    file: string,
    data: any,
    options: string | WriteFileOptions = {},
  ): Promise<void> {
    const directory = this.dirname(file);
    await this.ensureDir(directory);

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
   * Move file in disk.
   * @param oldPath Current path of file.
   * @param newPath New path to move to.
   */
  async move(oldPath: string, newPath: string): Promise<void> {
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
  async copy(
    src: string,
    dest: string,
    options: CopyOptions = {},
  ): Promise<void> {
    return new Promise((r) => {
      fsExtra.copy(src, dest, options, (err) => {
        if (err) {
          throw new Error(
            `Error when copying file from ${src} to ${dest}: ${JSON.stringify(
              err,
            )}`,
          );
        }
        r();
      });
    });
  }

  /**
   * Read and return contents of given directory.
   * @param directory
   */
  async ls(directory: string): Promise<string[]> {
    const files = await new Promise<string[]>((resolve) => {
      fsExtra.readdir(directory, (err, contents) => {
        if (err) {
          throw new Error(
            `Error when reading path ${directory}: ${JSON.stringify(err)}`,
          );
        }

        resolve(contents);
      });
    });

    return files;
  }
}

module.exports = { Filesystem };
