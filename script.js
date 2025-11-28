// Supabase Configuration
const SUPABASE_URL = 'https://xhsnuyouuzwrktyisnhv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc251eW91dXp3cmt0eWlzbmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDAyNjIsImV4cCI6MjA3OTg3NjI2Mn0.vUuFmMKUS8H5fYqStvWv8lQN-mnRfvBb-uGQd7LAZuE';

// Initialize Supabase client - FIXED
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

// Initialize the application
async function initApp() {
    console.log("Initializing app...");
    updateDashboard();
    startCountdown();
    setupEventListeners();
    await loadRegistrationData();
    setupRealtimeSubscription();
}

// Load registration data from Supabase
async function loadRegistrationData() {
    try {
        console.log("Loading registration data...");
        const { data, error, count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact' });

        if (error) {
            console.error('Error loading registration data:', error);
            showNotification('Error loading registration data: ' + error.message, 'error');
            return;
        }

        registeredUsers = count || 0;
        console.log("Loaded users:", registeredUsers);
        updateDashboard();

        // Check if target is already reached
        if (registeredUsers >= targetUsers) {
            showVcfDashboard();
        }

    } catch (error) {
        console.error('Error loading registration data:', error);
        showNotification('Error loading registration data', 'error');
    }
}

// Setup real-time subscription for new registrations
function setupRealtimeSubscription() {
    console.log("Setting up real-time subscription...");
    const subscription = supabase
        .channel('registrations')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'registrations' 
            }, 
            (payload) => {
                console.log('New registration received:', payload);
                // New registration added
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
        )
        .subscribe((status) => {
            console.log('Subscription status:', status);
        });

    return subscription;
}

// Update dashboard with current data
function updateDashboard() {
    const progress = (registeredUsers / targetUsers) * 100;
    const remaining = targetUsers - registeredUsers;
    
    console.log("Updating dashboard - Registered:", registeredUsers, "Progress:", progress);
    
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
    console.log("Setting up event listeners...");
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

// Handle user registration - SIMPLIFIED VERSION
async function handleRegistration() {
    console.log("Registration button clicked");
    
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    
    console.log("Form data:", { name, email, phone });
    
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

    // Disable button to prevent double registration
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering...';

    try {
        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('registrations')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (checkError) {
            console.error('Error checking existing user:', checkError);
        }

        if (existingUser) {
            showNotification("This email is already registered", "error");
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register Now';
            return;
        }
        
        // Save registration to database - WITHOUT profile picture first
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
            console.error('Registration error:', error);
            showNotification('Registration failed: ' + error.message, 'error');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register Now';
            return;
        }

        console.log('Registration successful:', data);

        // Show success message with ACTUAL name
        showNotification(`Registration successful! Welcome ${name} to Federico VCF Tanzania`, "success");
        
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
    } finally {
        // Re-enable button
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register Now';
    }
}

// Handle VCF download
async function handleVcfDownload() {
    try {
        // Fetch all registered users
        const { data: users, error } = await supabase
            .from('registrations')
            .select('name, email, phone')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching users:', error);
            showNotification('Error generating VCF file', 'error');
            return;
        }

        // Generate VCF content
        const vcfContent = generateVcfFromUsers(users);
        const blob = new Blob([vcfContent], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `federico-contacts-${new Date().toISOString().split('T')[0]}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification("VCF file downloaded successfully! Follow the instructions to import.", "success");
    } catch (error) {
        console.error('VCF download error:', error);
        showNotification('Error downloading VCF file', 'error');
    }
}

// Generate VCF content from users data - CLEAN NAMES ONLY
function generateVcfFromUsers(users) {
    let vcfContent = '';
    
    users.forEach((user, index) => {
        // Use EXACT name as provided - no additions
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

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone format
function validatePhone(phone) {
    // Remove all non-digit characters except +
    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    return cleanedPhone.length >= 10;
}

// Show notification
function showNotification(message, type) {
    console.log("Showing notification:", message, type);
    notificationEl.textContent = message;
    notificationEl.className = `notification ${type} show`;
    
    setTimeout(() => {
        notificationEl.classList.remove('show');
    }, 5000);
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initApp);
