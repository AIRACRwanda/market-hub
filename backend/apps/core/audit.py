"""
audit.py — thin helpers for writing to the AuditLog.
Import and call from any view that performs a moderation action.
"""
from .models import AuditLog


def log(admin, action, *, target_user=None, listing=None, note=None):
    """
    Write one audit log entry.

    admin        — the admin User performing the action
    action       — AuditLog.Action choice string
    target_user  — the User being acted on (optional)
    listing      — a Listing instance (optional) — id and title are recorded
    note         — the reason / message typed by the admin (optional)
    """
    AuditLog.objects.create(
        admin=admin,
        action=action,
        target_user=target_user,
        target_listing_id=listing.id if listing else None,
        target_listing_title=listing.title if listing else None,
        note=note,
    )
