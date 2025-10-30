#!/bin/bash
# 🚀 Script de inicio para Railway

# Inicia PHP embebido (frontend)
php -S 0.0.0.0:8080 -t php/ &

# Espera unos segundos
sleep 3

# Inicia la API de Node.js
npm start
