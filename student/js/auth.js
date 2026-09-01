import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (errorMsg) errorMsg.textContent = '';

        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value || '';
        const btn = loginForm.querySelector('button');

        if (!email || !password) {
            if (errorMsg) errorMsg.textContent = 'Enter your email and password.';
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Authenticating...';
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = '../../role-router.html';
        } catch (error) {
            console.error('Student login error:', error);

            if (errorMsg) {
                switch (error.code) {
                    case 'auth/invalid-credential':
                    case 'auth/wrong-password':
                        errorMsg.textContent = 'Incorrect email or password.';
                        break;
                    case 'auth/user-not-found':
                        errorMsg.textContent = 'No account found with this email.';
                        break;
                    case 'auth/invalid-email':
                        errorMsg.textContent = 'Please enter a valid email address.';
                        break;
                    default:
                        errorMsg.textContent = error.message || 'Unable to sign in.';
                }
            }

            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        }
    });
});
