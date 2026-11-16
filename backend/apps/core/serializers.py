from rest_framework import serializers
from .models import AuditLog, Report


class AuditLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.EmailField(source='admin.email', read_only=True)
    admin_name  = serializers.CharField(source='admin.full_name', read_only=True)
    target_user_email = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'action',
            'admin_email', 'admin_name',
            'target_user_email',
            'target_listing_id', 'target_listing_title',
            'note', 'created_at',
        ]

    def get_target_user_email(self, obj):
        return obj.target_user.email if obj.target_user else None


class ReportSerializer(serializers.ModelSerializer):
    reporter_email       = serializers.EmailField(source='reporter.email', read_only=True)
    reported_user_email  = serializers.SerializerMethodField()
    resolved_by_email    = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'report_type', 'status',
            'reporter_email',
            'reported_listing_id', 'reported_user_email',
            'reason', 'admin_note',
            'resolved_by_email', 'resolved_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'reporter_email', 'reported_user_email',
            'resolved_by_email', 'resolved_at',
            'created_at', 'updated_at',
        ]

    def get_reported_user_email(self, obj):
        return obj.reported_user.email if obj.reported_user else None

    def get_resolved_by_email(self, obj):
        return obj.resolved_by.email if obj.resolved_by else None


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['report_type', 'reported_listing_id', 'reported_user', 'reason']

    def validate(self, data):
        rtype = data.get('report_type')
        if rtype == Report.ReportType.LISTING and not data.get('reported_listing_id'):
            raise serializers.ValidationError({'reported_listing_id': 'Required for listing reports.'})
        if rtype == Report.ReportType.USER and not data.get('reported_user'):
            raise serializers.ValidationError({'reported_user': 'Required for user reports.'})
        return data
