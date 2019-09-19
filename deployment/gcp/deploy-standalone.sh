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
      MODE_ENV=${OPTARG:=local}
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

export DEFAULT_TIMESTAMP=$(date -u +"%y%m%d-%H%M")
export TIMESTAMP=${TIMESTAMP:=${DEFAULT_TIMESTAMP}}
echo "Current timestamp = ${TIMESTAMP}"
export TRAVIS_COMMIT=$(git rev-parse HEAD)
export NODE_ENV=${NODE_ENV:=ds}
export MODE_ENV=${MODE_ENV:=local}

#echo "$NODE_ENV, $MODE_ENV, $TIMESTAMP, $TRAVIS_COMMIT, $S3_ACCESS_KEY_ID, $S3_SECRET_ACCESS_KEY, $STRIPE_PRIVATE_KEY, $MONGODB_URL, $CROWDIN_PROJECT_NAME, $CROWDIN_API_KEY"

export BILLING_ACCOUNT=010E30-3FA15C-90C069
export OWNER_ACCOUNT=gcp@gapminder.org
export ID_FOLDER=970994369564
export ID_PROJECT=${MODE_ENV}-${NODE_ENV}
echo "Try to deploy ${ID_PROJECT}"
export REGION=europe-west4
export ZONE=${REGION}-c
export TARGET_TAG=app
export CLUSTER_MACHINE_TYPE=n1-standard-1

export DOCKER_REGISTRY=gcr.io/${ID_PROJECT}
export INSTANCE_NAME_STREET=street-${TIMESTAMP}
export IMAGE_NAME_STREET=${DOCKER_REGISTRY}/${INSTANCE_NAME_STREET}:${TRAVIS_COMMIT:0:7}
export INSTANCE_NAME_CMS=cms-${TIMESTAMP}
export IMAGE_NAME_CMS=${DOCKER_REGISTRY}/${INSTANCE_NAME_CMS}:${TRAVIS_COMMIT:0:7}

export TARGET_TAG=app
export TAGS=${TARGET_TAG},hash-${TRAVIS_COMMIT:0:7},tm-${TIMESTAMP}
export ALLOWED_PORTS='tcp:80,tcp:443,tcp:3000,tcp:3001,tcp:8080'
export FIREWALL_RULE_NAME=${ID_PROJECT}-rule


gcloud config set account ${OWNER_ACCOUNT}
#gcloud projects create ${ID_PROJECT} --folder=${ID_FOLDER} --name=${ID_PROJECT} --enable-cloud-apis --set-as-default --quiet --user-output-enabled false
gcloud config set project ${ID_PROJECT}
#gcloud services enable cloudbilling.googleapis.com
#gcloud beta billing projects link ${ID_PROJECT} --billing-account=${BILLING_ACCOUNT}
#gcloud services enable compute.googleapis.com
#gcloud services enable containerregistry.googleapis.com
#gcloud services enable logging.googleapis.com
#gcloud services enable container.googleapis.com
#gcloud services enable cloudfunctions.googleapis.com

export EXISTED_FIREWALL_RULE="$(gcloud compute firewall-rules describe ${FIREWALL_RULE_NAME})"

if [ -z ${EXISTED_FIREWALL_RULE} ]; then
  gcloud compute firewall-rules create ${FIREWALL_RULE_NAME} --allow=${ALLOWED_PORTS} --target-tags=${TARGET_TAG}
fi

gcloud compute firewall-rules update ${FIREWALL_RULE_NAME} --allow=${ALLOWED_PORTS} --target-tags=${TARGET_TAG}

#######################################################################################################

echo "Create base docker image"

########################################################################################################

docker build -t base_docker_image --file ./deployment/dockerfiles/Dockerfile-base .

########################################################################################################

echo "Create instance CMS ${INSTANCE_NAME_CMS}:${TRAVIS_COMMIT:0:7} on GCP"

########################################################################################################

  export ADDRESS_EXTERNAL_CMS=$(gcloud compute addresses list --filter="cms-external" --format="value(address)")
  if [ ! -z ${ADDRESS_EXTERNAL_CMS} ]; then
    gcloud compute addresses delete cms-external --region ${REGION} --quiet
  fi

  export INSTANCE_IP_CMS="$(gcloud compute instances list --filter="${INSTANCE_NAME_CMS}" --format="value(networkInterfaces[0].networkIP)")"

  if [ -z ${INSTANCE_IP_CMS} ]; then

    docker build -t ${IMAGE_NAME_CMS} \
                  --build-arg NODE_ENV=${NODE_ENV} \
                  --build-arg MODE_ENV=${MODE_ENV} \
                  --file ./deployment/dockerfiles/Dockerfile-cms .


    gcloud docker -- push ${IMAGE_NAME_CMS}

    gcloud compute instances create-with-container ${INSTANCE_NAME_CMS} \
             --zone=${ZONE} \
             --tags=cms-container,${TAGS} \
             --container-image=${IMAGE_NAME_CMS}
  fi

########################################################################################################

echo "Create instance STREET ${INSTANCE_NAME_STREET}:${TRAVIS_COMMIT:0:7} on GCP"

#########################################################################################################

  export ADDRESS_EXTERNAL_STREET=$(gcloud compute addresses list --filter="street-external" --format="value(address)")
  if [ ! -z ${ADDRESS_EXTERNAL_STREET} ]; then
    gcloud compute addresses delete street-external --region ${REGION} --quiet
  fi

  export INSTANCE_IP_STREET="$(gcloud compute instances list --filter="${INSTANCE_NAME_STREET}" --format="value(networkInterfaces[0].networkIP)")"

  if [ -z ${INSTANCE_IP_STREET} ]; then

    docker build -t ${IMAGE_NAME_STREET} \
                  --build-arg NODE_ENV=${NODE_ENV} \
                  --build-arg MODE_ENV=${MODE_ENV} \
                  --file ./deployment/dockerfiles/Dockerfile-env .

    gcloud docker -- push ${IMAGE_NAME_STREET}


    gcloud compute instances create-with-container ${INSTANCE_NAME_STREET} \
             --zone=${ZONE} \
             --tags=street-container,${TAGS} \
             --container-image=${IMAGE_NAME_STREET}
  fi

########################################################################################################

echo "wait..."

#########################################################################################################

sleep 10

export INSTANCE_EXTERNAL_IP_STREET="$(gcloud compute instances list --filter="${INSTANCE_NAME_STREET}" --format="value(networkInterfaces[0].accessConfigs[0].natIP)")"
export INSTANCE_EXTERNAL_IP_CMS="$(gcloud compute instances list --filter="${INSTANCE_NAME_CMS}" --format="value(networkInterfaces[0].accessConfigs[0].natIP)")"

########################################################################################################

echo "Promote IP addresses CMS ${INSTANCE_EXTERNAL_IP_CMS} & STREET ${INSTANCE_EXTERNAL_IP_STREET} on GCP"

#########################################################################################################

gcloud compute addresses create cms-external --addresses ${INSTANCE_EXTERNAL_IP_CMS} --region ${REGION}
gcloud compute addresses create street-external --addresses ${INSTANCE_EXTERNAL_IP_STREET} --region ${REGION}

############################################################################################################

echo "migration for add versioned to embed"

############################################################################################################

#  migrate up 015-versioned-for-embed.js && rm -rf migrations/.migrate-ds
