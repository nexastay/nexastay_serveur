/**
 * NexaStay Auth Manager
 * Gère l'authentification, la protection des pages et les informations utilisateur.
 */
const auth = {

    /**
     * Récupère l'utilisateur et le token depuis le localStorage.
     * @returns {Object|null} Un objet { user, token } ou null si non connecté.
     */
    getSession: function() {
        const user = localStorage.getItem('nexastay_user');
        const token = localStorage.getItem('nexastay_token');

        if (user && token) {
            return {
                user: JSON.parse(user),
                token: token
            };
        }
        return null;
    },

    /**
     * Déconnecte l'utilisateur en vidant le localStorage et en redirigeant.
     */
    logout: function() {
        localStorage.clear();
        window.location.href = '/index.html'; // Redirige vers la page d'accueil
    },

    /**
     * Protège une page. Vérifie si un utilisateur est connecté et a le bon rôle.
     * Si ce n'est pas le cas, redirige vers la page d'accueil.
     * @param {string} requiredRole - Le rôle requis pour accéder à la page (ex: 'HOST', 'VOYAGEUR').
     * @returns {Object} L'objet de l'utilisateur s'il est autorisé.
     */
    protectPage: function(requiredRole) {
        const session = this.getSession();

        if (!session || (requiredRole && session.user.role.toUpperCase() !== requiredRole.toUpperCase())) {
            console.error('Accès non autorisé. Redirection...');
            // alert('Accès non autorisé. Vous allez être redirigé vers l\'accueil.');
            window.location.href = '/index.html';
            return null;
        }
        
        console.log(`Accès autorisé pour ${session.user.email} avec le rôle ${session.user.role}`);
        return session.user;
    },

    /**
     * Redirige l'utilisateur vers son dashboard approprié après la connexion.
     * @param {Object} user - L'objet utilisateur contenant son rôle.
     */
    redirectUserToDashboard: function(user) {
        switch (user.role.toUpperCase()) {
            case 'HOST':
                window.location.href = '/proprietaire.html';
                break;
            case 'INTERVENANT':
                window.location.href = '/intervenant.html';
                break;
            case 'ADMIN':
                window.location.href = '/admin.html'; // Pour le futur
                break;
            case 'GUEST': // Le rôle par défaut pour les voyageurs
            default:
                window.location.href = '/voyageur.html';
                break;
        }
    }
};