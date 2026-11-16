from rest_framework import serializers
from .models import Enquiry, EnquiryMessage


class EnquiryMessageSerializer(serializers.ModelSerializer):
    sender_name  = serializers.CharField(source='sender.full_name', read_only=True)
    sender_role  = serializers.CharField(source='sender.role',      read_only=True)

    class Meta:
        model = EnquiryMessage
        fields = ['id', 'sender', 'sender_name', 'sender_role', 'message', 'created_at']
        read_only_fields = ['id', 'sender', 'sender_name', 'sender_role', 'created_at']


class EnquirySerializer(serializers.ModelSerializer):
    messages          = EnquiryMessageSerializer(many=True, read_only=True)
    buyer_name        = serializers.CharField(source='buyer.full_name',  read_only=True)
    buyer_email       = serializers.EmailField(source='buyer.email',     read_only=True)
    seller_name       = serializers.CharField(source='seller.full_name', read_only=True)
    seller_email      = serializers.EmailField(source='seller.email',    read_only=True)
    listing_title     = serializers.SerializerMethodField()
    listing_location  = serializers.SerializerMethodField()

    class Meta:
        model = Enquiry
        fields = [
            'id', 'listing',
            'listing_title', 'listing_location',
            'buyer', 'buyer_name', 'buyer_email',
            'seller', 'seller_name', 'seller_email',
            'subject', 'status',
            'viewing_requested', 'viewing_date',
            'messages',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'buyer', 'seller', 'status',
            'buyer_name', 'buyer_email',
            'seller_name', 'seller_email',
            'listing_title', 'listing_location',
            'created_at', 'updated_at',
        ]

    def get_listing_title(self, obj):
        return obj.listing.title if obj.listing else None

    def get_listing_location(self, obj):
        return obj.listing.location if obj.listing else None


class EnquiryCreateSerializer(serializers.ModelSerializer):
    """Used by buyer to open a new enquiry on a listing."""
    initial_message = serializers.CharField(write_only=True)

    class Meta:
        model = Enquiry
        fields = ['listing', 'subject', 'initial_message', 'viewing_requested', 'viewing_date']

    def validate_listing(self, listing):
        from apps.listings.models import Listing
        if listing.status != Listing.Status.PUBLISHED:
            raise serializers.ValidationError('You can only send enquiries on published listings.')
        return listing

    def validate(self, data):
        request = self.context['request']
        listing = data['listing']
        # Prevent sellers from enquiring on their own listings
        if listing.seller == request.user:
            raise serializers.ValidationError('You cannot enquire on your own listing.')
        # One open enquiry per buyer per listing
        already = Enquiry.objects.filter(
            listing=listing,
            buyer=request.user,
        ).exclude(status=Enquiry.Status.CLOSED).exists()
        if already:
            raise serializers.ValidationError(
                'You already have an open enquiry on this listing.'
            )
        return data

    def create(self, validated_data):
        initial_message = validated_data.pop('initial_message')
        buyer  = self.context['request'].user
        seller = validated_data['listing'].seller

        enquiry = Enquiry.objects.create(
            buyer=buyer,
            seller=seller,
            **validated_data,
        )
        EnquiryMessage.objects.create(
            enquiry=enquiry,
            sender=buyer,
            message=initial_message,
        )
        return enquiry


class EnquiryReplySerializer(serializers.Serializer):
    """Buyer or seller posts a new message on an existing enquiry."""
    message = serializers.CharField(min_length=1)
