### Migration rules

- Don't change models structure (removing fields, renaming, removing documents)
- Run all migrations for all environments simultaniously, due to not forget about envs that is needed to update
- Run migrations just for external IPs for each primary mongo instance

### Current envs

- MODE_ENV=local NODE_ENV=ds migrate 

- MODE_ENV=ci NODE_ENV=ds migrate 
- MODE_ENV=dev NODE_ENV=crazy migrate
- MODE_ENV=dev NODE_ENV=ds migrate  
- MODE_ENV=dev NODE_ENV=warehouses migrate

- MODE_ENV=pre-prod NODE_ENV=ds migrate 

- MODE_ENV=prod NODE_ENV=lectures migrate 
- MODE_ENV=prod NODE_ENV=clinics migrate 
- MODE_ENV=prod NODE_ENV=schools migrate 

- MODE_ENV=prod NODE_ENV=ds migrate `CAREFULL!!!!` 
