// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB2jwbNHZhnWJWszdnQ-Eiud8rS0hAF1PI",
    authDomain: "fredi-ai.firebaseapp.com",
    projectId: "fredi-ai",
    storageBucket: "fredi-ai.firebasestorage.app",
    messagingSenderId: "612087815858",
    appId: "1:612087815858:web:07ebe516d46f65495af3ab",
    measurementId: "G-DCP4DKN42Z"
};

// Initialize Firebase (you'll need to add Firebase SDK in HTML)
// For now, we'll use localStorage for demo purposes

// App State
const state = {
    registrations: JSON.parse(localStorage.getItem('frediRegistrations')) || [],
    maxRegistrations: 1000,
    userProfile: JSON.parse(localStorage.getItem('frediUserProfile')) || null
};

// DOM Elements
const elements = {
    registrationForm: document.getElementById('registrationForm'),
    registrationSection: document.getElementById('registrationSection'),
    downloadSection: document.getElementById('downloadSection'),
    profilePreview: document.getElementById('profilePreview'),
    profileImage: document.getElementById('profileImage'),
    profileInput: document.getElementById('profileInput'),
    currentRegistrations: document.getElementById('currentRegistrations'),
    targetRegistrations: document.getElementById('targetRegistrations'),
    remainingSlots: document.getElementById('remainingSlots'),
    currentProgress: document.getElementById('currentProgress'),
    remainingProgress: document.getElementById('remainingProgress'),
    currentPercent: document.getElementById('currentPercent'),
    registrationsList: document.getElementById('registrationsList'),
    totalCount: document.getElementById('totalCount'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    notificationContainer: document.getElementById('notificationContainer')
};

// Initialize App
function initApp() {
    loadRegistrations();
    setupEventListeners();
    updateUI();
    showNotification('Welcome to Fredi VCF!', 'Register your contact to join our global network.', 'info');
}

// Event Listeners
function setupEventListeners() {
    // Form submission
    elements.registrationForm.addEventListener('submit', handleFormSubmit);
    
    // Profile picture upload
    elements.profileInput.addEventListener('change', handleProfileUpload);
    
    // Drag and drop for profile picture
    elements.profilePreview.addEventListener('dragover', handleDragOver);
    elements.profilePreview.addEventListener('drop', handleFileDrop);
}

// Form Submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(elements.registrationForm);
    const userData = {
        id: Date.now(),
        fullName: document.getElementById('fullName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        email: document.getElementById('email').value,
        occupation: document.getElementById('occupation').value,
        additionalInfo: document.getElementById('additionalInfo').value,
        profilePicture: state.userProfile?.imageUrl || null,
        registrationDate: new Date().toISOString(),
        status: 'active'
    };

    // Validate form
    if (!validateForm(userData)) {
        return;
    }

    showLoading(true);

    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if user already registered
        const existingUser = state.registrations.find(reg => 
            reg.phoneNumber === userData.phoneNumber || reg.email === userData.email
        );

        if (existingUser) {
            showNotification('Already Registered', 'This phone number or email is already registered.', 'warning');
            showLoading(false);
            return;
        }

        // Add to registrations
        state.registrations.push(userData);
        saveRegistrations();
        
        showNotification('Registration Successful!', `Welcome ${userData.fullName}! You're now part of our network.`, 'success');
        
        // Reset form
        elements.registrationForm.reset();
        resetProfilePicture();
        
        // Update UI
        updateUI();
        
        // Check if we reached the limit
        if (state.registrations.length >= state.maxRegistrations) {
            showDownloadSection();
        }
        
    } catch (error) {
        showNotification('Registration Failed', 'Please try again later.', 'warning');
        console.error('Registration error:', error);
    } finally {
        showLoading(false);
    }
}

// Profile Picture Handling
function handleProfileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#4361ee';
}

function handleFileDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        processImageFile(file);
    }
}

function processImageFile(file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification('File Too Large', 'Please select an image smaller than 5MB.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        elements.profileImage.src = e.target.result;
        elements.profileImage.classList.remove('hidden');
        elements.profilePreview.querySelector('i').classList.add('hidden');
        
        // Store profile data
        state.userProfile = {
            imageUrl: e.target.result,
            fileName: file.name,
            fileSize: file.size
        };
        localStorage.setItem('frediUserProfile', JSON.stringify(state.userProfile));
    };
    reader.readAsDataURL(file);
}

function resetProfilePicture() {
    elements.profileImage.classList.add('hidden');
    elements.profilePreview.querySelector('i').classList.remove('hidden');
    state.userProfile = null;
    localStorage.removeItem('frediUserProfile');
}

// Form Validation
function validateForm(data) {
    if (!data.fullName.trim()) {
        showNotification('Validation Error', 'Please enter your full name.', 'warning');
        return false;
    }

    if (!data.phoneNumber.trim() || !isValidPhoneNumber(data.phoneNumber)) {
        showNotification('Validation Error', 'Please enter a valid phone number.', 'warning');
        return false;
    }

    if (!data.email.trim() || !isValidEmail(data.email)) {
        showNotification('Validation Error', 'Please enter a valid email address.', 'warning');
        return false;
    }

    if (!data.occupation.trim()) {
        showNotification('Validation Error', 'Please enter your occupation.', 'warning');
        return false;
    }

    return true;
}

function isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// UI Updates
function updateUI() {
    const currentCount = state.registrations.length;
    const remainingCount = state.maxRegistrations - currentCount;
    const progressPercent = (currentCount / state.maxRegistrations) * 100;
    const remainingPercent = (remainingCount / state.maxRegistrations) * 100;

    // Update stats
    elements.currentRegistrations.textContent = currentCount;
    elements.remainingSlots.textContent = remainingCount;
    elements.currentPercent.textContent = `${Math.round(progressPercent)}%`;
    
    // Update progress bars
    elements.currentProgress.style.width = `${progressPercent}%`;
    elements.remainingProgress.style.width = `${remainingPercent}%`;
    
    // Update total count badge
    elements.totalCount.textContent = currentCount;
    
    // Update registrations list
    updateRegistrationsList();
    
    // Show download section if limit reached
    if (currentCount >= state.maxRegistrations) {
        showDownloadSection();
    }
}

function updateRegistrationsList() {
    const recentRegistrations = [...state.registrations]
        .reverse()
        .slice(0, 5);

    if (recentRegistrations.length === 0) {
        elements.registrationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No registrations yet. Be the first to register!</p>
            </div>
        `;
        return;
    }

    elements.registrationsList.innerHTML = recentRegistrations.map(registration => `
        <div class="registration-item">
            <div class="registration-avatar">
                ${registration.profilePicture 
                    ? `<img src="${registration.profilePicture}" alt="${registration.fullName}">`
                    : `<span>${getInitials(registration.fullName)}</span>`
                }
            </div>
            <div class="registration-info">
                <h4>${registration.fullName}</h4>
                <p>${registration.occupation} • ${formatDate(registration.registrationDate)}</p>
            </div>
        </div>
    `).join('');
}

function showDownloadSection() {
    elements.registrationSection.classList.add('hidden');
    elements.downloadSection.classList.remove('hidden');
    showNotification('Target Reached!', 'VCF file is now available for download.', 'success');
}

// Utility Functions
function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

// Data Management
function loadRegistrations() {
    // In a real app, this would load from Firebase
    console.log('Loaded registrations:', state.registrations.length);
}

function saveRegistrations() {
    localStorage.setItem('frediRegistrations', JSON.stringify(state.registrations));
}

// Download VCF
function downloadVCF() {
    if (state.registrations.length === 0) {
        showNotification('No Data', 'There are no contacts to download.', 'warning');
        return;
    }

    showLoading(true);

    try {
        // Generate VCF content
        let vcfContent = '';
        state.registrations.forEach(contact => {
            vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${contact.fullName}
TEL:${contact.phoneNumber}
EMAIL:${contact.email}
ORG:${contact.occupation}
NOTE:${contact.additionalInfo || 'Registered via Fredi VCF'}
END:VCARD\n`;
        });

        // Create and download file
        const blob = new Blob([vcfContent], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fredi-contacts-${new Date().toISOString().split('T')[0]}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Download Complete!', `${state.registrations.length} contacts exported successfully.`, 'success');
        
    } catch (error) {
        showNotification('Download Failed', 'Please try again later.', 'warning');
        console.error('Download error:', error);
    } finally {
        showLoading(false);
    }
}

// Share Functions
function shareToWhatsApp() {
    const text = `🌟 Join Fredi VCF Global Network! 🌟

📱 Register your contact to be part of our 1000+ contacts VCF file
🔗 Registration Link: ${window.location.href}

📢 Follow our WhatsApp Channel for updates:
https://whatsapp.com/channel/0029VbAjdiWBFLgXpS7VJz1u

Share with your friends and grow the network! 🚀`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    showNotification('Share Ready!', 'The registration link has been prepared for sharing on WhatsApp.', 'info');
}

function showChannelInfo() {
    showNotification(
        'WhatsApp Channel Information',
        'All VCF file updates and announcements will be posted in our WhatsApp channel. Make sure to follow it!',
        'info'
    );
}

// UI Helpers
function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.add('show');
    } else {
        elements.loadingOverlay.classList.remove('show');
    }
}

function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
              type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' : 
              '<i class="fas fa-info-circle"></i>'}
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elements.notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    elements.notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
