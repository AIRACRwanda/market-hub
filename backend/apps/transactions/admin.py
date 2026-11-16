from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['reference_number', 'listing', 'buyer', 'seller', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'currency', 'provider_name']
    search_fields = ['reference_number', 'buyer__email', 'seller__email']
    readonly_fields = ['provider_response', 'created_at', 'updated_at']
