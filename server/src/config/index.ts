import { config } from './config';
import { expressConfig } from './express.config';

export const initConfigs = (app) => {
  config(app);
  expressConfig(app);
};
