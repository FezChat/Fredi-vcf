// Simple Contact Manager - WORKS IMMEDIATELY
class ContactManager {
    constructor() {
        this.registrations = this.loadRegistrations();
        this.maxRegistrations = 1000;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.showNotification('Ready!', 'Fredi VCF is ready for registration', 'success');
    }

    setupEventListeners() {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.registerUser();
        });
    }

    registerUser() {
        // Get form values
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();

        // Validate
        if (!this.validateForm(name, phone, email)) {
            return;
        }

        // Show loading
        this.showLoading(true);

        // Simulate quick processing (remove setTimeout in production)
        setTimeout(() => {
            try {
                // Check for duplicates
                if (this.isDuplicate(phone, email)) {
                    this.showError('This phone or email is already registered');
                    this.showLoading(false);
                    return;
                }

                // Create contact
                const contact = {
                    id: Date.now(),
                    name: name,
                    phone: phone,
                    email: email,
                    timestamp: new Date().toISOString()
                };

                // Save contact
                this.saveRegistration(contact);

                // Show success
                this.showSuccess();
                this.clearForm();

                // Update UI
                this.updateUI();

                this.showNotification('Success!', 'Contact registered successfully', 'success');

            } catch (error) {
                this.showError('Registration failed: ' + error.message);
            } finally {
                this.showLoading(false);
            }
        }, 500); // Small delay for better UX
    }

    validateForm(name, phone, email) {
        if (!name) {
            this.showError('Please enter your full name');
            return false;
        }

        if (!phone) {
            this.showError('Please enter your phone number');
            return false;
        }

        if (!email) {
            this.showError('Please enter your email address');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isDuplicate(phone, email) {
        return this.registrations.some(reg => 
            reg.phone === phone || reg.email === email
        );
    }

    saveRegistration(contact) {
        this.registrations.push(contact);
        localStorage.setItem('frediRegistrations', JSON.stringify(this.registrations));
        
        // Try to sync with Firebase in background (non-blocking)
        this.syncWithFirebase(contact);
    }

    async syncWithFirebase(contact) {
        try {
            // Only sync if Firebase is available
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                await firebase.firestore().collection('contacts').add({
                    ...contact,
                    syncedAt: new Date().toISOString()
                });
                console.log('✅ Synced with Firebase');
            }
        } catch (error) {
            console.log('⚠️ Firebase sync failed (but contact saved locally):', error);
        }
    }

    loadRegistrations() {
        try {
            const saved = localStorage.getItem('frediRegistrations');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading registrations:', error);
            return [];
        }
    }

    updateUI() {
        const currentCount = this.registrations.length;
        const remainingCount = this.maxRegistrations - currentCount;
        const progressPercent = (currentCount / this.maxRegistrations) * 100;

        // Update numbers
        document.getElementById('current').textContent = currentCount;
        document.getElementById('remaining').textContent = remainingCount;
        document.getElementById('percent').textContent = Math.round(progressPercent) + '%';

        // Update progress bar
        document.getElementById('progressFill').style.width = progressPercent + '%';

        // Show download section if target reached
        if (currentCount >= this.maxRegistrations) {
            document.getElementById('downloadSection').classList.remove('hidden');
        }

        // Update recent registrations
        this.updateRegistrationsList();
    }

    updateRegistrationsList() {
        const listElement = document.getElementById('registrationsList');
        const recent = this.registrations.slice(-5).reverse();

        if (recent.length === 0) {
            listElement.innerHTML = '<div class="empty">No registrations yet</div>';
            return;
        }

        listElement.innerHTML = recent.map(reg => `
            <div class="registration-item">
                <span>${reg.name}</span>
                <small>${this.formatDate(reg.timestamp)}</small>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const submitBtn = document.getElementById('submitBtn');
        
        if (show) {
            loading.classList.remove('hidden');
            submitBtn.disabled = true;
        } else {
            loading.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }

    showSuccess() {
        const success = document.getElementById('success');
        const error = document.getElementById('error');
        
        success.classList.remove('hidden');
        error.classList.add('hidden');
        
        setTimeout(() => {
            success.classList.add('hidden');
        }, 3000);
    }

    showError(message) {
        const success = document.getElementById('success');
        const error = document.getElementById('error');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        error.classList.remove('hidden');
        success.classList.add('hidden');
        
        setTimeout(() => {
            error.classList.add('hidden');
        }, 5000);
    }

    clearForm() {
        document.getElementById('name').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('email').value = '';
    }

    showNotification(title, message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <strong>${title}</strong>
            <p>${message}</p>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    downloadVCF() {
        if (this.registrations.length === 0) {
            this.showError('No contacts to download');
            return;
        }

        try {
            let vcfContent = '';
            this.registrations.forEach(contact => {
                vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL:${contact.phone}
EMAIL:${contact.email}
NOTE:Registered via Fredi VCF
END:VCARD\n\n`;
            });

            const blob = new Blob([vcfContent], { type: 'text/vcard' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fredi-contacts-${new Date().toISOString().split('T')[0]}.vcf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('Download Complete!', 'VCF file downloaded successfully', 'success');
            
        } catch (error) {
            this.showError('Download failed: ' + error.message);
        }
    }

    shareToWhatsApp() {
        const text = `🌟 Join Fredi VCF! 🌟

📱 Register your contact for our VCF file
🔗 ${window.location.href}

📢 WhatsApp Channel:
https://whatsapp.com/channel/0029VbAjdiWBFLgXpS7VJz1u

Share with friends! 🚀`;

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        this.showNotification('Share Ready!', 'WhatsApp sharing opened', 'success');
    }
}

// Initialize the app when page loads
let contactManager;

document.addEventListener('DOMContentLoaded', () => {
    contactManager = new ContactManager();
});

// Global functions for HTML onclick
function downloadVCF() {
    if (contactManager) {
        contactManager.downloadVCF();
    }
}

function shareToWhatsApp() {
    if (contactManager) {
        contactManager.shareToWhatsApp();
    }
}
