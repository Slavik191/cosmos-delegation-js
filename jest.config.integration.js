const config = require('./jest.config');

// Override default configuration
config.testRegex = '\\.ispec\\.js$';

// eslint-disable-next-line no-console
console.log('RUNNING INTEGRATION TESTS');

module.exports = config;
