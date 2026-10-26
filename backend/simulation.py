from datetime import datetime
from .data import initial_state


def priority_for(patient):
    obs = patient["observations"]
    flags = []
    if obs["spo2"] < 90:
        flags.append({"rule": "Oxygen saturation below 90%", "observation": f"SpO₂ {obs['spo2']}%"})
    if obs["heart_rate"] >= 125:
        flags.append({"rule": "Heart rate at or above 125 bpm", "observation": f"HR {obs['heart_rate']} bpm"})
    if obs["respiratory_rate"] >= 28:
        flags.append({"rule": "Respiratory rate at or above 28/min", "observation": f"RR {obs['respiratory_rate']}/min"})
    level = "CRITICAL" if len(flags) >= 2 else "URGENT" if flags else "ROUTINE"
    return {"level": level, "flags": flags, "note": "Demonstration rules only · not a clinical assessment"}


def record_event(state, event_type, description, target, severity, status="ACTIVE"):
    event = {"id": f"EVT-{len(state['events']) + 1:03d}", "type": event_type,
             "description": description, "target": target, "severity": severity,
             "time": datetime.now().strftime("%H:%M:%S"), "status": status}
    state["events"].insert(0, event)
    return event


def reset_state():
    return initial_state()
