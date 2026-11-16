from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Enquiry, EnquiryMessage
from .serializers import EnquirySerializer, EnquiryCreateSerializer, EnquiryReplySerializer
from apps.users.permissions import IsBuyerOrSeller
from apps.notifications.utils import notify_new_enquiry, notify_enquiry_response


# ---------------------------------------------------------------------------
# Buyer — open enquiries / create
# ---------------------------------------------------------------------------

class BuyerEnquiryListView(APIView):
    """
    GET  /api/v1/enquiries/buyer/   — buyer's own enquiries
    POST /api/v1/enquiries/buyer/   — open a new enquiry on a listing
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Enquiry.objects
            .filter(buyer=request.user)
            .select_related('listing', 'seller')
            .prefetch_related('messages')
            .order_by('-updated_at')
        )
        status_filter = request.query_params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(EnquirySerializer(qs, many=True).data)

    def post(self, request):
        serializer = EnquiryCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        enquiry = serializer.save()
        notify_new_enquiry(enquiry.seller, enquiry)

        return Response(
            EnquirySerializer(enquiry).data,
            status=status.HTTP_201_CREATED,
        )


class BuyerEnquiryDetailView(APIView):
    """
    GET   /api/v1/enquiries/buyer/<pk>/         — full thread
    POST  /api/v1/enquiries/buyer/<pk>/reply/   — buyer sends a message
    POST  /api/v1/enquiries/buyer/<pk>/close/   — buyer closes the enquiry
    POST  /api/v1/enquiries/buyer/<pk>/viewing/ — request a viewing
    """
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        return get_object_or_404(
            Enquiry.objects.select_related('listing', 'buyer', 'seller')
            .prefetch_related('messages__sender'),
            pk=pk,
            buyer=request.user,
        )

    def get(self, request, pk):
        return Response(EnquirySerializer(self._get(request, pk)).data)


class BuyerEnquiryReplyView(APIView):
    """POST /api/v1/enquiries/buyer/<pk>/reply/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        enquiry = get_object_or_404(Enquiry, pk=pk, buyer=request.user)

        if enquiry.status == Enquiry.Status.CLOSED:
            return Response(
                {'detail': 'This enquiry is closed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = EnquiryReplySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        EnquiryMessage.objects.create(
            enquiry=enquiry,
            sender=request.user,
            message=serializer.validated_data['message'],
        )
        enquiry.updated_at  # touch
        enquiry.save(update_fields=['updated_at'])

        return Response({'message': 'Reply sent.'}, status=status.HTTP_201_CREATED)


class BuyerEnquiryCloseView(APIView):
    """POST /api/v1/enquiries/buyer/<pk>/close/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        enquiry = get_object_or_404(Enquiry, pk=pk, buyer=request.user)
        if enquiry.status == Enquiry.Status.CLOSED:
            return Response({'detail': 'Already closed.'}, status=status.HTTP_400_BAD_REQUEST)
        enquiry.status = Enquiry.Status.CLOSED
        enquiry.save(update_fields=['status'])
        return Response({'message': 'Enquiry closed.'})


class BuyerViewingRequestView(APIView):
    """POST /api/v1/enquiries/buyer/<pk>/viewing/   Body: { viewing_date: ISO datetime }"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        enquiry = get_object_or_404(Enquiry, pk=pk, buyer=request.user)

        if enquiry.status == Enquiry.Status.CLOSED:
            return Response(
                {'detail': 'Cannot request a viewing on a closed enquiry.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        viewing_date = request.data.get('viewing_date')
        if not viewing_date:
            return Response(
                {'detail': 'viewing_date is required (ISO 8601 format).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enquiry.viewing_requested = True
        enquiry.viewing_date      = viewing_date
        enquiry.status            = Enquiry.Status.VIEWING_REQUESTED
        enquiry.save(update_fields=['viewing_requested', 'viewing_date', 'status'])

        # Notify seller
        notify_new_enquiry(enquiry.seller, enquiry)

        return Response({'message': 'Viewing request sent to seller.'})


# ---------------------------------------------------------------------------
# Seller — enquiry inbox
# ---------------------------------------------------------------------------

class SellerEnquiryListView(APIView):
    """
    GET /api/v1/enquiries/seller/
    Seller sees all enquiries on their listings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Enquiry.objects
            .filter(seller=request.user)
            .select_related('listing', 'buyer')
            .prefetch_related('messages')
            .order_by('-updated_at')
        )
        status_filter = request.query_params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(EnquirySerializer(qs, many=True).data)


class SellerEnquiryDetailView(APIView):
    """GET /api/v1/enquiries/seller/<pk>/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        enquiry = get_object_or_404(
            Enquiry.objects.select_related('listing', 'buyer', 'seller')
            .prefetch_related('messages__sender'),
            pk=pk,
            seller=request.user,
        )
        return Response(EnquirySerializer(enquiry).data)


class SellerEnquiryReplyView(APIView):
    """POST /api/v1/enquiries/seller/<pk>/reply/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        enquiry = get_object_or_404(Enquiry, pk=pk, seller=request.user)

        if enquiry.status == Enquiry.Status.CLOSED:
            return Response(
                {'detail': 'This enquiry is closed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = EnquiryReplySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        EnquiryMessage.objects.create(
            enquiry=enquiry,
            sender=request.user,
            message=serializer.validated_data['message'],
        )

        # Advance status to 'responded' if still 'new'
        if enquiry.status == Enquiry.Status.NEW:
            enquiry.status = Enquiry.Status.RESPONDED
        enquiry.save(update_fields=['status', 'updated_at'])

        notify_enquiry_response(enquiry.buyer, enquiry)

        return Response({'message': 'Reply sent.'}, status=status.HTTP_201_CREATED)


class SellerEnquiryCloseView(APIView):
    """POST /api/v1/enquiries/seller/<pk>/close/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        enquiry = get_object_or_404(Enquiry, pk=pk, seller=request.user)
        if enquiry.status == Enquiry.Status.CLOSED:
            return Response({'detail': 'Already closed.'}, status=status.HTTP_400_BAD_REQUEST)
        enquiry.status = Enquiry.Status.CLOSED
        enquiry.save(update_fields=['status'])
        return Response({'message': 'Enquiry closed.'})
