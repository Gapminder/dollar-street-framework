import * as _ from 'lodash';
import * as async from 'async';
import * as shell from 'shelljs';

import { ChildProcess } from 'child_process';
import { logger } from '../../common/log';

export async function promiseShellCommand(command, options) {
  return new Promise((resolve, reject) => {
    return runShellCommand(command, options, (error: string, result: string) =>
      error ? reject(error) : resolve(result)
    );
  });
}

// tslint:disable-next-line:no-any
export function runShellCommand(
  command: string,
  // tslint:disable-next-line:no-any
  options: any,
  cb: AsyncResultCallback<shell.ExecOutputReturnValue | ChildProcess | string, string>
) {
  let outputParam = '';
  switch (true) {
    case _.includes(command, 'gcloud compute') && !_.includes(command, '--quiet'):
      outputParam = ' --format=json';
      break;
    case _.includes(command, 'gcloud beta billing') && !_.includes(command, '--quiet'):
      outputParam = ' --format=json';
      break;
    case _.includes(command, 'kubectl get service') && !_.includes(command, '--quiet'):
      outputParam = ' --output=json';
      break;
    default:
  }

  const wrappedCommand = `${command}${outputParam}`;
  logger.info('deploy', 'RUN COMMAND: ', wrappedCommand, '\n');

  let attemptCounter = 0;

  async.retry(
    {
      times: 3,
      interval: 1000
    },
    (_cb: AsyncResultCallback<shell.ExecOutputReturnValue | ChildProcess, string>) => {
      const result: shell.ExecOutputReturnValue | ChildProcess = shell.exec(wrappedCommand, options);

      const error: string = shell.error();
      const { code, stderr, stdout } = result as shell.ExecOutputReturnValue;

      if (process.env.DEBUG === 'true') {
        logger.info(
          `[CODE=${code}] RESULT COMMAND: \nstdout: ${stdout ? stdout : `${stdout}\n`}stderr: ${
            stderr ? stderr : `${stderr}\n`
          }error: ${error ? error : `${error}\n`}`
        );
      }

      const isErrorShouldBeSkipped = isStepShouldBeSkipped(stderr);
      const isResultShouldBeSkipped = isStepShouldBeSkipped(stdout);

      if (error && !isErrorShouldBeSkipped) {
        logger.info(`Attempt ${++attemptCounter} was failed..`);

        console.error(`Unexpected error [code=${code}]: ${stderr}`);

        return async.setImmediate(() => _cb(null, result));
      }

      if (isErrorShouldBeSkipped || isResultShouldBeSkipped) {
        logger.info(`SKIP STEP`);

        return async.setImmediate(() => _cb(null, result));
      }

      if (_.isEmpty(stdout)) {
        logger.info(`STDOUT IS EMPTY`);

        return async.setImmediate(() => _cb(null, result));
      }

      if (_.includes(command, 'docker')) {
        logger.info(`DOCKER COMMAND`);

        return async.setImmediate(() => _cb(null, result));
      }

      try {
        if (options.pathsToCheck) {
          const parsedStdout = JSON.parse(stdout);

          const missingPaths = options.pathsToCheck.filter((path: string) => !_.get(parsedStdout, path, false));
          if (missingPaths.length) {
            logger.error(`No required data by paths: "${missingPaths.join('", "')}" : ${stdout}`);

            return async.setImmediate(() =>
              _cb(`No required data by paths: "${missingPaths.join('", "')}" : ${stdout}`, result)
            );
          }
        }

        return async.setImmediate(() => _cb(null, result));
      } catch (_error) {
        logger.info(`Attempt ${++attemptCounter} was failed..`);
        logger.error(`JSON parse syntax error: ${_error.message}. Retry to connect again..`);

        return async.setImmediate(() =>
          _cb(`JSON parse syntax error: ${_error.message}. Retry to connect again..`, result)
        );
      }
    },
    cb
  );
}

function isStepShouldBeSkipped(result: string) {
  const skipMarkers = [
    'already exists',
    'scaled',
    'AlreadyExists',
    'is already in use',
    'code=404',
    'was not found',
    'is not a valid name',
    'RUNNING',
    'Google Cloud SDK',
    'Docker version'
  ];

  return _.some(skipMarkers, (item: string) => {
    return _.includes(result, item);
  });
}
