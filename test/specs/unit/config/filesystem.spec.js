const { describe, it } = require('mocha');
const { assert } = require('chai');
const { join } = require('path');
const { pathExists } = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const { Prerenderer } = require('../../../../dist/lib/prerenderer');

describe('filesystem config', () => {
  it('should not create a directory for snapshotsDirectory when filesystemDriver is s3.', async () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      snapshotsDirectory: `${join(process.cwd(), 'test', 'tmp', uuidv4())}`,
      filesystemDriver: 's3',
      awsS3AccessKeyID: 'test',
      awsS3SecretAccessKey: 'test',
      awsS3BucketName: 'test',
      awsS3RegionName: 'test',
    };

    const p = new Prerenderer(config);

    assert.isNotOk(await pathExists(p.getConfig().getSnapshotsDirectory()));
  });

  it('should set AWS S3 config as passed in constructor.', () => {
    /**
     * @type {import('../../../../dist/types/config/defaults').PrerendererConfigParams}
     */
    const config = {
      snapshotsDirectory: `${join(process.cwd(), 'test', 'tmp', uuidv4())}`,
      filesystemDriver: 's3',
      awsS3AccessKeyID: 'test1',
      awsS3SecretAccessKey: 'test2',
      awsS3BucketName: 'test3',
      awsS3RegionName: 'test4',
    };

    const p = new Prerenderer(config);

    assert.equal(p.getConfig().getAWSS3AccessKeyId(), config.awsS3AccessKeyID);
    assert.equal(p.getConfig().getAWSS3SecretAccessKey(), config.awsS3SecretAccessKey);
    assert.equal(p.getConfig().getAWSS3BucketName(), config.awsS3BucketName);
    assert.equal(p.getConfig().getAWSS3RegionName(), config.awsS3RegionName);
  });
});
