// tslint:disable:no-floating-promises

import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as async from 'async';
import * as rmdir from 'rmdir';
import * as mongoose from 'mongoose';
import { translationsService as crowdin } from './translations.service';
import { TranslationsToExport } from './translations.interface';

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

export const exportTranslations = (app) => {
  const nconf = app.get('nconf');
  const isAdmin = app.get('validate').isAdmin;
  const CROWDIN_API_KEY = nconf.get('CROWDIN_API_KEY');
  const CROWDIN_PROJECT_NAME = nconf.get('CROWDIN_PROJECT_NAME');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  crowdin.setKey(CROWDIN_API_KEY);

  app.get(`/${CMS_SERVER_VERSION}/export-translations`, isAdmin, _exportTranslations(CROWDIN_PROJECT_NAME));
};

function _exportTranslations(projectName) {
  return (req, res) => {
    async.parallel(
      {
        articles: prepareArticlesToExport,
        categories: prepareCategoriesToExport,
        footer: prepareFooterToExport,
        aboutData: prepareAboutDataToExport,
        forms: prepareFormsToExport,
        info: prepareInfoToExport,
        locations: prepareLocationsToExport,
        onboarding: prepareOnboardingToExport,
        places: preparePlacesToExport,
        questions: prepareQuestionsToExport,
        regions: prepareRegionsToExport,
        things: prepareThingsToExport,
        typesPlaces: prepareTypesPlacesToExport,
        usersTypes: prepareUsersTypesToExport,
        users: prepareUsersToExport,
        placeInfo: prepareInfoPlacesToExport,
        interface: prepareInterfaceToExport,
        content: prepareContentToExport
      },
      (err, results: TranslationsToExport) => {
        if (err) {
          return res.json({ success: !err, msg: [], data: null, error: err });
        }

        const hashArticlesTitleByArticlesIds = results.articles.titles;

        const pathToTranslationsFolders = _.map(results, (value) => {
          const foldersForTranslations = path.join(translationsPath, '/', value.directory);

          return {
            folder: value.directory,
            path: foldersForTranslations
          };
        });

        let pathToFiles = [];

        async.each(
          pathToTranslationsFolders,
          (folderPath, cb) => {
            fs.readdir(folderPath.path, (readdirError, files) => {
              if (readdirError) {
                return cb(readdirError);
              }

              const filesPath = _.map(files, (file) => ({
                folder: folderPath.folder,
                filePath: `${folderPath.folder}/${file}`
              }));

              pathToFiles = pathToFiles.concat(filesPath);

              return cb();
            });
          },
          (error) => {
            if (error) {
              return res.json({ success: !error, msg: [], data: null, error });
            }

            const fileToUploadChunk = _.chain(pathToFiles)
              .groupBy('folder')
              .map((value, key) => ({
                folder: key,
                files: _.chunk(
                  _.map(value, (item) => {
                    const file: { file: string; title?: string } = {
                      file: item.filePath
                    };

                    if (key === 'articles' && hashArticlesTitleByArticlesIds) {
                      const fileId = item.filePath.split('/')[1].split('.')[0];
                      const title = hashArticlesTitleByArticlesIds[fileId];

                      if (title) {
                        file.title = title;
                      }
                    }

                    return file;
                  }),
                  10
                )
              }))
              .value();

            async.each(
              fileToUploadChunk,
              (item, callback) => {
                exportToService(projectName, item.folder, item.files, callback);
              },
              (exportToServiceError) => {
                if (exportToServiceError) {
                  return res.json({ success: !exportToServiceError, msg: [], data: null, error: exportToServiceError });
                }

                const folders = _.chain(pathToFiles)
                  .map('folder')
                  .uniq()
                  .value();

                async.each(
                  folders,
                  (folder, callback) => {
                    rmdir(`${translationsPath}/${folder}`, callback);
                  },
                  (removeFilesError) =>
                    res.json({
                      success: !removeFilesError,
                      msg: [],
                      data: null,
                      error: removeFilesError
                    })
                );
              }
            );
          }
        );
      }
    );
  };
}

function prepareArticlesToExport(cb) {
  Articles.find({}, { shortDescription: 1, description: 1, thing: 1 })
    .lean()
    .exec((err, articles) => {
      if (err) {
        return cb(err);
      }

      const hashArticleIdByArticleThingId = _.reduce(
        articles,
        (result, article) => {
          result[article.thing.toString()] = article._id.toString();

          return result;
        },
        {}
      );

      const thingsIds = _.map(articles, (article) => article.thing.toString());

      let newArticles = _.reduce(
        articles,
        (result, article) => {
          const articleId = article._id.toString();

          delete article._id;
          delete article.thing;

          if (!article.shortDescription) {
            delete article.shortDescription;
          }

          if (!article.description) {
            delete article.description;
          }

          result[articleId] = article;

          return result;
        },
        {}
      );

      newArticles = _.map(newArticles, (value, key) => {
        const article = {};

        article[key] = value;

        return article;
      });

      Things.find({ _id: { $in: thingsIds } }, { thingName: 1 })
        .lean()
        .exec((error, things) => {
          if (error) {
            return cb(error);
          }

          const hashThingNameByThingId = _.reduce(
            things,
            (result, thing) => {
              result[hashArticleIdByArticleThingId[thing._id.toString()]] = thing.thingName;

              return result;
            },
            {}
          );

          const saveTranslationsPath = path.join(translationsPath, '/articles');

          ensureExists(saveTranslationsPath, (mkdirError) => {
            if (mkdirError) {
              return cb(mkdirError);
            }

            async.eachLimit(newArticles, 5, createExportFileByHash(saveTranslationsPath), (createError) =>
              cb(createError, {
                directory: 'articles',
                titles: hashThingNameByThingId
              })
            );
          });
        });
    });
}

function prepareFooterToExport(cb) {
  Footer.find({}, { text: 1 })
    .lean()
    .exec((err, footer) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/footer');

      const hashFooter = _.reduce(
        footer,
        (result, item) => {
          const itemId = item._id.toString();

          delete item._id;

          if (!item.text) {
            delete item.text;
          }

          result[itemId] = item;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashFooter], 5, createExportFileByHash(saveTranslationsPath, 'footer'), (createError) =>
          cb(createError, { directory: 'footer' })
        );
      });
    });
}

function prepareInfoToExport(cb) {
  Info.find({}, { context: 1 })
    .lean()
    .exec((err, footer) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/about');

      const hashCategories = _.reduce(
        footer,
        (result, item) => {
          const itemId = item._id.toString();

          delete item._id;

          if (!item.context) {
            delete item.context;
          }

          result[itemId] = item;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashCategories], 5, createExportFileByHash(saveTranslationsPath, 'about'), (createError) =>
          cb(createError, { directory: 'about' })
        );
      });
    });
}

function prepareCategoriesToExport(cb) {
  Categories.find({}, { name: 1, description: 1 })
    .lean()
    .exec((err, categories) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/categories');

      const hashCategories = _.reduce(
        categories,
        (result, category) => {
          const categoryId = category._id.toString();

          delete category._id;

          if (!category.description) {
            delete category.description;
          }

          result[categoryId] = category;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit(
          [hashCategories],
          5,
          createExportFileByHash(saveTranslationsPath, 'categories'),
          (createError) => cb(createError, { directory: 'categories' })
        );
      });
    });
}

function prepareFormsToExport(cb) {
  Forms.find({}, { name: 1, description: 1 })
    .lean()
    .exec((err, forms) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/forms');

      const hashForms = _.reduce(
        forms,
        (result, form) => {
          const formId = form._id.toString();

          delete form._id;

          if (!form.description) {
            delete form.description;
          }

          result[formId] = form;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashForms], 5, createExportFileByHash(saveTranslationsPath, 'forms'), (createError) =>
          cb(createError, { directory: 'forms' })
        );
      });
    });
}

function prepareLocationsToExport(cb) {
  Locations.find({}, { country: 1, alias: 1, description: 1 })
    .lean()
    .exec((err, locations) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/countries');

      const hashLocation = _.reduce(
        locations,
        (result, location) => {
          const countryId = location._id.toString();

          delete location._id;

          if (!location.alias) {
            delete location.alias;
          }

          if (!location.description) {
            delete location.description;
          }

          result[countryId] = location;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashLocation], 5, createExportFileByHash(saveTranslationsPath, 'countries'), (createError) =>
          cb(createError, { directory: 'countries' })
        );
      });
    });
}

function prepareOnboardingToExport(cb) {
  Onboarding.find(
    {},
    {
      name: 1,
      header: 1,
      description: 1,
      link: 1
    }
  )
    .lean()
    .exec((err, onboarding) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/onboarding');

      const hashOnboarding = _.reduce(
        onboarding,
        (result, item) => {
          const itemId = item._id.toString();

          delete item._id;

          if (!item.name) {
            delete item.name;
          }

          if (!item.header) {
            delete item.header;
          }

          if (!item.description) {
            delete item.description;
          }

          if (item.link) {
            if (!item.link.href) {
              delete item.link.href;
            }

            if (!item.link.text) {
              delete item.link.text;
            }
          }

          if (!_.isEmpty(item.link)) {
            delete item.link;
          }

          result[itemId] = item;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit(
          [hashOnboarding],
          5,
          createExportFileByHash(saveTranslationsPath, 'onboarding'),
          (createError) => cb(createError, { directory: 'onboarding' })
        );
      });
    });
}

function preparePlacesToExport(cb) {
  Places.find(
    {},
    {
      name: 1,
      description: 1,
      familyInfo: 1,
      familyInfoSummary: 1,
      aboutData: 1
    }
  )
    .lean()
    .exec((err, places) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/places');

      const hashPlaces = _.reduce(
        places,
        (result, place) => {
          const placeId = place._id.toString();

          delete place._id;

          if (!place.description) {
            delete place.description;
          }

          if (!place.familyInfo) {
            delete place.familyInfo;
          }

          if (!place.familyInfoSummary) {
            delete place.familyInfoSummary;
          }

          if (!place.aboutData) {
            delete place.aboutData;
          }

          result[placeId] = place;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashPlaces], 5, createExportFileByHash(saveTranslationsPath, 'places'), (createError) =>
          cb(createError, { directory: 'places' })
        );
      });
    });
}

function prepareQuestionsToExport(cb) {
  Questions.find(
    {},
    {
      name: 1,
      description: 1
    }
  )
    .lean()
    .exec((err, questions) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/questions');

      const hashQuestions = _.reduce(
        questions,
        (result, question) => {
          const questionId = question._id.toString();

          delete question._id;

          if (!question.description) {
            delete question.description;
          }

          result[questionId] = question;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashQuestions], 5, createExportFileByHash(saveTranslationsPath, 'questions'), (createError) =>
          cb(createError, { directory: 'questions' })
        );
      });
    });
}

function prepareRegionsToExport(cb) {
  Regions.find({}, { name: 1 })
    .lean()
    .exec((err, regions) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/regions');

      const hashRegions = _.reduce(
        regions,
        (result, region) => {
          const regionsId = region._id.toString();

          delete region._id;

          result[regionsId] = region;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashRegions], 5, createExportFileByHash(saveTranslationsPath, 'regions'), (createError) =>
          cb(createError, { directory: 'regions' })
        );
      });
    });
}

function prepareThingsToExport(cb) {
  Things.find(
    {},
    {
      synonymous: 1,
      thingName: 1,
      tags: 1,
      plural: 1,
      thingDescription: 1
    }
  )
    .lean()
    .exec((err, things) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/things');

      const hashThings = _.reduce(
        things,
        (result, thing) => {
          const thingId = thing._id.toString();

          delete thing._id;

          if (!thing.plural) {
            delete thing.plural;
          }

          if (!thing.thingDescription) {
            delete thing.thingDescription;
          }

          if (thing.synonymous && thing.synonymous.length) {
            thing.synonymous = _.map(thing.synonymous, (synonym) => _.omit(synonym, ['_id']));
          } else {
            delete thing.synonymous;
          }

          if (thing.tags && thing.tags.length) {
            thing.tags = _.map(thing.tags, (tag) => _.omit(tag, ['_id']));
          } else {
            delete thing.tags;
          }

          result[thingId] = thing;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashThings], 5, createExportFileByHash(saveTranslationsPath, 'things'), (createError) =>
          cb(createError, { directory: 'things' })
        );
      });
    });
}

function prepareTypesPlacesToExport(cb) {
  TypesPlaces.find({}, { name: 1 })
    .lean()
    .exec((err, typesPlaces) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/types-places');

      const hashTypesPlaces = _.reduce(
        typesPlaces,
        (result, type) => {
          const typeId = type._id.toString();

          delete type._id;

          result[typeId] = type;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit(
          [hashTypesPlaces],
          5,
          createExportFileByHash(saveTranslationsPath, 'types-places'),
          (createError) => cb(createError, { directory: 'types-places' })
        );
      });
    });
}

function prepareUsersTypesToExport(cb) {
  UsersTypes.find({}, { name: 1 })
    .lean()
    .exec((err, usersTypes) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/users-types');

      const hashUsersTypes = _.reduce(
        usersTypes,
        (result, type) => {
          const typeId = type._id.toString();

          delete type._id;

          result[typeId] = type;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit(
          [hashUsersTypes],
          5,
          createExportFileByHash(saveTranslationsPath, 'users-types'),
          (createError) => cb(createError, { directory: 'users-types' })
        );
      });
    });
}

function prepareUsersToExport(cb) {
  Users.find(
    {},
    {
      firstName: 1,
      lastName: 1,
      description: 1,
      company: 1
    }
  )
    .lean()
    .exec((err, users) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/users');

      const hashUsers = _.reduce(
        users,
        (result, user) => {
          const userId = user._id.toString();

          delete user._id;

          if (!user.firstName) {
            delete user.firstName;
          }

          if (!user.lastName) {
            delete user.lastName;
          }

          if (!user.description) {
            delete user.description;
          }

          if (!user.company) {
            delete user.company;
          }

          if (user.company) {
            if (!user.company.name) {
              delete user.company.name;
            }

            if (!user.company.description) {
              delete user.company.description;
            }

            if (!user.company.link) {
              delete user.company.link;
            }
          }

          if (!_.isEmpty(user.company)) {
            delete user.company;
          }

          result[userId] = user;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashUsers], 5, createExportFileByHash(saveTranslationsPath, 'users'), (createError) =>
          cb(createError, { directory: 'users' })
        );
      });
    });
}

function prepareInfoPlacesToExport(cb) {
  InfoPlaces.find({}, { answer: 1 })
    .lean()
    .exec((err, info) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/answers-by-questions');

      const hashUsers = _.reduce(
        info,
        (result, item) => {
          const itemId = item._id.toString();

          delete item._id;

          if (!item.answer) {
            delete item.answer;
          }

          result[itemId] = item;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit(
          [hashUsers],
          5,
          createExportFileByHash(saveTranslationsPath, 'answers-by-questions'),
          (createError) => cb(createError, { directory: 'answers-by-questions' })
        );
      });
    });
}

function prepareInterfaceToExport(cb) {
  InterfaceTranslations.find({ translations: { $elemMatch: { lang: 'en' } } })
    .limit(1)
    .lean()
    .exec((err, interfaces) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/interface');

      const hashUsers = _.reduce(
        interfaces,
        (result, item) => {
          const itemId = item._id.toString();

          delete item._id;

          if (!item.translations) {
            delete item.translations;
          } else {
            // tslint:disable-next-line:no-parameter-reassignment
            item = _.first(item.translations);

            if (item.lang) {
              delete item.lang;
            }

            if (item._id) {
              delete item._id;
            }
          }

          result[itemId] = item;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashUsers], 5, createExportFileByHash(saveTranslationsPath, 'interface'), (createError) =>
          cb(createError, { directory: 'interface' })
        );
      });
    });
}

function prepareContentToExport(cb) {
  ContentTranslations.find({})
    .lean()
    .exec((err, data) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/content');

      const hashContent = _.reduce(
        data,
        (result, item) => {
          const itemId = item._id.toString();

          delete item._id;
          delete item.name;
          delete item.label;
          delete item.key;

          if (!item.__v) {
            delete item.__v;
          }

          if (!item.translations) {
            delete item.translations;
          } else {
            _.each(item.translations, (trans) => {
              if (trans._id) {
                delete trans._id;
              }

              if (trans.lang) {
                delete trans.lang;
              }

              if (trans.value) {
                delete trans.value;
              }
            });
          }

          result[itemId] = item;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashContent], 5, createExportFileByHash(saveTranslationsPath, 'content'), (createError) =>
          cb(createError, { directory: 'content' })
        );
      });
    });
}

function prepareAboutDataToExport(cb) {
  CommonShortInfoIncome.find({}, { description: 1 })
    .lean()
    .exec((err, data) => {
      if (err) {
        return cb(err);
      }

      const saveTranslationsPath = path.join(translationsPath, '/about-data');

      const hashAboutData = _.reduce(
        data,
        (result, item) => {
          const itemId = item._id.toString();

          delete item._id;

          if (!item.description) {
            delete item.description;
          }

          result[itemId] = item;

          return result;
        },
        {}
      );

      ensureExists(saveTranslationsPath, (error) => {
        if (err) {
          return cb(error);
        }

        async.eachLimit([hashAboutData], 5, createExportFileByHash(saveTranslationsPath, 'about-data'), (createError) =>
          cb(createError, { directory: 'about-data' })
        );
      });
    });
}

function createExportFileByHash(transPath, fileName?) {
  return (item, cb) => {
    let secondName = null;

    if (!fileName) {
      secondName = _.first(_.keys(item));
    }

    const pathToSaveFile = path.join(transPath, `${fileName || secondName}.json`);

    fs.writeFile(pathToSaveFile, JSON.stringify(item), { encoding: 'utf8' }, cb);
  };
}

function ensureExists(pathForTranslations, cb) {
  fs.mkdir(pathForTranslations, (err) => {
    if (err) {
      return err.code === 'EEXIST' ? cb(null) : cb(err);
    }

    return cb(null);
  });
}

function exportToService(projectName, folder, files, cb) {
  const uploadFileToServiceForParallel = {};

  _.forEach(files, (part, index) => {
    uploadFileToServiceForParallel[`part${index}`] = uploadFileToService(projectName, part);
  });

  crowdin
    .createDirectory(projectName, folder)
    .then(() => {
      uploadFileToServiceParallel(uploadFileToServiceForParallel, cb);
    })
    .catch((createDirectoryError) => {
      uploadFileToServiceParallel(uploadFileToServiceForParallel, cb);
    });
}

function uploadFileToServiceParallel(uploadFileToServiceForParallel, cb) {
  async.parallelLimit(uploadFileToServiceForParallel, 5, cb);
}

function uploadFileToService(projectName, items) {
  return (cb) => {
    const files = _.map(items, 'file');
    const formData = {};

    _.forEach(items, (item) => {
      if (!item.title) {
        return;
      }

      const titleIndex = `titles[${item.file}]`;
      formData[titleIndex] = item.title;
    });

    crowdin
      .addFile(projectName, files, formData)
      .then((addFileDone) => cb(null, addFileDone))
      .catch((addFileError) => {
        const errorMessage = addFileError.message;

        if (errorMessage.indexOf('code 5') === -1) {
          return cb(addFileError);
        }

        crowdin
          .updateFile(projectName, files, formData)
          .then((updateFileDone) => cb(null, updateFileDone))
          .catch(cb);
      });
  };
}
