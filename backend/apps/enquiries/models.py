from django.db import models
from django.conf import settings


class Enquiry(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'New'
        RESPONDED = 'responded', 'Responded'
        VIEWING_REQUESTED = 'viewing_requested', 'Viewing Requested'
        CLOSED = 'closed', 'Closed'

    listing = models.ForeignKey(
        'listings.Listing', on_delete=models.CASCADE, related_name='enquiries'
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_enquiries'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_enquiries'
    )
    subject = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    viewing_requested = models.BooleanField(default=False)
    viewing_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enquiries'
        verbose_name_plural = 'Enquiries'
        ordering = ['-created_at']

    def __str__(self):
        return f'Enquiry by {self.buyer.email} on {self.listing.title}'


class EnquiryMessage(models.Model):
    enquiry = models.ForeignKey(Enquiry, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enquiry_messages'
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'enquiry_messages'
        ordering = ['created_at']

    def __str__(self):
        return f'Message from {self.sender.email} on enquiry #{self.enquiry.id}'
