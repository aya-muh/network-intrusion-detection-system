import os
import sys
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__, template_folder='templates', static_folder='static')

# Preprocessing Mappings matching cybersecurity_intrusion_data_ml.ipynb
PROTOCOL_MAPPING = {
    'TCP': 0,
    'UDP': 1,
    'ICMP': 2
}

ENCRYPTION_MAPPING = {
    'NONE': 0,
    'AES': 1,
    'DES': 2
}

BROWSER_MAPPING = {
    'CHROME': 0,
    'EDGE': 1,
    'FIREFOX': 2,
    'SAFARI': 3,
    'UNKNOWN': 4
}

FEATURE_COLUMNS = [
    'network_packet_size',
    'protocol_type',
    'login_attempts',
    'session_duration',
    'encryption_used',
    'ip_reputation_score',
    'failed_logins',
    'browser_type',
    'unusual_time_access',
    'failed_ratio'
]

# Locate and load the model pipeline
def load_trained_model():
    candidates = [
        os.path.join(os.path.dirname(__file__), 'model', 'cybersecurity_model.pkl'),
        os.path.join(os.path.dirname(__file__), 'cybersecurity_model.pkl'),
        os.path.join(os.path.dirname(__file__), '..', 'cybersecurity_model.pkl'),
        'cybersecurity_model.pkl'
    ]
    for path in candidates:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            try:
                loaded = joblib.load(abs_path)
                print(f"[INFO] Successfully loaded model pipeline from: {abs_path}")
                return loaded, abs_path
            except Exception as e:
                print(f"[WARNING] Failed loading candidate '{abs_path}': {e}")
    raise FileNotFoundError("Could not find 'cybersecurity_model.pkl' in candidate search paths.")

try:
    model_pipeline, loaded_model_path = load_trained_model()
except Exception as e:
    model_pipeline = None
    loaded_model_path = str(e)
    print(f"[ERROR] Model initialization failed: {e}")


def parse_categorical(val, mapping, default_key):
    """Normalize and map string or integer categorical input."""
    if val is None:
        return mapping[default_key]
    if isinstance(val, (int, float)):
        int_val = int(val)
        if int_val in mapping.values():
            return int_val
        return mapping[default_key]
    str_val = str(val).strip().upper()
    return mapping.get(str_val, mapping[default_key])


def get_risk_assessment(probability):
    """Categorize numerical risk score into standard SOC risk tiers."""
    if probability < 25.0:
        return {
            'level': 'LOW',
            'severity': 'low',
            'action': 'Routine logging; no immediate remediation required.',
            'action_ar': 'تسجيل روتيني؛ لا يتطلب إجراء فوري.'
        }
    elif probability < 50.0:
        return {
            'level': 'MODERATE',
            'severity': 'moderate',
            'action': 'Elevated monitoring; session flagged for secondary review.',
            'action_ar': 'مراقبة مرتفعة؛ تم تحديد الجلسة للمراجعة الثانوية.'
        }
    elif probability < 75.0:
        return {
            'level': 'HIGH',
            'severity': 'high',
            'action': 'Suspicious anomaly; trigger re-authentication and notify SOC tier 1.',
            'action_ar': 'شذوذ مشبوه؛ فرض إعادة المصادقة وإشعار فريق العمليات الأمنية.'
        }
    else:
        return {
            'level': 'CRITICAL',
            'severity': 'critical',
            'action': 'Critical intrusion signature detected; immediate session termination recommended.',
            'action_ar': 'تم رصد توقيع اختراق حرج؛ يُوصى بإنهاء الجلسة فوراً وعزل المصدر.'
        }


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy' if model_pipeline is not None else 'degraded',
        'model_loaded': model_pipeline is not None,
        'model_path': loaded_model_path,
        'feature_count': len(FEATURE_COLUMNS),
        'expected_features': FEATURE_COLUMNS,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })


@app.route('/api/predict', methods=['POST'])
def predict():
    if model_pipeline is None:
        return jsonify({
            'status': 'error',
            'message': 'Model pipeline is not loaded on server.'
        }), 503

    try:
        data = request.get_json(force=True, silent=False)
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Invalid request: No JSON payload provided.'
            }), 400

        # Extract and validate numerical inputs with fallbacks
        try:
            packet_size = float(data.get('network_packet_size', 0))
            duration = float(data.get('session_duration', 0))
            logins = float(data.get('login_attempts', 0))
            failed = float(data.get('failed_logins', 0))
            ip_rep = float(data.get('ip_reputation_score', 0))
            unusual_time = 1 if str(data.get('unusual_time_access', '0')).strip().lower() in ['1', 'true', 'yes'] else 0
        except (ValueError, TypeError) as conv_err:
            return jsonify({
                'status': 'error',
                'message': f'Invalid numerical input format: {str(conv_err)}'
            }), 400

        # Boundary checks
        if packet_size < 0:
            return jsonify({'status': 'error', 'message': 'network_packet_size cannot be negative.'}), 400
        if duration < 0:
            return jsonify({'status': 'error', 'message': 'session_duration cannot be negative.'}), 400
        if logins < 0:
            return jsonify({'status': 'error', 'message': 'login_attempts cannot be negative.'}), 400
        if failed < 0:
            return jsonify({'status': 'error', 'message': 'failed_logins cannot be negative.'}), 400
        if ip_rep < 0.0 or ip_rep > 1.0:
            return jsonify({'status': 'error', 'message': 'ip_reputation_score must be between 0.0 and 1.0.'}), 400
        if failed > logins:
            # Adjust or alert, but in notebook failed_logins can be <= or = logins; keep mathematically consistent
            pass

        # Categorical processing
        proto_encoded = parse_categorical(data.get('protocol_type'), PROTOCOL_MAPPING, 'TCP')
        enc_encoded = parse_categorical(data.get('encryption_used'), ENCRYPTION_MAPPING, 'NONE')
        browser_encoded = parse_categorical(data.get('browser_type'), BROWSER_MAPPING, 'UNKNOWN')

        # Feature Engineering: failed_ratio = failed_logins / (login_attempts + 1)
        failed_ratio = failed / (logins + 1.0)

        # Assemble features dataframe matching exact notebook schema
        features_dict = {
            'network_packet_size': packet_size,
            'protocol_type': proto_encoded,
            'login_attempts': logins,
            'session_duration': duration,
            'encryption_used': enc_encoded,
            'ip_reputation_score': ip_rep,
            'failed_logins': failed,
            'browser_type': browser_encoded,
            'unusual_time_access': unusual_time,
            'failed_ratio': failed_ratio
        }

        features_df = pd.DataFrame([features_dict])[FEATURE_COLUMNS]

        # Model inference
        prediction_val = int(model_pipeline.predict(features_df)[0])
        probabilities = model_pipeline.predict_proba(features_df)[0]
        attack_probability = float(probabilities[1] * 100.0)
        normal_probability = float(probabilities[0] * 100.0)

        is_attack = (prediction_val == 1)
        assessment = get_risk_assessment(attack_probability)
        audit_id = f"SEC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

        # Invert mappings for audit display
        proto_rev = {v: k for k, v in PROTOCOL_MAPPING.items()}
        enc_rev = {v: k for k, v in ENCRYPTION_MAPPING.items()}
        browser_rev = {v: k for k, v in BROWSER_MAPPING.items()}

        response_payload = {
            'status': 'success',
            'audit_id': audit_id,
            'timestamp': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'),
            'prediction': prediction_val,
            'is_attack': is_attack,
            'verdict_en': 'Attack Detected (Intrusion Anomaly)' if is_attack else 'Normal Session (Authorized Traffic)',
            'verdict_ar': 'تم رصد هجوم (اختراق مشبوه)' if is_attack else 'جلسة طبيعية (حركة مرور آمنة)',
            'risk_probability': round(attack_probability, 2),
            'normal_probability': round(normal_probability, 2),
            'risk_level': assessment['level'],
            'severity': assessment['severity'],
            'recommended_action_en': assessment['action'],
            'recommended_action_ar': assessment['action_ar'],
            'processed_features': {
                'network_packet_size': packet_size,
                'protocol_type': proto_rev.get(proto_encoded, str(proto_encoded)),
                'protocol_type_encoded': proto_encoded,
                'login_attempts': int(logins),
                'session_duration': duration,
                'encryption_used': enc_rev.get(enc_encoded, str(enc_encoded)),
                'encryption_used_encoded': enc_encoded,
                'ip_reputation_score': round(ip_rep, 4),
                'failed_logins': int(failed),
                'browser_type': browser_rev.get(browser_encoded, str(browser_encoded)),
                'browser_type_encoded': browser_encoded,
                'unusual_time_access': unusual_time,
                'failed_ratio': round(failed_ratio, 4)
            }
        }

        return jsonify(response_payload)

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Server inference exception: {str(e)}'
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
