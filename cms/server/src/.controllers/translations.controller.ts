import { exportTranslations } from '../translations/export-translations.controller';
import { importTranslations } from '../translations/import-translations.controller';

export const translations = (app) => {
  exportTranslations(app);
  importTranslations(app);
};
