from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.db import connection
from django.utils import timezone
from django.shortcuts import get_object_or_404

from apps.users.permissions import IsAdmin
from .models import AuditLog, Report
from .serializers import AuditLogSerializer, ReportSerializer, ReportCreateSerializer


# ---------------------------------------------------------------------------
# Health check (public)
# ---------------------------------------------------------------------------

class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            connection.ensure_connection()
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'

        return Response({
            'status': 'ok',
            'api': 'Market Hub API',
            'version': 'v1',
            'timestamp': timezone.now().isoformat(),
            'database': db_status,
        })


# ---------------------------------------------------------------------------
# Platform statistics (admin only)
# ---------------------------------------------------------------------------

class AdminStatsView(APIView):
    """
    GET /api/v1/stats/
    Returns platform-wide summary counts for the admin dashboard.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.users.models import User
        from apps.listings.models import Listing
        from apps.enquiries.models import Enquiry

        users     = User.objects.all()
        listings  = Listing.objects.all()
        enquiries = Enquiry.objects.all()
        reports   = Report.objects.all()

        return Response({
            'users': {
                'total':    users.count(),
                'buyers':   users.filter(role='buyer').count(),
                'sellers':  users.filter(role='seller').count(),
                'admins':   users.filter(role='admin').count(),
                'disabled': users.filter(is_disabled=True).count(),
            },
            'listings': {
                'total':                listings.count(),
                'pending_review':       listings.filter(status='pending_review').count(),
                'proof_requested':      listings.filter(status='proof_requested').count(),
                'under_review':         listings.filter(status='under_review').count(),
                'published':            listings.filter(status='published').count(),
                'rejected':             listings.filter(status='rejected').count(),
                'permanently_rejected': listings.filter(status='permanently_rejected').count(),
                'expired':              listings.filter(status='expired').count(),
                'sold':                 listings.filter(status='sold').count(),
                'rented':               listings.filter(status='rented').count(),
                'removed':              listings.filter(status='removed').count(),
                'hidden':               listings.filter(status='hidden').count(),
            },
            'enquiries': {
                'total':             enquiries.count(),
                'new':               enquiries.filter(status='new').count(),
                'responded':         enquiries.filter(status='responded').count(),
                'viewing_requested': enquiries.filter(status='viewing_requested').count(),
                'closed':            enquiries.filter(status='closed').count(),
            },
            'reports': {
                'total':     reports.count(),
                'open':      reports.filter(status='open').count(),
                'resolved':  reports.filter(status='resolved').count(),
                'dismissed': reports.filter(status='dismissed').count(),
            },
        })


# ---------------------------------------------------------------------------
# Audit log (admin only)
# ---------------------------------------------------------------------------

class AuditLogListView(APIView):
    """
    GET /api/v1/audit-log/
    Returns audit log entries, newest first.
    Query params:
      action      — filter by action type
      admin_id    — filter by which admin performed the action
      limit       — number of records (default 50, max 200)
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = AuditLog.objects.select_related('admin', 'target_user').order_by('-created_at')

        action = request.query_params.get('action', '').strip()
        if action:
            qs = qs.filter(action=action)

        admin_id = request.query_params.get('admin_id', '').strip()
        if admin_id:
            qs = qs.filter(admin_id=admin_id)

        try:
            limit = min(int(request.query_params.get('limit', 50)), 200)
        except ValueError:
            limit = 50
        qs = qs[:limit]

        return Response(AuditLogSerializer(qs, many=True).data)


# ---------------------------------------------------------------------------
# Reports (submit + admin management)
# ---------------------------------------------------------------------------

class ReportCreateView(APIView):
    """
    POST /api/v1/reports/
    Any authenticated user can submit a report.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReportCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        report = serializer.save(reporter=request.user)
        return Response(
            ReportSerializer(report).data,
            status=status.HTTP_201_CREATED,
        )


class AdminReportListView(APIView):
    """
    GET /api/v1/reports/admin/
    Admin sees all reports.
    Query param: status — open | resolved | dismissed
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = Report.objects.select_related(
            'reporter', 'reported_user', 'resolved_by'
        ).order_by('-created_at')

        status_filter = request.query_params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(ReportSerializer(qs, many=True).data)


class AdminReportDetailView(APIView):
    """
    GET  /api/v1/reports/admin/<pk>/
    POST /api/v1/reports/admin/<pk>/resolve/
    POST /api/v1/reports/admin/<pk>/dismiss/
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        report = get_object_or_404(
            Report.objects.select_related('reporter', 'reported_user', 'resolved_by'),
            pk=pk,
        )
        return Response(ReportSerializer(report).data)


class AdminReportResolveView(APIView):
    """POST /api/v1/reports/admin/<pk>/resolve/   Body: { "admin_note": "..." }"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        from apps.core.audit import log

        report = get_object_or_404(Report, pk=pk)
        if report.status != Report.Status.OPEN:
            return Response(
                {'detail': 'Only open reports can be resolved.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin_note = request.data.get('admin_note', '').strip()
        report.status      = Report.Status.RESOLVED
        report.admin_note  = admin_note or None
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()

        log(
            admin=request.user,
            action=AuditLog.Action.REPORT_RESOLVED,
            note=f'Report #{report.id} resolved. {admin_note}',
        )

        return Response({'message': 'Report resolved.', 'report': ReportSerializer(report).data})


class AdminReportDismissView(APIView):
    """POST /api/v1/reports/admin/<pk>/dismiss/   Body: { "admin_note": "..." }"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        from apps.core.audit import log

        report = get_object_or_404(Report, pk=pk)
        if report.status != Report.Status.OPEN:
            return Response(
                {'detail': 'Only open reports can be dismissed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin_note = request.data.get('admin_note', '').strip()
        report.status      = Report.Status.DISMISSED
        report.admin_note  = admin_note or None
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()

        log(
            admin=request.user,
            action=AuditLog.Action.REPORT_DISMISSED,
            note=f'Report #{report.id} dismissed. {admin_note}',
        )

        return Response({'message': 'Report dismissed.', 'report': ReportSerializer(report).data})
