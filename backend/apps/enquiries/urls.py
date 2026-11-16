from django.urls import path
from .views import (
    # Buyer
    BuyerEnquiryListView,
    BuyerEnquiryDetailView,
    BuyerEnquiryReplyView,
    BuyerEnquiryCloseView,
    BuyerViewingRequestView,

    # Seller
    SellerEnquiryListView,
    SellerEnquiryDetailView,
    SellerEnquiryReplyView,
    SellerEnquiryCloseView,
)

urlpatterns = [
    # -----------------------------------------------------------------------
    # Buyer
    # -----------------------------------------------------------------------
    path('buyer/',                          BuyerEnquiryListView.as_view(),    name='buyer-enquiry-list'),
    path('buyer/<int:pk>/',                 BuyerEnquiryDetailView.as_view(),  name='buyer-enquiry-detail'),
    path('buyer/<int:pk>/reply/',           BuyerEnquiryReplyView.as_view(),   name='buyer-enquiry-reply'),
    path('buyer/<int:pk>/close/',           BuyerEnquiryCloseView.as_view(),   name='buyer-enquiry-close'),
    path('buyer/<int:pk>/viewing/',         BuyerViewingRequestView.as_view(), name='buyer-viewing-request'),

    # -----------------------------------------------------------------------
    # Seller
    # -----------------------------------------------------------------------
    path('seller/',                         SellerEnquiryListView.as_view(),   name='seller-enquiry-list'),
    path('seller/<int:pk>/',                SellerEnquiryDetailView.as_view(), name='seller-enquiry-detail'),
    path('seller/<int:pk>/reply/',          SellerEnquiryReplyView.as_view(),  name='seller-enquiry-reply'),
    path('seller/<int:pk>/close/',          SellerEnquiryCloseView.as_view(),  name='seller-enquiry-close'),
]
