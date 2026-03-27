from datetime import datetime

from flask import Blueprint, current_app, jsonify, request

from app.services.fraud_detection import FraudDetectionService
from app.utils.validators import parse_request_json, validate_numeric_range

api_blueprint = Blueprint("fraud_detection_api", __name__)
fraud_service = FraudDetectionService()


@api_blueprint.get("/")
def health_check():
    return jsonify(
        {
            "message": "Fraud Detection API is running",
            "status": "active",
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


@api_blueprint.post("/api/generate-data")
def generate_data():
    payload = parse_request_json(request)
    minutes = payload.get("minutes", current_app.config["DEFAULT_MINUTES"])
    is_valid, error_message = validate_numeric_range(
        value=minutes,
        min_value=current_app.config["MIN_MINUTES"],
        max_value=current_app.config["MAX_MINUTES"],
        field_name="Minutes",
    )
    if not is_valid:
        return jsonify({"status": "error", "message": error_message}), 400

    minutes = int(float(minutes))

    transactions, anomaly_indices = fraud_service.generate_transactions(minutes=minutes)
    return jsonify(
        {
            "transactions": transactions,
            "anomaly_indices": anomaly_indices,
            "message": f"Generated {minutes} minutes of transaction data",
        }
    )


@api_blueprint.post("/api/detect-anomalies")
def detect_anomalies():
    payload = parse_request_json(request)
    transactions = payload.get("transactions", [])

    if not transactions:
        return jsonify({"error": "No transactions provided"}), 400

    analysis = fraud_service.analyze_transactions(transactions)
    response = {**analysis, "timestamp": datetime.utcnow().isoformat()}
    return jsonify(response)


@api_blueprint.get("/api/history")
def get_history():
    limit = current_app.config["MAX_HISTORY_RECORDS"]
    history = fraud_service.get_history(limit=limit)
    return jsonify({"history": history, "total_records": len(fraud_service.transaction_history)})


@api_blueprint.post("/api/reset")
def reset_system():
    return jsonify(fraud_service.reset())


@api_blueprint.post("/api/settings/threshold")
def set_threshold():
    payload = parse_request_json(request)
    threshold = payload.get("threshold", current_app.config["DEFAULT_THRESHOLD"])
    is_valid, error_message = validate_numeric_range(
        value=threshold,
        min_value=current_app.config["MIN_THRESHOLD"],
        max_value=current_app.config["MAX_THRESHOLD"],
        field_name="Threshold",
    )
    if not is_valid:
        return jsonify({"status": "error", "message": error_message}), 400

    fraud_service.update_threshold(float(threshold))
    return jsonify(
        {
            "status": "success",
            "threshold": fraud_service.threshold_probability,
            "message": f"Threshold updated to {fraud_service.threshold_probability}",
        }
    )


@api_blueprint.post("/api/settings/lambda")
def set_lambda():
    payload = parse_request_json(request)
    lambda_value = payload.get("lambda", current_app.config["DEFAULT_LAMBDA"])
    is_valid, error_message = validate_numeric_range(
        value=lambda_value,
        min_value=current_app.config["MIN_LAMBDA"],
        max_value=current_app.config["MAX_LAMBDA"],
        field_name="Lambda",
    )
    if not is_valid:
        return jsonify({"status": "error", "message": error_message}), 400

    fraud_service.update_lambda(int(float(lambda_value)))
    return jsonify(
        {
            "status": "success",
            "lambda": fraud_service.lambda_normal,
            "message": f"Normal transaction rate updated to {fraud_service.lambda_normal}",
        }
    )


@api_blueprint.get("/api/settings")
def get_settings():
    return jsonify(
        {
            "lambda": fraud_service.lambda_normal,
            "threshold": fraud_service.threshold_probability,
        }
    )
