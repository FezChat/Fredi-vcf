// Supabase Configuration
const SUPABASE_URL = 'https://xhsnuyouuzwrktyisnhv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc251eW91dXp3cmt0eWlzbmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDAyNjIsImV4cCI6MjA3OTg3NjI2Mn0.vUuFmMKUS8H5fYqStvWv8lQN-mnRfvBb-uGQd7LAZuE';

// Initialize Supabase client - FIXED VERSION
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Application State
let registeredUsers = 0;
const targetUsers = 500;
let countdownDate = new Date();
countdownDate.setDate(countdownDate.getDate() + 5);

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

// Debug function
function debugLog(message, data = null) {
    console.log(`[DEBUG] ${message}`, data || '');
    // You can also show this in a debug div if needed
}

// Initialize the application
async function initApp() {
    debugLog("🚀 Initializing app...");
    updateDashboard();
    startCountdown();
    setupEventListeners();
    await loadRegistrationData();
    setupRealtimeSubscription();
}

// Load registration data from Supabase
async function loadRegistrationData() {
    try {
        debugLog("📊 Loading registration data from Supabase...");
        
        const { data, error, count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact' });

        if (error) {
            debugLog("❌ Error loading data:", error);
            showNotification('Error loading registration data', 'error');
            return;
        }

        registeredUsers = count || 0;
        debugLog(`✅ Loaded ${registeredUsers} users from database`);
        updateDashboard();

        if (registeredUsers >= targetUsers) {
            showVcfDashboard();
        }

    } catch (error) {
        debugLog("❌ Catch error loading data:", error);
        showNotification('Error loading registration data', 'error');
    }
}

// Setup real-time subscription
function setupRealtimeSubscription() {
    debugLog("🔔 Setting up real-time subscription...");
    
    const subscription = supabase
        .channel('public:registrations')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'registrations' 
            }, 
            (payload) => {
                debugLog("🆕 New registration received:", payload);
                registeredUsers++;
                updateDashboard();
                
                if (registeredUsers % 50 === 0) {
                    showNotification(`We've reached ${registeredUsers} registrations! Keep sharing!`, "info");
                }
                
                if (registeredUsers >= targetUsers) {
                    showVcfDashboard();
                    showNotification("🎉 Target achieved! VCF file is now available", "success");
                }
            }
        )
        .subscribe((status) => {
            debugLog("📡 Subscription status:", status);
        });

    return subscription;
}

// Update dashboard
function updateDashboard() {
    const progress = (registeredUsers / targetUsers) * 100;
    const remaining = targetUsers - registeredUsers;
    
    debugLog(`📈 Dashboard update - Registered: ${registeredUsers}, Progress: ${progress}%`);
    
    registeredCountEl.textContent = registeredUsers;
    remainingCountEl.textContent = remaining;
    progressFillEl.style.width = `${progress}%`;
    progressPercentageEl.textContent = `${Math.round(progress)}%`;
    progressTextEl.textContent = `${registeredUsers} of ${targetUsers} registered`;
    
    updateCircleProgress('.circle-card.primary .circle-progress', progress);
    updateCircleProgress('.circle-card.success .circle-progress', (remaining / targetUsers) * 100);
    
    if (registeredUsers >= targetUsers) {
        showVcfDashboard();
    }
}

// Update circle progress
function updateCircleProgress(selector, progress) {
    const circle = document.querySelector(selector);
    if (circle) {
        circle.style.background = `conic-gradient(currentColor ${progress}%, rgba(255, 255, 255, 0.1) 0%)`;
    }
}

// Countdown timer
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

function checkTargetAchievement() {
    if (registeredUsers >= targetUsers) {
        showNotification("Target achieved! VCF file is now available", "success");
        showVcfDashboard();
    } else {
        showNotification("Time's up! We didn't reach the target of 500 registrations.", "error");
    }
}

function showVcfDashboard() {
    mainDashboard.style.display = 'none';
    vcfDashboard.style.display = 'block';
    finalCountEl.textContent = registeredUsers;
}

// Setup event listeners
function setupEventListeners() {
    debugLog("🔗 Setting up event listeners...");
    
    registerBtn.addEventListener('click', handleRegistration);
    userPhotoInput.addEventListener('change', handleProfilePictureUpload);
    downloadVcfBtn.addEventListener('click', handleVcfDownload);
    
    debugLog("✅ Event listeners setup complete");
}

function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Profile Preview';
            profilePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

// Handle user registration - SIMPLIFIED AND DEBUGGED
async function handleRegistration() {
    debugLog("🖱️ Register button clicked");
    
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    
    debugLog("📝 Form data:", { name, email, phone });
    
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

    // Disable button
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

    try {
        debugLog("🔍 Checking if user exists...");
        
        // Check if user exists
        const { data: existingUser, error: checkError } = await supabase
            .from('registrations')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (checkError) {
            debugLog("❌ Error checking user:", checkError);
        }

        if (existingUser) {
            showNotification("This email is already registered", "error");
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register Now';
            return;
        }
        
        debugLog("💾 Saving to database...");
        
        // Save to database
        const { data, error } = await supabase
            .from('registrations')
            .insert([
                { 
                    name: name, 
                    email: email, 
                    phone: phone,
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            debugLog("❌ Database error:", error);
            showNotification('Registration failed: ' + error.message, 'error');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register Now';
            return;
        }

        debugLog("✅ Registration successful:", data);
        
        // SUCCESS - Show notification immediately
        showNotification(`✅ Registration successful! Welcome ${name}`, "success");
        
        // Clear form
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userPhone').value = '';
        userPhotoInput.value = '';
        profilePreview.innerHTML = '<i class="fas fa-user"></i>';
        
        // Real-time update will handle the count increment
        
    } catch (error) {
        debugLog("❌ Catch error:", error);
        showNotification('Registration failed. Please try again.', 'error');
    } finally {
        // Re-enable button
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register Now';
    }
}

// Handle VCF download
async function handleVcfDownload() {
    try {
        const { data: users, error } = await supabase
            .from('registrations')
            .select('name, email, phone')
            .order('created_at', { ascending: true });

        if (error) {
            showNotification('Error generating VCF file', 'error');
            return;
        }

        const vcfContent = generateVcfFromUsers(users);
        const blob = new Blob([vcfContent], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `federico-contacts.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification("VCF file downloaded successfully!", "success");
    } catch (error) {
        showNotification('Error downloading VCF file', 'error');
    }
}

// Generate VCF - CLEAN NAMES ONLY
function generateVcfFromUsers(users) {
    let vcfContent = '';
    
    users.forEach((user) => {
        vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${user.name}
EMAIL:${user.email}
TEL:${user.phone}
END:VCARD

`;
    });
    
    return vcfContent;
}

// Validation functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    return cleanedPhone.length >= 10;
}

// Show notification
function showNotification(message, type) {
    debugLog(`💬 Notification: ${message}`, type);
    notificationEl.textContent = message;
    notificationEl.className = `notification ${type} show`;
    
    setTimeout(() => {
        notificationEl.classList.remove('show');
    }, 5000);
}

// Initialize app
document.addEventListener('DOMContentLoaded', initApp);
