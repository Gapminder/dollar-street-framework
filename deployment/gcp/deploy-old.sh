#!/bin/bash

set -e

##########################################################################################################

export ID_PROJECT=mongodb-cloud
export RELEASE=ds-dev
export TAG=latest
export ZONE=europe-west1-b
export CLUSTER_MACHINE_TYPE=g1-small
export NUM_NODES_IN_CLUSTER=2
export MAX_NODES_IN_CLUSTER=2
export MIN_NODES_IN_CLUSTER=2
export INTERNAL_PORT=3000
export EXTERNAL_PORT=80
export NUMBER_REPLICAS=4
export MAX_NUMBER_REPLICAS=5
export LB_NAME=ds-dev
export BASE_HREF=/dollar-street
export CLUSTER_SPLASH_INTERNAL_IP=
export CLUSTER_SPLASH_EXTERNAL_IP=
export INSTANCE_SPLASH_PORT=8050
export S3_REGION=eu-west-1
export S3_ACCESS_KEY_ID=""
export S3_SECRET_ACCESS_KEY=""
export S3_BUCKET=
export S3_SERVER_PREFIX=
export S3_SERVER=${S3_SERVER_PREFIX}${S3_BUCKET}
export MONGODB_URL=""
export STRIPE_PRIVATE_KEY=""
export PORT=3000

########################################################################################################

echo "Build and Push Image to GCP"

#########################################################################################################

   docker build -t gcr.io/$ID_PROJECT/${RELEASE}:$TAG \
			--build-arg S3_REGION=$S3_REGION \
			--build-arg S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID \
			--build-arg S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY \
			--build-arg S3_BUCKET=$S3_BUCKET \
			--build-arg S3_SERVER_PREFIX=$S3_SERVER_PREFIX \
			--build-arg MONGODB_URL=$MONGODB_URL \
			--build-arg STRIPE_PRIVATE_KEY=$STRIPE_PRIVATE_KEY \
			--build-arg BASE_HREF=$BASE_HREF \
			--build-arg CLUSTER_SPLASH_INTERNAL_IP=$CLUSTER_SPLASH_INTERNAL_IP \
			--build-arg CLUSTER_SPLASH_EXTERNAL_IP=$CLUSTER_SPLASH_EXTERNAL_IP \
			--build-arg INSTANCE_SPLASH_PORT=$INSTANCE_SPLASH_PORT \
			--build-arg PORT=$PORT --file ./deployment/dockerfiles/Dockerfile-dev .

 gcloud docker -- push gcr.io/$ID_PROJECT/${RELEASE}:${TAG}

##########################################################################################################

echo "Create Claster at Google Cloud"

##########################################################################################################

gcloud container clusters create $RELEASE \
		--machine-type=$CLUSTER_MACHINE_TYPE \
		--zone=$ZONE \
		--num-nodes=$NUM_NODES_IN_CLUSTER \
		--enable-autoscaling \
		--max-nodes=$MAX_NODES_IN_CLUSTER \
		--min-nodes=$MIN_NODES_IN_CLUSTER


############################################################################################################

echo "Created PODs in cluster && autoscale"

############################################################################################################

kubectl run $RELEASE --image=gcr.io/$ID_PROJECT/$RELEASE:${TAG} \
		--port=$INTERNAL_PORT \
		--replicas=$NUMBER_REPLICAS

kubectl scale deployment $RELEASE --replicas=$NUMBER_REPLICAS

kubectl autoscale deployment $RELEASE --min=$NUMBER_REPLICAS \
		--max=$MAX_NUMBER_REPLICAS \
		--cpu-percent=60

############################################################################################################

echo "Created LoadBalancer"

###########################################################################################################

kubectl expose deployment $RELEASE --port=$EXTERNAL_PORT  \
		--target-port=$INTERNAL_PORT \
       	--name=${LB_NAME} \
        	--type=LoadBalancer

###########################################################################################################

