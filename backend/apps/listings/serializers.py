from rest_framework import serializers
from .models import Category, Listing, ListingImage, ListingProof


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']


# ---------------------------------------------------------------------------
# Listing images
# ---------------------------------------------------------------------------

class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ['id', 'image', 'is_primary', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


# ---------------------------------------------------------------------------
# Listing proof
# ---------------------------------------------------------------------------

class ListingProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingProof
        fields = ['id', 'image', 'document', 'seller_note', 'attempt_number', 'submitted_at']
        read_only_fields = ['id', 'attempt_number', 'submitted_at']


# ---------------------------------------------------------------------------
# Listing — full detail (used in retrieve, seller dashboard, admin)
# ---------------------------------------------------------------------------

class ListingDetailSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    proofs = ListingProofSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    seller_email = serializers.EmailField(source='seller.email', read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)

    class Meta:
        model = Listing
        fields = [
            'id', 'seller_email', 'seller_name',
            'title', 'category', 'category_name', 'listing_type',
            'description', 'price', 'location', 'availability', 'features',
            'status', 'proof_attempts', 'proof_requested_at', 'proof_deadline',
            'admin_note', 'rejection_reason',
            'reviewed_by', 'reviewed_at',
            'images', 'proofs',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'seller_email', 'seller_name', 'status',
            'proof_attempts', 'proof_requested_at', 'proof_deadline',
            'admin_note', 'rejection_reason', 'reviewed_by', 'reviewed_at',
            'created_at', 'updated_at',
        ]


# ---------------------------------------------------------------------------
# Listing — public list card (visitors/buyers browsing)
# ---------------------------------------------------------------------------

class ListingCardSerializer(serializers.ModelSerializer):
    """Minimal fields for search/browse results — avoids sending proof data publicly."""
    primary_image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)

    class Meta:
        model = Listing
        fields = [
            'id', 'title', 'category_name', 'listing_type',
            'price', 'location', 'availability', 'features',
            'primary_image', 'seller_name', 'created_at',
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        return None


# ---------------------------------------------------------------------------
# Listing — create / update (seller input)
# ---------------------------------------------------------------------------

class ListingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = [
            'title', 'category', 'listing_type',
            'description', 'price', 'location', 'availability', 'features',
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Price must be greater than zero.')
        return value

    def validate_features(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Features must be a JSON object (key-value pairs).')
        return value
