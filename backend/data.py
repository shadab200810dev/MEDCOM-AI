from datetime import datetime, timedelta


def initial_state():
    now = datetime.now()
    patients = [
        {"id": "PT-1042", "sector": "NORTH RIDGE", "node": "A", "status": "STABLE", "reviewed": False,
         "observations": {"heart_rate": 92, "spo2": 97, "respiratory_rate": 18, "temperature": 37.1},
         "history": [{"at": "14:02", "hr": 88, "spo2": 98}, {"at": "14:11", "hr": 90, "spo2": 97}, {"at": "14:20", "hr": 92, "spo2": 97}]},
        {"id": "PT-1048", "sector": "EAST PASS", "node": "D", "status": "MONITOR", "reviewed": False,
         "observations": {"heart_rate": 118, "spo2": 91, "respiratory_rate": 25, "temperature": 38.2},
         "history": [{"at": "13:58", "hr": 104, "spo2": 94}, {"at": "14:09", "hr": 111, "spo2": 93}, {"at": "14:20", "hr": 118, "spo2": 91}]},
        {"id": "PT-1051", "sector": "SOUTH BASIN", "node": "G", "status": "STABLE", "reviewed": True,
         "observations": {"heart_rate": 84, "spo2": 98, "respiratory_rate": 16, "temperature": 36.8},
         "history": [{"at": "13:59", "hr": 86, "spo2": 97}, {"at": "14:10", "hr": 85, "spo2": 98}, {"at": "14:20", "hr": 84, "spo2": 98}]},
        {"id": "PT-1057", "sector": "WEST CUT", "node": "H", "status": "PRIORITY", "reviewed": False,
         "observations": {"heart_rate": 132, "spo2": 88, "respiratory_rate": 29, "temperature": 39.0},
         "history": [{"at": "13:58", "hr": 119, "spo2": 92}, {"at": "14:09", "hr": 127, "spo2": 90}, {"at": "14:20", "hr": 132, "spo2": 88}]},
        {"id": "PT-1063", "sector": "CENTRAL", "node": "E", "status": "STABLE", "reviewed": False,
         "observations": {"heart_rate": 98, "spo2": 95, "respiratory_rate": 20, "temperature": 37.4},
         "history": [{"at": "14:00", "hr": 96, "spo2": 96}, {"at": "14:10", "hr": 97, "spo2": 95}, {"at": "14:20", "hr": 98, "spo2": 95}]},
    ]
    for patient in patients:
        patient["updated_at"] = (now - timedelta(minutes=2)).strftime("%H:%M")
    nodes = [
        {"id": "A", "x": 80, "y": 125, "name": "North Ridge"}, {"id": "B", "x": 255, "y": 75, "name": "Highland Junction"},
        {"id": "C", "x": 255, "y": 260, "name": "West Fork"}, {"id": "D", "x": 470, "y": 55, "name": "East Pass"},
        {"id": "E", "x": 470, "y": 175, "name": "Crossroads"}, {"id": "F", "x": 700, "y": 270, "name": "Forward Aid Station"},
        {"id": "G", "x": 700, "y": 115, "name": "Field Medical Unit"}, {"id": "H", "x": 870, "y": 185, "name": "West Cut"},
    ]
    roads = [
        {"id": "ROAD-01", "from": "A", "to": "B", "minutes": 4, "blocked": False},
        {"id": "ROAD-02", "from": "A", "to": "C", "minutes": 7, "blocked": False},
        {"id": "ROAD-03", "from": "B", "to": "D", "minutes": 5, "blocked": False},
        {"id": "ROAD-04", "from": "B", "to": "E", "minutes": 5, "blocked": True},
        {"id": "ROAD-05", "from": "C", "to": "E", "minutes": 3, "blocked": False},
        {"id": "ROAD-06", "from": "C", "to": "F", "minutes": 8, "blocked": False},
        {"id": "ROAD-07", "from": "D", "to": "E", "minutes": 4, "blocked": False},
        {"id": "ROAD-08", "from": "D", "to": "G", "minutes": 6, "blocked": False},
        {"id": "ROAD-09", "from": "E", "to": "G", "minutes": 5, "blocked": False},
        {"id": "ROAD-10", "from": "E", "to": "H", "minutes": 7, "blocked": False},
        {"id": "ROAD-11", "from": "F", "to": "H", "minutes": 4, "blocked": False},
        {"id": "ROAD-12", "from": "G", "to": "H", "minutes": 3, "blocked": False},
    ]
    facilities = [
        {"id": "FAC-01", "name": "Forward Aid Station", "node": "F", "available": True, "capabilities": ["TRAUMA", "STABILIZATION"]},
        {"id": "FAC-02", "name": "Field Medical Unit", "node": "G", "available": True, "capabilities": ["TRAUMA", "SURGICAL"]},
        {"id": "FAC-03", "name": "Regional Care Point", "node": "H", "available": False, "capabilities": ["ADVANCED CARE"]},
    ]
    events = [
        {"id": "EVT-001", "type": "SYSTEM", "description": "Scenario initialized · Sector Kestrel", "target": "SYSTEM", "severity": "LOW", "time": now.strftime("%H:%M:%S"), "status": "ACTIVE"},
        {"id": "EVT-002", "type": "ROAD", "description": "ROAD-04 closure reported · bridge inspection", "target": "ROAD-04", "severity": "HIGH", "time": now.strftime("%H:%M:%S"), "status": "ACTIVE"},
        {"id": "EVT-003", "type": "MISSION", "description": "Mission ongoing · Operation Kestrel", "target": "OPERATION KESTREL", "severity": "LOW", "time": now.strftime("%H:%M:%S"), "status": "ACTIVE"},
    ]
    return {"patients": patients, "facilities": facilities, "nodes": nodes, "roads": roads,
            "routes": [], "events": events, "mission_status": "ONGOING",
            "analytics": {"requests": 0, "success": 0, "failed": 0, "closures": 0, "times_ms": []}}
