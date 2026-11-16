from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Health check
    path('api/v1/', include('apps.core.urls')),

    # API v1
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/listings/', include('apps.listings.urls')),
    path('api/v1/enquiries/', include('apps.enquiries.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/transactions/', include('apps.transactions.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
