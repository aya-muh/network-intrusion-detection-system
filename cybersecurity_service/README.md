# Enterprise Network Intrusion Detection Service

An enterprise-grade, NIST-compliant network session audit service powered by an **XGBoost** classification pipeline trained for cybersecurity intrusion detection.

---

## Directory Structure

```
cybersecurity_service/
├── app.py                      # Flask REST API and preprocessing pipeline
├── run.py                      # Standalone server runner
├── requirements.txt            # Python dependencies
├── model/
│   └── cybersecurity_model.pkl # Trained XGBoost classification pipeline
├── static/
│   ├── css/
│   │   └── style.css           # Corporate minimalist design (Zero-AI aesthetic, no icons/emojis)
│   └── js/
│       └── main.js             # Client-side dynamic controller & async prediction logic
└── templates/
    └── index.html              # Enterprise audit dashboard with bilingual parameter guidance
```

---

## Preprocessing & Feature Engineering

The service adheres strictly to the preprocessing logic established in `cybersecurity_intrusion_data_ml.ipynb`:

| Feature | Type | Values / Encoding | Description |
| :--- | :--- | :--- | :--- |
| `network_packet_size` | Float / Int | `64` to `65535` | Packet payload volume in bytes |
| `protocol_type` | Categorical | `TCP: 0`, `UDP: 1`, `ICMP: 2` | Transport layer protocol |
| `login_attempts` | Float / Int | `≥ 0` | Total authentication attempts in session |
| `session_duration` | Float | `≥ 0` | Active connection duration in seconds |
| `encryption_used` | Categorical | `NONE: 0`, `AES: 1`, `DES: 2` | Cryptographic cipher applied |
| `ip_reputation_score` | Float | `0.00` to `1.00` | Reputation score (0: trusted, 1: malicious) |
| `failed_logins` | Float / Int | `≥ 0` | Unsuccessful authentication attempts |
| `browser_type` | Categorical | `CHROME: 0`, `EDGE: 1`, `FIREFOX: 2`, `SAFARI: 3`, `UNKNOWN: 4` | Client User-Agent identity |
| `unusual_time_access` | Binary | `0: Standard`, `1: Off-Hours` | Temporal access anomaly indicator |
| `failed_ratio` | **Engineered** | `failed_logins / (login_attempts + 1)` | **Automatically computed** on backend and client |

---

## Execution Instructions

### 1. Direct Launch (Standalone Runner)
From either the project root or inside `cybersecurity_service/`:
```bash
python run.py
```
Or:
```bash
python cybersecurity_service/run.py
```

### 2. Access the Dashboard
Open your web browser and navigate to:
```
http://127.0.0.1:5000/
```

### 3. REST API Usage
- **Health Check**: `GET http://127.0.0.1:5000/api/health`
- **Predict Endpoint**: `POST http://127.0.0.1:5000/api/predict`
  ```bash
  curl -X POST http://127.0.0.1:5000/api/predict \
       -H "Content-Type: application/json" \
       -d '{
         "network_packet_size": 4200,
         "protocol_type": "TCP",
         "login_attempts": 20,
         "session_duration": 15,
         "encryption_used": "NONE",
         "ip_reputation_score": 0.96,
         "failed_logins": 19,
         "browser_type": "UNKNOWN",
         "unusual_time_access": 1
       }'
  ```
