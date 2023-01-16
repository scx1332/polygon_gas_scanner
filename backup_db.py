from datetime import datetime
import os
import shutil

mongo_container_name = os.getenv("MONGO_CONTAINER_NAME")

if os.path.exists("dump"):
    shutil.rmtree("dump")

def run_command(command):
    print("Running command: {}".format(command))
    os.system(command)


run_command("docker-compose down")
run_command("docker-compose up -d mongo")
run_command(f"docker exec {mongo_container_name} mongodump")
run_command(f"docker cp {mongo_container_name}:dump .")
run_command(f'docker exec {mongo_container_name} /bin/bash -c "rm -rf ./dump"')
run_command(f'docker exec {mongo_container_name} /bin/bash -c "ls"')

backup_dir = "backupdb_" + datetime.today().strftime('%Y-%m-%d_%H-%M-%S')
os.mkdir(backup_dir)
shutil.move("dump", backup_dir)
