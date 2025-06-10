document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const errorMessageElement = document.getElementById('error-message');

    // --- Firebase Config Placeholder ---
    // Ensure firebaseConfig in auth.js is replaced with your actual config
    // if (!firebaseConfig || firebaseConfig.apiKey === "YOUR_API_KEY") {
    //     if (errorMessageElement) {
    //         errorMessageElement.textContent = "FIREBASE IS NOT CONFIGURED. Please update auth.js";
    //     }
    //     console.error("FIREBASE IS NOT CONFIGURED. Please update auth.js with your Firebase project's configuration object.");
    //     // return; // Stop execution if Firebase is not configured
    // }


    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (errorMessageElement) errorMessageElement.textContent = ''; // Clear previous errors

            const { user, error } = await login(email, password);
            if (user) {
                console.log('Login successful, redirecting to chat...');
                window.location.href = 'chat.html'; // Redirect to chat page
            } else if (errorMessageElement) {
                errorMessageElement.textContent = error || 'Login failed. Please try again.';
            }
        });
    }

    // Handle Sign Up Form Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            if (errorMessageElement) errorMessageElement.textContent = ''; // Clear previous errors

            if (password.length < 6) {
                 if (errorMessageElement) errorMessageElement.textContent = 'Password should be at least 6 characters.';
                 return;
            }

            const { user, error } = await signUp(email, password);
            if (user) {
                console.log('Sign up successful, redirecting to chat...');
                window.location.href = 'chat.html'; // Redirect to chat page
            } else if (errorMessageElement) {
                errorMessageElement.textContent = error || 'Sign up failed. Please try again.';
            }
        });
    }

    // Monitor auth state to protect chat.html or redirect if not logged in
    // This should ideally be on a script included in chat.html or a global script
    if (window.location.pathname.endsWith('chat.html')) {
        onAuthStateChanged(user => {
            if (!user) {
                console.log('User not logged in, redirecting to login page.');
                window.location.href = 'index.html';
            } else {
                console.log('User is logged in:', user.email);
                // Initialize chat features here
            }
        });
    }
});
