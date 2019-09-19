#!/bin/bash

set -e

export RUNNER=${RUNNER:=ci}
echo $(openssl version)
export NODE_ENV=ds
export MODE_ENV=dev
export DEFAULT_TIMESTAMP=$(date -u +"%y%m%d-%H%M")
export TIMESTAMP=${TIMESTAMP:=${DEFAULT_TIMESTAMP}}
echo "timestamp: $TIMESTAMP"
export RELEASE=${MODE_ENV}-${NODE_ENV}
export RELEASE_STREET=street-${TIMESTAMP}
export RELEASE_CMS=cms-${TIMESTAMP}
export RELEASE_PUPPETEER=puppeteer-${TIMESTAMP}
export TRAVIS_COMMIT=$(git rev-parse HEAD)
export OWNER_ACCOUNT=gcp@gapminder.org
export PUPPETEER_ZONE=europe-west4-c
export CMS_ZONE=europe-west1-c
export STREET_ZONE=europe-west1-c

if [ "${RUNNER}" == "ci" ]; then
  echo $GCLOUD_SERVICE_KEY | base64 --decode -i > ${HOME}/gcloud-service-key.json
  #gcloud auth activate-service-account --key-file ${HOME}/mongodb-cloud-e24e70761a92.json
  gcloud auth activate-service-account --key-file ${HOME}/gcloud-service-key.json
fi

export ID_PROJECT=$(gcloud projects list --filter=name=${RELEASE} --format="value(projectId)")

gcloud container clusters get-credentials ${RELEASE_STREET} --zone ${STREET_ZONE} --project ${ID_PROJECT}

gcloud config set project ${ID_PROJECT}
gcloud services enable compute.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable cloudfunctions.googleapis.com

#######################################################################################################

echo "Create base docker image"

########################################################################################################

docker build -t base_docker_image --file ./deployment/dockerfiles/Dockerfile-base .

#######################################################################################################

if [ "${RUNNER}" == "ci" ]; then
  docker build -t gcr.io/${ID_PROJECT}/${RELEASE_STREET}:${TRAVIS_COMMIT} \
    --build-arg NODE_ENV=${NODE_ENV} \
    --build-arg MODE_ENV=${MODE_ENV} \
    --file ./deployment/dockerfiles/Dockerfile-env .

  gcloud docker -- push gcr.io/${ID_PROJECT}/${RELEASE_STREET}

  yes | gcloud beta container images add-tag gcr.io/${ID_PROJECT}/${RELEASE_STREET}:${TRAVIS_COMMIT} gcr.io/${ID_PROJECT}/${RELEASE_STREET}:latest

  kubectl config view
  kubectl config current-context
fi

kubectl set image deployment/${RELEASE_STREET} ${RELEASE_STREET}=gcr.io/${ID_PROJECT}/${RELEASE_STREET}:latest

### Puppeteer
if [ "${RUNNER}" == "ci" ]; then
  docker build -t gcr.io/${ID_PROJECT}/${RELEASE_PUPPETEER}:${TRAVIS_COMMIT} \
                --build-arg NODE_ENV=${NODE_ENV} \
                --build-arg MODE_ENV=${MODE_ENV} \
                --file ./deployment/dockerfiles/Dockerfile-puppeteer .

  gcloud docker -- push gcr.io/${ID_PROJECT}/${RELEASE_PUPPETEER}

  yes | gcloud beta container images add-tag gcr.io/${ID_PROJECT}/${RELEASE_PUPPETEER}:${TRAVIS_COMMIT} gcr.io/${ID_PROJECT}/${RELEASE_PUPPETEER}:latest
fi

gcloud beta compute instances update-container ${RELEASE_PUPPETEER} \
         --zone=${PUPPETEER_ZONE} \
         --project=${ID_PROJECT} \
         --container-image=gcr.io/${ID_PROJECT}/${RELEASE_PUPPETEER}:latest

### CMS
if [ "${RUNNER}" == "ci" ]; then
  docker build -t gcr.io/${ID_PROJECT}/${RELEASE_CMS}:${TRAVIS_COMMIT} \
                --build-arg NODE_ENV=${NODE_ENV} \
                --build-arg MODE_ENV=${MODE_ENV} \
                --file ./deployment/dockerfiles/Dockerfile-cms .

  gcloud docker -- push gcr.io/${ID_PROJECT}/${RELEASE_CMS}

  yes | gcloud beta container images add-tag gcr.io/${ID_PROJECT}/${RELEASE_CMS}:${TRAVIS_COMMIT} gcr.io/${ID_PROJECT}/${RELEASE_CMS}:latest
fi

gcloud beta compute instances update-container ${RELEASE_CMS} \
         --zone=${CMS_ZONE} \
         --project=${ID_PROJECT} \
         --container-image=gcr.io/${ID_PROJECT}/${RELEASE_CMS}:latest
