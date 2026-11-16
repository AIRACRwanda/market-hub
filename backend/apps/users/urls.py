from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Registration
    BuyerRegisterView,
    SellerRegisterView,
    BuyerUpgradeView,

    # Auth
    LoginView,
    LogoutView,

    # Current user
    MeView,
    MeUpdateView,
    PasswordChangeView,
    SellerProfileView,
    UserPreferencesView,

    # Admin
    AdminUserListView,
    AdminUserDetailView,
    AdminDisableUserView,
    AdminEnableUserView,
)

urlpatterns = [
    # -----------------------------------------------------------------------
    # Registration
    # -----------------------------------------------------------------------
    path('register/buyer/', BuyerRegisterView.as_view(), name='register-buyer'),
    path('register/seller/', SellerRegisterView.as_view(), name='register-seller'),
    path('register/seller/upgrade/', BuyerUpgradeView.as_view(), name='buyer-upgrade'),

    # -----------------------------------------------------------------------
    # Authentication
    # -----------------------------------------------------------------------
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # -----------------------------------------------------------------------
    # Current authenticated user
    # -----------------------------------------------------------------------
    path('me/', MeView.as_view(), name='me'),
    path('me/update/', MeUpdateView.as_view(), name='me-update'),
    path('me/password/', PasswordChangeView.as_view(), name='me-password'),
    path('me/seller-profile/', SellerProfileView.as_view(), name='me-seller-profile'),
    path('me/preferences/', UserPreferencesView.as_view(), name='me-preferences'),

    # -----------------------------------------------------------------------
    # Admin — user management
    # -----------------------------------------------------------------------
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:pk>/disable/', AdminDisableUserView.as_view(), name='admin-disable-user'),
    path('admin/users/<int:pk>/enable/', AdminEnableUserView.as_view(), name='admin-enable-user'),
]
