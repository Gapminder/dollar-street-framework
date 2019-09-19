#!/bin/bash

set -e

export ID_PROJECT=test
export RELEASE=local
export TRAVIS_COMMIT=123
export NODE_ENV=ds
export MODE_ENV=ci
export EXTERNAL_PORT=3000

#######################################################################################################

echo "Create base docker image"

########################################################################################################

docker build -t base_docker_image --file ./deployment/dockerfiles/Dockerfile-base .

########################################################################################################

echo "Deploy application"

#######################################################################################################

docker build -t puppeeteer:${TRAVIS_COMMIT} \
              --build-arg NODE_ENV=${NODE_ENV} \
              --build-arg MODE_ENV=${MODE_ENV} \
              --file ./deployment/dockerfiles/Dockerfile-puppeteer .
docker run -d --network=host puppeeteer:${TRAVIS_COMMIT}

docker build -t cms:${TRAVIS_COMMIT} \
              --build-arg NODE_ENV=${NODE_ENV} \
              --build-arg MODE_ENV=${MODE_ENV} \
              --file ./deployment/dockerfiles/Dockerfile-cms .
docker run -d --network=host cms:${TRAVIS_COMMIT}

docker build -t street:${TRAVIS_COMMIT} \
  --build-arg NODE_ENV=${NODE_ENV} \
  --build-arg MODE_ENV=${MODE_ENV} \
  --file ./deployment/dockerfiles/Dockerfile-env .

docker run -d --network=host street:${TRAVIS_COMMIT}

docker ps
sleep 5

npm run retest:e2e:client:${MODE_ENV}
npm run test:unit
npm run test:api
