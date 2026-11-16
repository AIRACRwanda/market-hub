from django.contrib import admin
from .models import Enquiry, EnquiryMessage


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = ['listing', 'buyer', 'seller', 'status', 'viewing_requested', 'created_at']
    list_filter = ['status', 'viewing_requested']


@admin.register(EnquiryMessage)
class EnquiryMessageAdmin(admin.ModelAdmin):
    list_display = ['enquiry', 'sender', 'created_at']
