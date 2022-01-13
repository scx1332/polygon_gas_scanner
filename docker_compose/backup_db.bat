docker-compose down
docker-compose up -d mongodb_container
docker exec gas_scanner_mongo mongodump
docker cp gas_scanner_mongo:dump .
docker exec gas_scanner_mongo /bin/bash -c "rm -rf ./dump"
docker exec gas_scanner_mongo /bin/bash -c "ls"
docker-compose up -d
