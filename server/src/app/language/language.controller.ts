// Todo: Need refactor according to "noImplicitAny" rule

import { Application, Request, Response } from 'express';
import { extend, keyBy, forEach, find, get, map } from 'lodash';

import { InterfaceTranslations } from '../../interfaces/interfaceTranslations';
import { ContentTranslations } from '../../interfaces/contentTranslations';

import { interfaceTranslationsService } from '../../repositories/interfaceTranslations.service';
import { infoRepositoryService } from '../../repositories/info.repository.service';
import { languagesRepositoryService } from '../../repositories/languages.repository.service';
import { contentTranslationsRepositoryService } from '../../repositories/contentTranslations.repository.service';
import { Languages } from '../../interfaces/languages';

const defaultLanguage = 'en';
const ERROR_CODE = 320;

module.exports = (app: Application) => {
  const config = app.get('nconf');
  const compression = app.get('compression.middleware');

  const BASE_HREF = config.get('BASE_HREF');

  app.get(`${BASE_HREF}/v1/language`, compression(), getLanguageDataSet);

  app.get(`${BASE_HREF}/v1/languagesList`, compression(), setLanguagesList);
};

async function getLanguageDataSet(req: Request, res: Response): Promise<Response> {
  try {
    const {
      query: { lang: currentLanguage }
    } = req;
    const [interfaceTranslations, contentTranslations, infoTranslations] = await Promise.all([
      setInterfaceTranslations(currentLanguage),
      setContentTranslations(currentLanguage),
      setInfoTranslations(currentLanguage)
    ]);
    const data = extend({}, contentTranslations, interfaceTranslations, infoTranslations);

    return res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: false, msg: [], data: null, error: `Error code for language: ${ERROR_CODE}` });
  }
}

async function setInterfaceTranslations(currentLanguage: string): Promise<InterfaceTranslations> {
  const { translations } = await interfaceTranslationsService.getInterfaceTranslations();

  if (!translations) {
    throw new Error('Error: Translations were not found!');
  }

  const translationsByLanguage = keyBy(translations, 'lang');
  const defaultTranslation = translationsByLanguage[defaultLanguage];
  let translationToUse;

  if (translationsByLanguage[currentLanguage]) {
    translationToUse = translationsByLanguage[currentLanguage];

    forEach(defaultTranslation, (value, key) => {
      if (!translationToUse[key]) {
        translationToUse[key] = value;
      }
    });
  } else {
    translationToUse = defaultTranslation;
  }

  return translationToUse;
}

async function setContentTranslations(currentLanguage: string): Promise<ContentTranslations> {
  const { translations, value, key } = await contentTranslationsRepositoryService.getContentTranslations();

  if (!translations) {
    throw new Error(`Error: Translations by current language: ${currentLanguage} were not found!`);
  }

  const translationResult = {};
  const translationByLanguage = find(translations, { lang: currentLanguage });
  translationResult[key] = get(translationByLanguage, 'value', value);

  return translationResult as ContentTranslations;
}

async function setInfoTranslations(currentLanguage: string): Promise<{ [x: string]: string }> {
  const { translations, context } = await infoRepositoryService.getInfoTranslations();

  if (!translations) {
    throw new Error(`Error: Translations by current language: ${currentLanguage} were not found!`);
  }

  const infoTranslationKey = 'ABOUT_INFO';
  const translationResult = {
    [infoTranslationKey]: context
  };
  const translationByLanguage = find(translations, { lang: currentLanguage });
  translationResult[infoTranslationKey] = get(translationByLanguage, 'context', context);

  return translationResult;
}

async function setLanguagesList(req: Request, res: Response): Promise<Response> {
  try {
    const languagesList: Languages[] = await languagesRepositoryService.getLanguagesList();

    if (!languagesList) {
      throw new Error('Error: Languages were not found!');
    }

    const languages = map(languagesList, (language: { alias: string; code: string; name: string }) => {
      language.name = language.alias || language.name;
      delete language.alias;

      return language;
    });

    return res.json({ success: true, msg: [], data: languages, error: null });
  } catch (err) {
    console.error(err);

    return res.json({
      success: !err,
      msg: [],
      data: null,
      error: `Error: Languages were not found. Error code: ${ERROR_CODE}`
    });
  }
}
