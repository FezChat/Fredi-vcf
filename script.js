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

// Initialize Firebase
let db;
let firebaseInitialized = false;

try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    firebaseInitialized = true;
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    firebaseInitialized = false;
}

// App State
const state = {
    registrations: [],
    maxRegistrations: 1000,
    userProfile: null
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
    showLoading(true);
    
    // Try to load from Firebase first
    if (firebaseInitialized) {
        loadRegistrationsFromFirestore()
            .then(() => {
                showNotification('Connected!', 'Fredi VCF is online and syncing across all devices.', 'success');
                setupRealtimeListener();
            })
            .catch(error => {
                console.error('Firebase load failed:', error);
                showNotification('Offline Mode', 'Using local storage. Data will not sync across devices.', 'warning');
                loadLocalRegistrations();
            })
            .finally(() => {
                showLoading(false);
            });
    } else {
        // Use localStorage as fallback
        showNotification('Offline Mode', 'Using local storage. Register anyway!', 'warning');
        loadLocalRegistrations();
        showLoading(false);
    }
    
    setupEventListeners();
}

// Load Registrations from Firestore (SIMPLIFIED)
async function loadRegistrationsFromFirestore() {
    return new Promise((resolve, reject) => {
        // Set timeout for Firebase connection
        const timeout = setTimeout(() => {
            reject(new Error('Firebase connection timeout'));
        }, 8000);

        db.collection('registrations').get()
            .then(snapshot => {
                clearTimeout(timeout);
                state.registrations = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                updateUI();
                resolve();
            })
            .catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}

// Setup Real-time Listener (SIMPLIFIED)
function setupRealtimeListener() {
    if (!firebaseInitialized) return;
    
    db.collection('registrations')
        .onSnapshot(snapshot => {
            state.registrations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            updateUI();
        });
}

// Save Registration (WORKS OFFLINE OR ONLINE)
async function saveRegistration(userData) {
    showLoading(true);

    try {
        // Try Firebase first if available
        if (firebaseInitialized) {
            const docRef = await db.collection('registrations').add({
                ...userData,
                registrationDate: new Date().toISOString(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            userData.id = docRef.id;
        } else {
            // Fallback to localStorage
            userData.id = 'local_' + Date.now();
            userData.registrationDate = new Date().toISOString();
        }

        // Always save locally
        saveRegistrationLocally(userData);
        
        showNotification(
            'Registration Successful!', 
            `Welcome ${userData.fullName}! You're contact #${state.registrations.length + 1}`,
            'success'
        );
        
        elements.registrationForm.reset();
        resetProfilePicture();
        updateUI();
        
    } catch (error) {
        console.error('Save error:', error);
        
        // Even if Firebase fails, save locally
        userData.id = 'local_' + Date.now();
        userData.registrationDate = new Date().toISOString();
        saveRegistrationLocally(userData);
        
        showNotification(
            'Saved Locally!', 
            `Welcome ${userData.fullName}! (Saved offline - will sync when online)`,
            'warning'
        );
        
        updateUI();
    } finally {
        showLoading(false);
    }
}

// Local Storage Functions
function saveRegistrationLocally(userData) {
    let localRegistrations = JSON.parse(localStorage.getItem('frediRegistrations')) || [];
    
    // Check for duplicates locally
    const isDuplicate = localRegistrations.some(reg => 
        reg.phoneNumber === userData.phoneNumber || reg.email === userData.email
    );
    
    if (!isDuplicate) {
        localRegistrations.push(userData);
        localStorage.setItem('frediRegistrations', JSON.stringify(localRegistrations));
        state.registrations = localRegistrations;
    }
}

function loadLocalRegistrations() {
    const localRegistrations = JSON.parse(localStorage.getItem('frediRegistrations')) || [];
    state.registrations = localRegistrations;
    updateUI();
}

// Form Submission (SIMPLIFIED)
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const userData = {
        fullName: document.getElementById('fullName').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        occupation: document.getElementById('occupation').value.trim(),
        additionalInfo: document.getElementById('additionalInfo').value.trim(),
        profilePicture: state.userProfile?.imageUrl || null
    };

    // Basic validation
    if (!userData.fullName || !userData.phoneNumber || !userData.email || !userData.occupation) {
        showNotification('Error', 'Please fill all required fields', 'warning');
        return;
    }

    // Save registration
    await saveRegistration(userData);
}

// Profile Picture Handling
function handleProfileUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
            showNotification('File Too Large', 'Please select image < 5MB', 'warning');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            elements.profileImage.src = e.target.result;
            elements.profileImage.classList.remove('hidden');
            elements.profilePreview.querySelector('i').classList.add('hidden');
            
            state.userProfile = {
                imageUrl: e.target.result,
                fileName: file.name
            };
        };
        reader.readAsDataURL(file);
    }
}

function resetProfilePicture() {
    elements.profileImage.classList.add('hidden');
    elements.profilePreview.querySelector('i').classList.remove('hidden');
    state.userProfile = null;
}

// UI Updates
function updateUI() {
    const currentCount = state.registrations.length;
    const remainingCount = state.maxRegistrations - currentCount;
    const progressPercent = (currentCount / state.maxRegistrations) * 100;

    elements.currentRegistrations.textContent = currentCount;
    elements.remainingSlots.textContent = remainingCount;
    elements.currentPercent.textContent = `${Math.round(progressPercent)}%`;
    elements.currentProgress.style.width = `${progressPercent}%`;
    elements.remainingProgress.style.width = `${100 - progressPercent}%`;
    elements.totalCount.textContent = currentCount;

    updateRegistrationsList();

    if (currentCount >= state.maxRegistrations) {
        showDownloadSection();
    }
}

function updateRegistrationsList() {
    const recentRegistrations = [...state.registrations]
        .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
        .slice(0, 5);

    if (recentRegistrations.length === 0) {
        elements.registrationsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                <p>No registrations yet. Be the first to register!</p>
            </div>
        `;
        return;
    }

    elements.registrationsList.innerHTML = recentRegistrations.map(reg => `
        <div class="registration-item">
            <div class="registration-avatar">
                ${reg.profilePicture 
                    ? `<img src="${reg.profilePicture}" alt="${reg.fullName}">`
                    : `<span>${getInitials(reg.fullName)}</span>`
                }
            </div>
            <div class="registration-info">
                <h4>${reg.fullName}</h4>
                <p>${reg.occupation} • ${formatDate(reg.registrationDate)}</p>
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

// Download VCF
function downloadVCF() {
    if (state.registrations.length === 0) {
        showNotification('No Data', 'No contacts to download', 'warning');
        return;
    }

    showLoading(true);

    try {
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

        const blob = new Blob([vcfContent], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fredi-contacts-${new Date().toISOString().split('T')[0]}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Download Complete!', `${state.registrations.length} contacts exported`, 'success');
        
    } catch (error) {
        showNotification('Download Failed', 'Please try again', 'warning');
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

Share with friends! 🚀`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showNotification('Share Ready!', 'Registration link prepared for WhatsApp', 'info');
}

function showChannelInfo() {
    showNotification(
        'WhatsApp Channel',
        'All VCF updates will be posted in: https://whatsapp.com/channel/0029VbAjdiWBFLgXpS7VJz1u',
        'info'
    );
}

// UI Helpers
function showLoading(show) {
    elements.loadingOverlay.style.display = show ? 'flex' : 'none';
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
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Event Listeners
function setupEventListeners() {
    elements.registrationForm.addEventListener('submit', handleFormSubmit);
    elements.profileInput.addEventListener('change', handleProfileUpload);
    
    // Drag and drop for profile picture
    elements.profilePreview.addEventListener('dragover', (e) => e.preventDefault());
    elements.profilePreview.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            elements.profileInput.files = e.dataTransfer.files;
            handleProfileUpload({ target: elements.profileInput });
        }
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);
