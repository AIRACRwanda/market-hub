from django.db import models
from django.conf import settings
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Listing(models.Model):
    class ListingType(models.TextChoices):
        SALE = 'sale', 'For Sale'
        RENT = 'rent', 'For Rent'

    class Status(models.TextChoices):
        PENDING_REVIEW = 'pending_review', 'Pending Review'
        PROOF_REQUESTED = 'proof_requested', 'Proof Requested'
        UNDER_REVIEW = 'under_review', 'Under Review'
        PUBLISHED = 'published', 'Published'
        REJECTED = 'rejected', 'Rejected'
        PERMANENTLY_REJECTED = 'permanently_rejected', 'Permanently Rejected'
        EXPIRED = 'expired', 'Expired'
        SOLD = 'sold', 'Sold'
        RENTED = 'rented', 'Rented'
        REMOVED = 'removed', 'Removed'
        HIDDEN = 'hidden', 'Hidden'

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='listings',
        limit_choices_to={'role': 'seller'},
    )
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='listings')
    title = models.CharField(max_length=255)
    listing_type = models.CharField(max_length=10, choices=ListingType.choices)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    location = models.CharField(max_length=255)
    availability = models.CharField(max_length=255, blank=True, null=True)
    features = models.JSONField(default=dict, blank=True)   # flexible key-value features
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.PENDING_REVIEW)

    # Approval workflow fields
    proof_attempts = models.PositiveSmallIntegerField(default=0)   # max 3
    proof_requested_at = models.DateTimeField(null=True, blank=True)
    proof_deadline = models.DateTimeField(null=True, blank=True)   # proof_requested_at + 3 days
    admin_note = models.TextField(blank=True, null=True)           # admin message to seller
    rejection_reason = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_listings',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'listings'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.status})'

    def request_proof(self, admin_user, message):
        self.status = self.Status.PROOF_REQUESTED
        self.admin_note = message
        self.proof_requested_at = timezone.now()
        self.proof_deadline = timezone.now() + timezone.timedelta(days=3)
        self.reviewed_by = admin_user
        self.save()

    def submit_proof(self):
        self.proof_attempts += 1
        self.status = self.Status.UNDER_REVIEW
        self.save()

    def approve(self, admin_user):
        self.status = self.Status.PUBLISHED
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.save()

    def reject(self, admin_user, reason):
        self.rejection_reason = reason
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        if self.proof_attempts >= 3:
            self.status = self.Status.PERMANENTLY_REJECTED
        else:
            self.status = self.Status.REJECTED
        self.save()


class ListingImage(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='listings/images/')
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'listing_images'

    def __str__(self):
        return f'Image for {self.listing.title}'


class ListingProof(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='proofs')
    image = models.ImageField(upload_to='listings/proofs/images/')              # required
    document = models.FileField(upload_to='listings/proofs/documents/', blank=True, null=True)  # optional
    seller_note = models.TextField(blank=True, null=True)
    attempt_number = models.PositiveSmallIntegerField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'listing_proofs'

    def __str__(self):
        return f'Proof #{self.attempt_number} for {self.listing.title}'
