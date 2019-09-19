import { config } from './config';
import { expressConfig } from './express.config';

export const initConfig = (app) => {
  config(app);
  expressConfig(app);
};
