import os
import shutil

if os.path.exists("gas_scanner_front"):
    shutil.rmtree("gas_scanner_front")


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

shutil.copytree("../gas_scanner_front", "gas_scanner_front", ignore=ignore_files)

os.system("docker build -f DockerfileFrontend -t gas_scanner_frontend_image .")
