"""
Dashboard aggregation endpoints.

Pulls counts and recent activity from all domain services in a single
read pass — no new business logic, just presentation aggregation.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import Roles, require_roles
from app.core.database import get_db
from app.services.alert.models import Alert, AlertStatus
from app.services.assignment.models import Assignment, AssignmentStatus
from app.services.auth.models import User
from app.services.shelter.models import Shelter, ShelterStatus
from app.services.volunteer.models import Volunteer

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ALL_AUTHENTICATED)),
):
    """Aggregate KPI counts for the dashboard."""

    # ── Alerts ──────────────────────────────────────────────────
    alert_total = (await db.execute(select(func.count()).select_from(Alert))).scalar() or 0
    alert_pending = (
        await db.execute(
            select(func.count()).select_from(Alert).where(Alert.status == AlertStatus.PENDING)
        )
    ).scalar() or 0
    alert_in_progress = (
        await db.execute(
            select(func.count()).select_from(Alert).where(Alert.status == AlertStatus.IN_PROGRESS)
        )
    ).scalar() or 0
    alert_resolved = (
        await db.execute(
            select(func.count()).select_from(Alert).where(Alert.status == AlertStatus.RESOLVED)
        )
    ).scalar() or 0

    from app.services.alert.models import Severity
    severity_counts = {}
    for sev in Severity:
        count = (
            await db.execute(
                select(func.count()).select_from(Alert).where(Alert.severity == sev)
            )
        ).scalar() or 0
        severity_counts[sev.value] = count

    from app.services.alert.models import IncidentType
    incident_counts = {}
    for inc in IncidentType:
        count = (
            await db.execute(
                select(func.count()).select_from(Alert).where(Alert.incident_type == inc)
            )
        ).scalar() or 0
        incident_counts[inc.value] = count

    # Alerts in last 24 hours
    alert_24h = (
        await db.execute(
            select(func.count()).select_from(Alert).where(
                Alert.created_at >= text("NOW() - INTERVAL '24 hours'")
            )
        )
    ).scalar() or 0

    # ── Assignments ─────────────────────────────────────────────
    assign_total = (await db.execute(select(func.count()).select_from(Assignment))).scalar() or 0
    assign_active = (
        await db.execute(
            select(func.count()).select_from(Assignment).where(
                Assignment.status.in_([
                    AssignmentStatus.PENDING,
                    AssignmentStatus.ACKNOWLEDGED,
                    AssignmentStatus.EN_ROUTE,
                    AssignmentStatus.ON_SCENE,
                ])
            )
        )
    ).scalar() or 0
    assign_completed = (
        await db.execute(
            select(func.count()).select_from(Assignment).where(
                Assignment.status == AssignmentStatus.COMPLETED
            )
        )
    ).scalar() or 0

    # ── Shelters ─────────────────────────────────────────────────
    shelter_total = (await db.execute(select(func.count()).select_from(Shelter))).scalar() or 0
    shelter_operational = (
        await db.execute(
            select(func.count()).select_from(Shelter).where(
                Shelter.status == ShelterStatus.OPERATIONAL
            )
        )
    ).scalar() or 0
    total_capacity_row = (
        await db.execute(select(func.sum(Shelter.total_capacity)).select_from(Shelter))
    ).scalar() or 0
    total_occupancy_row = (
        await db.execute(select(func.sum(Shelter.current_occupancy)).select_from(Shelter))
    ).scalar() or 0

    # ── Responders (users with role=responder) ───────────────────
    responder_total = (
        await db.execute(
            select(func.count()).select_from(User).where(User.role == "responder")
        )
    ).scalar() or 0
    responder_active = (
        await db.execute(
            select(func.count()).select_from(User).where(
                User.role == "responder", User.is_active == True  # noqa: E712
            )
        )
    ).scalar() or 0

    return {
        "alerts": {
            "total": alert_total,
            "pending": alert_pending,
            "in_progress": alert_in_progress,
            "resolved": alert_resolved,
            "by_severity": severity_counts,
            "by_incident_type": incident_counts,
            "last_24h": alert_24h,
        },
        "assignments": {
            "total": assign_total,
            "active": assign_active,
            "completed": assign_completed,
        },
        "shelters": {
            "total": shelter_total,
            "operational": shelter_operational,
            "total_capacity": int(total_capacity_row),
            "current_occupancy": int(total_occupancy_row),
            "available_capacity": int(total_capacity_row) - int(total_occupancy_row),
        },
        "responders": {
            "total": responder_total,
            "available": responder_active,
        },
    }


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*Roles.ALL_AUTHENTICATED)),
):
    """Latest activity from the audit_log table."""
    result = await db.execute(
        text(
            """
            SELECT
                al.id,
                al.action,
                al.entity_type,
                al.entity_id,
                al.created_at,
                u.username,
                u.full_name,
                u.role
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT :limit
            """
        ).bindparams(limit=limit)
    )
    rows = result.mappings().all()

    activities = [
        {
            "id": str(row["id"]),
            "action": row["action"],
            "entity_type": row["entity_type"],
            "entity_id": str(row["entity_id"]) if row["entity_id"] else None,
            "timestamp": row["created_at"].isoformat() if row["created_at"] else None,
            "user": {
                "username": row["username"],
                "full_name": row["full_name"],
                "role": row["role"],
            } if row["username"] else None,
        }
        for row in rows
    ]

    return {"activities": activities, "total": len(activities)}
