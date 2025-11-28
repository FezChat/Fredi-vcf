// Supabase Configuration
const SUPABASE_URL = 'https://xhsnuyouuzwrktyisnhv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc251eW91dXp3cmt0eWlzbmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDAyNjIsImV4cCI6MjA3OTg3NjI2Mn0.vUuFmMKUS8H5fYqStvWv8lQN-mnRfvBb-uGQd7LAZuE';

// Application State
let registeredUsers = 0;
const targetUsers = 500;
let countdownDate = new Date();
countdownDate.setDate(countdownDate.getDate() + 5); // 5 days from now

// DOM Elements
const mainDashboard = document.getElementById('mainDashboard');
const vcfDashboard = document.getElementById('vcfDashboard');
const registeredCountEl = document.getElementById('registeredCount');
const remainingCountEl = document.getElementById('remainingCount');
const progressFillEl = document.getElementById('progressFill');
const progressPercentageEl = document.getElementById('progressPercentage');
const progressTextEl = document.getElementById('progressText');
const countdownTimerEl = document.getElementById('countdownTimer');
const timerMessageEl = document.getElementById('timerMessage');
const registerBtn = document.getElementById('registerBtn');
const downloadVcfBtn = document.getElementById('downloadVcf');
const notificationEl = document.getElementById('notification');
const finalCountEl = document.getElementById('finalCount');
const profilePreview = document.getElementById('profilePreview');
const userPhotoInput = document.getElementById('userPhoto');

// Initialize the application
function initApp() {
    updateDashboard();
    startCountdown();
    setupEventListeners();
    // Start with empty data - will be populated from Supabase
    loadRegistrationData();
}

// Load registration data from Supabase
async function loadRegistrationData() {
    try {
        // In a real implementation, you would fetch from Supabase
        // const { data, error } = await supabase.from('registrations').select('*');
        // registeredUsers = data.length;
        
        // For demo, we'll start with 0 and simulate real-time updates
        registeredUsers = 0;
        updateDashboard();
        
        // Simulate real-time updates (replace with Supabase real-time subscription)
        simulateRealTimeUpdates();
        
    } catch (error) {
        console.error('Error loading registration data:', error);
        showNotification('Error loading registration data', 'error');
    }
}

// Update dashboard with current data
function updateDashboard() {
    const progress = (registeredUsers / targetUsers) * 100;
    const remaining = targetUsers - registeredUsers;
    
    // Update circle values
    registeredCountEl.textContent = registeredUsers;
    remainingCountEl.textContent = remaining;
    
    // Update progress bars
    progressFillEl.style.width = `${progress}%`;
    progressPercentageEl.textContent = `${Math.round(progress)}%`;
    progressTextEl.textContent = `${registeredUsers} of ${targetUsers} registered`;
    
    // Update circle progress animations
    updateCircleProgress('.circle-card.primary .circle-progress', progress);
    updateCircleProgress('.circle-card.success .circle-progress', (remaining / targetUsers) * 100);
    
    // Check if target is reached
    if (registeredUsers >= targetUsers) {
        showVcfDashboard();
    }
}

// Update circle progress animation
function updateCircleProgress(selector, progress) {
    const circle = document.querySelector(selector);
    if (circle) {
        circle.style.background = `conic-gradient(currentColor ${progress}%, rgba(255, 255, 255, 0.1) 0%)`;
    }
}

// Start the countdown timer
function startCountdown() {
    function updateTimer() {
        const now = new Date().getTime();
        const distance = countdownDate.getTime() - now;
        
        if (distance < 0) {
            countdownTimerEl.textContent = "Time's Up!";
            timerMessageEl.textContent = "Registration period has ended";
            checkTargetAchievement();
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        countdownTimerEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        // Update message based on progress
        if (registeredUsers >= targetUsers) {
            timerMessageEl.textContent = "Target achieved! VCF file is now available";
        } else if (days === 0) {
            timerMessageEl.textContent = "Last day to reach the target!";
        } else {
            timerMessageEl.textContent = "Help us reach 500 registrations!";
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Check if target was achieved before time ended
function checkTargetAchievement() {
    if (registeredUsers >= targetUsers) {
        showNotification("Target achieved! VCF file is now available", "success");
        showVcfDashboard();
    } else {
        showNotification("Time's up! We didn't reach the target of 500 registrations.", "error");
    }
}

// Show VCF dashboard
function showVcfDashboard() {
    mainDashboard.style.display = 'none';
    vcfDashboard.style.display = 'block';
    finalCountEl.textContent = registeredUsers;
}

// Setup event listeners
function setupEventListeners() {
    // Registration button
    registerBtn.addEventListener('click', handleRegistration);
    
    // Profile picture upload
    userPhotoInput.addEventListener('change', handleProfilePictureUpload);
    
    // Download VCF button
    downloadVcfBtn.addEventListener('click', handleVcfDownload);
}

// Handle profile picture upload
function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Clear existing content
            profilePreview.innerHTML = '';
            
            // Create and add image
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Profile Preview';
            profilePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

// Handle user registration
async function handleRegistration() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    
    // Validation
    if (!name || !email || !phone) {
        showNotification("Please fill in all required fields", "error");
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification("Please enter a valid email address", "error");
        return;
    }
    
    if (!validatePhone(phone)) {
        showNotification("Please enter a valid phone number", "error");
        return;
    }
    
    try {
        // In a real implementation, you would save to Supabase
        // const { data, error } = await supabase
        //     .from('registrations')
        //     .insert([{ name, email, phone, profile_picture: profilePictureUrl }]);
        
        // For demo, we'll simulate successful registration
        registeredUsers++;
        updateDashboard();
        
        // Show success message
        showNotification(`Registration successful! You are user #${registeredUsers}`, "success");
        
        // Clear form
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userPhone').value = '';
        userPhotoInput.value = '';
        
        // Reset profile preview
        profilePreview.innerHTML = '<i class="fas fa-user"></i>';
        
        // Show encouragement message
        setTimeout(() => {
            showNotification("Share the registration link with friends to help reach our target faster!", "info");
        }, 3000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

// Handle VCF download
function handleVcfDownload() {
    // In a real app, this would download the actual VCF file from Supabase
    // For demo, we'll create a simple VCF file
    const vcfContent = createSampleVcf();
    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'federico-contacts.vcf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification("VCF file downloaded successfully! Follow the instructions to import.", "success");
}

// Create sample VCF content
function createSampleVcf() {
    return `BEGIN:VCARD
VERSION:3.0
FN:Federico Community
ORG:Federico VCF Tanzania
TEL:+255752593977
EMAIL:frediezra360@gmail.com 
END:VCARD

BEGIN:VCARD
VERSION:3.0
FN:Fredi Ezra
ORG:Federico Developer
TEL:+255764182801
EMAIL:frediezra360@gmail.com 
END:VCARD`;
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone format
function validatePhone(phone) {
    // Basic phone validation - adjust for your needs
    const re = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return re.test(phone);
}

// Show notification
function showNotification(message, type) {
    notificationEl.textContent = message;
    notificationEl.className = `notification ${type} show`;
    
    setTimeout(() => {
        notificationEl.classList.remove('show');
    }, 5000);
}

// Simulate real-time updates (replace with Supabase real-time)
function simulateRealTimeUpdates() {
    // This would be replaced with Supabase real-time subscription
    setInterval(() => {
        // In real app, this would come from Supabase real-time updates
        // For demo, we'll occasionally add a user
        if (Math.random() > 0.7 && registeredUsers < targetUsers) {
            registeredUsers++;
            updateDashboard();
            
            // Show progress notification occasionally
            if (registeredUsers % 50 === 0) {
                showNotification(`We've reached ${registeredUsers} registrations! Keep sharing!`, "info");
            }
            
            // If target is reached, show VCF dashboard
            if (registeredUsers >= targetUsers) {
                showVcfDashboard();
                showNotification("Target achieved! VCF file is now available", "success");
            }
        }
    }, 10000); // Check every 10 seconds
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initApp);
