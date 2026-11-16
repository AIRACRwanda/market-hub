from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Category, Listing, ListingImage, ListingProof
from .serializers import (
    CategorySerializer,
    ListingDetailSerializer,
    ListingCardSerializer,
    ListingWriteSerializer,
    ListingImageSerializer,
    ListingProofSerializer,
)
from apps.users.permissions import IsSeller, IsAdmin
from apps.notifications.utils import (
    notify_listing_approved,
    notify_listing_rejected,
    notify_proof_requested,
    notify_proof_rejected,
)
from apps.core.audit import log as audit_log
from apps.core.models import AuditLog


MAX_PROOF_ATTEMPTS = 3


# ---------------------------------------------------------------------------
# Categories (public)
# ---------------------------------------------------------------------------

class CategoryListView(APIView):
    """GET /api/v1/listings/categories/"""
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all().order_by('name')
        return Response(CategorySerializer(categories, many=True).data)


class LocationSuggestionsView(APIView):
    """
    GET /api/v1/listings/locations/?q=nairobi
    Returns up to 10 distinct location strings that contain the query.
    Used to power the location autocomplete in the search UI.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 2:
            return Response([])

        locations = (
            Listing.objects
            .filter(status=Listing.Status.PUBLISHED, location__icontains=q)
            .values_list('location', flat=True)
            .distinct()
            .order_by('location')[:10]
        )
        return Response(list(locations))


# ---------------------------------------------------------------------------
# Public listing browse
# ---------------------------------------------------------------------------

class PublicListingListView(APIView):
    """
    GET /api/v1/listings/
    Returns published listings with search, filter, sort, and pagination.

    Query params:
      q             — keyword search (title, description, location)
      category      — category slug
      listing_type  — sale | rent
      location      — partial match
      price_min     — decimal
      price_max     — decimal
      ordering      — price | -price | created_at | -created_at  (default: -created_at)
      page          — page number (default: 1)
      page_size     — results per page (default: 12, max: 48)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from django.db.models import Q

        qs = Listing.objects.filter(status=Listing.Status.PUBLISHED).select_related(
            'category', 'seller'
        ).prefetch_related('images')

        # keyword search
        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(description__icontains=q) |
                Q(location__icontains=q)
            )

        # filters
        category_slug = request.query_params.get('category', '').strip()
        if category_slug:
            qs = qs.filter(category__slug=category_slug)

        listing_type = request.query_params.get('listing_type', '').strip()
        if listing_type in ('sale', 'rent'):
            qs = qs.filter(listing_type=listing_type)

        location = request.query_params.get('location', '').strip()
        if location:
            qs = qs.filter(location__icontains=location)

        price_min = request.query_params.get('price_min', '').strip()
        if price_min:
            try:
                qs = qs.filter(price__gte=float(price_min))
            except ValueError:
                pass

        price_max = request.query_params.get('price_max', '').strip()
        if price_max:
            try:
                qs = qs.filter(price__lte=float(price_max))
            except ValueError:
                pass

        # ordering
        ordering = request.query_params.get('ordering', '-created_at')
        allowed_orderings = ('price', '-price', 'created_at', '-created_at')
        if ordering not in allowed_orderings:
            ordering = '-created_at'
        qs = qs.order_by(ordering)

        # total count before pagination (for the UI result counter)
        total = qs.count()

        # pagination
        try:
            page = max(1, int(request.query_params.get('page', 1)))
        except ValueError:
            page = 1
        try:
            page_size = min(max(1, int(request.query_params.get('page_size', 12))), 48)
        except ValueError:
            page_size = 12

        offset = (page - 1) * page_size
        qs = qs[offset: offset + page_size]

        import math
        return Response({
            'count':       total,
            'total_pages': math.ceil(total / page_size) if total else 1,
            'page':        page,
            'page_size':   page_size,
            'results':     ListingCardSerializer(qs, many=True, context={'request': request}).data,
        })


class PublicListingDetailView(APIView):
    """GET /api/v1/listings/<pk>/  — anyone can view a published listing."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        listing = get_object_or_404(
            Listing.objects.select_related('category', 'seller').prefetch_related('images'),
            pk=pk,
            status=Listing.Status.PUBLISHED,
        )
        return Response(ListingDetailSerializer(listing, context={'request': request}).data)


# ---------------------------------------------------------------------------
# Seller — listing management
# ---------------------------------------------------------------------------

class SellerListingListView(APIView):
    """
    GET  /api/v1/listings/my/   — seller's own listings
    POST /api/v1/listings/my/   — create a new listing
    """
    permission_classes = [IsAuthenticated, IsSeller]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Listing.objects.filter(seller=request.user).select_related(
            'category'
        ).prefetch_related('images').order_by('-created_at')

        status_filter = request.query_params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(ListingDetailSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = ListingWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        listing = serializer.save(seller=request.user, status=Listing.Status.PENDING_REVIEW)

        # Handle image uploads — at least one image is required
        images = request.FILES.getlist('images')
        if not images:
            listing.delete()
            return Response(
                {'images': 'At least one listing image is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for index, img_file in enumerate(images):
            ListingImage.objects.create(
                listing=listing,
                image=img_file,
                is_primary=(index == 0),
            )

        return Response(
            ListingDetailSerializer(listing, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class SellerListingDetailView(APIView):
    """
    GET    /api/v1/listings/my/<pk>/   — view own listing detail
    PATCH  /api/v1/listings/my/<pk>/   — edit listing (only when editable)
    DELETE /api/v1/listings/my/<pk>/   — remove listing
    """
    permission_classes = [IsAuthenticated, IsSeller]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_own_listing(self, request, pk):
        return get_object_or_404(Listing, pk=pk, seller=request.user)

    def get(self, request, pk):
        listing = self._get_own_listing(request, pk)
        return Response(ListingDetailSerializer(listing, context={'request': request}).data)

    def patch(self, request, pk):
        listing = self._get_own_listing(request, pk)

        # Only allow editing when the listing is not locked in an active review state
        locked_statuses = (
            Listing.Status.PUBLISHED,
            Listing.Status.UNDER_REVIEW,
            Listing.Status.PERMANENTLY_REJECTED,
        )
        if listing.status in locked_statuses:
            return Response(
                {'detail': f'Listings with status "{listing.status}" cannot be edited.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ListingWriteSerializer(listing, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        return Response(
            ListingDetailSerializer(listing, context={'request': request}).data
        )

    def delete(self, request, pk):
        listing = self._get_own_listing(request, pk)
        listing.status = Listing.Status.REMOVED
        listing.save(update_fields=['status'])
        return Response({'message': 'Listing removed.'}, status=status.HTTP_200_OK)


class SellerListingStatusView(APIView):
    """
    POST /api/v1/listings/my/<pk>/status/
    Seller can pause, mark sold/rented, or resubmit a rejected listing.
    Body: { "action": "pause" | "resubmit" | "sold" | "rented" }
    """
    permission_classes = [IsAuthenticated, IsSeller]

    def post(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk, seller=request.user)
        action = request.data.get('action', '').strip()

        if action == 'pause':
            if listing.status != Listing.Status.PUBLISHED:
                return Response(
                    {'detail': 'Only published listings can be paused.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            listing.status = Listing.Status.HIDDEN
            listing.save(update_fields=['status'])
            return Response({'message': 'Listing paused (hidden from public).', 'status': listing.status})

        if action == 'resubmit':
            if listing.status not in (Listing.Status.REJECTED,):
                return Response(
                    {'detail': 'Only rejected listings can be resubmitted.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if listing.proof_attempts >= MAX_PROOF_ATTEMPTS:
                return Response(
                    {'detail': 'Maximum submission attempts reached. This listing cannot be resubmitted.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            listing.status = Listing.Status.PENDING_REVIEW
            listing.rejection_reason = None
            listing.save(update_fields=['status', 'rejection_reason'])
            return Response({'message': 'Listing resubmitted for review.', 'status': listing.status})

        if action == 'sold':
            if listing.status != Listing.Status.PUBLISHED:
                return Response(
                    {'detail': 'Only published listings can be marked as sold.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            listing.status = Listing.Status.SOLD
            listing.save(update_fields=['status'])
            return Response({'message': 'Listing marked as sold.', 'status': listing.status})

        if action == 'rented':
            if listing.status != Listing.Status.PUBLISHED:
                return Response(
                    {'detail': 'Only published listings can be marked as rented.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            listing.status = Listing.Status.RENTED
            listing.save(update_fields=['status'])
            return Response({'message': 'Listing marked as rented.', 'status': listing.status})

        return Response(
            {'detail': 'Invalid action. Valid actions: pause, resubmit, sold, rented.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


class SellerProofSubmitView(APIView):
    """
    POST /api/v1/listings/my/<pk>/proof/
    Seller submits proof images and optional document after admin requests it.
    At least one image is required. Max 3 total attempts across the listing's lifetime.
    """
    permission_classes = [IsAuthenticated, IsSeller]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk, seller=request.user)

        if listing.status != Listing.Status.PROOF_REQUESTED:
            return Response(
                {'detail': 'Proof can only be submitted when status is "proof_requested".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if listing.proof_attempts >= MAX_PROOF_ATTEMPTS:
            return Response(
                {'detail': 'Maximum proof submission attempts (3) reached.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check deadline
        if listing.proof_deadline and timezone.now() > listing.proof_deadline:
            listing.status = Listing.Status.EXPIRED
            listing.save(update_fields=['status'])
            return Response(
                {'detail': 'The 3-day proof submission deadline has passed. Listing is now expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        image = request.FILES.get('image')
        if not image:
            return Response(
                {'image': 'At least one proof image is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        document = request.FILES.get('document')
        seller_note = request.data.get('seller_note', '').strip() or None

        # Advance attempt counter and status
        listing.proof_attempts += 1
        listing.status = Listing.Status.UNDER_REVIEW
        listing.save(update_fields=['proof_attempts', 'status'])

        ListingProof.objects.create(
            listing=listing,
            image=image,
            document=document,
            seller_note=seller_note,
            attempt_number=listing.proof_attempts,
        )

        return Response({
            'message': 'Proof submitted. Admin will review it shortly.',
            'attempt_number': listing.proof_attempts,
            'attempts_remaining': MAX_PROOF_ATTEMPTS - listing.proof_attempts,
            'status': listing.status,
        }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Seller — image management
# ---------------------------------------------------------------------------

class SellerListingImageUploadView(APIView):
    """
    POST   /api/v1/listings/my/<pk>/images/        — add more images
    DELETE /api/v1/listings/my/<pk>/images/<img_pk>/ — remove an image
    PATCH  /api/v1/listings/my/<pk>/images/<img_pk>/primary/ — set as primary
    """
    permission_classes = [IsAuthenticated, IsSeller]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk, seller=request.user)
        images = request.FILES.getlist('images')
        if not images:
            return Response({'images': 'No images provided.'}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for img_file in images:
            has_primary = listing.images.filter(is_primary=True).exists()
            obj = ListingImage.objects.create(
                listing=listing,
                image=img_file,
                is_primary=not has_primary,
            )
            created.append(ListingImageSerializer(obj, context={'request': request}).data)

        return Response({'uploaded': created}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk, img_pk):
        listing = get_object_or_404(Listing, pk=pk, seller=request.user)
        image = get_object_or_404(ListingImage, pk=img_pk, listing=listing)

        # Must keep at least one image
        if listing.images.count() <= 1:
            return Response(
                {'detail': 'A listing must have at least one image.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        was_primary = image.is_primary
        image.delete()

        # Promote the first remaining image to primary if the deleted one was primary
        if was_primary:
            first = listing.images.first()
            if first:
                first.is_primary = True
                first.save(update_fields=['is_primary'])

        return Response({'message': 'Image removed.'}, status=status.HTTP_200_OK)


class SellerListingImagePrimaryView(APIView):
    """PATCH /api/v1/listings/my/<pk>/images/<img_pk>/primary/"""
    permission_classes = [IsAuthenticated, IsSeller]

    def patch(self, request, pk, img_pk):
        listing = get_object_or_404(Listing, pk=pk, seller=request.user)
        image = get_object_or_404(ListingImage, pk=img_pk, listing=listing)

        # Clear existing primary then set this one
        listing.images.update(is_primary=False)
        image.is_primary = True
        image.save(update_fields=['is_primary'])

        return Response({'message': 'Primary image updated.'})


# ---------------------------------------------------------------------------
# Admin — listing moderation
# ---------------------------------------------------------------------------

class AdminListingListView(APIView):
    """
    GET /api/v1/listings/admin/
    Admin sees all listings. Filter by status.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = Listing.objects.all().select_related(
            'category', 'seller'
        ).prefetch_related('images', 'proofs').order_by('-created_at')

        status_filter = request.query_params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(
            ListingDetailSerializer(qs, many=True, context={'request': request}).data
        )


class AdminListingDetailView(APIView):
    """GET /api/v1/listings/admin/<pk>/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        listing = get_object_or_404(
            Listing.objects.select_related('category', 'seller').prefetch_related('images', 'proofs'),
            pk=pk,
        )
        return Response(ListingDetailSerializer(listing, context={'request': request}).data)


class AdminListingApproveView(APIView):
    """
    POST /api/v1/listings/admin/<pk>/approve/
    Approves a listing. Valid from: pending_review or under_review.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk)

        approvable = (Listing.Status.PENDING_REVIEW, Listing.Status.UNDER_REVIEW)
        if listing.status not in approvable:
            return Response(
                {'detail': f'Cannot approve a listing with status "{listing.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        listing.approve(admin_user=request.user)
        notify_listing_approved(listing.seller, listing)
        audit_log(
            admin=request.user,
            action=AuditLog.Action.LISTING_APPROVED,
            listing=listing,
            target_user=listing.seller,
        )

        return Response({
            'message': f'Listing "{listing.title}" approved and published.',
            'status': listing.status,
        })


class AdminListingRejectView(APIView):
    """
    POST /api/v1/listings/admin/<pk>/reject/
    Body: { "reason": "..." }
    Rejects a listing. If proof_attempts >= 3, marks permanently rejected.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk)

        rejectable = (Listing.Status.PENDING_REVIEW, Listing.Status.UNDER_REVIEW)
        if listing.status not in rejectable:
            return Response(
                {'detail': f'Cannot reject a listing with status "{listing.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response(
                {'detail': 'A rejection reason is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        listing.reject(admin_user=request.user, reason=reason)
        notify_listing_rejected(listing.seller, listing, reason)
        audit_log(
            admin=request.user,
            action=AuditLog.Action.LISTING_REJECTED,
            listing=listing,
            target_user=listing.seller,
            note=reason,
        )

        return Response({
            'message': f'Listing "{listing.title}" rejected.',
            'status': listing.status,
            'attempts_used': listing.proof_attempts,
            'permanently_rejected': listing.status == Listing.Status.PERMANENTLY_REJECTED,
        })


class AdminRequestProofView(APIView):
    """
    POST /api/v1/listings/admin/<pk>/request-proof/
    Body: { "message": "What we need..." }
    Requests proof from the seller. Sets a 3-day deadline.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk)

        requestable = (Listing.Status.PENDING_REVIEW, Listing.Status.UNDER_REVIEW)
        if listing.status not in requestable:
            return Response(
                {'detail': f'Cannot request proof for a listing with status "{listing.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if listing.proof_attempts >= MAX_PROOF_ATTEMPTS:
            return Response(
                {'detail': 'This listing has exhausted all proof submission attempts.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = request.data.get('message', '').strip()
        if not message:
            return Response(
                {'detail': 'A proof request message is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        listing.request_proof(admin_user=request.user, message=message)
        notify_proof_requested(listing.seller, listing, message)
        audit_log(
            admin=request.user,
            action=AuditLog.Action.PROOF_REQUESTED,
            listing=listing,
            target_user=listing.seller,
            note=message,
        )

        return Response({
            'message': f'Proof requested from seller for "{listing.title}".',
            'proof_deadline': listing.proof_deadline,
            'status': listing.status,
        })


class AdminListingRemoveView(APIView):
    """
    POST /api/v1/listings/admin/<pk>/remove/
    Admin removes a published listing that violates platform rules.
    Body: { "reason": "..." }
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk)

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response(
                {'detail': 'A reason is required when removing a listing.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        listing.rejection_reason = reason
        listing.status = Listing.Status.REMOVED
        listing.reviewed_by = request.user
        listing.reviewed_at = timezone.now()
        listing.save(update_fields=['rejection_reason', 'status', 'reviewed_by', 'reviewed_at'])

        audit_log(
            admin=request.user,
            action=AuditLog.Action.LISTING_REMOVED,
            listing=listing,
            target_user=listing.seller,
            note=reason,
        )

        return Response({'message': f'Listing "{listing.title}" removed.', 'status': listing.status})
