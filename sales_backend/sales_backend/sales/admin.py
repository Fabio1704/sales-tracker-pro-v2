from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import ModelProfile, DailySale
from django.db.models import Sum, Count, Q
from django.utils.html import format_html
from django.urls import reverse
from django.utils.http import urlencode
from decimal import Decimal

# FILTRES PERSONNALISÉS
class OwnerFilter(admin.SimpleListFilter):
    title = 'Propriétaire'
    parameter_name = 'owner'

    def lookups(self, request, model_admin):
        # Retourne la liste de tous les propriétaires
        owners = User.objects.all().values_list('id', 'username').distinct()
        return owners

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(owner__id=self.value())
        return queryset

class ModelOwnerFilter(admin.SimpleListFilter):
    title = 'Propriétaire du modèle'
    parameter_name = 'model_owner'

    def lookups(self, request, model_admin):
        # Retourne la liste de tous les propriétaires de modèles
        owners = User.objects.filter(model_profiles__isnull=False).values_list('id', 'username').distinct()
        return owners

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(model_profile__owner__id=self.value())
        return queryset

# INLINES
class DailySaleInline(admin.TabularInline):
    model = DailySale
    extra = 0
    readonly_fields = ['created_at', 'get_net_amount']
    fields = ['date', 'amount_usd', 'get_net_amount', 'created_at']
    
    def get_net_amount(self, obj):
        # ⬇️⬇️⬇️ CORRECTION : Convertir en float avant multiplication ⬇️⬇️⬇️
        amount_float = float(obj.amount_usd)
        return f"${amount_float * 0.8:.2f}"
    get_net_amount.short_description = 'Montant net (80%)'

# ADMIN CLASSES
@admin.register(ModelProfile)
class ModelProfileAdmin(admin.ModelAdmin):
    list_display = [
        'first_name', 
        'last_name', 
        'owner_link', 
        'created_at', 
        'sales_count', 
        'total_revenue',
        'total_net_revenue',
        'view_sales_link'
    ]
    list_filter = ['created_at', OwnerFilter]  # Utilisez le filtre personnalisé
    search_fields = ['first_name', 'last_name', 'owner__username', 'owner__email']
    readonly_fields = ['created_at', 'sales_count', 'total_revenue', 'total_net_revenue']
    inlines = [DailySaleInline]
    list_per_page = 20
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        
        # Super admin voit tout
        if request.user.email == 'tahiantsaoFabio17@gmail.com':
            return qs
        
        # Les admins clients voient leurs modèles + ceux créés par leurs utilisateurs
        from accounts.models import UserProfile
        created_users = UserProfile.objects.filter(created_by=request.user).values_list('user_id', flat=True)
        return qs.filter(Q(owner=request.user) | Q(owner__id__in=created_users) | Q(created_by=request.user))
    
    def save_model(self, request, obj, form, change):
        """Assigner automatiquement le propriétaire et créateur lors de la création"""
        if not change:  # Nouveau modèle
            obj.owner = request.user
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def owner_link(self, obj):
        url = reverse('admin:auth_user_change', args=[obj.owner.id])
        return format_html('<a href="{}">{}</a>', url, obj.owner.username)
    owner_link.short_description = 'Propriétaire'
    
    def sales_count(self, obj):
        count = obj.daily_sales.count()
        url = (
            reverse('admin:sales_dailysale_changelist')
            + '?'
            + urlencode({'model_profile__id': f'{obj.id}'})
        )
        return format_html('<a href="{}">{}</a>', url, count)
    sales_count.short_description = 'Nombre de ventes'
    
    def total_revenue(self, obj):
        total = obj.daily_sales.aggregate(total=Sum('amount_usd'))['total']
        if total:
            # ⬇️⬇️⬇️ CORRECTION : Convertir en float ⬇️⬇️⬇️
            total_float = float(total)
            return f"${total_float:.2f}"
        return "$0.00"
    total_revenue.short_description = 'Revenu total'
    
    def total_net_revenue(self, obj):
        total = obj.daily_sales.aggregate(total=Sum('amount_usd'))['total']
        if total:
            # ⬇️⬇️⬇️ CORRECTION : Convertir en float avant multiplication ⬇️⬇️⬇️
            total_float = float(total)
            net = total_float * 0.8
            return f"${net:.2f}"
        return "$0.00"
    total_net_revenue.short_description = 'Revenu net (80%)'
    
    def view_sales_link(self, obj):
        url = reverse('admin:sales_dailysale_changelist') + f'?model_profile__id={obj.id}'
        return format_html('<a href="{}" class="button">Voir les ventes</a>', url)
    view_sales_link.short_description = 'Actions'

@admin.register(DailySale)
class DailySaleAdmin(admin.ModelAdmin):
    list_display = [
        'model_profile_link',
        'date', 
        'amount_usd',
        'net_amount',
        'fees_amount',
        'owner_link',
        'created_at'
    ]
    list_filter = [
        'date', 
        'model_profile', 
        'created_at', 
        ModelOwnerFilter  # Utilisez le filtre personnalisé
    ]
    search_fields = [
        'model_profile__first_name', 
        'model_profile__last_name',
        'model_profile__owner__username',
        'model_profile__owner__email'
    ]
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'net_amount', 'fees_amount']
    list_per_page = 50
    
    def model_profile_link(self, obj):
        url = reverse('admin:sales_modelprofile_change', args=[obj.model_profile.id])
        return format_html('<a href="{}">{} {}</a>', url, obj.model_profile.first_name, obj.model_profile.last_name)
    model_profile_link.short_description = 'Modèle'
    
    def owner_link(self, obj):
        url = reverse('admin:auth_user_change', args=[obj.model_profile.owner.id])
        return format_html('<a href="{}">{}</a>', url, obj.model_profile.owner.username)
    owner_link.short_description = 'Propriétaire'
    
    def net_amount(self, obj):
        # ⬇️⬇️⬇️ CORRECTION : Convertir en float avant multiplication ⬇️⬇️⬇️
        amount_float = float(obj.amount_usd)
        return f"${amount_float * 0.8:.2f}"
    net_amount.short_description = 'Montant net (80%)'
    
    def fees_amount(self, obj):
        # ⬇️⬇️⬇️ CORRECTION : Convertir en float avant multiplication ⬇️⬇️⬇️
        amount_float = float(obj.amount_usd)
        return f"${amount_float * 0.2:.2f}"
    fees_amount.short_description = 'Honoraires (20%)'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        qs = qs.select_related('model_profile', 'model_profile__owner')
        
        # Super admin voit tout
        if request.user.email == 'tahiantsaoFabio17@gmail.com':
            return qs
        
        # Les admins clients voient les ventes de leurs modèles + ceux créés par leurs utilisateurs
        from accounts.models import UserProfile
        created_users = UserProfile.objects.filter(created_by=request.user).values_list('user_id', flat=True)
        return qs.filter(Q(model_profile__owner=request.user) | Q(model_profile__owner__id__in=created_users) | Q(model_profile__created_by=request.user))

# INLINE POUR USER ADMIN
class ModelProfileInline(admin.TabularInline):
    model = ModelProfile
    extra = 0
    readonly_fields = ['first_name', 'last_name', 'created_at', 'sales_count', 'total_revenue']
    fields = ['first_name', 'last_name', 'created_at', 'sales_count', 'total_revenue']
    
    def sales_count(self, obj):
        return obj.daily_sales.count()
    sales_count.short_description = 'Nombre de ventes'
    
    def total_revenue(self, obj):
        total = obj.daily_sales.aggregate(total=Sum('amount_usd'))['total']
        # ⬇️⬇️⬇️ CORRECTION : Convertir en float ⬇️⬇️⬇️
        if total:
            total_float = float(total)
            return f"${total_float:.2f}"
        return "$0.00"
    total_revenue.short_description = 'Revenu total'
    
    def has_add_permission(self, request, obj):
        return False

# CUSTOM USER ADMIN
class CustomUserAdmin(UserAdmin):
    inlines = [ModelProfileInline]
    list_display = UserAdmin.list_display + ('date_joined', 'last_login', 'model_count', 'total_sales')
    
    def model_count(self, obj):
        count = obj.model_profiles.count()
        url = (
            reverse('admin:sales_modelprofile_changelist')
            + '?'
            + urlencode({'owner__id': f'{obj.id}'})
        )
        return format_html('<a href="{}">{}</a>', url, count)
    model_count.short_description = 'Modèles'
    
    def total_sales(self, obj):
        total = DailySale.objects.filter(model_profile__owner=obj).aggregate(total=Sum('amount_usd'))['total']
        # ⬇️⬇️⬇️ CORRECTION : Convertir en float ⬇️⬇️⬇️
        if total:
            total_float = float(total)
            return f"${total_float:.2f}"
        return "$0.00"
    total_sales.short_description = 'Ventes totales'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        qs = qs.prefetch_related('model_profiles')
        
        # Super admin voit tout
        if request.user.email == 'tahiantsaoFabio17@gmail.com':
            return qs
        
        # Les admins clients voient leur propre compte + les utilisateurs qu'ils ont créés
        from accounts.models import UserProfile
        created_users = UserProfile.objects.filter(created_by=request.user).values_list('user_id', flat=True)
        return qs.filter(Q(id=request.user.id) | Q(id__in=created_users))

# Ne pas désenregistrer User ici car c'est géré dans accounts/admin_custom.py