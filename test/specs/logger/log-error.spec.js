const { describe, it } = require('mocha');
const { assert } = require('chai');
const { createReadStream } = require('fs-extra');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../dist/lib/Prerenderer');

describe('log errors', () => {
  /**
   * @type {import('../../../dist/types/Config').PrerendererConfigParams}
   */
  const initialConfig = {
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
    snapshotsDirectory: join('test', 'tmp', uuidv4()),
    snapshotsDriver: 'fs',
  };

  it('should close log write stream if it cannot write to log file.', async () => {
    const p = new Prerenderer(initialConfig);
    await p.initialize();

    const logger = p.getLogger();
    const logFile = p.getConfig().getPrerendererLogFile();
    const msgToNotLog = uuidv4();

    const reader = createReadStream(logFile);

    reader.on('data', () => {
      assert.isOk(false, 'should not have logged, because log write stream should be closed');
    });

    /**
     * Propositally close write stream and write to cause an error.
     */
    logger.logFile.close();
    logger.logFile.write('test');

    /**
     * Also, this shouldn't log.
     */
    logger.error(msgToNotLog, 'test');
  });
});
