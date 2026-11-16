from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    listing_title  = serializers.SerializerMethodField()
    buyer_email    = serializers.SerializerMethodField()
    seller_email   = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'reference_number',
            'listing', 'listing_title',
            'buyer', 'buyer_email',
            'seller', 'seller_email',
            'amount', 'currency', 'status',
            'provider_name', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_listing_title(self, obj):
        return obj.listing.title if obj.listing else None

    def get_buyer_email(self, obj):
        return obj.buyer.email if obj.buyer else None

    def get_seller_email(self, obj):
        return obj.seller.email if obj.seller else None
