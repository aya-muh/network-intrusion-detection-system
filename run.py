#!/usr/bin/env python3
"""
Root runner script to launch the cybersecurity_service directly.
"""
import os
import sys

# Add cybersecurity_service to sys.path
service_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cybersecurity_service')
if service_dir not in sys.path:
    sys.path.insert(0, service_dir)

from run import main

if __name__ == '__main__':
    main()
