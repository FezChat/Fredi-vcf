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
let storage;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// App State
const state = {
    registrations: [],
    maxRegistrations: 1000,
    userProfile: null,
    isOnline: false
};

// DOM Elements (same as before)
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
async function initApp() {
    showLoading(true);
    
    try {
        // Check Firebase connection
        await checkFirebaseConnection();
        
        // Load registrations from Firestore
        await loadRegistrationsFromFirestore();
        
        // Setup real-time listener
        setupRealtimeListener();
        
        setupEventListeners();
        updateUI();
        
        showNotification('System Ready!', 'Fredi VCF is connected and ready.', 'success');
        
    } catch (error) {
        console.error('App initialization failed:', error);
        showNotification('Connection Issue', 'Using offline mode. Data may not sync across devices.', 'warning');
        loadLocalRegistrations();
    } finally {
        showLoading(false);
    }
}

// Check Firebase Connection
async function checkFirebaseConnection() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Firebase connection timeout'));
        }, 5000);

        db.collection('test').doc('connection').get()
            .then(() => {
                clearTimeout(timeout);
                state.isOnline = true;
                resolve();
            })
            .catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}

// Load Registrations from Firestore
async function loadRegistrationsFromFirestore() {
    try {
        const snapshot = await db.collection('registrations')
            .orderBy('registrationDate', 'desc')
            .limit(1000)
            .get();
        
        state.registrations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Loaded ${state.registrations.length} registrations from Firestore`);
        
    } catch (error) {
        console.error('Error loading from Firestore:', error);
        throw error;
    }
}

// Setup Real-time Listener
function setupRealtimeListener() {
    db.collection('registrations')
        .orderBy('registrationDate', 'desc')
        .limit(1000)
        .onSnapshot(snapshot => {
            state.registrations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            updateUI();
            
            // Show notification for new registrations (except on initial load)
            if (state.registrations.length > 0) {
                const latestRegistration = state.registrations[0];
                if (Date.now() - new Date(latestRegistration.registrationDate).getTime() < 10000) {
                    showNotification('New Registration', `${latestRegistration.fullName} just joined!`, 'info');
                }
            }
        }, error => {
            console.error('Real-time listener error:', error);
            showNotification('Sync Issue', 'Real-time updates paused.', 'warning');
        });
}

// Save Registration to Firestore
async function saveRegistrationToFirestore(userData) {
    try {
        // Check for duplicates in Firestore
        const duplicatePhone = await db.collection('registrations')
            .where('phoneNumber', '==', userData.phoneNumber)
            .get();
            
        const duplicateEmail = await db.collection('registrations')
            .where('email', '==', userData.email)
            .get();
        
        if (!duplicatePhone.empty) {
            throw new Error('Phone number already registered');
        }
        
        if (!duplicateEmail.empty) {
            throw new Error('Email already registered');
        }
        
        // Upload profile picture if exists
        if (state.userProfile && state.userProfile.imageUrl) {
            const imageUrl = await uploadProfilePicture(state.userProfile.imageUrl, userData.id);
            userData.profilePicture = imageUrl;
        }
        
        // Save to Firestore
        const docRef = await db.collection('registrations').add({
            ...userData,
            registrationDate: firebase.firestore.FieldValue.serverTimestamp(),
            device: getDeviceInfo(),
            ipAddress: await getIPAddress()
        });
        
        userData.id = docRef.id;
        return userData;
        
    } catch (error) {
        console.error('Error saving to Firestore:', error);
        throw error;
    }
}

// Upload Profile Picture to Firebase Storage
async function uploadProfilePicture(dataUrl, userId) {
    try {
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Upload to Firebase Storage
        const storageRef = storage.ref();
        const profileRef = storageRef.child(`profiles/${userId}-${Date.now()}.jpg`);
        
        const snapshot = await profileRef.put(blob);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        return downloadURL;
        
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw error;
    }
}

// Updated Form Submission with Firestore
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(elements.registrationForm);
    const userData = {
        fullName: document.getElementById('fullName').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        occupation: document.getElementById('occupation').value.trim(),
        additionalInfo: document.getElementById('additionalInfo').value.trim(),
        profilePicture: null,
        status: 'active'
    };

    // Validate form
    if (!validateForm(userData)) {
        return;
    }

    showLoading(true);

    try {
        // Save to Firestore
        const savedUser = await saveRegistrationToFirestore(userData);
        
        // Also save locally as backup
        saveRegistrationLocally(savedUser);
        
        showNotification(
            'Registration Successful!', 
            `Welcome ${userData.fullName}! You're contact #${state.registrations.length + 1}`, 
            'success'
        );
        
        // Reset form
        elements.registrationForm.reset();
        resetProfilePicture();
        
        // No need to call updateUI() - real-time listener will handle it
        
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.message.includes('already registered')) {
            showNotification('Already Registered', error.message, 'warning');
        } else {
            showNotification('Registration Failed', 'Please check your connection and try again.', 'warning');
        }
    } finally {
        showLoading(false);
    }
}

// Backup: Local Storage Functions
function saveRegistrationLocally(userData) {
    let localRegistrations = JSON.parse(localStorage.getItem('frediRegistrations')) || [];
    localRegistrations.push(userData);
    localStorage.setItem('frediRegistrations', JSON.stringify(localRegistrations));
}

function loadLocalRegistrations() {
    const localRegistrations = JSON.parse(localStorage.getItem('frediRegistrations')) || [];
    state.registrations = localRegistrations;
    updateUI();
}

// Utility Functions
function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: `${screen.width}x${screen.height}`
    };
}

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

// Download VCF from Firestore Data
async function downloadVCF() {
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
URL:${window.location.href}
REV:${contact.registrationDate}
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

        showNotification(
            'Download Complete!', 
            `${state.registrations.length} contacts exported successfully.`, 
            'success'
        );
        
        // Log download event
        await db.collection('downloads').add({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            count: state.registrations.length,
            userAgent: navigator.userAgent
        });
        
    } catch (error) {
        showNotification('Download Failed', 'Please try again later.', 'warning');
        console.error('Download error:', error);
    } finally {
        showLoading(false);
    }
}

// Admin Functions (Optional - for monitoring)
async function getStats() {
    try {
        const totalRegistrations = state.registrations.length;
        const uniqueDevices = [...new Set(state.registrations.map(r => r.device?.userAgent))].length;
        
        console.log('📊 Statistics:');
        console.log(`Total Registrations: ${totalRegistrations}`);
        console.log(`Unique Devices: ${uniqueDevices}`);
        console.log(`Completion: ${((totalRegistrations / state.maxRegistrations) * 100).toFixed(1)}%`);
        
        return {
            totalRegistrations,
            uniqueDevices,
            completionPercent: (totalRegistrations / state.maxRegistrations) * 100
        };
    } catch (error) {
        console.error('Error getting stats:', error);
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
