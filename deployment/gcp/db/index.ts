import { run as runDBChange } from './move-place-db';

(async () => {
  try {
    await runDBChange();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
})();
