from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import ContactMessage
from rest_framework import serializers

class ContactMessageSerializer(serializers.ModelSerializer):
    is_recent = serializers.ReadOnlyField()
    timestamp = serializers.SerializerMethodField()
    
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at', 'timestamp', 'read', 'is_recent']
        read_only_fields = ['id', 'created_at']
    
    def get_timestamp(self, obj):
        """Retourner created_at au format ISO pour éviter Invalid Date"""
        return obj.created_at.isoformat() if obj.created_at else None

class ContactMessageCreateView(generics.CreateAPIView):
    """Créer un nouveau message de contact (public)"""
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        serializer.save()

class ContactMessageListView(generics.ListAPIView):
    """Lister tous les messages de contact (admin seulement)"""
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Seuls les superusers peuvent voir les messages
        if not self.request.user.is_superuser:
            return ContactMessage.objects.none()
        return ContactMessage.objects.all()

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_message_as_read(request, message_id):
    """Marquer un message comme lu (admin seulement)"""
    if not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        message = ContactMessage.objects.get(id=message_id)
        message.read = True
        message.save()
        serializer = ContactMessageSerializer(message)
        return Response(serializer.data)
    except ContactMessage.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    """Supprimer définitivement un message (admin seulement)"""
    if not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        message = ContactMessage.objects.get(id=message_id)
        message.delete()
        return Response({'message': 'Message supprimé avec succès'}, status=status.HTTP_204_NO_CONTENT)
    except ContactMessage.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_messages_count(request):
    """Compter les messages non lus (admin seulement)"""
    if not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    count = ContactMessage.objects.filter(read=False).count()
    return Response({'unread_count': count})
