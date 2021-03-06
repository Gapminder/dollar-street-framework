'use strict';
const fs = require('fs');
const path = require('path');

const testResultsDir = 'results';
const testResultsFile = `${testResultsDir}/testResults.txt`;
const consoleErrorsFile = `${testResultsDir}/consoleErrors.txt`;
const BOUNDARY = '\n***************\n';

exports.config = {
  baseUrl: 'http://localhost:3000',

  capabilities: {
    browserName: 'chrome',
    shardTestFiles: true,
    maxInstances: 4,
    chromeOptions: {
      args: ['headless', '--window-size=1920x1080'],
      prefs: {
        'profile.managed_default_content_settings.notifications': 1
      }
    }
  },

  params: {
    baseHref: '',
    apiUrl: ''
  },

  specs: ['./test-e2e/app/tests/**/*.e2e-spec.ts'],
  exclude: [
    './test-e2e/app/cms/**/*.e2e-spec.ts',
    './test-e2e/app/tests/click-each-link.e2e-spec.ts',
    './test-e2e/app/tests/facebook.e2e-spec.ts',
    './test-e2e/app/tests/social-networks/*.e2e-spec.ts',
    './test-e2e/app/tests/matrix-page/embed-feature-tests.e2e-spec.ts'
  ],

  framework: 'jasmine',

  allScriptsTimeout: 60000,

  jasmineNodeOpts: {
    showTiming: true,
    showColors: true,
    isVerbose: false,
    includeStackTrace: false,
    defaultTimeoutInterval: 60000,
    print: function() {}
  },
  directConnect: true,

  // temporary disabled
  // typescript copmiles 'async await' to generators so it won't affect controlFlow
  // SELENIUM_PROMISE_MANAGER: false,

  useAllAngular2AppRoots: true,

  // this will be run after all the tests will be finished
  afterLaunch: function() {
    const fileParse = fs.readFileSync(testResultsFile, 'utf-8');
    const rawTestResults = fileParse.split(BOUNDARY).filter((el) => el);
    const testResults = rawTestResults.map((res) => JSON.parse(res));

    // print consolidated report to the console
    for (const testResult of testResults) {
      console.log(`\n${testResults.indexOf(testResult) + 1}) ${testResult.fullName}`);
      testResult.failedExpectations.forEach((exp) => {
        console.log('  - [31m' + exp.message + '[39m');
      });
    }
  },

  // will be run before any test starts
  beforeLaunch: function() {
    // create directory for testResults if not exist
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir);
    }

    // clear older tests results
    const files = fs.readdirSync(testResultsDir);
    for (const file of files) {
      fs.unlinkSync(`${testResultsDir}/${file}`);
    }
    // fill the testResults files with default values
    fs.openSync(testResultsFile, 'w');
    fs.openSync(consoleErrorsFile, 'w');
  },
  onPrepare: function() {
    require('ts-node').register({ project: path.join(__dirname, './test-e2e/tsconfig.json') });
    browser.params.apiUrl = `${browser.baseUrl}/${process.env.API_VERSION || 'v1'}`; // Set up here, because we need browser object and baseUrl field

    browser.driver
      .manage()
      .window()
      .setSize(1920, 1080);
    let SpecReporter = require('jasmine-spec-reporter').SpecReporter;

    jasmine.getEnv().addReporter(
      new SpecReporter({
        spec: {
          displayStacktrace: true
        }
      })
    );

    jasmine.getEnv().addReporter({
      specDone: function(result) {
        if (result.status === 'failed') {
          // take screenshot on fail
          browser.takeScreenshot().then(function(screenShot) {
            // Save screenshot
            fs.writeFileSync(`${testResultsDir}/${result.fullName}`, screenShot, 'base64', function(err) {
              if (err) throw err;
              console.log('File saved.');
            });
          });

          // save testResult in file
          fs.appendFileSync(testResultsFile, JSON.stringify(result) + BOUNDARY, 'utf-8');
        }

        browser
          .manage()
          .logs()
          .get('browser')
          .then(function(browserLogs) {
            browserLogs.forEach(function(log) {
              if (log.level.value > 900) {
                // it's an error log
                fs.appendFileSync(
                  consoleErrorsFile,
                  result.fullName + '\n' + require('util').inspect(log) + BOUNDARY,
                  'utf-8'
                );
              }
            });
          });
      }
    });
  }
};
