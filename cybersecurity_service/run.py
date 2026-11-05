#!/usr/bin/env python3
"""
Cybersecurity Intrusion Detection Service - Standalone Server Runner
"""
import os
import sys

# Ensure current directory is on python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from app import app
except ImportError as e:
    print(f"[ERROR] Could not import Flask application: {e}")
    sys.exit(1)

def main():
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() in ['1', 'true', 'yes']

    print("=" * 65)
    print("  CYBERSECURITY INTRUSION DETECTION SERVICE")
    print("  Enterprise Network Session Audit Gateway")
    print("=" * 65)
    print(f"  Server listening on : http://{host}:{port}")
    print(f"  Dashboard Interface : http://{host}:{port}/")
    print(f"  REST API Endpoint   : http://{host}:{port}/api/predict")
    print(f"  Health Check        : http://{host}:{port}/api/health")
    print("=" * 65)
    print("  Press Ctrl+C to terminate the service.")
    print("=" * 65)

    app.run(host=host, port=port, debug=debug)

if __name__ == '__main__':
    main()
