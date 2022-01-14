import os
import shutil

if os.path.exists("gas_scanner"):
    shutil.rmtree("gas_scanner")

def ignore_files(dir, paths):
    ignore_list = []
    for path in paths:
        ignore = False
        ignore = ignore or path == "node_modules"
        ignore = ignore or path == "dist"
        ignore = ignore or path == ".idea"
        ignore = ignore or path == ".gitignore"
        ignore = ignore or path == "node_modules"
        ignore = ignore or path.endswith(".bat")
        ignore = ignore or path == ".env"
        if ignore:
            ignore_list.append(path)
        
    return ignore_list

shutil.copytree("../gas_scanner", "gas_scanner", ignore=ignore_files)

os.system("docker build -f DockerfileBackend -t gas_scanner_backend_image .")