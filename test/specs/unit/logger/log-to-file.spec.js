const { describe, it } = require('mocha');
const { assert } = require('chai');
const { createReadStream } = require('fs-extra');
const { join, basename } = require('path');
const { v4: uuidv4 } = require('uuid');

const { PrerendererService } = require('../../../../dist/lib/service');
const { Logger } = require('../../../../dist/lib/logger');

describe('log to file', () => {
  // /**
  //  * @type {import('../../../../dist/types/config/defaults').PrerendererConfig}
  //  */
  // const initialConfig = {
  //   databaseOptions: {
  //     authSource: 'admin',
  //     host: process.env.TEST_DB_HOST,
  //     username: process.env.TEST_DB_USERNAME,
  //     password: process.env.TEST_DB_PASSWORD,
  //     database: process.env.TEST_DB_DATABASE,
  //   },
  //   nodeEnv: 'production',
  //   prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
  // };

  // const pProduction = new PrerendererService(initialConfig);
  // const pDevelopment = new PrerendererService({
  //   ...initialConfig,
  //   nodeEnv: 'development',
  //   prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
  // });

  // before(async () => {
  //   await pProduction.start();
  //   await pDevelopment.start();
  // });

  // after(async () => {
  //   await pProduction.stop();
  //   await pDevelopment.stop();
  // });

  // it('should log up to warning level on production env.', async () => {
  //   const logger = pProduction.getLogger();
  //   const logFile = pProduction.getConfig().getPrerendererLogFile();
  //   let msg = '';

  //   const levelsToLog = ['emerg', 'alert', 'crit', 'error', 'warning'];
  //   const levelsToNotLog = ['notice', 'info', 'debug'];

  //   const readerForLevelsToLog = createReadStream(logFile);

  //   readerForLevelsToLog.on('data', (logBuffer) => {
  //     const msg = levelsToLog.find((logLevel) => logBuffer.toString().includes(`${logLevel}:`));
  //     assert.isOk(msg, `should have included log message in log file ${basename(logFile)}`);
  //   });

  //   levelsToLog.forEach((logLevel) => {
  //     msg = uuidv4();
  //     logger[logLevel](msg, 'test');
  //   });

  //   const readerForLevelsToNotLog = createReadStream(logFile);

  //   readerForLevelsToNotLog.on('data', (logBuffer) => {
  //     const msg = levelsToNotLog.find((logLevel) => logBuffer.toString().includes(`${logLevel}:`));
  //     assert.isNotOk(msg, `should have not included log message in log file ${basename(logFile)}`);
  //   });

  //   levelsToNotLog.forEach((logLevel) => {
  //     msg = uuidv4();
  //     logger[logLevel](msg);
  //   });
  // });

  // it('should log all levels on development env.', async () => {
  //   const logger = pDevelopment.getLogger();
  //   const logFile = pDevelopment.getConfig().getPrerendererLogFile();
  //   let msg = '';

  //   const levelsToLog = ['emerg', 'alert', 'crit', 'error', 'warning', 'notice', 'info', 'debug'];

  //   const readerForLevelsToLog = createReadStream(logFile);

  //   readerForLevelsToLog.on('data', (logBuffer) => {
  //     const msg = levelsToLog.find((logLevel) => logBuffer.toString().includes(`${logLevel}:`));
  //     assert.isOk(msg, `should have included log message in log file ${basename(logFile)}`);
  //   });

  //   levelsToLog.forEach((logLevel) => {
  //     msg = uuidv4();
  //     logger[logLevel](msg, 'test');
  //   });
  // });

  it('should stringify anything correctly so that it is loggable.', async () => {
    assert.strictEqual(Logger.stringify(undefined), '');
    assert.strictEqual(Logger.stringify(''), '');
    assert.strictEqual(Logger.stringify(123), '123');
    assert.strictEqual(Logger.stringify(new Error('test 123')), 'Error: test 123');

    const circObj = { a: 1, b: 2 };
    circObj.c = circObj;
    assert.strictEqual(Logger.stringify(circObj), '[{"a":1,"b":2,"c":"0"}]');
  });
});
