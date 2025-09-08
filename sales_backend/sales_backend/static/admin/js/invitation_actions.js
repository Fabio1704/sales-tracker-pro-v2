// JavaScript pour les actions d'invitation dans l'admin Django

function copyInvitationLink(url) {
    // Créer un élément temporaire pour copier le lien
    const tempInput = document.createElement('input');
    tempInput.value = window.location.origin + url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // Afficher une notification
    alert('Lien d\'invitation copié dans le presse-papiers !');
}

// Confirmation avant annulation d'invitation
document.addEventListener('DOMContentLoaded', function() {
    const cancelButtons = document.querySelectorAll('a[href*="cancel/"]');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Êtes-vous sûr de vouloir annuler cette invitation ?')) {
                e.preventDefault();
            }
        });
    });
});
