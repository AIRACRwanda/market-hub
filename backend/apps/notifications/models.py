from django.db import models
from django.conf import settings


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        LISTING_APPROVED = 'listing_approved', 'Listing Approved'
        LISTING_REJECTED = 'listing_rejected', 'Listing Rejected'
        PROOF_REQUESTED = 'proof_requested', 'Proof Requested'
        PROOF_REJECTED = 'proof_rejected', 'Proof Rejected'
        LISTING_EXPIRED = 'listing_expired', 'Listing Expired'
        NEW_ENQUIRY = 'new_enquiry', 'New Enquiry'
        ENQUIRY_RESPONSE = 'enquiry_response', 'Enquiry Response'
        ACCOUNT_DISABLED = 'account_disabled', 'Account Disabled'
        ACCOUNT_ENABLED = 'account_enabled', 'Account Enabled'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications'
    )
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_listing_id = models.IntegerField(null=True, blank=True)  # soft link to avoid circular import
    related_enquiry_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.notification_type} → {self.recipient.email}'
