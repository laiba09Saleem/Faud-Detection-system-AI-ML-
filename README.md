# Fraud Detection System

A lightweight full-stack fraud detection demo that simulates transaction traffic, detects suspicious spikes, and presents the results in a clean analyst-style dashboard.

## Overview

This project combines a Flask API with a static frontend to model a simple fraud monitoring workflow:

- generate synthetic transaction volumes using a Poisson distribution
- flag anomalous behavior using probability-based thresholding
- summarize fraud indicators with operational metrics and a risk score
- visualize activity and incidents in a responsive dashboard

The system is designed for learning, demos, and portfolio use rather than production fraud screening.

## Features

- Synthetic transaction generation with configurable monitoring duration
- Adjustable detection threshold and expected normal transaction rate (`lambda`)
- Poisson-based anomaly detection for transaction spikes
- Risk scoring based on recent transaction behavior
- Interactive dashboard with Chart.js visualizations
- In-memory transaction history and reset support
- Input validation for API requests

## Tech Stack

- Backend: Python, Flask, Flask-CORS
- Scientific computing: NumPy, SciPy
- Frontend: HTML, CSS, JavaScript
- Charts: Chart.js

## How It Works

1. The backend generates minute-by-minute transaction counts using a Poisson distribution.
2. Random anomaly spikes are injected into a small portion of the generated data.
3. Each transaction count is evaluated against the expected normal rate.
4. Counts with probabilities below the configured threshold are flagged as anomalies.
5. The frontend renders key statistics, risk level, and flagged events for quick review.

## Project Structure

```text
fraud-detection-system/
|-- backend/
|   |-- app.py
|   `-- app/
|       |-- __init__.py
|       |-- config.py
|       |-- api/routes.py
|       |-- services/fraud_detection.py
|       `-- utils/validators.py
|-- frontend/
|   |-- index.html
|   |-- styles.css
|   `-- app.js
`-- requirements.txt
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd fraud-detection-system
```

### 2. Create and activate a virtual environment

On Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

On macOS/Linux:

```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the backend

```bash
cd backend
python app.py
```

The API starts at `http://localhost:5000`.

### 5. Open the frontend

Open `frontend/index.html` in your browser, or serve the `frontend` folder with a simple local static server if you prefer.

## Default Configuration

- Default monitoring window: `120` minutes
- Allowed minutes range: `10` to `500`
- Default Poisson lambda: `5`
- Allowed lambda range: `1` to `20`
- Default anomaly threshold: `0.05`
- Allowed threshold range: `0.001` to `0.5`
- History limit returned by the API: `250` records

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Health check |
| `GET` | `/api/settings` | Fetch current lambda and threshold |
| `POST` | `/api/settings/threshold` | Update anomaly threshold |
| `POST` | `/api/settings/lambda` | Update normal transaction rate |
| `POST` | `/api/generate-data` | Generate synthetic transaction data |
| `POST` | `/api/detect-anomalies` | Analyze transactions and return anomalies |
| `GET` | `/api/history` | Fetch recent generated history |
| `POST` | `/api/reset` | Clear in-memory history and reset state |

## Example Workflow

1. Start the Flask backend.
2. Open the frontend dashboard.
3. Set the desired `Minutes`, `Threshold`, and `Lambda`.
4. Click `Generate Data` to create a synthetic transaction stream.
5. Review anomalies, risk posture, and charted activity.
6. Click `Reset` to clear the current session.

## Notes and Limitations

- Data is generated synthetically and stored only in memory.
- There is no database, authentication, or persistent audit logging.
- The fraud logic is intentionally simplified for educational use.
- The frontend expects the backend to be available at `http://localhost:5000`.

## Future Improvements

- Add persistent storage for generated sessions and incident history
- Introduce user authentication and role-based access
- Support real transaction datasets and model evaluation
- Add automated tests for API routes and detection logic
- Containerize the application with Docker

## License

This project is available for educational and portfolio use. Add a license file if you plan to distribute it publicly.
