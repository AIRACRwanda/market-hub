from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, SellerProfile


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ['id', 'business_name', 'bio', 'profile_image', 'id_verified', 'created_at']
        read_only_fields = ['id', 'id_verified', 'created_at']


# ---------------------------------------------------------------------------
# Read serializer — used in responses
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    seller_profile = SellerProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'is_disabled', 'created_at', 'seller_profile',
        ]
        read_only_fields = ['id', 'role', 'is_active', 'is_disabled', 'created_at']


# ---------------------------------------------------------------------------
# Registration — Buyer
# ---------------------------------------------------------------------------

class BuyerRegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate_phone(self, value):
        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError('An account with this phone number already exists.')
        return value or None

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        try:
            validate_password(data['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        phone = validated_data.pop('phone', None)
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=phone,
            role=User.Role.BUYER,
        )
        return user


# ---------------------------------------------------------------------------
# Registration — Seller (fresh account)
# ---------------------------------------------------------------------------

class SellerRegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    business_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate_phone(self, value):
        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError('An account with this phone number already exists.')
        return value or None

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        try:
            validate_password(data['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        phone = validated_data.pop('phone', None)
        business_name = validated_data.pop('business_name', '')
        bio = validated_data.pop('bio', '')

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=phone,
            role=User.Role.SELLER,
        )
        SellerProfile.objects.create(
            user=user,
            business_name=business_name or None,
            bio=bio or None,
        )
        return user


# ---------------------------------------------------------------------------
# Upgrade — Buyer → Seller
# ---------------------------------------------------------------------------

class BuyerUpgradeSerializer(serializers.Serializer):
    """
    Looks up an existing buyer account by email or phone and upgrades it to Seller.
    Used when a registering seller already has a buyer account.
    """
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    business_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        phone = data.get('phone', '').strip()

        if not email and not phone:
            raise serializers.ValidationError('Provide either email or phone to find your account.')

        user = None
        if email:
            user = User.objects.filter(email__iexact=email).first()
        if not user and phone:
            user = User.objects.filter(phone=phone).first()

        if not user:
            raise serializers.ValidationError('No account found with those details.')

        if not user.check_password(data['password']):
            raise serializers.ValidationError({'password': 'Incorrect password.'})

        if user.role == User.Role.SELLER:
            raise serializers.ValidationError('This account is already a seller account.')

        if user.role == User.Role.ADMIN:
            raise serializers.ValidationError('Admin accounts cannot be upgraded.')

        if user.is_disabled:
            raise serializers.ValidationError('This account is disabled. Contact support.')

        data['_user'] = user
        return data

    def save(self):
        user = self.validated_data['_user']
        business_name = self.validated_data.get('business_name', '') or None
        bio = self.validated_data.get('bio', '') or None

        user.role = User.Role.SELLER
        user.save(update_fields=['role'])

        SellerProfile.objects.get_or_create(
            user=user,
            defaults={'business_name': business_name, 'bio': bio},
        )
        return user


# ---------------------------------------------------------------------------
# Profile update
# ---------------------------------------------------------------------------

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone']

    def validate_phone(self, value):
        if value:
            qs = User.objects.filter(phone=value).exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError('This phone number is already in use.')
        return value or None


# ---------------------------------------------------------------------------
# Password change (authenticated)
# ---------------------------------------------------------------------------

class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = self.context['request'].user
        if not user.check_password(data['current_password']):
            raise serializers.ValidationError({'current_password': 'Current password is incorrect.'})
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError({'confirm_new_password': 'Passwords do not match.'})
        try:
            validate_password(data['new_password'], user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})
        return data

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


# ---------------------------------------------------------------------------
# AI preferences update
# ---------------------------------------------------------------------------

class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'pref_budget_min', 'pref_budget_max', 'pref_location',
            'pref_category', 'pref_intended_use', 'pref_amenities',
        ]
