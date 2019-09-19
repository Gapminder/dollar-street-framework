import { logger } from '../../common/log';
import { credentialsService } from '../../common/credential.service';
import * as _ from 'lodash';

import {
  setDefaultUser,
  setDefaultProject,
  setFireWallRule,
  createExternalInstanceIp,
  unsetExternalIp,
  buildDockerImage,
  pushImageToGCloud,
  computeInstancesGCloud,
  findInstanceBYExternalIpName,
  setExternalIpToNewInstance,
  getInstanceStaticExternalIP,
  getInstanceExternalIp,
  logExternalIps,
  getTravisCommit,
  checkExistFireWallRule
} from './deploy.helpers';

const pathToCredentials = '../..';
const actualCredentials = credentialsService.loadDeployDefaultEnvs(pathToCredentials);

export async function run(): Promise<string | void> {
  try {
    await setDefaultUser(actualCredentials);
    await setDefaultProject(actualCredentials);
    const EXISTED_FIREWALL_RULE = await checkExistFireWallRule(actualCredentials);

    if (_.isEmpty(EXISTED_FIREWALL_RULE)) {
      await setFireWallRule(actualCredentials, 'create');
    } else {
      await setFireWallRule(actualCredentials, 'update');
    }
    await getTravisCommit(actualCredentials);

    // deploy CMS

    await buildDockerImage(actualCredentials, 'CMS');
    await pushImageToGCloud(actualCredentials, 'CMS_NEW');
    await computeInstancesGCloud(actualCredentials, 'CMS_NEW');
    await getInstanceStaticExternalIP(actualCredentials, 'CMS');

    const CMS_EXTERNAL_IP = actualCredentials.get('CMS_EXTERNAL_IP');

    if (CMS_EXTERNAL_IP) {
      await findInstanceBYExternalIpName(actualCredentials, 'CMS');
      await unsetExternalIp(actualCredentials, 'CMS_ACTUAL');
      await unsetExternalIp(actualCredentials, 'CMS_NEW');
      await setExternalIpToNewInstance(actualCredentials, 'CMS');
    } else {
      await getInstanceExternalIp(actualCredentials, `CMS_NEW`);
      await createExternalInstanceIp(actualCredentials, 'CMS');
    }

    // deploy STREET

    await buildDockerImage(actualCredentials, 'STREET');
    await pushImageToGCloud(actualCredentials, 'STREET_NEW');
    await computeInstancesGCloud(actualCredentials, 'STREET_NEW');
    await getInstanceStaticExternalIP(actualCredentials, 'STREET');

    const STREET_EXTERNAL_IP = actualCredentials.get('STREET_EXTERNAL_IP');

    if (STREET_EXTERNAL_IP) {
      await findInstanceBYExternalIpName(actualCredentials, 'STREET');
      await unsetExternalIp(actualCredentials, 'STREET_ACTUAL');
      await unsetExternalIp(actualCredentials, 'STREET_NEW');
      await setExternalIpToNewInstance(actualCredentials, 'STREET');
    } else {
      await getInstanceExternalIp(actualCredentials, `STREET_NEW`);
      await createExternalInstanceIp(actualCredentials, 'STREET');
    }

    await logExternalIps(actualCredentials, 'CMS', 'STREET');
  } catch (error) {
    logger.error(error);
  }
}
