from rest_framework import viewsets, status, generics, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.http import HttpResponse
from datetime import datetime
from .models import ModelProfile, DailySale
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import (
    ModelProfileSerializer, ModelProfileCreateSerializer, 
    DailySaleSerializer, StatsSerializer, UserSerializer, UserWithStatsSerializer
)
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io
import logging
import traceback
import os

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Retourne l'utilisateur actuellement connecté"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing users (admin only).
    """
    serializer_class = UserWithStatsSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        # L'admin voit son propre compte ET les utilisateurs qu'il a créés
        if self.request.user.is_superuser:
            return User.objects.all().order_by('-date_joined')
        else:
            from accounts.models import UserProfile
            from django.db.models import Q
            user_profiles_created = UserProfile.objects.filter(created_by=self.request.user).values_list('user_id', flat=True)
            return User.objects.filter(Q(id=self.request.user.id) | Q(id__in=user_profiles_created)).order_by('-date_joined')

    def get_serializer_class(self):
        if self.action == 'list':
            return UserWithStatsSerializer
        return UserWithStatsSerializer

    def perform_create(self, serializer):
        # Hash du mot de passe avant sauvegarde
        user = serializer.save()
        user.set_password(serializer.validated_data['password'])
        user.save()
        
        # Assigner l'admin actuel comme créateur du profil utilisateur
        if hasattr(user, 'profile'):
            user.profile.created_by = self.request.user
            user.profile.save()
    
    def destroy(self, request, *args, **kwargs):
        """Seuls les superusers peuvent supprimer des administrateurs"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Seuls les superutilisateurs peuvent supprimer des administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

class AdminModelProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for admin to view models of users they created.
    """
    serializer_class = ModelProfileSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        # Superuser voit tout, admin voit ses modèles + ceux des utilisateurs qu'il a créés
        if self.request.user.is_superuser:
            return ModelProfile.objects.all().order_by('-created_at')
        else:
            # Admin voit ses propres modèles + ceux des utilisateurs qu'il a créés
            from accounts.models import UserProfile
            created_users = UserProfile.objects.filter(created_by=self.request.user).values_list('user', flat=True)
            return ModelProfile.objects.filter(
                Q(owner=self.request.user) | 
                Q(owner__in=created_users)
            ).order_by('-created_at')

class AdminDailySaleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for admin to view sales of users they created.
    """
    serializer_class = DailySaleSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        model_profile_id = self.request.query_params.get('model_profile')
        
        # Admin voit ses propres ventes + celles des utilisateurs qu'il a créés
        if self.request.user.is_superuser:
            queryset = DailySale.objects.all()
        else:
            from accounts.models import UserProfile
            created_users = UserProfile.objects.filter(created_by=self.request.user).values_list('user', flat=True)
            queryset = DailySale.objects.filter(
                Q(model_profile__owner=self.request.user) | 
                Q(model_profile__owner__in=created_users)
            )
        
        if model_profile_id:
            queryset = queryset.filter(model_profile=model_profile_id)
            
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get overall statistics for admin's models and models of users they created
        """
        # Admin voit ses propres statistiques + celles des utilisateurs qu'il a créés
        if request.user.is_superuser:
            models_queryset = ModelProfile.objects.all()
            sales_queryset = DailySale.objects.all()
        else:
            from accounts.models import UserProfile
            created_users = UserProfile.objects.filter(created_by=request.user).values_list('user', flat=True)
            models_queryset = ModelProfile.objects.filter(
                Q(owner=request.user) | 
                Q(owner__in=created_users)
            )
            sales_queryset = DailySale.objects.filter(
                Q(model_profile__owner=request.user) | 
                Q(model_profile__owner__in=created_users)
            )
        
        total_models = models_queryset.count()
        total_sales = sales_queryset.count()
        total_revenue = sales_queryset.aggregate(total=Sum('amount_usd'))['total'] or 0
        
        # Stats par modèle (seulement les modèles de l'admin)
        models_stats = models_queryset.annotate(
            total_sales=Count('daily_sales'),
            total_revenue=Sum('daily_sales__amount_usd')
        ).values('id', 'first_name', 'last_name', 'total_sales', 'total_revenue')
        
        return Response({
            'total_models': total_models,
            'total_sales': total_sales,
            'total_revenue': total_revenue,
            'models_stats': models_stats
        })

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing users (admin only) with enhanced functionality.
    """
    serializer_class = UserWithStatsSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        # L'admin voit son propre compte ET les utilisateurs qu'il a créés
        if self.request.user.is_superuser:
            return User.objects.all().order_by('-date_joined')
        else:
            from accounts.models import UserProfile
            from django.db.models import Q
            user_profiles_created = UserProfile.objects.filter(created_by=self.request.user).values_list('user_id', flat=True)
            return User.objects.filter(Q(id=self.request.user.id) | Q(id__in=user_profiles_created)).order_by('-date_joined')

    def perform_create(self, serializer):
        # Hash du mot de passe avant sauvegarde
        user = serializer.save()
        user.set_password(serializer.validated_data['password'])
        user.save()
        
        # Assigner l'admin actuel comme créateur du profil utilisateur
        if hasattr(user, 'profile'):
            user.profile.created_by = self.request.user
            user.profile.save()
    
    def destroy(self, request, *args, **kwargs):
        """Gestion des permissions de suppression"""
        user_to_delete = self.get_object()
        
        # Seuls les superusers peuvent supprimer des administrateurs
        if user_to_delete.is_staff and not request.user.is_superuser:
            return Response(
                {'error': 'Seuls les superutilisateurs peuvent supprimer des administrateurs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Les admins peuvent supprimer leurs propres utilisateurs (non-staff)
        if not user_to_delete.is_staff:
            # Vérifier que l'utilisateur a été créé par cet admin
            from accounts.models import UserProfile
            try:
                user_profile = UserProfile.objects.get(user=user_to_delete)
                if user_profile.created_by != request.user and not request.user.is_superuser:
                    return Response(
                        {'error': 'Vous ne pouvez supprimer que les utilisateurs que vous avez créés'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except UserProfile.DoesNotExist:
                if not request.user.is_superuser:
                    return Response(
                        {'error': 'Profil utilisateur non trouvé'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def overall_stats(self, request):
        """
        Get overall statistics for admin's own data only
        """
        # Chaque admin ne voit que ses propres statistiques - isolation complète
        if request.user.is_superuser:
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            staff_users = User.objects.filter(is_staff=True).count()
            total_models = ModelProfile.objects.count()
            total_sales = DailySale.objects.count()
            total_revenue = DailySale.objects.aggregate(total=Sum('amount_usd'))['total'] or 0
        else:
            # Admin ne voit que son propre compte
            total_users = 1
            active_users = 1 if request.user.is_active else 0
            staff_users = 1
            total_models = ModelProfile.objects.filter(owner=request.user).count()
            total_sales = DailySale.objects.filter(model_profile__owner=request.user).count()
            total_revenue = DailySale.objects.filter(model_profile__owner=request.user).aggregate(total=Sum('amount_usd'))['total'] or 0
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'staff_users': staff_users,
            'total_models': total_models,
            'total_sales': total_sales,
            'total_revenue': total_revenue
        })

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'id': user.id,
            'username': user.username,
            'is_active': user.is_active,
            'message': f'User {"activated" if user.is_active else "deactivated"} successfully'
        })

class ModelProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"ModelProfileViewSet - User: {self.request.user.email}, is_staff: {self.request.user.is_staff}")
        
        # Super admin voit SEULEMENT ses propres modèles
        if self.request.user.email == 'tahiantsaoFabio17@gmail.com':
            queryset = ModelProfile.objects.filter(owner=self.request.user).order_by('-created_at')
            logger.info(f"Super admin queryset count: {queryset.count()}")
            return queryset
        
        # Les autres admins voient leurs modèles + ceux des utilisateurs qu'ils ont créés
        if self.request.user.is_staff:
            from accounts.models import UserProfile
            created_users = UserProfile.objects.filter(created_by=self.request.user).values_list('user', flat=True)
            
            queryset = ModelProfile.objects.filter(
                Q(owner=self.request.user) | 
                Q(owner__in=created_users)
            ).order_by('-created_at')
            
            logger.info(f"Admin queryset count: {queryset.count()}")
            return queryset
        else:
            # Utilisateur normal ne voit que ses propres modèles
            queryset = ModelProfile.objects.filter(owner=self.request.user)
            logger.info(f"User queryset count: {queryset.count()}")
            return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ModelProfileCreateSerializer
        return ModelProfileSerializer
    
    def create(self, request, *args, **kwargs):
        logger.info(f"📨 Création de modèle - Utilisateur: {request.user}")
        logger.info(f"📦 Données reçues: {request.data}")
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            logger.info(f"✅ Modèle créé avec succès: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            logger.error(f"❌ Erreur création modèle: {str(e)}")
            return Response(
                {'error': f'Erreur lors de la création du modèle: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        try:
            model_profile = self.get_object()
            
            # Vérifier que l'utilisateur a le droit d'accéder à ces stats
            if not request.user.is_staff and model_profile.owner != request.user:
                return Response(
                    {'error': 'Vous n\'avez pas la permission d\'accéder à ces statistiques'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Calcul des statistiques
            sales_agg = model_profile.daily_sales.aggregate(
                gross_usd=Sum('amount_usd'),
                days_with_sales=Count('id')
            )
            
            gross_usd = sales_agg['gross_usd'] or 0
            gross_float = float(gross_usd)
            fees_usd = gross_float * 0.2
            net_usd = gross_float * 0.8
            
            stats_data = {
                'gross_usd': float(gross_usd),
                'fees_usd': float(fees_usd),
                'net_usd': float(net_usd),
                'days_with_sales': sales_agg['days_with_sales'] or 0,
            }
            
            serializer = StatsSerializer(stats_data)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"❌ Erreur stats: {str(e)}")
            return Response(
                {'error': f'Erreur lors du calcul des statistiques: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['POST'])
    def upload_photo(self, request, pk=None):
        try:
            logger.info(f"📤 Upload photo request for model {pk}")
            logger.info(f"📦 Files received: {dict(request.FILES)}")
            
            model_profile = self.get_object()
            
            # Vérifier les permissions
            if not request.user.is_staff and model_profile.owner != request.user:
                return Response(
                    {'error': 'Vous n\'avez pas la permission de modifier ce modèle'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if 'profile_photo' not in request.FILES:
                logger.error("❌ No file provided in upload")
                return Response({'error': 'Aucun fichier fourni'}, status=400)
            
            file = request.FILES['profile_photo']
            logger.info(f"📄 File info: name={file.name}, size={file.size}, type={file.content_type}")
            
            # Valider le type de fichier
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
            if file.content_type not in allowed_types:
                logger.error(f"❌ Invalid file type: {file.content_type}")
                return Response({'error': f'Type de fichier non supporté: {file.content_type}. Types autorisés: {allowed_types}'}, status=400)
            
            # Valider la taille (max 5MB)
            if file.size > 5 * 1024 * 1024:
                logger.error(f"❌ File too large: {file.size} bytes")
                return Response({'error': 'Le fichier ne doit pas dépasser 5MB'}, status=400)
            
            # Vérifier que le dossier media existe
            media_root = 'media/'
            if not os.path.exists(media_root):
                os.makedirs(media_root)
                logger.info(f"📁 Created media directory: {media_root}")
            
            # Sauvegarder l'image
            logger.info("💾 Saving profile photo...")
            
            # Méthode alternative pour sauvegarder le fichier
            from django.core.files.base import ContentFile
            import uuid
            
            # Générer un nom de fichier unique
            file_extension = os.path.splitext(file.name)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Lire le contenu du fichier
            file_content = file.read()
            
            # Sauvegarder avec ContentFile
            model_profile.profile_photo.save(
                unique_filename,
                ContentFile(file_content),
                save=True
            )
            
            # Recharger l'instance pour avoir l'URL mise à jour
            model_profile.refresh_from_db()
            logger.info(f"✅ Photo saved successfully: {model_profile.profile_photo}")
            logger.info(f"📁 Photo path: {model_profile.profile_photo.path if model_profile.profile_photo else 'None'}")
            
            serializer = self.get_serializer(model_profile)
            return Response(serializer.data)
            
        except Exception as e:
            error_traceback = traceback.format_exc()
            logger.error(f"❌ Erreur upload photo: {str(e)}")
            logger.error(f"📋 Stack trace: {error_traceback}")
            return Response({'error': f'Erreur lors de l\'upload: {str(e)}'}, status=400)

class DailySaleViewSet(viewsets.ModelViewSet):
    serializer_class = DailySaleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Récupérer le paramètre model_profile de la requête
        model_profile_id = self.request.query_params.get('model_profile')
        
        # Tous les utilisateurs (y compris admin) ne voient que leurs propres ventes
        queryset = DailySale.objects.filter(model_profile__owner=self.request.user)
        
        if model_profile_id:
            queryset = queryset.filter(model_profile=model_profile_id)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        logger.info(f"📨 Création de vente - Utilisateur: {request.user}")
        logger.info(f"📦 Données reçues: {request.data}")
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            logger.info(f"✅ Vente créée avec succès: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            logger.error(f"❌ Erreur création vente: {str(e)}")
            return Response(
                {'error': f'Erreur lors de la création de la vente: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        model_profile_id = self.request.data.get('model_profile')
        try:
            # Tous les utilisateurs ne peuvent créer des ventes que pour leurs propres modèles
            model_profile = ModelProfile.objects.get(id=model_profile_id, owner=self.request.user)
            serializer.save(model_profile=model_profile)
        except ModelProfile.DoesNotExist:
            raise serializers.ValidationError("Modèle non trouvé ou non autorisé")

class StatsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        model_id = request.query_params.get('model_id')
        
        if not model_id:
            return Response({'error': 'model_id parameter is required'}, status=400)
        
        try:
            # Tous les utilisateurs ne peuvent accéder qu'aux stats de leurs propres modèles
            model_profile = ModelProfile.objects.get(id=model_id, owner=request.user)
        except ModelProfile.DoesNotExist:
            return Response({'error': 'Modèle non trouvé'}, status=404)
        
        # Calcul des statistiques
        sales_agg = model_profile.daily_sales.aggregate(
            gross_usd=Sum('amount_usd'),
            days_with_sales=Count('id')
        )
        
        gross_usd = sales_agg['gross_usd'] or 0
        gross_float = float(gross_usd)
        fees_usd = gross_float * 0.2
        net_usd = gross_float * 0.8
        
        stats_data = {
            'gross_usd': gross_float,
            'fees_usd': fees_usd,
            'net_usd': net_usd,
            'days_with_sales': sales_agg['days_with_sales'] or 0,
        }
        
        return Response(stats_data)

class PDFReportView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        model_id = request.query_params.get('model_id')
        
        if not model_id:
            return Response({'error': 'model_id parameter is required'}, status=400)
        
        try:
            # Tous les utilisateurs ne peuvent accéder qu'aux rapports de leurs propres modèles
            model_profile = ModelProfile.objects.get(id=model_id, owner=request.user)
        except ModelProfile.DoesNotExist:
            return Response({'error': 'Modèle non trouvé'}, status=404)
        
        # Création du PDF
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Contenu du PDF
        p.drawString(100, 750, f"Rapport pour {model_profile.full_name}")
        p.drawString(100, 730, f"Période: {datetime.now().strftime('%Y-%m-%d')}")
        
        # Statistiques
        sales_agg = model_profile.daily_sales.aggregate(
            gross_usd=Sum('amount_usd'),
            days_with_sales=Count('id')
        )
        
        gross_usd = sales_agg['gross_usd'] or 0
        gross_float = float(gross_usd)
        
        p.drawString(100, 700, f"Ventes brutes: {gross_float:.2f} €")
        p.drawString(100, 680, f"Honoraires (20%): {gross_float * 0.2:.2f} €")
        p.drawString(100, 660, f"Revenu net (80%): {gross_float * 0.8:.2f} €")
        p.drawString(100, 640, f"Jours avec ventes: {sales_agg['days_with_sales'] or 0}")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="rapport_{model_profile.full_name}.pdf"'
        
        return response