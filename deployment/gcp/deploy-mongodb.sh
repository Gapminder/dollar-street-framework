#!/bin/bash

set -e

##########################################################################################################

# A POSIX variable
OPTIND=1         # Reset in case getopts has been used previously in the shell.

while getopts ":m:n:t:" opt; do
    case "$opt" in
    m)
      MODE_ENV=${OPTARG:=dev}
      #echo "-m was triggered (MODE_ENV), Parameter: $OPTARG" >&2
        ;;
    n)
      NODE_ENV=${OPTARG:=ds}
      #echo "-n was triggered (NODE_ENV), Parameter: $OPTARG" >&2
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
export TAG=${TIMESTAMP};
export TRAVIS_COMMIT=$(git rev-parse HEAD)
export NODE_ENV=${NODE_ENV:=ds}

export MODE_ENV=${MODE_ENV:=dev}
export BILLING_ACCOUNT=010E30-3FA15C-90C069
export OWNER_ACCOUNT=gcp@gapminder.org
export ID_FOLDER=970994369564
export ID_PROJECT=$(gcloud projects list --filter=name=$MODE_ENV-$NODE_ENV --format="value(projectId)")
export ZONE=europe-west3-a
export IMAGE_NAME_CMS=docker.io/mongo:4.0.10-xenial
export INSTANCE_NAME_CMS=mongoshell


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

gcloud compute instances create-with-container ${INSTANCE_NAME_CMS} \
         --zone=${ZONE} \
         --container-image=${IMAGE_NAME_CMS}
