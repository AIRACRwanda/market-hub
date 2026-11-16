from django.urls import path
from .views import (
    InitiatePaymentView,
    TransactionStatusView,
    BuyerTransactionListView,
    AdminTransactionListView,
)

urlpatterns = [
    path('initiate/',          InitiatePaymentView.as_view(),       name='payment-initiate'),
    path('my/',                BuyerTransactionListView.as_view(),   name='my-transactions'),
    path('admin/',             AdminTransactionListView.as_view(),   name='admin-transactions'),
    path('<str:reference_number>/', TransactionStatusView.as_view(), name='transaction-status'),
]
