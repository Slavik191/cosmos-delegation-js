const config = require('./jest.config');

// Override default configuration
config.testRegex = '\\.spec\\.js$';

// eslint-disable-next-line no-console
console.log('RUNNING UNIT TESTS');

module.exports = config;
