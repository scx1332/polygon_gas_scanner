from datetime import datetime
import os
import shutil
import sys

input_dir = sys.argv[1]

if not os.path.exists("{}/dump".format(input_dir)):
    print("Directory does not exists:" + " {}/dump".format(input_dir))
    exit(1)


def run_command(command):
    print("Running command: {}".format(command))
    os.system(command)

run_command("docker-compose down")
run_command("docker-compose up -d mongodb_container")
run_command('docker exec gas_scanner_mongo /bin/bash -c "rm -rf /dump"')
run_command('docker cp {}/dump gas_scanner_mongo:/dump'.format(input_dir))
run_command('docker exec gas_scanner_mongo mongorestore')
run_command('docker exec gas_scanner_mongo /bin/bash -c "rm -rf /dump"')
run_command('docker-compose up -d')









