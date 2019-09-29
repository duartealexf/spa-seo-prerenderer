const { describe, it } = require('mocha');
const { assert } = require('chai');
const { createReadStream } = require('fs-extra');
const { join, basename } = require('path');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../../dist/lib/prerenderer');

describe('log to file', () => {
  /**
   * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'production',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    snapshotsDirectory: join('test', 'tmp', uuidv4()),
    filesystemDriver: 'fs',
  };

  it('should log up to warning level on production env.', async () => {
    const p = new Prerenderer(initialConfig);
    await p.initialize();

    const logger = p.getLogger();
    const logFile = p.getConfig().getPrerendererLogFile();
    let msg = '';

    const levelsToLog = ['emerg', 'alert', 'crit', 'error', 'warning'];
    const levelsToNotLog = ['notice', 'info', 'debug'];

    const readerForLevelsToLog = createReadStream(logFile);

    readerForLevelsToLog.on('data', (logBuffer) => {
      const msg = levelsToLog.find((logLevel) => logBuffer.toString().includes(`${logLevel}:`));
      assert.isOk(msg, `should have included log message in log file ${basename(logFile)}`);
    });

    levelsToLog.forEach((logLevel) => {
      msg = uuidv4();
      logger[logLevel](msg, 'test');
    });

    const readerForLevelsToNotLog = createReadStream(logFile);

    readerForLevelsToNotLog.on('data', (logBuffer) => {
      const msg = levelsToNotLog.find((logLevel) => logBuffer.toString().includes(`${logLevel}:`));
      assert.isNotOk(msg, `should have not included log message in log file ${basename(logFile)}`);
    });

    levelsToNotLog.forEach((logLevel) => {
      msg = uuidv4();
      logger[logLevel](msg);
    });
  });

  it('should log all levels on development env.', async () => {
    const config = Object.assign({}, initialConfig, {
      nodeEnv: 'development',
      prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    });

    const p = new Prerenderer(config);
    await p.initialize();

    const logger = p.getLogger();
    const logFile = p.getConfig().getPrerendererLogFile();
    let msg = '';

    const levelsToLog = ['emerg', 'alert', 'crit', 'error', 'warning', 'notice', 'info', 'debug'];

    const readerForLevelsToLog = createReadStream(logFile);

    readerForLevelsToLog.on('data', (logBuffer) => {
      const msg = levelsToLog.find((logLevel) => logBuffer.toString().includes(`${logLevel}:`));
      assert.isOk(msg, `should have included log message in log file ${basename(logFile)}`);
    });

    levelsToLog.forEach((logLevel) => {
      msg = uuidv4();
      logger[logLevel](msg, 'test');
    });
  });
});
