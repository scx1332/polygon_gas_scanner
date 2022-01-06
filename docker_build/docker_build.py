import os
import shutil
#to run interactively docker run:
#docker run -it node_test /bin/bash

if os.path.exists("gas_scanner"):
    shutil.rmtree("gas_scanner")

if os.path.exists("mongo_db"):
    shutil.rmtree("mongo_db")

def ignore_files(dir, paths):
    ignore_list = []
    for path in paths:
        if path == "node_modules" or path == "dist" or path == ".idea" or path == ".gitignore":
            ignore_list.append(path)
        elif path.endswith(".bat"):
            ignore_list.append(path)
        
    return ignore_list


shutil.copytree("../gas_scanner", "gas_scanner", ignore=ignore_files)
shutil.copytree("../mongo_db", "mongo_db", ignore=ignore_files)

os.system("docker build . -t gas_scanner")