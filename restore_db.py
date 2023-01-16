import os
import sys
from dotenv import load_dotenv

load_dotenv()

input_dir = sys.argv[1]

mongo_container_name = os.getenv("MONGO_CONTAINER_NAME")

if not os.path.exists("{}/dump".format(input_dir)):
    print("Directory does not exists:" + " {}/dump".format(input_dir))
    exit(1)


def run_command(command):
    print("Running command: {}".format(command))
    os.system(command)


run_command("docker-compose down")
run_command("docker-compose up -d mongo")
run_command(f'docker exec {mongo_container_name} /bin/bash -c "rm -rf /dump"')
run_command(f'docker cp {input_dir}/dump gas_scanner_mongo:/dump')
run_command(f'docker exec {mongo_container_name} mongorestore')
run_command(f'docker exec {mongo_container_name} /bin/bash -c "rm -rf /dump"')









