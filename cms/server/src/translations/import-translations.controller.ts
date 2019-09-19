// tslint:disable:no-floating-promises

import * as fs from 'fs';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as path from 'path';
import * as rmdir from 'rmdir';
import * as async from 'async';
import * as unzip from 'unzip';
import * as request from 'request';
import * as mongoose from 'mongoose';
import { translationsService as crowdin } from './translations.service';
import { LanguageEntity, TranslatedEntity, UpdateTranslationQuery } from './translations.interface';

// tslint:disable-next-line:variable-name
const Info = mongoose.model('Info');
// tslint:disable-next-line:variable-name
const Users = mongoose.model('Users');
// tslint:disable-next-line:variable-name
const Forms = mongoose.model('Forms');
// tslint:disable-next-line:variable-name
const Places = mongoose.model('Places');
// tslint:disable-next-line:variable-name
const Things = mongoose.model('Things');
// tslint:disable-next-line:variable-name
const Footer = mongoose.model('Footer');
// tslint:disable-next-line:variable-name
const Regions = mongoose.model('Regions');
// tslint:disable-next-line:variable-name
const Articles = mongoose.model('Articles');
// tslint:disable-next-line:variable-name
const Languages = mongoose.model('Languages');
// tslint:disable-next-line:variable-name
const Locations = mongoose.model('Locations');
// tslint:disable-next-line:variable-name
const Questions = mongoose.model('Questions');
// tslint:disable-next-line:variable-name
const InfoPlaces = mongoose.model('InfoPlaces');
// tslint:disable-next-line:variable-name
const Categories = mongoose.model('Categories');
// tslint:disable-next-line:variable-name
const Onboarding = mongoose.model('Onboarding');
// tslint:disable-next-line:variable-name
const UsersTypes = mongoose.model('UsersTypes');
// tslint:disable-next-line:variable-name
const TypesPlaces = mongoose.model('TypesPlaces');
// tslint:disable-next-line:variable-name
const InterfaceTranslations = mongoose.model('InterfaceTranslations');
// tslint:disable-next-line:variable-name
const CommonShortInfoIncome = mongoose.model('CommonShortInfoIncome');
// tslint:disable-next-line:variable-name
const ContentTranslations = mongoose.model('ContentTranslations');

const translationsPath = path.join(process.cwd(), '/translations');

export const importTranslations = (app) => {
  const nconf = app.get('nconf');
  const isAdmin = app.get('validate').isAdmin;
  const CROWDIN_API_KEY = nconf.get('CROWDIN_API_KEY');
  const CROWDIN_PROJECT_NAME = nconf.get('CROWDIN_PROJECT_NAME');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  crowdin.setKey(CROWDIN_API_KEY);

  app.get(`/${CMS_SERVER_VERSION}/languages`, isAdmin, getLanguagesList);
  app.get(`/${CMS_SERVER_VERSION}/update-languages-list`, isAdmin, updateLanguagesList(CROWDIN_PROJECT_NAME));
  app.get(
    `/${CMS_SERVER_VERSION}/import-translations/:code`,
    isAdmin,
    importLanguageByLanguageCode({
      apiKey: CROWDIN_API_KEY,
      projectName: CROWDIN_PROJECT_NAME
    })
  );

  app.post(`/${CMS_SERVER_VERSION}/update-language/:id`, isAdmin, updateLanguage);
  app.post(`/${CMS_SERVER_VERSION}/update-language-position`, isAdmin, updateLanguagePosition);
};

function getLanguagesList(req, res) {
  Languages.find({}, { alias: 1, name: 1, code: 1, isPublic: 1, position: 1 })
    .sort({ position: 1 })
    .lean()
    .exec((err, languages) => res.json({ success: !err, msg: [], data: languages, error: err }));
}

function updateLanguage(req, res) {
  const body = req.body;
  const params = req.params;

  const languageId = new mongoose.Types.ObjectId(params.id);

  Languages.update({ _id: languageId }, { $set: body }).exec((err, data) =>
    res.json({
      success: !err,
      msg: [],
      data,
      error: err
    })
  );
}

function updateLanguagePosition(req, res) {
  const body = req.body;
  const languages = body.languages || [];

  async.eachLimit(languages, 10, languageDBUpdatePosition, (err) => {
    return res.json({ success: !err, msg: [], error: err });
  });
}

function languageDBUpdatePosition(language, cb) {
  const languageId = new mongoose.Types.ObjectId(language.id);

  if (language.position === undefined) {
    return cb('Error: language.position is undefined in languageDBUpdatePosition()');
  }

  return Languages.update({ _id: languageId }, { $set: { position: language.position } }).exec(cb);
}

function getNewIncomeLanguages(languages: LanguageEntity[]) {
  return (cb) => {
    Languages.find({}, { code: 1 }).exec((error, data: LanguageEntity[]) => {
      if (error) {
        console.error(error);

        return cb(error);
      }

      const newLanguagesIncome: LanguageEntity[] = _.differenceBy(languages, data, 'code');
      let langPosition: number = data.length + 1;

      _.forEach(newLanguagesIncome, (lang: LanguageEntity) => {
        lang.position = langPosition;
        langPosition++;
      });

      return cb(null, newLanguagesIncome);
    });
  };
}

function updateLanguagesList(projectName) {
  return (req, res) => {
    crowdin
      .projectInfo(projectName)
      .then((result) => {
        const crowdinLanguageList = result.languages;
        const getLanguages = getNewIncomeLanguages(crowdinLanguageList);

        getLanguages((err, newLanguages: LanguageEntity[]) => {
          if (err) {
            return res.json({ success: !err, msg: [], data: null, error: err });
          }

          if (!newLanguages) {
            return res.json({ success: !err, msg: [], data: null, error: err });
          }

          async.each(
            newLanguages,
            (language, cb) => {
              Languages.update(
                {
                  code: language.code
                },
                {
                  $set: {
                    name: language.name,
                    code: language.code,
                    position: language.position
                  }
                },
                {
                  upsert: true
                }
              ).exec(cb);
            },
            (updateLangError) => {
              if (updateLangError) {
                return res.json({ success: !updateLangError, msg: [], data: null, error: updateLangError });
              }

              getLanguagesList(req, res);
            }
          );
        });
      })
      .catch((error) => res.json({ success: !error, msg: [], data: null, error }));
  };
}

function importLanguageByLanguageCode(crowdinSettings) {
  return (req, res) => {
    const params = req.params;
    const code = params.code;

    const importUrl = `https://api.crowdin.com/api/project/${crowdinSettings.projectName}/download/${code}.zip?key=${
      crowdinSettings.apiKey
    }&json`;

    const nameArchive = `translations-${code}`;
    const pathToSave = `${translationsPath}/${nameArchive}.zip`;
    const translationsPathToSaveFiles = `${translationsPath}/${nameArchive}`;

    const stream = request(importUrl).pipe(fs.createWriteStream(pathToSave));

    stream.on('error', (error) => res.json({ success: !error, msg: [], data: null, error }));

    stream.on('finish', () => {
      const unzipStream = fs.createReadStream(pathToSave).pipe(unzip.Extract({ path: translationsPathToSaveFiles }));

      unzipStream.on('error', (error) => res.json({ success: !error, msg: [], data: null, error }));

      unzipStream.on('close', () => {
        glob(`${translationsPathToSaveFiles}/**/*.json`, (error, files) => {
          if (error) {
            return res.json({ success: !error, msg: [], data: null, error });
          }

          const filesForUpdateCollections = _.chain(files)
            .map((filePath) => {
              const options = filePath.split(`${translationsPathToSaveFiles}/`)[1].split('/');

              return {
                collection: options[0],
                path: filePath
              };
            })
            .groupBy('collection')
            .map((valueCollection, keyCollection) => ({
              collection: keyCollection,
              data: _.map(valueCollection, 'path')
            }))
            .value();

          async.eachLimit(filesForUpdateCollections, 5, updateCollectionsByLang(code), (updateByLangError) => {
            if (updateByLangError) {
              return res.json({ success: !updateByLangError, msg: [], data: null, error: updateByLangError });
            }

            async.parallel(
              {
                removeArchive: removeArchive(pathToSave),
                removeArchiveFolder: removeArchiveFolder(translationsPathToSaveFiles)
              },
              (parallelError) => res.json({ success: !parallelError, msg: [], data: null, error: parallelError })
            );
          });
        });
      });
    });
  };
}

const tasksForParallel = {
  about: updateAboutCollection,
  regions: updateRegionsCollection,
  categories: updateCategoriesCollection,
  'types-places': updateTypesPlacesCollection,
  'about-data': updateAboutDataCollection,
  countries: updateCountriesCollection,
  footer: updateFooterCollection,
  onboarding: updateOnboardingCollection,
  places: updatePlacesCollection,
  forms: updateFormsCollection,
  questions: updateQuestionsCollection,
  things: updateThingsCollection,
  'users-types': updateUsersTypesCollection,
  users: updateUsersCollection,
  articles: updateArticlesCollection,
  'answers-by-questions': updateInfoPlacesCollection,
  interface: updateInterfaceTranslationsCollection,
  content: updateContentTranslationsCollection
};

function updateCollectionsByLang(lang) {
  return (item, cb) => {
    const parallelTasks = {};

    if (tasksForParallel[item.collection]) {
      parallelTasks[item.collection] = tasksForParallel[item.collection](lang, item.data);
    }

    async.parallelLimit(parallelTasks, 5, cb);
  };
}

function updateArticlesCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Articles, callback);
      },
      cb
    );
  };
}

function updateInfoPlacesCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, InfoPlaces, callback);
      },
      cb
    );
  };
}

function updateInterfaceTranslationsCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, InterfaceTranslations, callback);
      },
      cb
    );
  };
}

function updateContentTranslationsCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, ContentTranslations, callback);
      },
      cb
    );
  };
}

function updateFormsCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Forms, callback);
      },
      cb
    );
  };
}

function updateQuestionsCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Questions, callback);
      },
      cb
    );
  };
}

function updateThingsCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Things, callback);
      },
      cb
    );
  };
}

function updateUsersTypesCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, UsersTypes, callback);
      },
      cb
    );
  };
}

function updateUsersCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Users, callback);
      },
      cb
    );
  };
}

function updatePlacesCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Places, callback);
      },
      cb
    );
  };
}

function updateOnboardingCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Onboarding, callback);
      },
      cb
    );
  };
}

function updateFooterCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Footer, callback);
      },
      cb
    );
  };
}

function updateCountriesCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Locations, callback);
      },
      cb
    );
  };
}

function updateAboutDataCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, CommonShortInfoIncome, callback);
      },
      cb
    );
  };
}

function updateCategoriesCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Categories, callback);
      },
      cb
    );
  };
}

function updateRegionsCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Regions, callback);
      },
      cb
    );
  };
}

function updateTypesPlacesCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, TypesPlaces, callback);
      },
      cb
    );
  };
}

function updateAboutCollection(lang, files) {
  return (cb) => {
    async.eachLimit(
      files,
      5,
      (item, callback) => {
        readFileAndUpdateCollections(item, lang, Info, callback);
      },
      cb
    );
  };
}

function readFile(pathToFile, cb) {
  fs.readFile(pathToFile, 'utf8', (err, data) => {
    if (err) {
      return cb(err);
    }

    const body = JSON.parse(data);

    return cb(null, body);
  });
}

function normaliseData(data) {
  return _.chain(data)
    .map((value, key) => {
      value._id = new mongoose.Types.ObjectId(key);

      return value;
    })
    .value();
}

function updateCollections(collection, items, lang, cb) {
  async.eachLimit(
    items,
    5,
    (item: TranslatedEntity, callback) => {
      const query = { _id: item._id };

      delete item._id;

      item.lang = lang;

      collection
        .find(query, { translations: 1 })
        .limit(1)
        .lean()
        .exec((error, findItems: { translations: TranslatedEntity[] }[]) => {
          if (error) {
            return callback(error);
          }

          const originItem = _.first(findItems);

          if (!originItem) {
            return callback();
          }

          let update: UpdateTranslationQuery = {};

          if (originItem && !originItem.translations) {
            update = { $set: { translations: [item] } };
          } else {
            const index = _.findIndex(originItem.translations, { lang });

            if (index === -1) {
              update = { $push: { translations: item } };
            } else {
              update = { $set: {} };

              _.forEach(Object.keys(item), (key) => {
                update.$set[`translations.${index}.${key}`] = item[key];
              });
            }
          }

          collection.update(query, update).exec(callback);
        });
    },
    cb
  );
}

function readFileAndUpdateCollections(pathToFile, lang, collection, cb) {
  readFile(pathToFile, (err, body) => {
    if (err) {
      return cb(err);
    }

    const items = normaliseData(body);

    updateCollections(collection, items, lang, cb);
  });
}

function removeArchive(pathToArchive) {
  return (cb) => {
    fs.unlink(pathToArchive, cb);
  };
}

function removeArchiveFolder(pathToArchiveFolder) {
  return (cb) => {
    rmdir(pathToArchiveFolder, cb);
  };
}
