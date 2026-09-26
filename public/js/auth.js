// auth.js
// Handles user authentication, session state, and UI routing guard for Element Chess

(function() {
    // Suppress credentials by default; if user defines these in window, it will use real Supabase
    const SUPABASE_URL = window.SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
    let supabase = null;

    if (SUPABASE_URL && SUPABASE_ANON_KEY && typeof supabase !== 'undefined') {
        try {
            supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
            console.error('Failed to initialize Supabase client:', e);
        }
    }

    // Dynamic avatars for different magic alignments
    const MOCK_AVATARS = [
        '🧙‍♂️', '⚡', '🔥', '💧', '🌿', '❄️', '🌋', '🌪️', '⚔️', '🔮'
    ];

    const GUEST_MONIKERS = [
        'Fire Mage', 'Frost Mage', 'Storm Sorcerer', 'Earth Druid', 'Abyss Warlock',
        'Lunar Cleric', 'Solar Templar', 'Aero Elementalist', 'Verdant Shaman', 'Void Adept'
    ];

    // Helper to generate dynamic Guest name
    function generateGuestMoniker() {
        const title = GUEST_MONIKERS[Math.floor(Math.random() * GUEST_MONIKERS.length)];
        const number = Math.floor(Math.random() * 900) + 100; // 100 - 999
        return `${title} #${number}`;
    }

    // Helper to get random avatar icon
    function getRandomAvatar() {
        return MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)];
    }

    class AuthenticationManager {
        constructor() {
            this.currentUser = null;
            this.onAuthStateChangeCallbacks = [];
            this.initSession();
        }

        /** Initialize session from Supabase or localStorage fallback */
        initSession() {
            if (supabase) {
                // Listen to Supabase Auth changes
                supabase.auth.onAuthStateChange((event, session) => {
                    if (session && session.user) {
                        const user = session.user;
                        this.currentUser = {
                            uid: user.id,
                            displayName: user.user_metadata?.full_name || user.email.split('@')[0],
                            photoURL: user.user_metadata?.avatar_url || '👤',
                            email: user.email,
                            provider: user.app_metadata?.provider || 'email'
                        };
                    } else {
                        this.currentUser = null;
                    }
                    this._triggerAuthStateChange();
                });
            } else {
                // LocalStorage mock session fallback
                const sessionStr = localStorage.getItem('element_chess_session');
                if (sessionStr) {
                    try {
                        this.currentUser = JSON.parse(sessionStr);
                    } catch (e) {
                        this.currentUser = null;
                    }
                }
                // Trigger initial state
                setTimeout(() => this._triggerAuthStateChange(), 50);
            }
        }

        /** Register a callback for auth state changes */
        onAuthStateChange(callback) {
            this.onAuthStateChangeCallbacks.push(callback);
            // Trigger immediately if user is loaded
            if (this.currentUser) {
                callback(this.currentUser);
            }
        }

        _triggerAuthStateChange() {
            this.onAuthStateChangeCallbacks.forEach(cb => cb(this.currentUser));
            this.applyRoutingGuard();
        }

        /** Render UI panels based on session presence */
        applyRoutingGuard() {
            const authContainer = document.getElementById('auth-container');
            const gameLobby = document.getElementById('game-lobby');

            if (!authContainer || !gameLobby) return;

            if (this.currentUser) {
                authContainer.classList.add('hidden');
                gameLobby.classList.remove('hidden');
                
                // Update player identity on the lobby interface
                const p1Name = document.getElementById('p1-name');
                const p1Avatar = document.getElementById('p1-avatar');
                
                if (p1Name) {
                    p1Name.innerText = `${this.currentUser.displayName} (White)`;
                }
                if (p1Avatar) {
                    const photo = this.currentUser.photoURL;
                    if (photo && (photo.startsWith('http') || photo.startsWith('data:image'))) {
                        p1Avatar.innerHTML = `<img src="${photo}" class="w-full h-full rounded-full object-cover" alt="avatar" />`;
                    } else {
                        p1Avatar.innerText = photo || '🧙‍♂️';
                    }
                }
            } else {
                gameLobby.classList.add('hidden');
                authContainer.classList.remove('hidden');
            }
        }

        /** Sign up using Email and Password */
        async signUp(email, password, displayName) {
            if (supabase) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: displayName
                        }
                    }
                });
                if (error) throw error;
                return data.user;
            } else {
                // Mock execution
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        const mockUsers = JSON.parse(localStorage.getItem('element_chess_mock_users') || '{}');
                        if (mockUsers[email]) {
                            reject(new Error('Email already registered.'));
                            return;
                        }
                        
                        const uid = 'mock_usr_' + Math.random().toString(36).slice(2, 11);
                        const newUser = {
                            uid,
                            email,
                            password,
                            displayName: displayName || email.split('@')[0],
                            photoURL: getRandomAvatar(),
                            provider: 'email'
                        };
                        
                        mockUsers[email] = newUser;
                        localStorage.setItem('element_chess_mock_users', JSON.stringify(mockUsers));
                        
                        // Auto login after signup in mock mode
                        this.currentUser = {
                            uid: newUser.uid,
                            displayName: newUser.displayName,
                            photoURL: newUser.photoURL,
                            email: newUser.email,
                            provider: 'email'
                        };
                        localStorage.setItem('element_chess_session', JSON.stringify(this.currentUser));
                        this._triggerAuthStateChange();
                        resolve(newUser);
                    }, 500);
                });
            }
        }

        /** Log in with Email and Password */
        async signIn(email, password) {
            if (supabase) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                return data.user;
            } else {
                // Mock execution
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        const mockUsers = JSON.parse(localStorage.getItem('element_chess_mock_users') || '{}');
                        const user = mockUsers[email];
                        if (!user || user.password !== password) {
                            reject(new Error('Invalid email or password.'));
                            return;
                        }
                        
                        this.currentUser = {
                            uid: user.uid,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            email: user.email,
                            provider: 'email'
                        };
                        localStorage.setItem('element_chess_session', JSON.stringify(this.currentUser));
                        this._triggerAuthStateChange();
                        resolve(user);
                    }, 500);
                });
            }
        }

        /** Sign in instantly as a Guest */
        signInAsGuest() {
            const guestUser = {
                uid: 'guest_' + Math.random().toString(36).slice(2, 11),
                displayName: generateGuestMoniker(),
                photoURL: getRandomAvatar(),
                email: null,
                provider: 'guest'
            };

            this.currentUser = guestUser;
            localStorage.setItem('element_chess_session', JSON.stringify(this.currentUser));
            this._triggerAuthStateChange();
            return Promise.resolve(guestUser);
        }

        /** Sign in via OAuth (Google or Facebook) */
        async signInWithOAuth(provider) {
            if (supabase) {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: provider
                });
                if (error) throw error;
                return data;
            } else {
                // Trigger a beautifully styled mock consent overlay or standard small popup window
                return new Promise((resolve) => {
                    const width = 500;
                    const height = 600;
                    const left = (window.screen.width - width) / 2;
                    const top = (window.screen.height - height) / 2;
                    
                    const popup = window.open('', `${provider}_oauth`, `width=${width},height=${height},top=${top},left=${left}`);
                    
                    if (popup) {
                        const capitalizedProvider = provider.charAt(0).toUpperCase() + provider.slice(1);
                        popup.document.write(`
                            <html>
                            <head>
                                <title>Sign in with ${capitalizedProvider}</title>
                                <script src="https://cdn.tailwindcss.com"></script>
                                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
                                <style>
                                    body { font-family: 'Outfit', sans-serif; }
                                </style>
                            </head>
                            <body class="bg-gray-900 text-white flex flex-col items-center justify-center h-screen p-6">
                                <div class="w-full max-w-sm bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-2xl text-center">
                                    <div class="text-3xl mb-4">${provider === 'google' ? '🔴' : '🔵'}</div>
                                    <h2 class="text-xl font-bold mb-2">Authorize Element Chess</h2>
                                    <p class="text-sm text-gray-400 mb-6">Select a profile to continue authentication with ${capitalizedProvider}:</p>
                                    
                                    <div class="flex flex-col gap-3">
                                        <button onclick="selectUser('Frost Elementalist', '❄️')" class="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-4 rounded-xl font-semibold border border-gray-600 transition-colors flex items-center gap-3">
                                            <span>❄️</span> <span class="text-left flex-1">Frost Elementalist</span>
                                        </button>
                                        <button onclick="selectUser('Pyromancer King', '🔥')" class="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-4 rounded-xl font-semibold border border-gray-600 transition-colors flex items-center gap-3">
                                            <span>🔥</span> <span class="text-left flex-1">Pyromancer King</span>
                                        </button>
                                        <button onclick="selectUser('Thunder Sage', '⚡')" class="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-4 rounded-xl font-semibold border border-gray-600 transition-colors flex items-center gap-3">
                                            <span>⚡</span> <span class="text-left flex-1">Thunder Sage</span>
                                        </button>
                                    </div>
                                </div>
                                <script>
                                    function selectUser(name, emoji) {
                                        window.opener.postMessage({
                                            type: 'OAUTH_SUCCESS',
                                            provider: '${provider}',
                                            displayName: name,
                                            photoURL: emoji,
                                            uid: 'oauth_' + '${provider}_' + Math.random().toString(36).slice(2, 10)
                                        }, '*');
                                        window.close();
                                    }
                                </script>
                            </body>
                            </html>
                        `);
                        popup.document.close();
                    }

                    // Listen to messaging postMessage from popup
                    const messageListener = (event) => {
                        if (event.data && event.data.type === 'OAUTH_SUCCESS' && event.data.provider === provider) {
                            window.removeEventListener('message', messageListener);
                            
                            this.currentUser = {
                                uid: event.data.uid,
                                displayName: event.data.displayName,
                                photoURL: event.data.photoURL,
                                email: `${event.data.displayName.toLowerCase().replace(/\s+/g, '')}@${provider}-mock.com`,
                                provider: provider
                            };
                            
                            localStorage.setItem('element_chess_session', JSON.stringify(this.currentUser));
                            this._triggerAuthStateChange();
                            resolve(this.currentUser);
                        }
                    };

                    window.addEventListener('message', messageListener);
                });
            }
        }

        /** Log out from current session */
        async signOut() {
            if (supabase) {
                const { error } = await supabase.auth.signOut();
                if (error) console.error('Supabase signOut error:', error);
            }
            
            // Clean local storage state
            this.currentUser = null;
            localStorage.removeItem('element_chess_session');
            this._triggerAuthStateChange();
            return Promise.resolve();
        }

        getCurrentUser() {
            return this.currentUser;
        }
    }

    // Expose authentication globally
    window.authManager = new AuthenticationManager();

    // ── DOM Event Bindings ──────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const authForm = document.getElementById('auth-form');
        const authTitle = document.getElementById('auth-title');
        const authSubtitle = document.getElementById('auth-subtitle');
        const authSubmitBtn = document.getElementById('auth-submit-btn');
        const authToggleBtn = document.getElementById('auth-toggle-btn');
        const authToggleText = document.getElementById('auth-toggle-text');
        const nameFieldGroup = document.getElementById('name-field-group');
        const regNameInput = document.getElementById('reg-name');
        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        const togglePwBtn = document.getElementById('toggle-pw-btn');
        const authAlert = document.getElementById('auth-alert');
        
        const googleBtn = document.getElementById('google-btn');
        const facebookBtn = document.getElementById('facebook-btn');
        const guestBtn = document.getElementById('guest-btn');
        const logoutBtn = document.getElementById('logout-btn');

        let mode = 'signin'; // 'signin' or 'signup'

        function showAlert(msg, type = 'error') {
            if (!authAlert) return;
            authAlert.innerText = msg;
            authAlert.classList.remove('hidden', 'bg-red-900/20', 'text-red-400', 'border-red-500/50', 'bg-green-900/20', 'text-green-400', 'border-green-500/50');
            
            if (type === 'error') {
                authAlert.classList.add('bg-red-900/20', 'text-red-400', 'border-red-500/50');
            } else {
                authAlert.classList.add('bg-green-900/20', 'text-green-400', 'border-green-500/50');
            }
        }

        function hideAlert() {
            if (authAlert) authAlert.classList.add('hidden');
        }

        // Toggle password visibility
        if (togglePwBtn && passwordInput) {
            togglePwBtn.addEventListener('click', () => {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    togglePwBtn.innerText = 'Hide';
                } else {
                    passwordInput.type = 'password';
                    togglePwBtn.innerText = 'Show';
                }
            });
        }

        // Switch between Login and Signup modes
        if (authToggleBtn) {
            authToggleBtn.addEventListener('click', () => {
                hideAlert();
                if (mode === 'signin') {
                    mode = 'signup';
                    authTitle.innerText = 'Form Alignment';
                    authSubtitle.innerText = 'Choose your wizard moniker and register.';
                    authSubmitBtn.innerText = '⚔ Summon Account';
                    nameFieldGroup.classList.remove('hidden');
                    regNameInput.required = true;
                    authToggleText.innerText = 'Already have a moniker?';
                    authToggleBtn.innerText = 'Sign In';
                } else {
                    mode = 'signin';
                    authTitle.innerText = 'Enter Arena';
                    authSubtitle.innerText = 'Summon your magic and access the lobby.';
                    authSubmitBtn.innerText = '⚔ Enter Lobby';
                    nameFieldGroup.classList.add('hidden');
                    regNameInput.required = false;
                    authToggleText.innerText = 'New to the elements?';
                    authToggleBtn.innerText = 'Create Account';
                }
            });
        }

        // Submit form (Email sign-in/sign-up)
        if (authForm) {
            authForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                hideAlert();

                const email = emailInput.value.trim();
                const password = passwordInput.value;
                const displayName = regNameInput ? regNameInput.value.trim() : '';

                if (password.length < 6) {
                    showAlert('Password must be at least 6 characters long.');
                    return;
                }

                authSubmitBtn.disabled = true;
                const originalText = authSubmitBtn.innerText;
                authSubmitBtn.innerText = 'Casting spell...';

                try {
                    if (mode === 'signup') {
                        await window.authManager.signUp(email, password, displayName);
                        showAlert('Account created! Entering lobby...', 'success');
                    } else {
                        await window.authManager.signIn(email, password);
                        showAlert('Welcome back! Entering lobby...', 'success');
                    }
                } catch (err) {
                    showAlert(err.message || 'An error occurred during authentication.');
                    authSubmitBtn.disabled = false;
                    authSubmitBtn.innerText = originalText;
                }
            });
        }

        // OAuth Sign-in Handlers
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                hideAlert();
                try {
                    await window.authManager.signInWithOAuth('google');
                } catch (err) {
                    showAlert(err.message || 'Google OAuth failed.');
                }
            });
        }

        if (facebookBtn) {
            facebookBtn.addEventListener('click', async () => {
                hideAlert();
                try {
                    await window.authManager.signInWithOAuth('facebook');
                } catch (err) {
                    showAlert(err.message || 'Facebook OAuth failed.');
                }
            });
        }

        // Guest Handler
        if (guestBtn) {
            guestBtn.addEventListener('click', async () => {
                hideAlert();
                try {
                    await window.authManager.signInAsGuest();
                } catch (err) {
                    showAlert(err.message || 'Guest login failed.');
                }
            });
        }

        // Logout Handler
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await window.authManager.signOut();
                    if (window.gameInstance) {
                        window.gameInstance.resetGame();
                    }
                } catch (err) {
                    console.error('Logout error:', err);
                }
            });
        }

        // Check initial routing state
        window.authManager.applyRoutingGuard();
    });
})();
