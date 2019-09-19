import { run as ranDeploy } from './deploy-standalone';

(async (): Promise<void> => {
  try {
    await ranDeploy();

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
})();
