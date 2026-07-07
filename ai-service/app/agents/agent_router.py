def route_agent(state):
    q = state["query"].lower()
    if "resume" in q:
        return "resume"
    if "interview" in q:
        return "interview"
    return "study"
