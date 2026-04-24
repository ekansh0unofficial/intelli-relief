from dataclasses import dataclass

from app.services.alert.models import IncidentType, Severity

INCIDENT_KEYWORDS: dict[IncidentType, list[str]] = {
    IncidentType.FLOOD:       ["flood", "flooding", "waterlogged", "inundated", "overflow", "submerged", "water level"],
    IncidentType.FIRE:        ["fire", "blaze", "burning", "flames", "smoke", "arson", "wildfire", "ignited"],
    IncidentType.EARTHQUAKE:  ["earthquake", "tremor", "quake", "seismic", "aftershock", "shaking", "building collapse"],
    IncidentType.ACCIDENT:    ["accident", "collision", "crash", "vehicle", "car", "truck", "road", "highway", "overturned"],
    IncidentType.MEDICAL:     ["medical", "cardiac", "heart attack", "injury", "bleeding", "unconscious", "ambulance", "sick", "hospital", "overdose"],
    IncidentType.RESCUE:      ["rescue", "trapped", "stranded", "missing", "lost", "stuck", "debris field"],
    IncidentType.LANDSLIDE:   ["landslide", "mudslide", "rockslide", "debris flow", "slope failure", "hill"],
    IncidentType.CYCLONE:     ["cyclone", "hurricane", "typhoon", "storm", "wind", "tornado", "gale"],
}

SEVERITY_KEYWORDS: dict[Severity, list[str]] = {
    Severity.CRITICAL: ["critical", "mass casualty", "multiple deaths", "widespread", "catastrophic", "extreme emergency", "many people", "dozens"],
    Severity.HIGH:     ["severe", "serious", "major", "urgent", "dangerous", "significant", "heavy", "large", "multiple injured", "several"],
    Severity.MEDIUM:   ["moderate", "considerable", "notable", "few people", "some people"],
    Severity.LOW:      ["minor", "small", "slight", "minimal", "single person", "one person"],
}


@dataclass
class InferenceResult:
    incident_type: IncidentType
    severity: Severity
    title: str


def infer_from_description(description: str, address: str | None = None) -> InferenceResult:
    """
    Keyword-based inference of incident_type, severity, and title.
    Deterministic — no network calls, no LLM.
    """
    text = description.lower()

    scores: dict[IncidentType, int] = {t: 0 for t in IncidentType}
    for itype, keywords in INCIDENT_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                scores[itype] += 1
    best_type = max(scores, key=lambda t: scores[t])
    incident_type = best_type if scores[best_type] > 0 else IncidentType.OTHER

    severity = Severity.MEDIUM
    for sev in (Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW):
        if any(kw in text for kw in SEVERITY_KEYWORDS[sev]):
            severity = sev
            break

    type_label = incident_type.value.replace("_", " ").title()
    location_hint = (address[:50].strip() if address else description[:50].strip())
    title = f"{type_label} incident: {location_hint}"[:100]

    return InferenceResult(incident_type=incident_type, severity=severity, title=title)
