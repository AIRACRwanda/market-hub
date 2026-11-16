from django.urls import path
from .views import (
    HealthCheckView,
    AdminStatsView,
    AuditLogListView,
    ReportCreateView,
    AdminReportListView,
    AdminReportDetailView,
    AdminReportResolveView,
    AdminReportDismissView,
)

urlpatterns = [
    # Public
    path('health/',      HealthCheckView.as_view(), name='health-check'),

    # Admin dashboard stats
    path('stats/',       AdminStatsView.as_view(),  name='admin-stats'),

    # Audit log
    path('audit-log/',   AuditLogListView.as_view(), name='audit-log-list'),

    # Reports — any authenticated user can submit
    path('reports/',                          ReportCreateView.as_view(),       name='report-create'),
    path('reports/admin/',                    AdminReportListView.as_view(),     name='admin-report-list'),
    path('reports/admin/<int:pk>/',           AdminReportDetailView.as_view(),   name='admin-report-detail'),
    path('reports/admin/<int:pk>/resolve/',   AdminReportResolveView.as_view(),  name='admin-report-resolve'),
    path('reports/admin/<int:pk>/dismiss/',   AdminReportDismissView.as_view(),  name='admin-report-dismiss'),
]
