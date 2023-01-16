from datetime import datetime
import os
import shutil

if os.path.exists("dump"):
    shutil.rmtree("dump")


def run_command(command):
    print("Running command: {}".format(command))
    os.system(command)


run_command("docker exec gas_scanner_mongo mongodump")
run_command("docker cp gas_scanner_mongo:dump .")
run_command('docker exec gas_scanner_mongo /bin/bash -c "rm -rf ./dump"')
run_command('docker exec gas_scanner_mongo /bin/bash -c "ls"')

backup_dir = "backupdb_" + datetime.today().strftime('%Y-%m-%d_%H-%M-%S')
os.mkdir(backup_dir)
shutil.move("dump", backup_dir)
