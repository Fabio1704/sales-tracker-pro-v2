from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        owner = getattr(obj, 'owner', None)
        if owner is None and hasattr(obj, 'model_profile'):
            owner = getattr(obj.model_profile, 'owner', None)
        return owner == request.user

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

# Ajoutez cette classe si vous en avez besoin
class IsAdminUserOrReadOnly(BasePermission):
    """
    Permission qui permet l'accès en lecture à tous,
    mais restreint l'écriture aux administrateurs uniquement.
    """
    def has_permission(self, request, view):
        # Les méthodes safe (GET, HEAD, OPTIONS) sont autorisées pour tous
        if request.method in SAFE_METHODS:
            return True
        
        # L'écriture n'est autorisée qu'aux administrateurs
        return request.user and request.user.is_staff