const { describe, it, before, after } = require('mocha');
const { assert } = require('chai');
const { createReadStream } = require('fs-extra');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

const { PrerendererService } = require('../../../../dist/lib/service');

describe('log errors', () => {
  /**
   * @type {import('../../../../dist/types/config/defaults').PrerendererConfig}
   */
  const initialConfig = {
    databaseOptions: {
      authSource: 'admin',
      host: process.env.TEST_DB_HOST,
      username: process.env.TEST_DB_USERNAME,
      password: process.env.TEST_DB_PASSWORD,
      database: process.env.TEST_DB_DATABASE,
    },
    nodeEnv: 'development',
    prerendererLogFile: join('test', 'tmp', `${uuidv4()}.log`),
  };

  const p = new PrerendererService(initialConfig);

  before(() => p.start());
  after(() => p.stop());

  it('should close log write stream if it cannot write to log file.', async () => {
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
