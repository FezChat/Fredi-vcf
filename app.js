// Global variables
let registrations = [];
const MAX_REGISTRATIONS = 1000;

// DOM Elements
const elements = {
    name: document.getElementById('name'),
    phone: document.getElementById('phone'),
    email: document.getElementById('email'),
    submitBtn: document.getElementById('submitBtn'),
    loading: document.getElementById('loading'),
    success: document.getElementById('success'),
    current: document.getElementById('current'),
    remaining: document.getElementById('remaining'),
    percent: document.getElementById('percent'),
    progressFill: document.getElementById('progressFill'),
    downloadSection: document.getElementById('downloadSection'),
    registrationsList: document.getElementById('registrationsList')
};

// Initialize app
async function initApp() {
    try {
        // Load existing registrations
        await loadRegistrations();
        
        // Setup real-time listener
        setupRealtimeListener();
        
        updateUI();
        
        showNotification('System Ready!', 'Fredi VCF is connected and ready.', 'success');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Connection Error', 'Please refresh the page.', 'error');
    }
}

// Load registrations from Firestore
async function loadRegistrations() {
    try {
        const snapshot = await db.collection('contacts').get();
        registrations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ Loaded ${registrations.length} registrations`);
    } catch (error) {
        console.error('Error loading registrations:', error);
        throw error;
    }
}

// Setup real-time listener
function setupRealtimeListener() {
    db.collection('contacts')
        .onSnapshot(snapshot => {
            registrations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            updateUI();
        }, error => {
            console.error('Real-time listener error:', error);
        });
}

// Register user function
async function registerUser() {
    // Get form values
    const name = elements.name.value.trim();
    const phone = elements.phone.value.trim();
    const email = elements.email.value.trim();

    // Validation
    if (!name || !phone || !email) {
        showNotification('Error', 'Please fill all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Error', 'Please enter valid email', 'error');
        return;
    }

    // Show loading
    showLoading(true);

    try {
        // Check for duplicates
        const isDuplicate = registrations.some(reg => 
            reg.phone === phone || reg.email === email
        );

        if (isDuplicate) {
            showNotification('Already Registered', 'This phone or email is already registered', 'error');
            showLoading(false);
            return;
        }

        // Create user data
        const userData = {
            name: name,
            phone: phone,
            email: email,
            timestamp: new Date().toISOString(),
            registeredAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firestore
        await db.collection('contacts').add(userData);

        // Show success
        showSuccess();
        
        // Reset form
        elements.name.value = '';
        elements.phone.value = '';
        elements.email.value = '';

        showNotification('Success!', 'Contact registered successfully', 'success');

    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Error', 'Registration failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Update UI
function updateUI() {
    const currentCount = registrations.length;
    const remainingCount = MAX_REGISTRATIONS - currentCount;
    const progressPercent = (currentCount / MAX_REGISTRATIONS) * 100;

    // Update numbers
    elements.current.textContent = currentCount;
    elements.remaining.textContent = remainingCount;
    elements.percent.textContent = Math.round(progressPercent) + '%';

    // Update progress bar
    elements.progressFill.style.width = progressPercent + '%';

    // Show download section if target reached
    if (currentCount >= MAX_REGISTRATIONS) {
        elements.downloadSection.classList.remove('hidden');
    }

    // Update recent registrations
    updateRegistrationsList();
}

// Update registrations list
function updateRegistrationsList() {
    const recent = registrations.slice(-5).reverse(); // Last 5 registrations
    
    if (recent.length === 0) {
        elements.registrationsList.innerHTML = '<div class="empty">No registrations yet</div>';
        return;
    }

    elements.registrationsList.innerHTML = recent.map(reg => `
        <div class="registration-item">
            <span>${reg.name}</span>
            <small>${formatDate(reg.timestamp)}</small>
        </div>
    `).join('');
}

// Download VCF
async function downloadVCF() {
    if (registrations.length === 0) {
        showNotification('Error', 'No contacts to download', 'error');
        return;
    }

    try {
        let vcfContent = '';
        registrations.forEach(contact => {
            vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL:${contact.phone}
EMAIL:${contact.email}
END:VCARD\n`;
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

        showNotification('Download Complete!', 'VCF file downloaded successfully', 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Error', 'Download failed', 'error');
    }
}

// Share to WhatsApp
function shareToWhatsApp() {
    const text = `🌟 Join Fredi VCF! 🌟

📱 Register your contact for our VCF file
🔗 ${window.location.href}

📢 WhatsApp Channel:
https://whatsapp.com/channel/0029VbAjdiWBFLgXpS7VJz1u

Share with friends! 🚀`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Utility functions
function showLoading(show) {
    elements.loading.classList.toggle('hidden', !show);
    elements.submitBtn.disabled = show;
}

function showSuccess() {
    elements.success.classList.remove('hidden');
    setTimeout(() => {
        elements.success.classList.add('hidden');
    }, 3000);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function showNotification(title, message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <strong>${title}</strong>
        <p>${message}</p>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', initApp);
