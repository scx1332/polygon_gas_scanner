docker-compose down
docker-compose up -d mongodb_container
docker exec gas_scanner_mongo /bin/bash -c "rm -rf ./dump"
docker cp dump gas_scanner_mongo:dump
docker exec gas_scanner_mongo mongorestore
docker exec gas_scanner_mongo /bin/bash -c "rm -rf ./dump"
docker-compose up -d

