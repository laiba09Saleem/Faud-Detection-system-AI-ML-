from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable
import random

import numpy as np
from scipy.stats import poisson


@dataclass
class DetectionSummary:
    anomalies: list[dict]
    statistics: dict
    risk_score: int


class FraudDetectionService:
    def __init__(self, lambda_normal: int = 5, threshold_probability: float = 0.05) -> None:
        self.lambda_normal = lambda_normal
        self.threshold_probability = threshold_probability
        self.transaction_history: list[dict] = []

    def generate_transactions(self, minutes: int = 120) -> tuple[list[int], list[int]]:
        safe_minutes = max(1, minutes)
        transactions = np.random.poisson(self.lambda_normal, safe_minutes)
        anomaly_indices: list[int] = []

        for index in range(safe_minutes):
            if random.random() < 0.05:
                transactions[index] += int(np.random.poisson(20, 1)[0])
                anomaly_indices.append(index)

        self._append_history(transactions.tolist(), anomaly_indices)
        return transactions.astype(int).tolist(), anomaly_indices

    def analyze_transactions(self, transactions: Iterable[int | float]) -> dict:
        series = [int(value) for value in transactions]
        anomalies = self.detect_anomalies(series)
        statistics = self.get_statistics(series, anomalies)
        risk_score = self.calculate_risk_score(series)

        return DetectionSummary(
            anomalies=anomalies,
            statistics=statistics,
            risk_score=risk_score,
        ).__dict__

    def detect_anomalies(self, transactions: list[int]) -> list[dict]:
        anomalies: list[dict] = []

        for minute, transaction_count in enumerate(transactions):
            probability = float(poisson.pmf(transaction_count, self.lambda_normal))
            if probability >= self.threshold_probability:
                continue

            anomalies.append(
                {
                    "minute": minute,
                    "transactions": transaction_count,
                    "probability": probability,
                    "threshold": self.threshold_probability,
                    "is_fraud": transaction_count > self.lambda_normal * 2,
                    "severity": self._get_severity(transaction_count),
                }
            )

        return anomalies

    def get_statistics(self, transactions: list[int], anomalies: list[dict]) -> dict:
        transactions_array = np.array(transactions)
        detected_anomalies = len(anomalies)
        confirmed_fraud_spikes = sum(1 for item in anomalies if item["is_fraud"])
        actual_high_spikes = sum(1 for value in transactions if value > self.lambda_normal * 2)

        return {
            "total_minutes": len(transactions),
            "total_transactions": int(transactions_array.sum()),
            "avg_transactions": round(float(transactions_array.mean()), 2),
            "std_transactions": round(float(transactions_array.std()), 2),
            "max_transactions": int(transactions_array.max()),
            "min_transactions": int(transactions_array.min()),
            "anomalies_detected": detected_anomalies,
            "fraud_spikes": confirmed_fraud_spikes,
            "false_positives": max(0, detected_anomalies - confirmed_fraud_spikes),
            "detection_rate": round((confirmed_fraud_spikes / max(1, actual_high_spikes)) * 100, 1),
        }

    def calculate_risk_score(self, transactions: list[int]) -> int:
        if not transactions:
            return 0

        recent_window = transactions[-10:] if len(transactions) > 10 else transactions
        recent_average = float(np.mean(recent_window))

        if recent_average > self.lambda_normal * 3:
            return 95
        if recent_average > self.lambda_normal * 2:
            return 75
        if recent_average > self.lambda_normal * 1.5:
            return 50
        if recent_average > self.lambda_normal * 1.2:
            return 25
        return 10

    def get_history(self, limit: int = 100) -> list[dict]:
        return self.transaction_history[-limit:]

    def reset(self) -> dict:
        self.transaction_history = []
        return {"status": "reset", "message": "System reset successfully"}

    def update_threshold(self, threshold: float) -> None:
        self.threshold_probability = threshold

    def update_lambda(self, lambda_value: int) -> None:
        self.lambda_normal = lambda_value

    def _append_history(self, transactions: list[int], anomaly_indices: list[int]) -> None:
        base_offset = len(self.transaction_history)
        timestamp = datetime.utcnow().isoformat()

        for minute, transaction_count in enumerate(transactions):
            self.transaction_history.append(
                {
                    "minute": base_offset + minute,
                    "transactions": transaction_count,
                    "is_anomaly": minute in anomaly_indices,
                    "timestamp": timestamp,
                }
            )

    def _get_severity(self, transaction_count: int) -> str:
        if transaction_count > self.lambda_normal * 3:
            return "High"
        if transaction_count > self.lambda_normal * 2:
            return "Medium"
        return "Low"
