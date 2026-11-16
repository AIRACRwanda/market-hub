from django.contrib import admin
from .models import Category, Listing, ListingImage, ListingProof


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ['title', 'seller', 'category', 'listing_type', 'status', 'proof_attempts', 'created_at']
    list_filter = ['status', 'listing_type', 'category']
    search_fields = ['title', 'seller__email', 'location']
    readonly_fields = ['proof_attempts', 'proof_requested_at', 'proof_deadline', 'reviewed_at']


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display = ['listing', 'is_primary', 'uploaded_at']


@admin.register(ListingProof)
class ListingProofAdmin(admin.ModelAdmin):
    list_display = ['listing', 'attempt_number', 'submitted_at']
