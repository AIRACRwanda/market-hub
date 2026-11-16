from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """
    Every important admin action is recorded here.
    Written by the views — never edited or deleted.
    """

    class Action(models.TextChoices):
        LISTING_APPROVED         = 'listing_approved',         'Listing Approved'
        LISTING_REJECTED         = 'listing_rejected',         'Listing Rejected'
        PROOF_REQUESTED          = 'proof_requested',          'Proof Requested'
        PROOF_REJECTED           = 'proof_rejected',           'Proof Rejected'
        LISTING_REMOVED          = 'listing_removed',          'Listing Removed'
        ACCOUNT_DISABLED         = 'account_disabled',         'Account Disabled'
        ACCOUNT_ENABLED          = 'account_enabled',          'Account Enabled'
        REPORT_RESOLVED          = 'report_resolved',          'Report Resolved'
        REPORT_DISMISSED         = 'report_dismissed',         'Report Dismissed'

    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_entries',
    )
    action = models.CharField(max_length=30, choices=Action.choices)
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='audit_target_entries',
    )
    target_listing_id = models.IntegerField(null=True, blank=True)
    target_listing_title = models.CharField(max_length=255, blank=True, null=True)
    note = models.TextField(blank=True, null=True)        # reason / message supplied by admin
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_log'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} by {self.admin} at {self.created_at}'


class Report(models.Model):
    """
    Users can submit reports/complaints about listings or other users.
    """

    class ReportType(models.TextChoices):
        LISTING  = 'listing',  'Listing Report'
        USER     = 'user',     'User Report'

    class Status(models.TextChoices):
        OPEN      = 'open',      'Open'
        RESOLVED  = 'resolved',  'Resolved'
        DISMISSED = 'dismissed', 'Dismissed'

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='submitted_reports',
    )
    report_type = models.CharField(max_length=10, choices=ReportType.choices)
    reported_listing_id = models.IntegerField(null=True, blank=True)
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reports_against',
    )
    reason = models.TextField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)
    admin_note = models.TextField(blank=True, null=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='resolved_reports',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']

    def __str__(self):
        return f'Report #{self.id} ({self.report_type}) — {self.status}'
