from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .validators_simple import validate_real_email

class CustomUserRegistrationForm(UserCreationForm):
    """Formulaire d'inscription avec validation d'email réel"""
    email = forms.EmailField(
        required=True,
        validators=[validate_real_email],
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Entrez votre email'
        }),
        help_text="Entrez une adresse email valide et existante"
    )
    first_name = forms.CharField(
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Prénom'
        })
    )
    last_name = forms.CharField(
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Nom'
        })
    )
    
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password1', 'password2')
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nom d\'utilisateur'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Mot de passe'
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Confirmez le mot de passe'
        })
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email:
            # Vérification d'unicité
            if User.objects.filter(email__iexact=email).exists():
                raise forms.ValidationError("Un utilisateur avec cet email existe déjà.")
            
            # Validation de l'existence réelle
            try:
                validate_real_email(email)
            except Exception as e:
                raise forms.ValidationError(f"Email invalide: {str(e)}")
        
        return email.lower() if email else email
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        if commit:
            user.save()
        return user

class EmailValidationForm(forms.Form):
    """Formulaire simple pour tester la validation d'email"""
    email = forms.EmailField(
        validators=[validate_real_email],
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Testez votre email'
        }),
        help_text="Entrez un email pour vérifier s'il existe"
    )
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email:
            try:
                validate_real_email(email)
            except Exception as e:
                raise forms.ValidationError(f"Email invalide: {str(e)}")
        return email.lower() if email else email
