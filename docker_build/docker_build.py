import os

#to run interactively docker run:
#docker run -it node_test /bin/bash

os.system("docker build . -t node_test")