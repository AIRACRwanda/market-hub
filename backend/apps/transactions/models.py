from django.db import models
from django.conf import settings


class Transaction(models.Model):
    """
    Payment placeholder model — fully structured for real provider integration in Phase 13.
    The payment button is visible in the UI but no provider is connected yet.
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCESSFUL = 'successful', 'Successful'
        FAILED = 'failed', 'Failed'
        CANCELLED = 'cancelled', 'Cancelled'
        REFUNDED = 'refunded', 'Refunded'

    listing = models.ForeignKey(
        'listings.Listing', on_delete=models.SET_NULL, null=True, related_name='transactions'
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='purchases'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sales'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)

    # Provider fields (stubbed — populated when real provider is integrated)
    provider_name = models.CharField(max_length=50, blank=True, null=True)   # e.g. 'stripe'
    provider_reference = models.CharField(max_length=255, blank=True, null=True)
    provider_response = models.JSONField(default=dict, blank=True)           # raw provider payload

    reference_number = models.CharField(max_length=100, unique=True, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f'Transaction {self.reference_number} — {self.status}'
