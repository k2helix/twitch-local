#!/bin/bash
find ./ -type f -exec sed -i 's/192.168.1.10/192.168.1.10/g' {} +
trap 'rm -rf streams* && exit' INT
nodemon getStream.js $@ > /dev/null & node server.js