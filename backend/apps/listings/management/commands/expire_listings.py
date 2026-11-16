"""
Management command: expire_listings

Finds all listings in proof_requested status whose proof_deadline has passed
and marks them as expired. Sends a dashboard notification to the seller.

Run manually:   python manage.py expire_listings
Schedule it:    cron / Windows Task Scheduler / APScheduler — run every hour.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.listings.models import Listing
from apps.notifications.utils import notify_listing_expired


class Command(BaseCommand):
    help = 'Expire listings whose proof submission deadline has passed.'

    def handle(self, *args, **options):
        now = timezone.now()
        overdue = Listing.objects.filter(
            status=Listing.Status.PROOF_REQUESTED,
            proof_deadline__lt=now,
        )

        count = 0
        for listing in overdue:
            listing.status = Listing.Status.EXPIRED
            listing.save(update_fields=['status'])
            notify_listing_expired(listing.seller, listing)
            count += 1
            self.stdout.write(f'  Expired: [{listing.id}] {listing.title}')

        self.stdout.write(self.style.SUCCESS(f'Done. {count} listing(s) expired.'))
