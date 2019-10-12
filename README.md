# Dollar Street Framework

## Test coverage
[![Build Status](https://travis-ci.org/Gapminder/dollar-street-framework.svg?branch=master)](https://travis-ci.org/Gapminder/dollar-street-framework)
[![codecov.io](https://codecov.io/github/Gapminder/dollar-street-framework/coverage.svg?branch=master)](https://codecov.io/github/Gapminder/dollar-street-framework?branch=master)
[![Dependency Status](https://david-dm.org/Gapminder/dollar-street-framework.svg)](https://david-dm.org/Gapminder/dollar-street-framework)
[![devDependency Status](https://david-dm.org/Gapminder/dollar-street-framework/dev-status.svg)](https://david-dm.org/Gapminder/dollar-street-framework#info=devDependencies)

[![Throughput Graph](https://graphs.waffle.io/Gapminder/dollar-street-framework/throughput.svg)](https://waffle.io/Gapminder/dollar-street-framework/metrics)

## Prerequisites
- Ubuntu/Debian Linux OS v18+ lts, Mac OSX v10+
- node v10+ & npm v6+
- git tool
- nohup tool
- ufraw-batch tool
- docker v18+ & docker-compose v1.23+
- imagemagick & graphicsmagick
- mongodb-org-tools v4+
```
apt-get install -y mongodb-org-tools
```
- for deploy: Google Cloud SDK 261.0.0
- for deploy: kubectl
- [create S3 bucket with permissions](https://docs.google.com/document/d/1oHrGkqXRs3DUfk5z0X-uBQe29OVdkrSOmgXKoDfHGBM/edit)

## How to launch

```
git clone git@github.com:Gapminder/dollar-street-framework.git

cd dollar-street-framework

# update credentials and bucket name of AWS S3 
nano credentials/local.ds.json 

npm i
npm i webpack@3.12.0 -g
npm start

# upload "empty" database to DB
mongorestore --db dollarstreet --drop --gzip --archive=dump/archive.gz

# open in browser
open http://localhost:8080 #cms
open http://localhost:3000 #street
```

## Key folders
 * server - deploy to GCP as a separate cluster/instance/container
    - src/models - all DB models (shared with cms server)
    - src/repositories - layer for connection to DB (in future it would be great to share it with cms server)
    - src/interfaces - interfaces for DB entities (in future it would be great to share it with cms server)
    - src/config - configuration files for express server only (refactoring is needed)
    - `cron.task.ts` - cron job for updating currencies in the DB, but it didn't work due to the expired credentials  
    - `ds.consumer.app.ts` - dollar street application
 * client - deploy to GCP as a part of cms/server
 * cms/server - deploy to GCP as a separate instance/container
    - src - cms server source files (refactoring is needed, controllers with business logic and layer for connection to DB)
    - `src/initApplication.ts` - something like tuning cms app
    - src/* - huge controllers
    - src/.controllers - small controllers
    - config - configuration files for express server only (refactoring is needed)
    - migrations - old version of migrations for cms server (saved in case of resolving conflicts)
    - `ds.cms.api.ts` - dollar street CMS (Content Management System) application 
 * cms/client - deploy to GCP as a part of cms/server
    - assets - media files for app (CSS, fonts, images)
    - libs - third-party libraries (were downloaded and saved inside repository, it would be nice to refactor it)
 * deployment
    - dockerfiles - all docker files for building docker images
    - files-for-travis - steps for travis CI (for release and development branches)
    - gcp/db - PoC for migration incomes from db source to db target
    - gcp/puppeteer - PoC for puppeteer instance with usage environment variables
    - gcp/puppeteer-v2 - PoC for puppeteer instance with usage our common credential service
 * credentials - all secrets should be stored here, avoid to commit changes in this folder
 * migrations - all migrations that were applied to DB, e.g. adding new translation keys
 * common
    - credential.service.ts
    - credentials-ui-prebuild.service.ts
    - db.config.ts
    - index-customizer.ts - update GoogleAnalitics data for certain 
    - log.ts
 * uploads - temporary storage for uploaded files

## Contributors

## Before release
[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/images/0)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/links/0)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/images/1)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/links/1)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/images/2)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/links/2)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/images/3)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/links/3)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/images/4)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/links/4)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/images/5)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/links/5)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/images/6)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/links/6)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/images/7)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-pages/links/7)

## After release
[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/images/0)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/links/0)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/images/1)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/links/1)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/images/2)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/links/2)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/images/3)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/links/3)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/images/4)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/links/4)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/images/5)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/links/5)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/images/6)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/links/6)[![](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/images/7)](https://sourcerer.io/fame/korel-san/Gapminder/dollar-street-framework/links/7)

You are welcome to join!
