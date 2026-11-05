/**
 * Cybersecurity Intrusion Detection Service - Frontend Controller
 * Strictly Vanilla JS, No external libraries, Zero icons
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('auditForm');
  const submitBtn = document.getElementById('btnSubmitAudit');
  const resetBtn = document.getElementById('btnResetForm');
  const liveFailedRatioEl = document.getElementById('liveFailedRatio');
  const errorBanner = document.getElementById('errorBanner');
  const resultPlaceholder = document.getElementById('resultPlaceholder');
  const auditReportContainer = document.getElementById('auditReportContainer');

  // Input elements for live ratio
  const inputLoginAttempts = document.getElementById('login_attempts');
  const inputFailedLogins = document.getElementById('failed_logins');

  // Result Elements
  const auditIdEl = document.getElementById('resAuditId');
  const auditTimestampEl = document.getElementById('resTimestamp');
  const verdictBannerEl = document.getElementById('verdictBanner');
  const verdictTagEl = document.getElementById('resVerdictTag');
  const verdictTitleEl = document.getElementById('resVerdictTitle');
  const verdictSubtitleArEl = document.getElementById('resVerdictSubtitleAr');
  const riskProbabilityEl = document.getElementById('resRiskProbability');
  const riskProgressFillEl = document.getElementById('resRiskProgressFill');
  const resRiskLevelEl = document.getElementById('resRiskLevel');
  const actionCardEl = document.getElementById('actionCard');
  const actionTextEnEl = document.getElementById('resActionTextEn');
  const actionTextArEl = document.getElementById('resActionTextAr');
  const auditTableBodyEl = document.getElementById('resAuditTableBody');

  // Tool buttons
  const btnCopyReport = document.getElementById('btnCopyReport');
  const btnDownloadJson = document.getElementById('btnDownloadJson');

  let currentAuditResult = null;

  // Presets definition
  const presets = {
    normal: {
      network_packet_size: 512,
      protocol_type: 'TCP',
      login_attempts: 2,
      session_duration: 180,
      encryption_used: 'AES',
      ip_reputation_score: 0.08,
      failed_logins: 0,
      browser_type: 'CHROME',
      unusual_time_access: '0'
    },
    credential_stuffing: {
      network_packet_size: 4200,
      protocol_type: 'TCP',
      login_attempts: 20,
      session_duration: 15,
      encryption_used: 'NONE',
      ip_reputation_score: 0.96,
      failed_logins: 19,
      browser_type: 'UNKNOWN',
      unusual_time_access: '1'
    },
    icmp_probe: {
      network_packet_size: 1500,
      protocol_type: 'ICMP',
      login_attempts: 6,
      session_duration: 4,
      encryption_used: 'NONE',
      ip_reputation_score: 0.85,
      failed_logins: 5,
      browser_type: 'UNKNOWN',
      unusual_time_access: '1'
    }
  };

  // Live Failed Ratio computation: failed_ratio = failed_logins / (login_attempts + 1)
  function updateLiveFailedRatio() {
    const attempts = parseFloat(inputLoginAttempts.value) || 0;
    const failed = parseFloat(inputFailedLogins.value) || 0;
    const ratio = failed / (attempts + 1.0);
    liveFailedRatioEl.textContent = ratio.toFixed(4);
  }

  inputLoginAttempts.addEventListener('input', updateLiveFailedRatio);
  inputFailedLogins.addEventListener('input', updateLiveFailedRatio);

  // Apply Preset Handler
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-preset');
      const data = presets[presetKey];
      if (!data) return;

      document.getElementById('network_packet_size').value = data.network_packet_size;
      document.getElementById('protocol_type').value = data.protocol_type;
      document.getElementById('login_attempts').value = data.login_attempts;
      document.getElementById('session_duration').value = data.session_duration;
      document.getElementById('encryption_used').value = data.encryption_used;
      document.getElementById('ip_reputation_score').value = data.ip_reputation_score;
      document.getElementById('failed_logins').value = data.failed_logins;
      document.getElementById('browser_type').value = data.browser_type;
      document.getElementById('unusual_time_access').value = data.unusual_time_access;

      updateLiveFailedRatio();
      hideError();
    });
  });

  // Form Reset
  resetBtn.addEventListener('click', () => {
    form.reset();
    updateLiveFailedRatio();
    hideError();
  });

  function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.style.display = 'block';
  }

  function hideError() {
    errorBanner.style.display = 'none';
  }

  // Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const payload = {
      network_packet_size: parseFloat(document.getElementById('network_packet_size').value),
      protocol_type: document.getElementById('protocol_type').value,
      login_attempts: parseFloat(document.getElementById('login_attempts').value),
      session_duration: parseFloat(document.getElementById('session_duration').value),
      encryption_used: document.getElementById('encryption_used').value,
      ip_reputation_score: parseFloat(document.getElementById('ip_reputation_score').value),
      failed_logins: parseFloat(document.getElementById('failed_logins').value),
      browser_type: document.getElementById('browser_type').value,
      unusual_time_access: parseInt(document.getElementById('unusual_time_access').value, 10)
    };

    // Client-side quick checks
    if (isNaN(payload.network_packet_size) || payload.network_packet_size < 0) {
      showError('Please enter a valid non-negative Network Packet Size.');
      return;
    }
    if (isNaN(payload.session_duration) || payload.session_duration < 0) {
      showError('Please enter a valid non-negative Session Duration in seconds.');
      return;
    }
    if (isNaN(payload.login_attempts) || payload.login_attempts < 0) {
      showError('Please enter a valid non-negative Login Attempts count.');
      return;
    }
    if (isNaN(payload.failed_logins) || payload.failed_logins < 0) {
      showError('Please enter a valid non-negative Failed Logins count.');
      return;
    }
    if (isNaN(payload.ip_reputation_score) || payload.ip_reputation_score < 0 || payload.ip_reputation_score > 1) {
      showError('IP Reputation Score must be between 0.00 and 1.00.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'AUDITING SESSION...';

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || 'Audit evaluation failed on server.');
      }

      currentAuditResult = result;
      renderAuditResult(result);

    } catch (err) {
      showError('Evaluation Error: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'EXECUTE INTRUSION AUDIT';
    }
  });

  function renderAuditResult(res) {
    resultPlaceholder.style.display = 'none';
    auditReportContainer.style.display = 'block';

    // Meta
    auditIdEl.textContent = res.audit_id;
    auditTimestampEl.textContent = res.timestamp;

    // Verdict Banner styling
    verdictBannerEl.className = 'verdict-banner ' + (res.is_attack ? 'verdict-attack' : 'verdict-normal');
    verdictTagEl.textContent = res.is_attack ? 'CRITICAL RISK [1]' : 'AUTHORIZED [0]';
    verdictTitleEl.textContent = res.verdict_en;
    verdictSubtitleArEl.textContent = res.verdict_ar;

    // Metric score & progress
    riskProbabilityEl.textContent = res.risk_probability.toFixed(2) + '%';
    resRiskLevelEl.textContent = res.risk_level;

    riskProgressFillEl.style.width = Math.min(Math.max(res.risk_probability, 3), 100) + '%';
    if (res.risk_probability < 25) {
      riskProgressFillEl.className = 'risk-progress-fill fill-normal';
    } else if (res.risk_probability < 60) {
      riskProgressFillEl.className = 'risk-progress-fill fill-moderate';
    } else {
      riskProgressFillEl.className = 'risk-progress-fill fill-attack';
    }

    // Action Card
    actionCardEl.className = 'action-card ' + (res.is_attack ? 'action-attack' : 'action-normal');
    actionTextEnEl.textContent = res.recommended_action_en;
    actionTextArEl.textContent = res.recommended_action_ar;

    // Features table
    const f = res.processed_features;
    const rows = [
      { name: 'Network Packet Size', code: 'network_packet_size', val: f.network_packet_size + ' Bytes' },
      { name: 'Protocol Type', code: 'protocol_type', val: f.protocol_type + ' (code ' + f.protocol_type_encoded + ')' },
      { name: 'Login Attempts', code: 'login_attempts', val: f.login_attempts },
      { name: 'Session Duration', code: 'session_duration', val: f.session_duration + ' s' },
      { name: 'Encryption Used', code: 'encryption_used', val: f.encryption_used + ' (code ' + f.encryption_used_encoded + ')' },
      { name: 'IP Reputation Score', code: 'ip_reputation_score', val: f.ip_reputation_score },
      { name: 'Failed Logins', code: 'failed_logins', val: f.failed_logins },
      { name: 'Browser Type', code: 'browser_type', val: f.browser_type + ' (code ' + f.browser_type_encoded + ')' },
      { name: 'Unusual Time Access', code: 'unusual_time_access', val: f.unusual_time_access === 1 ? '1 (Off-Hours)' : '0 (Normal)' },
      { name: 'Failed Ratio (Engineered)', code: 'failed_ratio', val: f.failed_ratio }
    ];

    auditTableBodyEl.innerHTML = rows.map(r => `
      <tr>
        <td><strong>${r.name}</strong><br><span style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-slate-400);">${r.code}</span></td>
        <td class="col-code">${r.val}</td>
      </tr>
    `).join('');

    // Smooth scroll into view on small screens
    if (window.innerWidth <= 1024) {
      auditReportContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Copy Summary
  btnCopyReport.addEventListener('click', () => {
    if (!currentAuditResult) return;
    const res = currentAuditResult;
    const textReport = [
      `=== CYBERSECURITY SESSION AUDIT REPORT ===`,
      `Audit Reference : ${res.audit_id}`,
      `Timestamp       : ${res.timestamp}`,
      `Evaluation      : ${res.verdict_en}`,
      `Decision Code   : ${res.prediction} (${res.is_attack ? 'ATTACK' : 'NORMAL'})`,
      `Risk Probability: ${res.risk_probability}%`,
      `Risk Level      : ${res.risk_level}`,
      `Recommended Act : ${res.recommended_action_en}`,
      `------------------------------------------`,
      `Failed Ratio    : ${res.processed_features.failed_ratio}`,
      `Packet Size     : ${res.processed_features.network_packet_size} Bytes`,
      `Protocol        : ${res.processed_features.protocol_type}`,
      `Encryption      : ${res.processed_features.encryption_used}`,
      `IP Reputation   : ${res.processed_features.ip_reputation_score}`,
      `==========================================`
    ].join('\n');

    navigator.clipboard.writeText(textReport).then(() => {
      const orig = btnCopyReport.textContent;
      btnCopyReport.textContent = 'REPORT COPIED';
      setTimeout(() => { btnCopyReport.textContent = orig; }, 1800);
    }).catch(() => {
      alert('Unable to copy report automatically.');
    });
  });

  // Download JSON
  btnDownloadJson.addEventListener('click', () => {
    if (!currentAuditResult) return;
    const blob = new Blob([JSON.stringify(currentAuditResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentAuditResult.audit_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Initial calculation
  updateLiveFailedRatio();
});
