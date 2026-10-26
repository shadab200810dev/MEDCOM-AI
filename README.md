# MEDCOM AI

**Smarter Triage. Faster Evacuation.**

MEDCOM AI is a local Flask and vanilla-JavaScript prototype for coordinating a synthetic emergency scenario. It includes a patient registry, condition reporting, facility selection, Dijkstra route planning, road closures, alerts, mission status, and analytics.

All patient and scenario data is synthetic. Demonstration priority flags are not diagnoses or clinically validated triage decisions.

## Quick start on Windows

1. Extract the ZIP file.
2. Install Python 3.10 or newer if it is not already installed. On Windows, enable **Add Python to PATH** during installation.
3. Double-click `run_medcom.bat`.
4. On first run, the script creates `.venv` and installs Flask. Allow it to finish; an internet connection is needed for that first install.
5. The site opens at <http://127.0.0.1:5000>. Keep the command window open while using it.

## Run from VS Code

1. In VS Code, choose **File → Open Folder** and select the extracted project folder. It must directly contain `backend`, `frontend`, and `run_medcom.bat`.
2. Press **Ctrl+Shift+B** and run **Run MEDCOM website**.
3. Keep the integrated terminal open while using the site.

Do not open an HTML page directly or use Live Server; the Flask server supplies the APIs used by the frontend.

## macOS or Linux

Install Python 3.10 or newer, extract the ZIP, open a terminal in the project folder, and run:

```bash
bash run_medcom.sh
```

The script creates `.venv`, installs Flask on first run, and starts the app. Open <http://127.0.0.1:5000> and leave the terminal running.

## Project structure

```text
backend/       Flask API, synthetic data, simulation, and Dijkstra routing
frontend/      Six HTML pages, shared CSS, and vanilla JavaScript
.vscode/       Run MEDCOM website task
requirements.txt
run_medcom.bat Windows launcher
run_medcom.sh  macOS/Linux launcher
```

## Stop and restart

Stop the server with **Ctrl+C** in its terminal. The prototype stores data in memory, so restarting resets the scenario to its initial synthetic data.

If startup reports that port 5000 is already in use, stop the other MEDCOM server window first, then retry.

## Deploy online with Netlify + Render

Netlify hosts the static frontend, while Render runs the Python/Flask API. Uploading only the ZIP or the `frontend` folder to Netlify is not enough to run the API.

1. Upload the extracted project to a GitHub repository.
2. In Render, create a **Web Service** from that repository. Leave **Root Directory** blank. Set **Build Command** to `pip install -r requirements-deploy.txt` and **Start Command** to `gunicorn backend.app:app --bind 0.0.0.0:$PORT`.
3. After Render deploys, copy the service host, for example `https://medcom-api.onrender.com`. In `frontend/_redirects`, replace `YOUR-RENDER-SERVICE.onrender.com` with that host, then commit/push the change.
4. In Netlify, import the same GitHub repository. `netlify.toml` sets the publish directory to `frontend`; leave the build command empty.
5. Wait for the Netlify deploy. Open the Netlify URL and check `/api/dashboard`; it should return JSON. The page routes, assets, and `/api/*` calls are routed by the included Netlify configuration.

The current Flask data is held in memory and resets when the service restarts. This demo has no authentication or persistent database; use synthetic data only.
