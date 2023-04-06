#!/bin/bash
trap 'rm -rf streams* && exit' INT
node getStream.js $@ > /dev/null & node server.js