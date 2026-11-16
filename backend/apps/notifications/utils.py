"""
Notification creation helpers.
Call these from any app to create a dashboard notification for a user.
Every function is intentionally simple — just create and return.
"""
from .models import Notification


def notify_listing_approved(user, listing):
    return Notification.objects.create(
        recipient=user,
        notification_type=Notification.NotificationType.LISTING_APPROVED,
        title='Listing Approved',
        message=f'Your listing "{listing.title}" has been approved and is now live.',
        related_listing_id=listing.id,
    )


def notify_listing_rejected(user, listing, reason=''):
    msg = f'Your listing "{listing.title}" was rejected.'
    if reason:
        msg += f' Reason: {reason}'
    return Notification.objects.create(
        recipient=user,
        notification_type=Notification.NotificationType.LISTING_REJECTED,
        title='Listing Rejected',
        message=msg,
        related_listing_id=listing.id,
    )


def notify_proof_requested(user, listing, admin_message=''):
    msg = f'Proof has been requested for your listing "{listing.title}". You have 3 days to submit.'
    if admin_message:
        msg += f' Admin note: {admin_message}'
    return Notification.objects.create(
        recipient=user,
        notification_type=Notification.NotificationType.PROOF_REQUESTED,
        title='Proof Requested',
        message=msg,
        related_listing_id=listing.id,
    )


def notify_proof_rejected(user, listing, reason=''):
    msg = f'Your proof submission for "{listing.title}" was rejected.'
    if reason:
        msg += f' Reason: {reason}'
    return Notification.objects.create(
        recipient=user,
        notification_type=Notification.NotificationType.PROOF_REJECTED,
        title='Proof Rejected',
        message=msg,
        related_listing_id=listing.id,
    )


def notify_listing_expired(user, listing):
    return Notification.objects.create(
        recipient=user,
        notification_type=Notification.NotificationType.LISTING_EXPIRED,
        title='Listing Expired',
        message=(
            f'Your listing "{listing.title}" has expired because '
            f'proof was not submitted within 3 days.'
        ),
        related_listing_id=listing.id,
    )


def notify_account_disabled(user, reason=''):
    msg = 'Your account has been disabled by an administrator.'
    if reason:
        msg += f' Reason: {reason}'
    return Notification.objects.create(
        recipient=user,
        notification_type=Notification.NotificationType.ACCOUNT_DISABLED,
        title='Account Disabled',
        message=msg,
    )


def notify_account_enabled(user):
    return Notification.objects.create(
        recipient=user,
        notification_type=Notification.NotificationType.ACCOUNT_ENABLED,
        title='Account Re-enabled',
        message='Your account has been re-enabled. Your listings are now visible again.',
    )


def notify_new_enquiry(seller, enquiry):
    return Notification.objects.create(
        recipient=seller,
        notification_type=Notification.NotificationType.NEW_ENQUIRY,
        title='New Enquiry',
        message=(
            f'{enquiry.buyer.full_name} sent an enquiry about '
            f'"{enquiry.listing.title}".'
        ),
        related_listing_id=enquiry.listing.id,
        related_enquiry_id=enquiry.id,
    )


def notify_enquiry_response(buyer, enquiry):
    return Notification.objects.create(
        recipient=buyer,
        notification_type=Notification.NotificationType.ENQUIRY_RESPONSE,
        title='Enquiry Response',
        message=(
            f'{enquiry.seller.full_name} replied to your enquiry about '
            f'"{enquiry.listing.title}".'
        ),
        related_listing_id=enquiry.listing.id,
        related_enquiry_id=enquiry.id,
    )
