#!/bin/bash

# Iniciar la API Node.js
node server.js &

# Iniciar el servidor PHP
php -S 0.0.0.0:$PORT -t public
