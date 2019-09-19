#!/bin/bash

set -e

##########################################################################################################

# A POSIX variable
OPTIND=1         # Reset in case getopts has been used previously in the shell.

while getopts ":m:n:t:b:i:" opt; do
    case "$opt" in
    b)
      BUILD_TYPE=${OPTARG:=cluster}
      #echo "-i was triggered (BUILD_TYPE), Parameter: $OPTARG" >&2
        ;;
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
    i)
      INSTANCE_MACHINE_TYPE=${OPTARG:=8}
      #echo "-I was triggered (INSTANCE_MACHINE_TYPE), Parameter: $OPTARG" >&2
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
export BUILD_TYPE=${BUILD_TYPE:=cluster}
export INSTANCE_MACHINE_TYPE=${INSTANCE_MACHINE_TYPE:=8}

#echo "$BUILD_TYPE, $NODE_ENV, $TAG, $TRAVIS_COMMIT, $S3_ACCESS_KEY_ID, $S3_SECRET_ACCESS_KEY, $STRIPE_PRIVATE_KEY, $MONGODB_URL, $CROWDIN_PROJECT_NAME, $CROWDIN_API_KEY"

export MODE_ENV=${MODE_ENV:=dev}
export BILLING_ACCOUNT=010E30-3FA15C-90C069
export OWNER_ACCOUNT=gcp@gapminder.org
export ID_FOLDER=970994369564
export ID_PROJECT=$(gcloud projects list --filter=name=$MODE_ENV-$NODE_ENV --format="value(projectId)")
export ZONE=europe-west4-c
export EXTERNAL_PORT=80
export INTERNAL_PORT=80
#export INTERNAL_PORT=5000
export CLUSTER_MACHINE_TYPE=n1-standard-${INSTANCE_MACHINE_TYPE}
export NUM_NODES_IN_CLUSTER=$((INSTANCE_MACHINE_TYPE / 2))
export MAX_NODES_IN_CLUSTER=$((INSTANCE_MACHINE_TYPE * 10))
export MIN_NODES_IN_CLUSTER=$((INSTANCE_MACHINE_TYPE / 2))
export NUMBER_REPLICAS=$((INSTANCE_MACHINE_TYPE * 3 / 4))
export MIN_NUMBER_REPLICAS=$((INSTANCE_MACHINE_TYPE * 2 / 4))
export MAX_NUMBER_REPLICAS=$((INSTANCE_MACHINE_TYPE * 20))
export CPU_PERCENT=50
export CLUSTER_REQUESTS="cpu=$((INSTANCE_MACHINE_TYPE / 2 - 1)),memory=${INSTANCE_MACHINE_TYPE}Gi"
echo "CLUSTER_REQUESTS ${CLUSTER_REQUESTS}"

#export CLUSTER_REQUESTS='cpu=3,memory=6Gi'
#export CLUSTER_REQUESTS='cpu=4,memory=8Gi'

#export RELEASE=$NODE_ENV-$TAG-$MODE_ENV
export RELEASE_PUPPETEER_CLUSTER=puppeteer-${TIMESTAMP}


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

#######################################################################################################

echo "Create base docker image"

########################################################################################################

docker build -t base_docker_image --file ./deployment/dockerfiles/Dockerfile-base .

########################################################################################################

echo "Build and Push Image Puppeteer to GCP"

#########################################################################################################

  docker build -t gcr.io/$ID_PROJECT/$RELEASE_PUPPETEER_CLUSTER:$TRAVIS_COMMIT \
                --build-arg NODE_ENV=$NODE_ENV \
                --build-arg MODE_ENV=$MODE_ENV \
                --file ./deployment/dockerfiles/Dockerfile-puppeteer .

  gcloud docker -- push gcr.io/$ID_PROJECT/$RELEASE_PUPPETEER_CLUSTER:${TRAVIS_COMMIT}


    if [ "$BUILD_TYPE" == "cluster" ]; then
      ##########################################################################################################

      echo "Create Puppeteer Cluster at Google Cloud"

      ##########################################################################################################


        gcloud container clusters create ${RELEASE_PUPPETEER_CLUSTER} \
            --machine-type=${CLUSTER_MACHINE_TYPE} \
            --zone=${ZONE} \
            --num-nodes=${NUM_NODES_IN_CLUSTER} \
            --enable-autoscaling \
            --max-nodes=${MAX_NODES_IN_CLUSTER} \
            --min-nodes=${MIN_NODES_IN_CLUSTER}


      ###########################################################################################################

      echo "Created PODs in cluster && autoscale"

      ###########################################################################################################

        kubectl run $RELEASE_PUPPETEER_CLUSTER \
            --image=gcr.io/$ID_PROJECT/$RELEASE_PUPPETEER_CLUSTER:${TRAVIS_COMMIT} \
            --port=$INTERNAL_PORT \
            --requests=$CLUSTER_REQUESTS \
            --replicas=$NUMBER_REPLICAS

        kubectl scale deployment $RELEASE_PUPPETEER_CLUSTER --replicas=$NUMBER_REPLICAS

        kubectl autoscale deployment $RELEASE_PUPPETEER_CLUSTER \
            --min=$MIN_NUMBER_REPLICAS \
            --max=$MAX_NUMBER_REPLICAS \
            --cpu-percent=$CPU_PERCENT

      ############################################################################################################

      echo "Created LoadBalancer"

      ###########################################################################################################

        kubectl expose deployment $RELEASE_PUPPETEER_CLUSTER \
            --port=$EXTERNAL_PORT  \
            --target-port=$INTERNAL_PORT \
            --name=${RELEASE_PUPPETEER_CLUSTER} \
            --type=LoadBalancer
    else

      export INSTANCE_PUPPETEER_IP="$(gcloud compute instances list --filter="${RELEASE_PUPPETEER_CLUSTER}" --format="value(networkInterfaces[0].networkIP)")"

      if [ -z $INSTANCE_PUPPETEER_IP ]; then
        ##########################################################################################################

        echo "Create Puppeteer Instance at Google Cloud"

        ##########################################################################################################
        gcloud beta compute instances create-with-container ${RELEASE_PUPPETEER_CLUSTER} \
           --zone=${ZONE} \
           --project=${ID_PROJECT} \
           --tags=puppeteer-container \
           --machine-type=${CLUSTER_MACHINE_TYPE} \
           --container-image=gcr.io/${ID_PROJECT}/${RELEASE_PUPPETEER_CLUSTER}:${TRAVIS_COMMIT}
      else
        gcloud beta compute instances update-container ${RELEASE_PUPPETEER_CLUSTER} \
           --zone=${ZONE} \
           --project=${ID_PROJECT} \
           --container-image=gcr.io/${ID_PROJECT}/${RELEASE_PUPPETEER_CLUSTER}:${TRAVIS_COMMIT}
      fi
    fi


