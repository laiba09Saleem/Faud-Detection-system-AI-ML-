const API_BASE_URL = "http://localhost:5000";

const state = {
    transactions: [],
    chart: null,
};

const elements = {
    minutes: document.getElementById("minutes"),
    threshold: document.getElementById("threshold"),
    lambda: document.getElementById("lambda"),
    generateButton: document.getElementById("generate-btn"),
    detectButton: document.getElementById("detect-btn"),
    resetButton: document.getElementById("reset-btn"),
    total: document.getElementById("stat-total"),
    average: document.getElementById("stat-average"),
    anomalies: document.getElementById("stat-anomalies"),
    detectionRate: document.getElementById("stat-detection-rate"),
    peak: document.getElementById("stat-peak"),
    range: document.getElementById("stat-range"),
    riskFill: document.getElementById("risk-fill"),
    riskLevel: document.getElementById("risk-level"),
    riskRecommendation: document.getElementById("risk-recommendation"),
    anomalyList: document.getElementById("anomaly-list"),
    systemStatus: document.getElementById("system-status"),
    activeThreshold: document.getElementById("active-threshold"),
    activeLambda: document.getElementById("active-lambda"),
    toastRoot: document.getElementById("toast-root"),
};

function initializeChart() {
    const context = document.getElementById("transactionChart").getContext("2d");
    state.chart = new Chart(context, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Transactions per minute",
                    data: [],
                    borderColor: "#48d1b2",
                    backgroundColor: "rgba(72, 209, 178, 0.12)",
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#eff5ff",
                    },
                },
            },
            scales: {
                x: {
                    ticks: { color: "#8fa7c5" },
                    grid: { color: "rgba(143, 167, 197, 0.08)" },
                    title: {
                        display: true,
                        text: "Minute",
                        color: "#8fa7c5",
                    },
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: "#8fa7c5" },
                    grid: { color: "rgba(143, 167, 197, 0.08)" },
                    title: {
                        display: true,
                        text: "Transactions",
                        color: "#8fa7c5",
                    },
                },
            },
        },
    });
}

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.message || payload.error || "Request failed");
    }
    return payload;
}

async function loadSettings() {
    try {
        const settings = await request("/api/settings", { method: "GET" });
        elements.threshold.value = settings.threshold;
        elements.lambda.value = settings.lambda;
        elements.activeThreshold.textContent = settings.threshold;
        elements.activeLambda.textContent = settings.lambda;
        elements.systemStatus.textContent = "Connected";
    } catch (error) {
        elements.systemStatus.textContent = "Backend unavailable";
        showToast("Backend settings could not be loaded.", "warning");
    }
}

async function updateThreshold() {
    const threshold = Number(elements.threshold.value);
    const result = await request("/api/settings/threshold", {
        method: "POST",
        body: JSON.stringify({ threshold }),
    });

    elements.activeThreshold.textContent = result.threshold;
}

async function updateLambda() {
    const lambda = Number(elements.lambda.value);
    const result = await request("/api/settings/lambda", {
        method: "POST",
        body: JSON.stringify({ lambda }),
    });

    elements.activeLambda.textContent = result.lambda;
}

async function generateData() {
    setButtonsDisabled(true);
    try {
        await updateThreshold();
        await updateLambda();

        const minutes = Number(elements.minutes.value);
        const payload = await request("/api/generate-data", {
            method: "POST",
            body: JSON.stringify({ minutes }),
        });

        state.transactions = payload.transactions;
        renderChart(payload.transactions, []);
        showToast(payload.message, "success");
        await detectAnomalies();
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        setButtonsDisabled(false);
    }
}

async function detectAnomalies() {
    if (!state.transactions.length) {
        showToast("Generate data first to run analysis.", "warning");
        return;
    }

    setButtonsDisabled(true);
    try {
        const payload = await request("/api/detect-anomalies", {
            method: "POST",
            body: JSON.stringify({ transactions: state.transactions }),
        });

        renderStatistics(payload.statistics);
        renderRisk(payload.risk_score);
        renderAnomalies(payload.anomalies);
        renderChart(state.transactions, payload.anomalies);

        const anomalyCount = payload.anomalies.length;
        const message = anomalyCount
            ? `${anomalyCount} anomalies detected in the current batch.`
            : "Analysis completed with no anomalies detected.";
        showToast(message, anomalyCount ? "warning" : "success");
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        setButtonsDisabled(false);
    }
}

async function resetSystem() {
    setButtonsDisabled(true);
    try {
        await request("/api/reset", { method: "POST" });
        state.transactions = [];
        renderStatistics({
            total_transactions: 0,
            avg_transactions: 0,
            anomalies_detected: 0,
            detection_rate: 0,
            max_transactions: 0,
            min_transactions: 0,
        });
        renderRisk(0);
        renderAnomalies([]);
        renderChart([], []);
        showToast("System reset successfully.", "success");
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        setButtonsDisabled(false);
    }
}

function renderStatistics(stats) {
    elements.total.textContent = stats.total_transactions;
    elements.average.textContent = `Average per minute: ${Number(stats.avg_transactions).toFixed(2)}`;
    elements.anomalies.textContent = stats.anomalies_detected;
    elements.detectionRate.textContent = `Detection rate: ${Number(stats.detection_rate).toFixed(1)}%`;
    elements.peak.textContent = stats.max_transactions;
    elements.range.textContent = `Minimum: ${stats.min_transactions}`;
}

function renderRisk(riskScore) {
    const { label, recommendation } = getRiskCopy(riskScore);
    elements.riskFill.style.width = `${riskScore}%`;
    elements.riskFill.textContent = `${riskScore}%`;
    elements.riskLevel.textContent = label;
    elements.riskRecommendation.textContent = recommendation;
}

function renderAnomalies(anomalies) {
    if (!anomalies.length) {
        elements.anomalyList.innerHTML = '<div class="empty-state">No anomalies detected in the latest run.</div>';
        return;
    }

    elements.anomalyList.innerHTML = anomalies
        .map((anomaly) => {
            const severity = anomaly.severity.toLowerCase();
            return `
                <article class="anomaly-item ${severity}">
                    <div class="anomaly-title">
                        <span>Minute ${anomaly.minute}</span>
                        <span class="pill ${severity}">${anomaly.severity}</span>
                    </div>
                    <div>Transactions: <strong>${anomaly.transactions}</strong></div>
                    <div>Probability: <strong>${(anomaly.probability * 100).toFixed(4)}%</strong></div>
                    <div>${anomaly.is_fraud ? "Fraud spike requires review." : "Suspicious traffic pattern detected."}</div>
                </article>
            `;
        })
        .join("");
}

function renderChart(transactions, anomalies) {
    if (!state.chart) {
        initializeChart();
    }

    const anomalyMinutes = new Set(anomalies.map((item) => item.minute));
    state.chart.data.labels = transactions.map((_, index) => index);
    state.chart.data.datasets[0].data = transactions;
    state.chart.data.datasets[0].pointRadius = (context) => (anomalyMinutes.has(context.dataIndex) ? 5 : 2);
    state.chart.data.datasets[0].pointBackgroundColor = (context) =>
        anomalyMinutes.has(context.dataIndex) ? "#ff6b6b" : "#48d1b2";
    state.chart.data.datasets[0].pointBorderColor = "#07111f";
    state.chart.data.datasets[0].pointBorderWidth = 1.5;
    state.chart.update();
}

function getRiskCopy(riskScore) {
    if (riskScore >= 70) {
        return {
            label: "High risk posture",
            recommendation: "Escalate to manual review and inspect the flagged spikes immediately.",
        };
    }

    if (riskScore >= 40) {
        return {
            label: "Medium risk posture",
            recommendation: "Keep monitoring and verify suspicious transactions against customer behavior.",
        };
    }

    if (riskScore > 0) {
        return {
            label: "Low risk posture",
            recommendation: "Traffic looks stable. Continue routine monitoring.",
        };
    }

    return {
        label: "Awaiting analysis",
        recommendation: "Generate and analyze data to see the current recommendation.",
    };
}

function showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastRoot.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 3200);
}

function setButtonsDisabled(disabled) {
    elements.generateButton.disabled = disabled;
    elements.detectButton.disabled = disabled;
    elements.resetButton.disabled = disabled;
}

function bindEvents() {
    elements.generateButton.addEventListener("click", generateData);
    elements.detectButton.addEventListener("click", detectAnomalies);
    elements.resetButton.addEventListener("click", resetSystem);
}

bindEvents();
initializeChart();
loadSettings();
