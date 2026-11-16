from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.utils import timezone

from .models import User, SellerProfile
from .serializers import (
    BuyerRegisterSerializer,
    SellerRegisterSerializer,
    BuyerUpgradeSerializer,
    UserSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer,
    SellerProfileSerializer,
    UserPreferencesSerializer,
)
from .permissions import IsAdmin, IsAccountOwner


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _token_pair(user):
    """Return a dict with access and refresh JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

class BuyerRegisterView(APIView):
    """POST /api/v1/users/register/buyer/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = BuyerRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        return Response({
            'message': 'Buyer account created successfully.',
            'user': UserSerializer(user).data,
            'tokens': _token_pair(user),
        }, status=status.HTTP_201_CREATED)


class SellerRegisterView(APIView):
    """POST /api/v1/users/register/seller/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SellerRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        return Response({
            'message': 'Seller account created successfully.',
            'user': UserSerializer(user).data,
            'tokens': _token_pair(user),
        }, status=status.HTTP_201_CREATED)


class BuyerUpgradeView(APIView):
    """
    POST /api/v1/users/register/seller/upgrade/
    Upgrades an existing buyer account to seller.
    The buyer identifies themselves with email or phone + password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = BuyerUpgradeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        return Response({
            'message': 'Account upgraded to Seller successfully.',
            'user': UserSerializer(user).data,
            'tokens': _token_pair(user),
        }, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Auth — login / logout / token refresh
# ---------------------------------------------------------------------------

class LoginView(APIView):
    """POST /api/v1/users/auth/login/"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'detail': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user.is_disabled:
            return Response(
                {'detail': 'Your account has been disabled. Please contact support.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_active:
            return Response(
                {'detail': 'This account is inactive.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response({
            'message': 'Login successful.',
            'user': UserSerializer(user).data,
            'tokens': _token_pair(user),
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/v1/users/auth/logout/
    Blacklists the refresh token to invalidate the session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {'detail': 'Token is invalid or already expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Current user profile
# ---------------------------------------------------------------------------

class MeView(APIView):
    """GET /api/v1/users/me/  — returns the authenticated user's profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class MeUpdateView(APIView):
    """PATCH /api/v1/users/me/update/  — update name and phone."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({
            'message': 'Profile updated.',
            'user': UserSerializer(request.user).data,
        })


class PasswordChangeView(APIView):
    """POST /api/v1/users/me/password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({'message': 'Password changed successfully.'})


# ---------------------------------------------------------------------------
# Seller profile
# ---------------------------------------------------------------------------

class SellerProfileView(APIView):
    """GET / PATCH /api/v1/users/me/seller-profile/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'seller':
            return Response(
                {'detail': 'Only seller accounts have a seller profile.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile, _ = SellerProfile.objects.get_or_create(user=request.user)
        return Response(SellerProfileSerializer(profile).data)

    def patch(self, request):
        if request.user.role != 'seller':
            return Response(
                {'detail': 'Only seller accounts have a seller profile.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile, _ = SellerProfile.objects.get_or_create(user=request.user)
        serializer = SellerProfileSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({'message': 'Seller profile updated.', 'profile': serializer.data})


# ---------------------------------------------------------------------------
# AI preferences (stub — ready for Phase 9)
# ---------------------------------------------------------------------------

class UserPreferencesView(APIView):
    """GET / PATCH /api/v1/users/me/preferences/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserPreferencesSerializer(request.user).data)

    def patch(self, request):
        serializer = UserPreferencesSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({'message': 'Preferences saved.', 'preferences': serializer.data})


# ---------------------------------------------------------------------------
# Admin — user management
# ---------------------------------------------------------------------------

class AdminUserListView(APIView):
    """GET /api/v1/users/admin/users/  — list all users (admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        role_filter = request.query_params.get('role')
        qs = User.objects.all().order_by('-created_at')
        if role_filter:
            qs = qs.filter(role=role_filter)
        return Response(UserSerializer(qs, many=True).data)


class AdminUserDetailView(APIView):
    """GET /api/v1/users/admin/users/<pk>/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)


class AdminDisableUserView(APIView):
    """
    POST /api/v1/users/admin/users/<pk>/disable/
    Body: { "reason": "..." }
    Disables a user account. All their listings are hidden by the signal in listings app.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'admin':
            return Response(
                {'detail': 'Admin accounts cannot be disabled through this endpoint.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response(
                {'detail': 'A reason is required when disabling an account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_disabled:
            return Response({'detail': 'Account is already disabled.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_disabled = True
        user.disabled_reason = reason
        user.disabled_at = timezone.now()
        user.save(update_fields=['is_disabled', 'disabled_reason', 'disabled_at'])

        # Hide all listings — handled by the signal in apps/listings/signals.py
        from apps.listings.models import Listing
        Listing.objects.filter(
            seller=user,
            status=Listing.Status.PUBLISHED,
        ).update(status=Listing.Status.HIDDEN)

        from apps.core.audit import log as audit_log
        from apps.core.models import AuditLog
        audit_log(
            admin=request.user,
            action=AuditLog.Action.ACCOUNT_DISABLED,
            target_user=user,
            note=reason,
        )

        from apps.notifications.utils import notify_account_disabled
        notify_account_disabled(user, reason)

        return Response({
            'message': f'Account for {user.email} has been disabled.',
            'user': UserSerializer(user).data,
        })


class AdminEnableUserView(APIView):
    """
    POST /api/v1/users/admin/users/<pk>/enable/
    Re-enables a disabled account. Restores hidden listings to published.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_disabled:
            return Response({'detail': 'Account is not disabled.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_disabled = False
        user.disabled_reason = None
        user.disabled_at = None
        user.save(update_fields=['is_disabled', 'disabled_reason', 'disabled_at'])

        # Restore hidden listings back to published
        from apps.listings.models import Listing
        Listing.objects.filter(
            seller=user,
            status=Listing.Status.HIDDEN,
        ).update(status=Listing.Status.PUBLISHED)

        from apps.core.audit import log as audit_log
        from apps.core.models import AuditLog
        audit_log(
            admin=request.user,
            action=AuditLog.Action.ACCOUNT_ENABLED,
            target_user=user,
        )

        from apps.notifications.utils import notify_account_enabled
        notify_account_enabled(user)

        return Response({
            'message': f'Account for {user.email} has been re-enabled.',
            'user': UserSerializer(user).data,
        })
