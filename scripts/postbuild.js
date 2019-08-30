const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');
const shell = require('shelljs');

// @ts-ignore
const { version: VERSION } = require('../package.json');
const CWD = join(__dirname, '..');

/**
 * Set version in transpiled Prerender file.
 * @param {string} version Version to be set.
 */
const setPrerenderVersion = (version) => {
  const PRERENDERER_FILE = join(CWD, 'dist', 'Prerenderer.js');
  let output = readFileSync(PRERENDERER_FILE).toString();
  output = output.replace('{{version}}', version);
  writeFileSync(PRERENDERER_FILE, output);
};

setPrerenderVersion(VERSION);
