class NexaStayModals {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.initializeModals();
    }

    initializeModals() {
        if (document.getElementById('nexastay-modals-container')) return;
        const modalContainer = document.createElement('div');
        modalContainer.id = 'nexastay-modals-container';
        document.body.appendChild(modalContainer);

        this.injectFullModalHTML();
        this.attachEventListeners();
        this.injectStyles();
    }

    // --- Fonctions de base des modales ---
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    showRegistrationModal() { document.getElementById('registrationModal').style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    showLoginModal() { document.getElementById('loginModal').style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    showSuccess(message) { document.getElementById('successMessage').textContent = message; document.getElementById('successModal').style.display = 'flex'; }
    showError(message) { document.getElementById('errorMessage').textContent = message; document.getElementById('errorModal').style.display = 'flex'; }
    
    // --- Logique d'authentification ---
    async handleRegistration(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        if (data.password !== data.confirmPassword) {
            this.showError('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem('nexastay_user', JSON.stringify(result.user));
                localStorage.setItem('nexastay_token', result.token);
                this.closeModal('registrationModal');
                this.showSuccess('Compte créé avec succès !');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                this.showError(result.error || 'Erreur lors de la création du compte');
            }
        } catch (error) {
            this.showError('Erreur de connexion au serveur');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem('nexastay_user', JSON.stringify(result.user));
                localStorage.setItem('nexastay_token', result.token);
                this.closeModal('loginModal');
                this.showSuccess(`Bienvenue ${result.user.firstName} !`);
                setTimeout(() => auth.redirectUserToDashboard(result.user), 1500);
            } else {
                this.showError(result.error || 'Erreur lors de la connexion');
            }
        } catch (error) {
            this.showError('Erreur de connexion au serveur');
        }
    }

    // --- Logique de la modale de détails de propriété ---
    async showPropertyDetailModal(propertyId) {
        const modal = document.getElementById('propertyDetailModal');
        const contentContainer = document.getElementById('propertyDetailContent');
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        contentContainer.innerHTML = '<p style="text-align: center; padding: 2rem;">Chargement des détails...</p>';

        try {
            const response = await fetch(`${this.apiUrl}/properties/${propertyId}`);
            if (!response.ok) throw new Error('Propriété non trouvée');
            const property = await response.json();

            let extrasHtml = property.extras.length > 0 ? '<h4>Ajouter des extras :</h4>' : '';
            property.extras.forEach(extra => {
                extrasHtml += `
                    <div class="extra-item">
                        <label>
                            <input type="checkbox" class="extra-checkbox" value="${extra.id}" data-price="${extra.price}">
                            ${extra.name} (+${extra.price}€) - <em>${extra.description}</em>
                        </label>
                    </div>`;
            });

            contentContainer.innerHTML = `
                <h3>${property.title}</h3>
                <p class="location-modal">📍 ${property.location}</p>
                <div class="property-photos">
                    ${property.photos.map(photo => `<img src="${photo}" alt="Photo de ${property.title}" onerror="this.style.display='none'">`).join('')}
                </div>
                <h4>Description</h4>
                <p>${property.description || "Aucune description disponible."}</p>
                
                <div class="booking-form">
                    <h4>Réserver votre séjour</h4>
                    <div class="dates-group">
                        <div class="form-group"><label>Arrivée</label><input type="date" id="modal-checkin"></div>
                        <div class="form-group"><label>Départ</label><input type="date" id="modal-checkout"></div>
                    </div>
                    <div class="options-group">
                        <div class="form-group"><label>Voyageurs</label><input type="number" id="modal-travelers" value="1" min="1"></div>
                        <div class="form-group pets-group"><label><input type="checkbox" id="modal-pets"> Animaux</label></div>
                    </div>
                    ${extrasHtml}
                    <button class="btn-modal-primary" onclick="nexaStayModals.handleBookingFromModal('${property.id}')">Confirmer la réservation</button>
                </div>
            `;
            
            const checkinInput = document.getElementById('modal-checkin');
            const checkoutInput = document.getElementById('modal-checkout');
            const today = new Date().toISOString().split('T')[0];
            checkinInput.min = today;
            checkoutInput.disabled = true;
            checkinInput.addEventListener('change', () => {
                if (checkinInput.value) {
                    const checkinDate = new Date(checkinInput.value);
                    checkinDate.setDate(checkinDate.getDate() + 1);
                    const nextDay = checkinDate.toISOString().split('T')[0];
                    checkoutInput.min = nextDay;
                    checkoutInput.disabled = false;
                    if (checkoutInput.value < nextDay) checkoutInput.value = '';
                } else {
                    checkoutInput.disabled = true;
                    checkoutInput.value = '';
                }
            });

        } catch (error) {
            contentContainer.innerHTML = `<p>Erreur: Impossible de charger les détails.</p>`;
        }
    }

    async handleBookingFromModal(propertyId) {
        const session = auth.getSession();
        if (!session) { this.showLoginModal(); return; }

        const bookingData = {
            propertyId,
            checkInDate: document.getElementById('modal-checkin').value,
            checkOutDate: document.getElementById('modal-checkout').value,
            numberOfTravelers: document.getElementById('modal-travelers').value,
            hasPets: document.getElementById('modal-pets').checked,
        };

        if (!bookingData.checkInDate || !bookingData.checkOutDate) {
            this.showError("Veuillez sélectionner les dates d'arrivée et de départ.");
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
                body: JSON.stringify(bookingData)
            });
            const result = await response.json();
            if (response.ok) {
                this.closeModal('propertyDetailModal');
                this.showSuccess("Réservation initiée ! Vous allez être redirigé vers votre espace pour finaliser.");
                setTimeout(() => window.location.href = '/voyageur.html', 2500);
            } else {
                this.showError(result.error || "Une erreur est survenue.");
            }
        } catch (error) {
            this.showError("Erreur de communication avec le serveur.");
        }
    }

    // --- Fonctions pour injecter le HTML et les styles ---
    injectFullModalHTML() {
        const container = document.getElementById('nexastay-modals-container');
        if (!container) return;
        container.innerHTML = `
            <div id="registrationModal" class="modal-overlay" style="display: none;"><div class="modal-container"><div class="modal-header"><h2>Créer un compte</h2><button class="modal-close" onclick="nexaStayModals.closeModal('registrationModal')">&times;</button></div><div class="modal-body"><form id="registrationForm"><div class="form-group"><label>Prénom</label><input type="text" name="firstName" required></div><div class="form-group"><label>Nom</label><input type="text" name="lastName" required></div><div class="form-group"><label>Email</label><input type="email" name="email" required></div><div class="form-group"><label>Mot de passe</label><input type="password" name="password" required></div><div class="form-group"><label>Confirmer</label><input type="password" name="confirmPassword" required></div><button type="submit" class="btn-modal-primary">S'inscrire</button></form></div></div></div>
            <div id="loginModal" class="modal-overlay" style="display: none;"><div class="modal-container"><div class="modal-header"><h2>Connexion</h2><button class="modal-close" onclick="nexaStayModals.closeModal('loginModal')">&times;</button></div><div class="modal-body"><form id="loginForm"><div class="form-group"><label>Email</label><input type="email" name="email" required></div><div class="form-group"><label>Mot de passe</label><input type="password" name="password" required></div><button type="submit" class="btn-modal-primary">Se connecter</button></form></div></div></div>
            <div id="successModal" class="modal-overlay" style="display: none;"><div class="modal-container"><div class="modal-header"><h2>Succès</h2><button class="modal-close" onclick="nexaStayModals.closeModal('successModal')">&times;</button></div><div class="modal-body" style="text-align:center;"><p id="successMessage" style="font-size: 1.1rem;"></p></div></div></div>
            <div id="errorModal" class="modal-overlay" style="display: none;"><div class="modal-container"><div class="modal-header"><h2>Erreur</h2><button class="modal-close" onclick="nexaStayModals.closeModal('errorModal')">&times;</button></div><div class="modal-body" style="text-align:center;"><p id="errorMessage" style="font-size: 1.1rem; color: #e53e3e;"></p></div></div></div>
            <div id="propertyDetailModal" class="modal-overlay" style="display: none;"><div class="modal-container modal-large"><div class="modal-header"><h2 id="propertyDetailTitle">Détails</h2><button class="modal-close" onclick="nexaStayModals.closeModal('propertyDetailModal')">&times;</button></div><div class="modal-body" id="propertyDetailContent"></div></div></div>
        `;
    }
    
    attachEventListeners() {
        const regForm = document.getElementById('registrationForm');
        const loginForm = document.getElementById('loginForm');
        if(regForm) regForm.addEventListener('submit', (e) => this.handleRegistration(e));
        if(loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    injectStyles() {
        if (document.getElementById('nexastay-modal-styles')) return;
        const styles = `
            .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(5px); }
            .modal-container { background: white; padding: 1.5rem; border-radius: 12px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            .modal-large { max-width: 800px; }
            .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem; }
            .modal-close { background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #888; }
            .form-group { margin-bottom: 1rem; }
            .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
            .form-group input { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 6px; }
            .btn-modal-primary { width: 100%; padding: 0.85rem; background-color: #3182ce; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 500; }
            .property-photos { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
            .property-photos img { width: 100%; border-radius: 8px; aspect-ratio: 3/2; object-fit: cover; }
            .booking-form { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
            .dates-group, .options-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: end; }
            .extra-item { margin-top: 0.75rem; }
            .location-modal { color: #555; }
        `;
        document.head.insertAdjacentHTML('beforeend', `<style id="nexastay-modal-styles">${styles}</style>`);
    }
}

let nexaStayModals;
document.addEventListener('DOMContentLoaded', () => {
    nexaStayModals = new NexaStayModals();
});
