# 🛡️ Enterprise Network Intrusion Detection System (NIDS) & Threat Assessment

[![Python 3.9+](https://img.shields.io/badge/Python-3.9%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![XGBoost](https://img.shields.io/badge/Model-XGBoost%20v2.0%2B-orange.svg)](https://xgboost.readthedocs.io/)
[![Scikit-Learn](https://img.shields.io/badge/Framework-Scikit--Learn-F7931E.svg?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Flask](https://img.shields.io/badge/Web%20API-Flask%203.0%2B-black.svg?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Docker Ready](https://img.shields.io/badge/Deployment-Docker-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![MLflow](https://img.shields.io/badge/Tracking-MLflow-0194E2.svg?logo=mlflow&logoColor=white)](https://mlflow.org/)
[![NIST Compliance](https://img.shields.io/badge/Standard-NIST%20SP%20800--94-green.svg)](https://csrc.nist.gov/publications/detail/sp/800-94/rev-1/final)

An end-to-end Machine Learning pipeline and production-ready **Intrusion Detection & Risk Assessment Gateway**. This system analyzes network session telemetry to detect cyber intrusions (e.g., brute-force authentication, credential stuffing, ICMP reconnaissance, port scans, and off-hour traffic anomalies) and provides automated SOC risk scoring and response recommendations compliant with **NIST SP 800-94**.

---

## 📌 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Key Features](#-key-features)
- [Project Directory Structure](#-project-directory-structure)
- [Dataset & Telemetry Attributes](#-dataset--telemetry-attributes)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
  - [Algorithms Evaluated](#algorithms-evaluated)
  - [Model Performance & Metrics](#model-performance--metrics)
  - [Hyperparameter Optimization](#hyperparameter-optimization)
  - [MLflow Experiment Tracking](#mlflow-experiment-tracking)
- [Web Service & SOC Dashboard](#-web-service--soc-dashboard)
  - [Bilingual Dashboard (EN / AR)](#bilingual-dashboard-en--ar)
  - [SOC Severity Stratification](#soc-severity-stratification)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [REST API Reference](#-rest-api-reference)
- [Docker Deployment](#-docker-deployment)
- [Git & Repository Notes](#-git--repository-notes)

---

## 🔍 Overview & Architecture

Modern enterprise networks generate massive volumes of session traffic. Identifying malicious patterns without overwhelming Security Operations Center (SOC) teams with false positives is a critical defense requirement.

This project delivers:
1. **Research & Experimentation**: Comprehensive Exploratory Data Analysis (EDA), feature engineering, multi-model evaluation (Logistic Regression, Random Forest, LightGBM, XGBoost), and MLflow experiment versioning (`v7` through `v10`).
2. **Production Inference Pipeline**: An automated Scikit-Learn `Pipeline` wrapping a tuned `XGBClassifier` achieving **~89% accuracy** and **100% precision on attack signatures**.
3. **Enterprise SOC Web Interface**: A minimalist, corporate audit dashboard featuring real-time risk gauges, preset attack scenarios, and bilingual (English & Arabic) response playbooks.
4. **REST API**: JSON inference endpoint for programmatic integration with firewalls, SIEMs, or log pipelines.

```
                           +--------------------------+
                           | Network Session Telemetry|
                           +------------+-------------+
                                        |
                                        v
                 +-----------------------------------------------+
                 |  Pre-processing & Automated Feature Pipeline   |
                 |  - Categorical Mapping (Proto, Enc, Browser)  |
                 |  - Feature Engineering: failed_ratio          |
                 +----------------------+------------------------+
                                        |
                                        v
                         +-----------------------------+
                         |  Tuned XGBoost Classifier   |
                         |  (Model Pipeline v10 / Ubj) |
                         +--------------+--------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
    +-------------------------+                   +-------------------------+
    |    REST API Service     |                   | SOC Audit Web Dashboard |
    |   POST /api/predict     |                   |  Real-time Risk Metrics |
    |   JSON Telemetry In/Out |                   |  Bilingual Actions (AR) |
    +-------------------------+                   +-------------------------+
```

---

## ✨ Key Features

- **High-Precision Intrusion Detection**: Near-zero false alarms on benign sessions with 100% precision on malicious traffic in benchmark evaluations.
- **Engineered Anomaly Indicators**: Includes `failed_ratio = failed_logins / (login_attempts + 1)` which acts as a primary discriminator for authentication-based intrusions.
- **Tiered Risk Stratification**: Automatically classifies events into 4 SOC action tiers: **LOW**, **MODERATE**, **HIGH**, and **CRITICAL**.
- **Bilingual Interface**: Native English and Arabic guidance designed for regional Security Operations Centers.
- **NIST SP 800-94 Playbooks**: Actionable response recommendations mapped to incident response guidelines.
- **Full Reproducibility**: Includes Jupyter Notebooks for training and MLflow runs tracking model lineage, confusion matrices, and feature importance.
- **Containerized Delivery**: Ready-to-deploy Docker configuration based on `python:3.9-slim`.

---

## 📁 Project Directory Structure

```
Model_cybersecurity/
├── cybersecurity_service/                     # Production Web Service & Application
│   ├── app.py                                 # Flask REST API & inference orchestration
│   ├── run.py                                 # Standalone service launcher
│   ├── requirements.txt                       # Application dependencies
│   ├── Dockerfile                             # Container deployment configuration
│   ├── README.md                              # Service-specific technical documentation
│   ├── model/
│   │   └── cybersecurity_model.pkl            # Production model pipeline (XGBoost)
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css                      # Corporate SOC dark/light dashboard theme
│   │   └── js/
│   │       └── main.js                        # Client-side dynamic controller & async fetch
│   └── templates/
│       └── index.html                         # Interactive SOC audit dashboard
│
├── mlflow_xgboost_model_Cybersecurity_v7/     # MLflow artifact bundle: Model version 7
├── mlflow_xgboost_model_Cybersecurity_v8/     # MLflow artifact bundle: Model version 8
├── mlflow_xgboost_model_Cybersecurity_v9/     # MLflow artifact bundle: Model version 9
├── mlflow_xgboost_model_Cybersecurity_v10/    # MLflow artifact bundle: Model version 10
│
├── classification_report_v7.txt               # Evaluation metrics for model version 7
├── classification_report_v8.txt               # Evaluation metrics for model version 8
├── classification_report_v9.txt               # Evaluation metrics for model version 9
├── classification_report_v10.txt              # Evaluation metrics for model version 10
│
├── xgb_feature_importance_v7.png              # Feature importance plot (v7)
├── xgb_feature_importance_v8.png              # Feature importance plot (v8)
├── xgb_feature_importance_v9.png              # Feature importance plot (v9)
├── xgb_feature_importance_v10.png             # Feature importance plot (v10)
│
├── xgb_model_Cybersecurity_7.pkl              # Serialized XGBoost model checkpoints
├── xgb_model_Cybersecurity_8.pkl
├── xgb_model_Cybersecurity_9.pkl
├── xgb_model_Cybersecurity_10.pkl
├── cybersecurity_model.pkl                    # Root production model checkpoint
│
├── cybersecurity_intrusion_data_ml.ipynb      # Core ML: EDA, cleaning, model training & tuning
├── cybersecurity_intrusion_data_ml - Mlflow.ipynb # Experiment tracking with MLflow
├── run.py                                     # Global root launcher for the service
├── .gitignore                                 # Git ignore configuration
└── README.md                                  # Repository documentation (this file)
```

---

## 📊 Dataset & Telemetry Attributes

The training dataset comprises **9,537 network session records** capturing transport, cryptographic, behavioral, and client identity telemetry:

| Feature Name | Type | Value Range / Classes | Description |
| :--- | :--- | :--- | :--- |
| `network_packet_size` | Numerical | `64` to `65,535` bytes | Packet payload data volume |
| `protocol_type` | Categorical | `TCP (0)`, `UDP (1)`, `ICMP (2)` | Transport layer protocol |
| `login_attempts` | Numerical | `≥ 0` | Total authentication requests during session |
| `session_duration` | Numerical | `≥ 0.0` seconds | Total connection duration |
| `encryption_used` | Categorical | `NONE (0)`, `AES (1)`, `DES (2)` | Cryptographic cipher applied |
| `ip_reputation_score` | Numerical | `0.00` to `1.00` | External threat score (0.0 = trusted, 1.0 = malicious) |
| `failed_logins` | Numerical | `≥ 0` | Number of unauthenticated / rejected attempts |
| `browser_type` | Categorical | `CHROME (0)`, `EDGE (1)`, `FIREFOX (2)`, `SAFARI (3)`, `UNKNOWN (4)` | Client User-Agent identification |
| `unusual_time_access` | Binary | `0` (Standard) or `1` (Off-Hours) | Temporal access anomaly indicator |
| `failed_ratio` | **Engineered** | `failed_logins / (login_attempts + 1)` | Ratio quantifying authentication failure intensity |
| **`attack_detected`** | **Target** | `0` (Normal) or `1` (Attack Detected) | Session intrusion ground truth |

---

## 🧠 Machine Learning Pipeline

### Algorithms Evaluated

During experimentation, several model families were trained and benchmarked under identical train/test splits (80/20 split, 1,908 test samples):

| Model | Test Accuracy | Strengths & Observations |
| :--- | :---: | :--- |
| **XGBoost (Selected)** | **~88.7% - 89.5%** | Highest precision on attack traffic (1.00), fast tree traversal, optimal handling of tabular feature interactions. |
| **LightGBM** | ~88.7% | Competitive accuracy and fast execution; slightly higher sensitivity to categorical encoding changes. |
| **Random Forest** | ~88.6% | Robust ensemble baseline; higher memory consumption compared to gradient-boosted trees. |
| **Logistic Regression** | ~74.5% | Underperformed due to non-linear interactions between packet size, protocol, and IP reputation. |

### Model Performance & Metrics

Performance evaluation of the production **XGBoost Classifier (v10)**:

```text
               precision    recall  f1-score   support

    Normal (0)      0.83      1.00      0.91      1055
    Attack (1)      1.00      0.75      0.85       853

      accuracy                          0.89      1908
     macro avg      0.91      0.87      0.88      1908
  weighted avg      0.90      0.89      0.88      1908
```

- **Zero False Alarms on Benign Sessions**: An attack precision of **1.00 (100%)** ensures that when the system alerts on an attack, security analysts can trust the verdict without wasting time triaging false positives.
- **Normal Traffic F1-Score**: Reached **0.91**, ensuring safe flow of authorized user activities.

### Hyperparameter Optimization

Hyperparameters were systematically tuned using `RandomizedSearchCV` across cross-validation folds:
- **Number of Estimators (`n_estimators`)**: `350` – `450`
- **Max Depth (`max_depth`)**: `6`
- **Learning Rate (`learning_rate`)**: `0.03`
- **Subsample Ratio (`subsample`)**: `0.75`
- **ColSample by Tree (`colsample_bytree`)**: `0.85`
- **Min Child Weight (`min_child_weight`)**: `1` – `3`
- **Gamma (`gamma`)**: `0.1`

### MLflow Experiment Tracking

The project includes an MLflow-instrumented pipeline (`cybersecurity_intrusion_data_ml - Mlflow.ipynb`). Each experiment iteration (`v7` through `v10`) logged:
- Model parameters and metrics (Accuracy, Precision, Recall, F1, LogLoss).
- Serialized Universal Binary JSON models (`model.ubj`).
- Feature importance visualization plots (`xgb_feature_importance_v*.png`).
- Environment configurations (`conda.yaml`, `python_env.yaml`, `requirements.txt`).

---

## 🖥️ Web Service & SOC Dashboard

The `cybersecurity_service/` directory encapsulates a full-stack, enterprise-ready auditing application.

### Bilingual Dashboard (EN / AR)
The interface is tailored for multinational cybersecurity teams:
- Parameter documentation in both English and Arabic.
- Pre-configured test scenario presets for instant verification:
  - **Baseline Traffic**: Normal web sessions over TCP.
  - **Brute-Force Anomaly**: Repeated failed authentications from low-reputation IPs.
  - **ICMP Reconnaissance**: Suspicious probing and off-hours scan telemetry.

### SOC Severity Stratification

Predictions are classified into standardized security tiers:

| Risk Score Range | Severity Tier | SOC Recommended Action (EN) | الإجراء الأمني الموصى به (AR) |
| :---: | :---: | :--- | :--- |
| **0.00% – 24.99%** | 🟢 **LOW** | Routine logging; no immediate remediation required. | تسجيل روتيني؛ لا يتطلب إجراء فوري. |
| **25.00% – 49.99%** | 🟡 **MODERATE** | Elevated monitoring; session flagged for secondary review. | مراقبة مرتفعة؛ تم تحديد الجلسة للمراجعة الثانوية. |
| **50.00% – 74.99%** | 🟠 **HIGH** | Suspicious anomaly; trigger re-authentication and notify SOC tier 1. | شذوذ مشبوه؛ فرض إعادة المصادقة وإشعار فريق العمليات. |
| **75.00% – 100.0%** | 🔴 **CRITICAL** | Critical intrusion signature; immediate session termination recommended. | تم رصد توقيع اختراق حرج؛ يُوصى بإنهاء الجلسة فوراً. |

---

## ⚙️ Installation & Setup

### Prerequisites
- **Python 3.9+** (Python 3.10 or 3.11 recommended)
- **pip** package installer

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Model_cybersecurity.git
cd Model_cybersecurity
```

### 2. Create and Activate a Virtual Environment
```bash
# On Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# On Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```bash
pip install -r cybersecurity_service/requirements.txt
```

---

## 🚀 Running the Application

### Option A: Using the Root Runner (Recommended)
You can launch the service directly from the project root:
```bash
python run.py
```

### Option B: Running from the Service Directory
```bash
cd cybersecurity_service
python run.py
```

Once started, the service will be available at:
- **Web Dashboard**: [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
- **Health Check**: [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)
- **Prediction Endpoint**: `POST http://127.0.0.1:5000/api/predict`

---

## 📡 REST API Reference

### Health Check

- **Method**: `GET`
- **Endpoint**: `/api/health`
- **Response**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "feature_count": 10,
  "expected_features": [
    "network_packet_size", "protocol_type", "login_attempts",
    "session_duration", "encryption_used", "ip_reputation_score",
    "failed_logins", "browser_type", "unusual_time_access", "failed_ratio"
  ],
  "timestamp": "2026-11-05T15:30:00.000000Z"
}
```

---

### Session Anomaly Prediction

- **Method**: `POST`
- **Endpoint**: `/api/predict`
- **Headers**: `Content-Type: application/json`

#### Request Payload:
```json
{
  "network_packet_size": 4200,
  "protocol_type": "TCP",
  "login_attempts": 20,
  "session_duration": 15.0,
  "encryption_used": "NONE",
  "ip_reputation_score": 0.95,
  "failed_logins": 19,
  "browser_type": "UNKNOWN",
  "unusual_time_access": 1
}
```

#### Response Payload:
```json
{
  "status": "success",
  "audit_id": "SEC-20261105153022-A4F89B",
  "timestamp": "2026-11-05 15:30:22 UTC",
  "prediction": 1,
  "is_attack": true,
  "verdict_en": "Attack Detected (Intrusion Anomaly)",
  "verdict_ar": "تم رصد هجوم (اختراق مشبوه)",
  "risk_probability": 94.62,
  "normal_probability": 5.38,
  "risk_level": "CRITICAL",
  "severity": "critical",
  "recommended_action_en": "Critical intrusion signature detected; immediate session termination recommended.",
  "recommended_action_ar": "تم رصد توقيع اختراق حرج؛ يُوصى بإنهاء الجلسة فوراً وعزل المصدر.",
  "processed_features": {
    "network_packet_size": 4200.0,
    "protocol_type": "TCP",
    "protocol_type_encoded": 0,
    "login_attempts": 20,
    "session_duration": 15.0,
    "encryption_used": "NONE",
    "encryption_used_encoded": 0,
    "ip_reputation_score": 0.95,
    "failed_logins": 19,
    "browser_type": "UNKNOWN",
    "browser_type_encoded": 4,
    "unusual_time_access": 1,
    "failed_ratio": 0.9048
  }
}
```

#### cURL Example:
```bash
curl -X POST http://127.0.0.1:5000/api/predict \
     -H "Content-Type: application/json" \
     -d '{
       "network_packet_size": 512,
       "protocol_type": "TCP",
       "login_attempts": 1,
       "session_duration": 120,
       "encryption_used": "AES",
       "ip_reputation_score": 0.05,
       "failed_logins": 0,
       "browser_type": "CHROME",
       "unusual_time_access": 0
     }'
```

---

## 🐳 Docker Deployment

The application includes a `Dockerfile` for standardized containerization:

### 1. Build the Docker Image
```bash
cd cybersecurity_service
docker build -t cybersecurity-nids:latest .
```

### 2. Run the Container
```bash
docker run -d -p 5000:5000 --name nids-service cybersecurity-nids:latest
```

The containerized service will be reachable at `http://localhost:5000/`.

---

## 📦 Git & Repository Notes

- **Excluded Files**: The repository includes a configured `.gitignore` that ignores large container export archives (`*.ter`, `*.tar`), Python virtual environments (`venv/`), Python cache directories (`__pycache__/`), and Jupyter checkpoints.
- **Model Checkpoints**: Core model pipelines (`.pkl` and `.ubj`) required for running the web service are preserved for immediate offline evaluation.

---

## 📄 License & Attribution

This project is developed for educational, research, and security engineering demonstration purposes. Security responses conform to NIST Special Publication 800-94 recommendations.

