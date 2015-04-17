#!/bin/bash

# Read from stdin and remove ANSI color codes
sed -r "s/\x1B\[[0-9]{1,3}m//g"