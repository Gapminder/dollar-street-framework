// Todo: Need refactor according to "noImplicitAny" rule

import { sortBy, forEach, map, head, reduce } from 'lodash';
import { Application, Request, Response } from 'express';

import { UserTypeEntity } from '../../interfaces/usersTypes';
import { TeamLocations } from '../../interfaces/locations';
import { Translation } from '../../interfaces/articleData';

import { locationRepositoryService } from '../../repositories/location.repository.service';
import { usersRepositoryService } from '../../repositories/users.repository.service';
import { userTypesRepositoryService } from '../../repositories/userTypes.repository.service';

const ERROR_CODE = 370;

module.exports = (app: Application) => {
  const nconf = app.get('nconf');
  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;
  const compression = app.get('compression.middleware');
  const BASE_HREF = nconf.get('BASE_HREF');

  app.get(`${BASE_HREF}/v1/team`, compression(), getTeamList.bind(getTeamList, S3_SERVER));
};

async function getTeamList(S3_SERVER: string, req: Request, res: Response): Promise<Response | void> {
  try {
    const {
      query: { lang: langUse }
    } = req;
    const [hashCountries, hashUsersTypes, team] = await Promise.all([
      setHashCountries(langUse),
      setUsersTypes(langUse),
      usersRepositoryService.getTeam(S3_SERVER)
    ]);
    const teams = setTeam(team, hashUsersTypes, langUse, hashCountries);

    return res.json({ success: true, msg: [], data: sortBy(teams, 'position'), error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, msg: [], data: null, error: `Error code for team: ${ERROR_CODE}` });
  }
}

function setTeam(team, hashUsersTypes, langUse: string, hashCountries): object[] {
  const teams = [];

  forEach(team, (type) => {
    const typeData = hashUsersTypes[type._id.toString()];

    if (!typeData) {
      return;
    }

    setAmbassador(type, langUse, hashCountries);

    const priorit = type.ambassadors.filter((ambassador) => {
      return ambassador.priority > 0;
    });

    const nonPriorit = type.ambassadors.filter((ambassador) => {
      return ambassador.priority <= 0;
    });

    priorit.sort((a: { priority: number }, b: { priority: number }) => {
      return a.priority - b.priority;
    });

    type.ambassadors = priorit.concat(nonPriorit);
    type.name = typeData.name;
    type.originTypeName = typeData.originTypeName;
    type.position = typeData.position;

    teams.push(type);
  });

  return teams;
}

function setAmbassador(type, langUse: string, hashCountries): void {
  forEach(type.ambassadors, (ambassador) => {
    if (!ambassador.country) {
      return;
    }

    ambassador.originName = ambassador.name;

    ambassador.translations = map(ambassador.translations, (data: Translation) => {
      if (data.lang === langUse) {
        ambassador.name = `${data.firstName} ${data.lastName}`;
        ambassador.description = data.description;
        ambassador.company = data.company || ambassador.company;
      }

      return ambassador;
    });

    delete ambassador.translations;

    ambassador.country = hashCountries[ambassador.country.toString()];
  });
}

async function setUsersTypes(langUse: string): Promise<object> {
  const types = await userTypesRepositoryService.getUsersTypes(langUse);

  if (!types) {
    throw new Error(`Error: Types were not found!`);
  }

  forEach(
    types,
    (item: UserTypeEntity): void => {
      const translation = head(item.translations);

      item.originTypeName = item.name;
      item.name = translation ? translation.name : item.name;

      delete item.translations;
    }
  );

  return reduce(
    types,
    (result, type: UserTypeEntity) => {
      result[type._id.toString()] = {
        name: type.name,
        originTypeName: type.originTypeName,
        position: type.position
      };

      return result;
    },
    {}
  );
}

async function setHashCountries(langUse: string): Promise<object> {
  const countries: TeamLocations[] = await locationRepositoryService.getHashCountries(langUse);

  if (!countries) {
    throw new Error(`Error: Countries were not found!`);
  }

  forEach(
    countries,
    (item: TeamLocations): void => {
      const translation = head(item.translations);

      item.country = translation ? translation.country : item.country;

      delete item.translations;
    }
  );

  return reduce(
    countries,
    (result, country: TeamLocations) => {
      result[country._id.toString()] = country.country;

      return result;
    },
    {}
  );
}
