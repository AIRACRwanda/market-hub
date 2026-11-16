from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, SellerProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'role', 'is_active', 'is_disabled', 'created_at']
    list_filter = ['role', 'is_active', 'is_disabled']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Role & Status', {'fields': ('role', 'is_active', 'is_disabled', 'disabled_reason', 'disabled_at')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('AI Preferences', {'fields': (
            'pref_budget_min', 'pref_budget_max', 'pref_location',
            'pref_category', 'pref_intended_use', 'pref_amenities',
        )}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'business_name', 'id_verified', 'created_at']
    list_filter = ['id_verified']
