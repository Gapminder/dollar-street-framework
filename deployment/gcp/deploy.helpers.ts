import * as commonHelpers from './common.helpers';
import { logger } from '../../common/log';
import { ExecOptions } from 'shelljs';
import * as _ from 'lodash';

const options: ExecOptions = {};

// Set default user

export async function setDefaultUser(externalContext) {
  const OWNER_ACCOUNT = externalContext.get('GCP_OWNER_ACCOUNT');

  const command = `gcloud config set account ${OWNER_ACCOUNT}`;

  return commonHelpers.promiseShellCommand(command, options);
}

// Set default project

export function setDefaultProject(externalContext) {
  const MODE_ENV = externalContext.get('MODE_ENV');
  const NODE_ENV = externalContext.get('NODE_ENV');
  const ID_PROJECT = `${MODE_ENV}-${NODE_ENV}`;
  externalContext.set('ID_PROJECT', ID_PROJECT);

  const command = `gcloud config set project ${ID_PROJECT}`;

  return commonHelpers.promiseShellCommand(command, options);
}

// Check and set FireWall rule

export async function checkExistFireWallRule(externalContext) {
  const ID_PROJECT = externalContext.get('ID_PROJECT');
  const FIREWALL_RULE_NAME = `${ID_PROJECT}-rule`;
  externalContext.set('FIREWALL_RULE_NAME', FIREWALL_RULE_NAME);

  const command = `gcloud compute firewall-rules describe ${FIREWALL_RULE_NAME} --format="value(name)" --quiet`;

  return commonHelpers.promiseShellCommand(command, options);
}

export async function setFireWallRule(externalContext, action) {
  const ALLOWED_PORTS = externalContext.get('GCP_ALLOWED_PORTS');
  const TARGET_TAG = externalContext.get('GCP_TARGET_TAG');
  const FIREWALL_RULE_NAME = externalContext.get('FIREWALL_RULE_NAME');

  // tslint:disable-next-line:max-line-length
  const command = `gcloud compute firewall-rules ${action} ${FIREWALL_RULE_NAME} --allow=${ALLOWED_PORTS} --target-tags=${TARGET_TAG} --quiet`;

  return commonHelpers.promiseShellCommand(command, options);
}
// Get Travis commit

export async function getTravisCommit(externalContext) {
  const command = `git rev-parse HEAD`;

  const ACTUAL_TRAVIS_COMMIT = await commonHelpers.promiseShellCommand(command, options);

  process.env.USER !== 'travis'
    ? externalContext.set('TRAVIS_COMMIT', ACTUAL_TRAVIS_COMMIT.toString())
    : externalContext.set('TRAVIS_COMMIT', process.env.TRAVIS_COMMIT);

  return ACTUAL_TRAVIS_COMMIT;
}

// build Docker image

export function buildDockerImage(externalContext, link) {
  const TRAVIS_COMMIT = externalContext.get('TRAVIS_COMMIT').substring(0, 7);
  const NODE_ENV = externalContext.get(`NODE_ENV`);
  const MODE_ENV = externalContext.get(`MODE_ENV`);
  const ID_PROJECT = externalContext.get(`ID_PROJECT`);
  const ACTUAL_DOCKERFILE_SUFFIX = externalContext.get(`DOCKERFILE_SUFFIX_${link}`);
  const NEW_INSTANCE_NAME = externalContext.get(`${link}_NEW_INSTANCE_NAME`);

  const DOCKER_REGISTRY = `gcr.io/${ID_PROJECT}`;
  const NEW_IMAGE_NAME = `${DOCKER_REGISTRY}/${NEW_INSTANCE_NAME}:${TRAVIS_COMMIT}`;

  externalContext.set(`${link}_NEW_IMAGE_NAME`, NEW_IMAGE_NAME);

  const command = `docker build -t ${NEW_IMAGE_NAME} \\
                  --build-arg NODE_ENV=${NODE_ENV} \\
                  --build-arg MODE_ENV=${MODE_ENV} \\
                  --file ./deployment/dockerfiles/Dockerfile-${ACTUAL_DOCKERFILE_SUFFIX} .`;

  return commonHelpers.promiseShellCommand(command, options);
}

// Push docker image

export function pushImageToGCloud(externalContext, link) {
  const NEW_IMAGE_NAME = externalContext.get(`${link}_IMAGE_NAME`);

  const command = `gcloud docker -- push ${NEW_IMAGE_NAME}`;

  return commonHelpers.promiseShellCommand(command, options);
}

// Create Instance

export function computeInstancesGCloud(externalContext, link) {
  const TARGET_TAG = externalContext.get('GCP_TARGET_TAG');
  const TIMESTAMP = externalContext.get(`TIMESTAMP`);
  const TRAVIS_COMMIT = externalContext.get('TRAVIS_COMMIT').substring(0, 7);
  const NEW_INSTANCE_NAME = externalContext.get(`${link}_INSTANCE_NAME`);
  const NEW_IMAGE_NAME = externalContext.get(`${link}_IMAGE_NAME`);
  const REGION = externalContext.get(`GCP_REGION`);
  const ZONE_SUFFIX = externalContext.get(`GCP_ZONE_SUFFIX`);

  const TAGS = `${TARGET_TAG},hash-${TRAVIS_COMMIT},tm-${TIMESTAMP}`;
  const ZONE = `${REGION}${ZONE_SUFFIX}`;
  externalContext.set('ZONE', ZONE);

  logger.info(`Create instance CMS ${NEW_INSTANCE_NAME}:${TRAVIS_COMMIT.substring(0, 7)} on GCP`);

  const command = `gcloud compute instances create-with-container ${NEW_INSTANCE_NAME} \\
             --zone=${ZONE} \\
             --tags=${TAGS} \\
             --container-image=${NEW_IMAGE_NAME} --quiet`;

  return commonHelpers.promiseShellCommand(command, options);
}

// Check Instances static Ip

export async function getInstanceStaticExternalIP(externalContext, link) {
  const INSTANCE_PREFIX = externalContext.get(`${link}_NAME`);
  // tslint:disable-next-line:max-line-length
  const command = `gcloud compute addresses list --filter="${INSTANCE_PREFIX}-external" --format="value(address)" --quiet`;
  logger.info(`Find ${INSTANCE_PREFIX}-external address`);

  const EXTERNAL_IP = await commonHelpers.promiseShellCommand(command, options);
  externalContext.set(`${link}_EXTERNAL_IP`, EXTERNAL_IP.toString());

  return EXTERNAL_IP;
}

// Find old instance by static external IP name and unset static External IP

export async function findInstanceBYExternalIpName(externalContext, link) {
  const INSTANCE_PREFIX = externalContext.get(`${link}_NAME`);
  // tslint:disable-next-line:max-line-length
  const command = `gcloud compute addresses list --filter="${INSTANCE_PREFIX}-external" --format="value(users)" --quiet`;

  const ACTUAL_FULL_INSTANCE_NAME = await commonHelpers.promiseShellCommand(command, options);

  if (_.isEmpty(ACTUAL_FULL_INSTANCE_NAME) || ACTUAL_FULL_INSTANCE_NAME === undefined) {
    return;
  } else {
    const ACTUAL_INSTANCE_NAME = _.last(_.split(ACTUAL_FULL_INSTANCE_NAME.toString(), '/')).trim();

    externalContext.set(`${link}_ACTUAL_INSTANCE_NAME`, ACTUAL_INSTANCE_NAME);

    return ACTUAL_FULL_INSTANCE_NAME;
  }
}

export async function unsetExternalIp(externalContext, link) {
  const ACTUAL_INSTANCE_NAME = externalContext.get(`${link}_INSTANCE_NAME`);
  const ZONE = externalContext.get(`ZONE`);

  // tslint:disable-next-line:max-line-length
  const command = `gcloud compute instances delete-access-config ${ACTUAL_INSTANCE_NAME} --zone ${ZONE} --access-config-name=external-nat --quiet`;

  return commonHelpers.promiseShellCommand(command, options);
}

export async function setExternalIpToNewInstance(externalContext, link) {
  const EXTERNAL_IP = externalContext.get(`${link}_EXTERNAL_IP`);
  console.log(EXTERNAL_IP);
  const INSTANCE_NAME = externalContext.get(`${link}_NEW_INSTANCE_NAME`);
  const ZONE = externalContext.get(`ZONE`);

  // tslint:disable-next-line:max-line-length
  const command = `gcloud compute instances add-access-config ${INSTANCE_NAME} \\
    --zone ${ZONE} \\
    --address=${EXTERNAL_IP}`;

  return commonHelpers.promiseShellCommand(command, options);
}

// Create static IP addresses

export async function getInstanceExternalIp(externalContext, link) {
  const ACTUAL_INSTANCE_NAME = externalContext.get(`${link}_INSTANCE_NAME`);

  // tslint:disable-next-line:max-line-length
  const command = `gcloud compute instances list --filter="${ACTUAL_INSTANCE_NAME}" --format="value(networkInterfaces[0].accessConfigs[0].natIP)" --quiet`;

  const NEW_STATIC_EXTERNAL_IP = await commonHelpers.promiseShellCommand(command, options);

  externalContext.set(`${link}_EXTERNAL_IP`, NEW_STATIC_EXTERNAL_IP);

  return NEW_STATIC_EXTERNAL_IP;
}

export async function createExternalInstanceIp(externalContext, link) {
  const REGION = externalContext.get(`REGION`);
  const INSTANCE_PREFIX = externalContext.get(`${link}_NAME`);
  const NEW_STATIC_EXTERNAL_IP = externalContext.get(`${link}_NEW_EXTERNAL_IP`);

  // tslint:disable-next-line:max-line-length
  const command = `gcloud compute addresses create ${INSTANCE_PREFIX}-external --addresses ${NEW_STATIC_EXTERNAL_IP} --region ${REGION}`;

  return commonHelpers.promiseShellCommand(command, options);
}

export async function logExternalIps(externalContext, cmsLink, streetLink) {
  const CMS_INSTANCE_PREFIX = externalContext.get(`${cmsLink}_NAME`);
  const STREET_INSTANCE_PREFIX = externalContext.get(`${streetLink}_NAME`);
  // tslint:disable:max-line-length
  const cmsCommand = `gcloud compute addresses list --filter="name=(${CMS_INSTANCE_PREFIX}-external)" --format="value(address, status)" --quiet`;
  const streetCommand = `gcloud compute addresses list --filter="name=(${STREET_INSTANCE_PREFIX}-external)" --format="value(address, status)" --quiet`;
  // tslint:enable:max-line-length

  const cmsInstanseIp = await commonHelpers.promiseShellCommand(cmsCommand, options);
  const streetInstanseIp = await commonHelpers.promiseShellCommand(streetCommand, options);

  logger.info(`Static IP address of ${cmsLink} instance ${cmsInstanseIp}`);
  logger.info(`Static IP address of ${streetLink} instance ${streetInstanseIp}`);
}
