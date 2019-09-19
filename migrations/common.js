const credentialsService = require('../dist/common/credential.service').credentialsService;
const dbConfig = require('../dist/common/db.config').dbConfig;

const app = require('express')();

require('../dist/server/src/models/index');
const pathToCredentials = '../..';
const actualCredentials = credentialsService.loadCredentials(pathToCredentials);
dbConfig(actualCredentials);

module.exports = app;
