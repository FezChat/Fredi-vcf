// Supabase Configuration
const SUPABASE_URL = 'https://xhsnuyouuzwrktyisnhv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc251eW91dXp3cmt0eWlzbmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDAyNjIsImV4cCI6MjA3OTg3NjI2Mn0.vUuFmMKUS8H5fYqStvWv8lQN-mnRfvBb-uGQd7LAZuE';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    updateDashboard();
    startCountdown();
    setupEventListeners();
    await loadRegistrationData();
    setupRealtimeSubscription();
}

// Load registration data from Supabase
async function loadRegistrationData() {
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('*');

        if (error) {
            console.error('Error loading registration data:', error);
            showNotification('Error loading registration data', 'error');
            return;
        }

        registeredUsers = data ? data.length : 0;
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
    const subscription = supabase
        .channel('registrations')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'registrations' 
            }, 
            (payload) => {
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
        .subscribe();

    return subscription;
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
    const profileFile = userPhotoInput.files[0];
    
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

    // Check if user already exists
    const { data: existingUser } = await supabase
        .from('registrations')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
        showNotification("This email is already registered", "error");
        return;
    }
    
    try {
        let profilePictureUrl = null;

        // Upload profile picture if provided
        if (profileFile) {
            const fileExt = profileFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(fileName, profileFile);

            if (uploadError) {
                console.error('Error uploading profile picture:', uploadError);
            } else {
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(fileName);
                
                profilePictureUrl = urlData.publicUrl;
            }
        }

        // Save registration to database
        const { data, error } = await supabase
            .from('registrations')
            .insert([
                { 
                    name: name, 
                    email: email, 
                    phone: phone, 
                    profile_picture: profilePictureUrl,
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Registration error:', error);
            showNotification('Registration failed. Please try again.', 'error');
            return;
        }

        // Note: The real-time subscription will update the count automatically
        // So we don't need to manually increment registeredUsers here

        // Show success message
        showNotification(`Registration successful! Welcome to Federico VCF Tanzania`, "success");
        
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

// Generate VCF content from users data
function generateVcfFromUsers(users) {
    let vcfContent = '';
    
    users.forEach((user, index) => {
        vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${user.name || 'Federico User'}
EMAIL:${user.email}
TEL:${user.phone}
NOTE:Registered user #${index + 1} - Federico VCF Tanzania
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
    notificationEl.textContent = message;
    notificationEl.className = `notification ${type} show`;
    
    setTimeout(() => {
        notificationEl.classList.remove('show');
    }, 5000);
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initApp);
