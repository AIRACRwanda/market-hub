from django.urls import path
from .views import (
    # Public
    CategoryListView,
    LocationSuggestionsView,
    PublicListingListView,
    PublicListingDetailView,

    # Seller
    SellerListingListView,
    SellerListingDetailView,
    SellerListingStatusView,
    SellerProofSubmitView,
    SellerListingImageUploadView,
    SellerListingImagePrimaryView,

    # Admin
    AdminListingListView,
    AdminListingDetailView,
    AdminListingApproveView,
    AdminListingRejectView,
    AdminRequestProofView,
    AdminListingRemoveView,
)

urlpatterns = [
    # -----------------------------------------------------------------------
    # Public
    # -----------------------------------------------------------------------
    path('', PublicListingListView.as_view(), name='public-listing-list'),
    path('<int:pk>/', PublicListingDetailView.as_view(), name='public-listing-detail'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('locations/', LocationSuggestionsView.as_view(), name='location-suggestions'),

    # -----------------------------------------------------------------------
    # Seller — own listings
    # -----------------------------------------------------------------------
    path('my/', SellerListingListView.as_view(), name='seller-listing-list'),
    path('my/<int:pk>/', SellerListingDetailView.as_view(), name='seller-listing-detail'),
    path('my/<int:pk>/status/', SellerListingStatusView.as_view(), name='seller-listing-status'),
    path('my/<int:pk>/proof/', SellerProofSubmitView.as_view(), name='seller-proof-submit'),
    path('my/<int:pk>/images/', SellerListingImageUploadView.as_view(), name='seller-image-upload'),
    path('my/<int:pk>/images/<int:img_pk>/', SellerListingImageUploadView.as_view(), name='seller-image-delete'),
    path('my/<int:pk>/images/<int:img_pk>/primary/', SellerListingImagePrimaryView.as_view(), name='seller-image-primary'),

    # -----------------------------------------------------------------------
    # Admin — moderation
    # -----------------------------------------------------------------------
    path('admin/', AdminListingListView.as_view(), name='admin-listing-list'),
    path('admin/<int:pk>/', AdminListingDetailView.as_view(), name='admin-listing-detail'),
    path('admin/<int:pk>/approve/', AdminListingApproveView.as_view(), name='admin-listing-approve'),
    path('admin/<int:pk>/reject/', AdminListingRejectView.as_view(), name='admin-listing-reject'),
    path('admin/<int:pk>/request-proof/', AdminRequestProofView.as_view(), name='admin-request-proof'),
    path('admin/<int:pk>/remove/', AdminListingRemoveView.as_view(), name='admin-listing-remove'),
]
