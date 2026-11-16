import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from .models import Transaction
from .serializers import TransactionSerializer
from apps.users.permissions import IsAdmin


# ---------------------------------------------------------------------------
# Payment initiation — PLACEHOLDER
# ---------------------------------------------------------------------------

class InitiatePaymentView(APIView):
    """
    POST /api/v1/transactions/initiate/
    Body: { "listing": <id>, "currency": "USD" }

    Placeholder — creates a pending transaction record.
    No real payment provider is connected yet (Phase 13).
    Returns a stub response that the frontend uses to show the payment UI.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.listings.models import Listing

        listing_id = request.data.get('listing')
        currency   = request.data.get('currency', 'USD').upper()

        if not listing_id:
            return Response({'detail': 'listing is required.'}, status=status.HTTP_400_BAD_REQUEST)

        listing = get_object_or_404(Listing, pk=listing_id, status=Listing.Status.PUBLISHED)

        # Prevent sellers from paying for their own listing
        if listing.seller == request.user:
            return Response(
                {'detail': 'You cannot initiate a payment on your own listing.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for an existing pending transaction
        existing = Transaction.objects.filter(
            listing=listing,
            buyer=request.user,
            status=Transaction.Status.PENDING,
        ).first()

        if existing:
            return Response({
                'message': 'You already have a pending transaction for this listing.',
                'transaction': TransactionSerializer(existing).data,
                'payment_stub': _stub_payload(existing),
            })

        # Create new pending transaction
        ref = f'MH-{uuid.uuid4().hex[:10].upper()}'
        transaction = Transaction.objects.create(
            listing=listing,
            buyer=request.user,
            seller=listing.seller,
            amount=listing.price,
            currency=currency,
            status=Transaction.Status.PENDING,
            reference_number=ref,
            provider_name='placeholder',
        )

        return Response({
            'message': 'Payment initiated (placeholder — no real provider connected).',
            'transaction': TransactionSerializer(transaction).data,
            'payment_stub': _stub_payload(transaction),
        }, status=status.HTTP_201_CREATED)


def _stub_payload(transaction):
    """
    Returns a stub payload that mimics what a real provider (e.g. Stripe)
    would return. The frontend renders a UI from this.
    Phase 13 replaces this with a real provider checkout URL / client secret.
    """
    return {
        'reference_number':  transaction.reference_number,
        'amount':            str(transaction.amount),
        'currency':          transaction.currency,
        'status':            transaction.status,
        'checkout_url':      None,          # Phase 13: real provider URL
        'client_secret':     None,          # Phase 13: Stripe client secret
        'provider':          'placeholder', # Phase 13: 'stripe' | 'paypal' etc.
        'note':              'Full payment integration comes in Phase 13. This is a placeholder.',
    }


# ---------------------------------------------------------------------------
# Transaction status check
# ---------------------------------------------------------------------------

class TransactionStatusView(APIView):
    """
    GET /api/v1/transactions/<reference_number>/
    Returns the current status of a transaction.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, reference_number):
        transaction = get_object_or_404(
            Transaction,
            reference_number=reference_number,
        )
        # Only buyer, seller, or admin can see it
        if request.user not in [transaction.buyer, transaction.seller] and request.user.role != 'admin':
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(TransactionSerializer(transaction).data)


# ---------------------------------------------------------------------------
# Buyer — my transactions
# ---------------------------------------------------------------------------

class BuyerTransactionListView(APIView):
    """GET /api/v1/transactions/my/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Transaction.objects.filter(buyer=request.user).select_related(
            'listing', 'seller'
        ).order_by('-created_at')
        return Response(TransactionSerializer(qs, many=True).data)


# ---------------------------------------------------------------------------
# Admin — all transactions
# ---------------------------------------------------------------------------

class AdminTransactionListView(APIView):
    """GET /api/v1/transactions/admin/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = Transaction.objects.all().select_related(
            'listing', 'buyer', 'seller'
        ).order_by('-created_at')

        status_filter = request.query_params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(TransactionSerializer(qs, many=True).data)
