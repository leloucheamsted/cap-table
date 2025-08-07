#!/bin/bash

echo "Installation de reportlab..."
cd /Users/apple/Documents/Work/cap-table/backend
pip install reportlab

echo "Test de la génération de certificat..."
python test_certificate.py
