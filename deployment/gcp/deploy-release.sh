#!/bin/bash

set -e

##########################################################################################################

# A POSIX variable
OPTIND=1         # Reset in case getopts has been used previously in the shell.

while getopts ":n:m:t:" opt; do
    case "$opt" in
    n)
      NODE_ENV=${OPTARG:=ds}
      #echo "-n was triggered (NODE_ENV), Parameter: $OPTARG" >&2
        ;;
    m)
      MODE_ENV=${OPTARG:=release}
      #echo "-m was triggered (MODE_ENV), Parameter: $OPTARG" >&2
        ;;
    t)
      TIMESTAMP=${OPTARG}
      #echo "-t was triggered (TIMESTAMP), Parameter: $OPTARG" >&2
        ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
    esac
done

shift $((OPTIND-1))

export RUNNER=${RUNNER:=ci}
export DEFAULT_TIMESTAMP=$(date -u +"%y%m%d-%H%M")
export TIMESTAMP=${TIMESTAMP:=${DEFAULT_TIMESTAMP}}
echo "Current timestamp = ${TIMESTAMP}"
export TRAVIS_COMMIT=$(git rev-parse HEAD)
export NODE_ENV=${NODE_ENV:=ds}
export MODE_ENV=${MODE_ENV:=release}

export OWNER_ACCOUNT=gcp@gapminder.org
export ID_PROJECT=${MODE_ENV}-${NODE_ENV}
echo "Try to deploy ${ID_PROJECT}"

export DOCKER_REGISTRY=gcr.io/${ID_PROJECT}
export INSTANCE_NAME=release-${TIMESTAMP}
export IMAGE_NAME=${DOCKER_REGISTRY}/${INSTANCE_NAME}:${TRAVIS_COMMIT:0:7}

gcloud config set account ${OWNER_ACCOUNT}
gcloud config set project ${ID_PROJECT}

if [ "${RUNNER}" == "ci" ]; then
  echo $GCLOUD_SERVICE_KEY_RELEASE_DS | base64 --decode -i > ${HOME}/release-ds-20ac476bfc16.json
  gcloud auth activate-service-account --key-file ${HOME}/release-ds-20ac476bfc16.json
fi

#######################################################################################################

echo "Create base docker image"

########################################################################################################

docker build -t base_docker_image --file ./deployment/dockerfiles/Dockerfile-base .

########################################################################################################

echo "Build release image ${INSTANCE_NAME}:${TRAVIS_COMMIT:0:7} on GCP"

#########################################################################################################

  docker build -t ${IMAGE_NAME} \
                --build-arg NODE_ENV=${NODE_ENV} \
                --build-arg MODE_ENV=${MODE_ENV} \
                --file ./deployment/dockerfiles/Dockerfile-release .

  gcloud docker -- push ${IMAGE_NAME}

##################################################################################################################

echo "Autodeploy to app engine with new release on board"

##################################################################################################################

  gcloud app deploy --image-url=${IMAGE_NAME}

