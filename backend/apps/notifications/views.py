from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    """
    GET /api/v1/notifications/
    Returns all notifications for the authenticated user, newest first.
    Query param: unread=true  — returns only unread notifications.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user)
        if request.query_params.get('unread', '').lower() == 'true':
            qs = qs.filter(is_read=False)
        return Response(NotificationSerializer(qs, many=True).data)


class NotificationMarkReadView(APIView):
    """
    PATCH /api/v1/notifications/<pk>/read/
    Marks a single notification as read.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, recipient=request.user)
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'message': 'Notification marked as read.'})


class NotificationMarkAllReadView(APIView):
    """
    POST /api/v1/notifications/read-all/
    Marks all of the user's notifications as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'message': f'{count} notification(s) marked as read.'})


class NotificationUnreadCountView(APIView):
    """
    GET /api/v1/notifications/unread-count/
    Returns the count of unread notifications — used to drive the badge in the UI.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})
