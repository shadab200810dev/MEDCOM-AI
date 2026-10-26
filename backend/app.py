from pathlib import Path
from threading import RLock
from time import perf_counter
from threading import Timer
from datetime import datetime
import math
import os
import webbrowser

from flask import Flask, jsonify, request, send_from_directory

from .data import initial_state
from .routing import calculate_route
from .simulation import priority_for, record_event, reset_state

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="/assets")
state = initial_state()
lock = RLock()

PAGES = {
    "/": "index.html",
    "/patients": "patient_registry.html",
    "/evacuation": "evacuation_command.html",
    "/map": "situation_map.html",
    "/events": "alerts_events.html",
    "/analytics": "mission_analytics.html",
}


def error(message, code=400):
    return jsonify({"error": message}), code


for path, filename in PAGES.items():
    app.add_url_rule(path, endpoint=f"page_{filename}", view_func=lambda file=filename: send_from_directory(FRONTEND, file))


@app.get("/api/dashboard")
def dashboard():
    with lock:
        patients = state["patients"]
        return jsonify({
            "active_patients": len(patients),
            "priority_cases": sum(priority_for(p)["level"] in ("URGENT", "CRITICAL") for p in patients),
            "available_facilities": sum(f["available"] for f in state["facilities"]),
            "active_hazards": sum(r["blocked"] for r in state["roads"]),
            "active_evacuations": sum(r["status"] == "IN PROGRESS" for r in state["routes"]),
            "patients": [{**p, "priority": priority_for(p)} for p in patients],
            "events": [e for e in state["events"] if e["type"] != "MISSION" or e["status"] == "ACTIVE"][:6],
        })


@app.get("/api/patients")
def patients():
    with lock:
        return jsonify([{**p, "priority": priority_for(p)} for p in state["patients"]])


@app.post("/api/patients")
def add_patient():
    body = request.get_json(silent=True) or {}
    sector = str(body.get("sector", "")).strip().upper()
    node = str(body.get("node", "")).strip().upper()
    status = str(body.get("status", "STABLE")).strip().upper()
    if not sector or len(sector) > 40:
        return error("Enter an incident sector of 1 to 40 characters")
    if status not in {"STABLE", "MONITOR", "PRIORITY"}:
        return error("Choose Stable, Monitor, or Priority as the simulated status")
    try:
        heart_rate = int(body.get("heart_rate"))
        spo2 = int(body.get("spo2"))
        respiratory_rate = int(body.get("respiratory_rate"))
        temperature = float(body.get("temperature"))
    except (TypeError, ValueError):
        return error("Enter valid numeric values for all four synthetic observations")
    if not (30 <= heart_rate <= 250 and 50 <= spo2 <= 100 and
            4 <= respiratory_rate <= 70 and math.isfinite(temperature) and 30 <= temperature <= 45):
        return error("Observations are outside the supported simulation ranges")

    with lock:
        if node not in {item["id"] for item in state["nodes"]}:
            return error("Choose a valid network location")
        numbers = [int(p["id"].split("-")[1]) for p in state["patients"]
                   if p.get("id", "").startswith("PT-") and p["id"].split("-")[1].isdigit()]
        patient_id = f"PT-{max(numbers, default=1000) + 1:04d}"
        now = datetime.now().strftime("%H:%M:%S")
        patient = {
            "id": patient_id, "sector": sector, "node": node, "status": status,
            "reviewed": False,
            "observations": {"heart_rate": heart_rate, "spo2": spo2,
                             "respiratory_rate": respiratory_rate, "temperature": round(temperature, 1)},
            "history": [{"at": now[:5], "hr": heart_rate, "spo2": spo2}],
            "updated_at": now[:5],
        }
        state["patients"].append(patient)
        record_event(state, "PATIENT", f"Synthetic patient record added · {patient_id}", patient_id, "LOW")
        return jsonify({**patient, "priority": priority_for(patient)}), 201


@app.get("/api/patients/<patient_id>")
def patient_detail(patient_id):
    with lock:
        p = next((p for p in state["patients"] if p["id"] == patient_id), None)
        if not p:
            return error("Patient not found", 404)
        return jsonify({**p, "priority": priority_for(p)})


@app.post("/api/patients/<patient_id>/review")
def mark_reviewed(patient_id):
    with lock:
        p = next((p for p in state["patients"] if p["id"] == patient_id), None)
        if not p:
            return error("Patient not found", 404)
        p["reviewed"] = True
        record_event(state, "REVIEW", f"{patient_id} marked reviewed", patient_id, "LOW")
        return jsonify({"ok": True, "patient": p})


@app.post("/api/patients/<patient_id>/condition")
def report_condition(patient_id):
    body = request.get_json(silent=True) or {}
    condition = str(body.get("condition", "")).upper().strip()
    note = str(body.get("note", "")).strip()
    if condition not in {"STABLE", "MONITOR", "PRIORITY"}:
        return error("Choose Stable, Monitor, or Priority as the reported condition")
    if len(note) > 500:
        return error("Condition note must be 500 characters or fewer")
    with lock:
        patient = next((p for p in state["patients"] if p["id"] == patient_id), None)
        if not patient:
            return error("Patient not found", 404)
        reported_at = datetime.now().strftime("%H:%M:%S")
        patient["status"] = condition
        patient["updated_at"] = reported_at[:5]
        patient["last_condition_report"] = {"condition": condition, "note": note, "time": reported_at}
        severity = "HIGH" if condition == "PRIORITY" else "MEDIUM" if condition == "MONITOR" else "LOW"
        description = f"Condition reported · {patient_id} · {condition}"
        if note:
            description += f" · {note[:100]}"
        record_event(state, "CONDITION", description, patient_id, severity)
        return jsonify({**patient, "priority": priority_for(patient)})


@app.get("/api/facilities")
def facilities():
    return jsonify(state["facilities"])


@app.get("/api/roads")
def roads():
    with lock:
        return jsonify({"nodes": state["nodes"], "roads": state["roads"],
                        "patients": [{**p, "priority": priority_for(p)} for p in state["patients"]],
                        "facilities": state["facilities"], "routes": state["routes"]})


@app.post("/api/routes/calculate")
def calculate():
    body = request.get_json(silent=True) or {}
    with lock:
        patient = next((p for p in state["patients"] if p["id"] == body.get("patient_id")), None)
        facility = next((f for f in state["facilities"] if f["id"] == body.get("facility_id")), None)
        if not patient or not facility:
            return error("Select a valid patient and facility")
        if not facility["available"]:
            return error("That facility is currently unavailable", 409)
        started = perf_counter()
        result = calculate_route(state["roads"], patient["node"], facility["node"])
        elapsed = round((perf_counter() - started) * 1000, 3)
        metrics = state["analytics"]
        metrics["requests"] += 1
        metrics["times_ms"].append(elapsed)
        route_id = f"EVAC-{metrics['requests']:03d}"
        if result is None:
            metrics["failed"] += 1
            record_event(state, "NO ROUTE", f"No valid route for {patient['id']} → {facility['name']}", patient["id"], "HIGH")
            return jsonify({"status": "NO ROUTE", "message": "No valid route is available with current road conditions.", "elapsed_ms": elapsed})
        was_active = any(r["patient_id"] == patient["id"] and r["status"] == "IN PROGRESS" for r in state["routes"])
        route = {"id": route_id, "patient_id": patient["id"], "facility_id": facility["id"],
                 "facility": facility["name"], "status": "IN PROGRESS", "elapsed_ms": elapsed, **result}
        state["routes"] = [r for r in state["routes"] if r["patient_id"] != patient["id"]] + [route]
        metrics["success"] += 1
        label = "recalculated" if was_active else "calculated"
        record_event(state, "RECALCULATED" if was_active else "ROUTE",
                     f"Route {route_id} {label} · {patient['id']} to {facility['name']}", route_id, "MEDIUM")
        return jsonify(route)


@app.post("/api/roads/<road_id>/<action>")
def update_road(road_id, action):
    if action not in ("block", "restore"):
        return error("Action must be block or restore")
    with lock:
        road = next((r for r in state["roads"] if r["id"] == road_id), None)
        if not road:
            return error("Road not found", 404)
        road["blocked"] = action == "block"
        if action == "block":
            state["analytics"]["closures"] += 1
        else:
            for old_event in state["events"]:
                if old_event["type"] == "ROAD" and old_event["target"] == road_id and old_event["status"] == "ACTIVE":
                    old_event["status"] = "RESOLVED"
        verb = "blocked" if road["blocked"] else "restored"
        record_event(state, "ROAD", f"{road_id} {verb}", road_id, "HIGH" if road["blocked"] else "LOW",
                     "ACTIVE" if road["blocked"] else "RESOLVED")
        updated = []
        for route in state["routes"]:
            if route["status"] != "IN PROGRESS" or road_id not in route["road_ids"]:
                continue
            patient = next(p for p in state["patients"] if p["id"] == route["patient_id"])
            facility = next(f for f in state["facilities"] if f["id"] == route["facility_id"])
            started = perf_counter()
            replacement = calculate_route(state["roads"], patient["node"], facility["node"])
            elapsed = round((perf_counter() - started) * 1000, 3)
            metrics = state["analytics"]
            metrics["requests"] += 1
            metrics["times_ms"].append(elapsed)
            if replacement is None:
                metrics["failed"] += 1
                route.update({"status": "NO ROUTE", "road_ids": [], "elapsed_ms": elapsed})
                record_event(state, "NO ROUTE", f"No route remains for {patient['id']}", patient["id"], "HIGH")
            else:
                metrics["success"] += 1
                route.update(replacement)
                route.update({"id": f"EVAC-{metrics['requests']:03d}", "elapsed_ms": elapsed})
                record_event(state, "RECALCULATED", f"Route updated for {patient['id']} · {replacement['minutes']} min", route["id"], "MEDIUM")
            updated.append(route)
        return jsonify({"road": road, "updated_routes": updated})


@app.get("/api/events")
def events():
    return jsonify(state["events"])


@app.get("/api/analytics")
def analytics():
    with lock:
        metrics = state["analytics"]
        times = metrics["times_ms"]
        return jsonify({
            "mission_status": state["mission_status"],
            "requests": metrics["requests"], "success": metrics["success"], "failed": metrics["failed"],
            "closures": metrics["closures"], "average_ms": round(sum(times) / len(times), 2) if times else 0,
            "times_ms": times, "open_roads": sum(not r["blocked"] for r in state["roads"]),
            "blocked_roads": sum(r["blocked"] for r in state["roads"]), "patients": len(state["patients"]),
            "facilities": len(state["facilities"]),
            "recalculations": sum(e["type"] == "RECALCULATED" for e in state["events"]),
        })


@app.post("/api/mission/status")
def update_mission_status():
    body = request.get_json(silent=True) or {}
    status = str(body.get("status", "")).upper().strip()
    if status not in {"ONGOING", "COMPLETED"}:
        return error("Mission status must be Ongoing or Completed")
    with lock:
        changed = state["mission_status"] != status
        if changed:
            state["mission_status"] = status
            for event in state["events"]:
                if event["type"] == "MISSION" and event["status"] == "ACTIVE":
                    event["status"] = "RESOLVED"
            description = "Mission ongoing · Operation Kestrel" if status == "ONGOING" else "Mission completed · Operation Kestrel"
            event_status = "ACTIVE" if status == "ONGOING" else "RESOLVED"
            record_event(state, "MISSION", description, "OPERATION KESTREL", "LOW", event_status)
        return jsonify({"mission_status": state["mission_status"], "changed": changed})


@app.post("/api/simulation/reset")
def reset():
    global state
    with lock:
        state = reset_state()
        record_event(state, "SYSTEM", "Scenario reset · initial synthetic data restored", "SYSTEM", "LOW")
        return jsonify({"ok": True})


if __name__ == "__main__":
    if os.environ.get("MEDCOM_OPEN_BROWSER") == "1":
        Timer(1.2, lambda: webbrowser.open("http://127.0.0.1:5000")).start()
    app.run(host="127.0.0.1", port=5000, debug=False)
