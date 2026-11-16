from rest_framework.permissions import BasePermission


class IsBuyer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'buyer'


class IsSeller(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'seller'


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsBuyerOrSeller(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('buyer', 'seller')


class IsSellerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('seller', 'admin')


class IsAccountOwner(BasePermission):
    """Allow access only to the account owner or an admin."""
    def has_object_permission(self, request, view, obj):
        return obj == request.user or request.user.role == 'admin'
