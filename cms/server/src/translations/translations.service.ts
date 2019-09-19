// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

import * as fs from 'fs';
import * as request from 'request-promise-native';

const baseUrl = 'https://api.crowdin.com/api/';
let apiKey;

function validateKey() {
  if (!apiKey) {
    throw new Error('Please specify CrowdIn API key.');
  }
}

function throwError(result) {
  throw new Error(`Error code ${result.error.code}: ${result.error.message}`);
}

function handleRequest(_request) {
  return _request
    .then((body) => JSON.parse(body))
    .catch((result) => {
      if (result && result.response && result.response.body) {
        const parsed = JSON.parse(result.response.body);
        throwError(parsed);
      }

      throw result;
    });
}

function getApiCall(apiUrl) {
  validateKey();

  const url = `${baseUrl}${apiUrl}`;

  const params = {
    json: true,
    key: apiKey
  };

  return handleRequest(
    request.get({
      url,
      qs: params
    })
  );
}

function postApiCall(apiUrl, getOptions, postOptions) {
  validateKey();

  const url = `${baseUrl}${apiUrl}`;

  const params = Object.assign(getOptions, {
    json: true,
    key: apiKey
  });

  return handleRequest(
    request.post({
      url,
      qs: params,
      formData: postOptions
    })
  );
}

function getApiRequest(apiUrl) {
  validateKey();

  const url = `${baseUrl}${apiUrl}?key=${apiKey}&json`;

  return request(url);
}

export class TranslationsService {
  setKey(newKey) {
    apiKey = newKey;
  }

  /**
   * Add new file to Crowdin project
   * @param projectName {String} Should contain the project identifier
   * @param files {Array} Files array that should be added to Crowdin project.
   *   Array keys should contain file names with path in Crowdin project.
   *   Note! 20 files max are allowed to upload per one time file transfer.
   * @param params {Object} Information about uploaded files.
   */
  addFile(projectName, files, params) {
    const filesInformation = {};

    files.forEach((fileName) => {
      const index = `files[${fileName}]`;
      filesInformation[index] = fs.createReadStream(`translations/${fileName}`);
    });

    return postApiCall(`project/${projectName}/add-file`, {}, Object.assign(filesInformation, params));
  }

  /**
   * Upload latest version of your localization file to Crowdin.
   * @param projectName {String} Should contain the project identifier
   * @param files {Array} Files array that should be updated.
   *   Note! 20 files max are allowed to upload per one time file transfer.
   * @param params {Object} Information about updated files.
   */
  updateFile(projectName, files, params) {
    const filesInformation = {};

    files.forEach((fileName) => {
      const index = `files[${fileName}]`;
      filesInformation[index] = fs.createReadStream(`translations/${fileName}`);
    });

    return postApiCall(`project/${projectName}/update-file`, {}, Object.assign(filesInformation, params));
  }

  /**
   * Delete file from Crowdin project. All the translations will be lost without ability to restore them.
   * @param projectName {String} Should contain the project identifier
   * @param fileName {String} Name of file to delete.
   */
  deleteFile(projectName, fileName) {
    return postApiCall(
      `project/${projectName}/delete-file`,
      {},
      {
        file: fileName
      }
    );
  }

  /**
   * Upload existing translations to your Crowdin project
   * @param projectName {String} Should contain the project identifier
   * @param files {Array} Translated files array. Array keys should contain file names in Crowdin.
   *   Note! 20 files max are allowed to upload per one time file transfer.
   * @param language {String} Target language. With a single call it's possible to upload
   *                          translations for several files but only into one of the languages
   * @param params {Object} Information about updated files.
   */
  updateTranslations(projectName, files, language, params) {
    const filesInformation = {
      language
    };

    files.forEach((fileName) => {
      const index = `files[${fileName}]`;
      filesInformation[index] = fs.createReadStream(fileName);
    });

    return postApiCall(`project/${projectName}/upload-translation`, {}, Object.assign(filesInformation, params));
  }

  /**
   * Track your Crowdin project translation progress by language.
   * @param projectName {String} Should contain the project identifier.   */
  translationStatus(projectName) {
    return postApiCall(`project/${projectName}/status`, {}, {});
  }

  /**
   * Get Crowdin Project details.
   * @param projectName {String} Should contain the project identifier.
   */
  projectInfo(projectName) {
    return postApiCall(`project/${projectName}/info`, {}, {});
  }

  /**
   * Download ZIP file with translations. You can choose the language of translation you need.
   */
  downloadTranslations(projectName, languageCode) {
    return getApiRequest(`project/${projectName}/download/${languageCode}.zip`);
  }

  /**
   * Download ZIP file with all translations.
   */
  downloadAllTranslations(projectName) {
    return getApiRequest(`project/${projectName}/download/all.zip`);
  }

  /**
   * Build ZIP archive with the latest translations.
   * Please Note: that this method can be invoked only once per 30 minutes (there is no such
   *              restriction for organization plans). Also API call will be ignored if there
   *              were no changes in the project since previous export.
   * You can see whether ZIP archive with latest translations was actually build by
   * status attribute ('built' or 'skipped') returned in response.
   */
  exportTranslations(projectName) {
    return getApiCall(`project/${projectName}/export`);
  }

  /**
   * Edit Crowdin project
   * @param projectName {String} Name of the project to change
   * @param params {Object} New parameters for the project.
   */
  editProject(projectName, params) {
    return postApiCall(`project/${projectName}/edit-project`, {}, params);
  }

  /**
   * Delete Crowdin project with all translations.
   * @param projectName {String} Name of the project to delete.
   */
  deleteProject(projectName) {
    return postApiCall(`project/${projectName}/delete-project`, {}, {});
  }

  /**
   * Add directory to Crowdin project.
   * @param projectName {String} Should contain the project identifier.
   * @param directory {String} Directory name (with path if nested directory should be created).
   */
  createDirectory(projectName, directory) {
    return postApiCall(
      `project/${projectName}/add-directory`,
      {},
      {
        name: directory
      }
    );
  }

  /**
   * Rename directory or modify its attributes. When renaming directory the path can not be changed
   * (it means new_name parameter can not contain path, name only).
   * @param projectName {String} Full directory path that should be modified (e.g. /MainPage/AboutUs).
   * @param directory {String} New directory name.
   * @param params {Object} New parameters for the directory.
   */
  changeDirectory(projectName, directory, params) {
    return postApiCall(
      `project/${projectName}/change-directory`,
      {},
      {
        name: directory,
        ...params
      }
    );
  }

  /**
   * Delete Crowdin project directory. All nested files and directories will be deleted too.
   * @param projectName {String} Should contain the project identifier.
   * @param directory {String} Directory path (or just name if the directory is in root).
   */
  deleteDirectory(projectName, directory) {
    return postApiCall(
      `project/${projectName}/delete-directory`,
      {},
      {
        name: directory
      }
    );
  }

  /**
   * Download Crowdin project glossaries as TBX file.
   */
  downloadGlossary(projectName) {
    return getApiRequest(`project/${projectName}/download-glossary`);
  }

  /**
   * Upload your glossaries for Crowdin Project in TBX file format.
   * @param projectName {String} Should contain the project identifier.
   * @param fileNameOrStream {String} Name of the file to upload or stream which contains file to upload.
   */
  uploadGlossary(projectName, fileNameOrStream) {
    if (typeof fileNameOrStream === 'string') {
      // tslint:disable-next-line:no-parameter-reassignment
      fileNameOrStream = fs.createReadStream(fileNameOrStream);
    }

    return postApiCall(
      `project/${projectName}/upload-glossary`,
      {},
      {
        file: fileNameOrStream
      }
    );
  }

  /**
   * Download Crowdin project Translation Memory as TMX file.
   */
  downloadTranslationMemory(projectName) {
    return postApiCall(`project/${projectName}/download-tm`, {}, {});
  }

  /**
   * Upload your Translation Memory for Crowdin Project in TMX file format.
   * @param projectName {String} Should contain the project identifier.
   * @param fileNameOrStream {String} Name of the file to upload or stream which contains file to upload.
   */
  uploadTranslationMemory(projectName, fileNameOrStream) {
    if (typeof fileNameOrStream === 'string') {
      // tslint:disable-next-line:no-parameter-reassignment
      fileNameOrStream = fs.createReadStream(fileNameOrStream);
    }

    return postApiCall(
      `project/${projectName}/upload-tm`,
      {},
      {
        file: fileNameOrStream
      }
    );
  }

  /**
   * Get supported languages list with Crowdin codes mapped to locale name and standardized codes.
   */
  supportedLanguages() {
    return getApiCall('supported-languages');
  }
}

export const translationsService = new TranslationsService();
