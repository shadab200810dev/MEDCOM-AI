import heapq


def calculate_route(roads, start, goal):
    """Return the lowest-minute route, excluding blocked roads."""
    graph = {}
    for road in roads:
        if road["blocked"]:
            continue
        graph.setdefault(road["from"], []).append((road["to"], road["minutes"], road["id"]))
        graph.setdefault(road["to"], []).append((road["from"], road["minutes"], road["id"]))
    queue = [(0, start, [], [start])]
    best = {}
    while queue:
        cost, node, road_ids, nodes = heapq.heappop(queue)
        if node in best:
            continue
        best[node] = cost
        if node == goal:
            return {"minutes": cost, "road_ids": road_ids, "nodes": nodes, "segments": len(road_ids)}
        for neighbor, weight, road_id in graph.get(node, []):
            if neighbor not in best:
                heapq.heappush(queue, (cost + weight, neighbor, road_ids + [road_id], nodes + [neighbor]))
    return None
