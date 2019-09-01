const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

// @ts-ignore
const { version: VERSION } = require('../package.json');
const CWD = join(__dirname, '..');

/**
 * Set version in transpiled Prerender file.
 * @param {string} version Version to be set.
 */
const setPrerenderVersion = (version) => {
  const OUT_FILES = [
    join(CWD, 'dist', 'lib', 'prerenderer.js'),
    join(CWD, 'dist', 'types', 'prerenderer.d.ts'),
  ];

  OUT_FILES.forEach((OUT_FILE) => {
    let output = readFileSync(OUT_FILE).toString();
    output = output.replace('{{version}}', version);
    writeFileSync(OUT_FILE, output);
  });
};

setPrerenderVersion(VERSION);
