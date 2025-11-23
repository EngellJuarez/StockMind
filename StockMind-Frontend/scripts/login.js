// scripts/login.js
(function () {
    'use strict';

    const API_URL = 'http://localhost:1337/api';

    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    // Tab Switching Logic
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const targetTab = this.getAttribute('data-tab');

                // Remove active class from all tabs and forms
                tabBtns.forEach(tab => tab.classList.remove('active'));
                authForms.forEach(form => form.classList.remove('active'));

                // Add active class to clicked tab
                this.classList.add('active');

                // Show corresponding form
                if (targetTab === 'login') {
                    loginForm.classList.add('active');
                } else {
                    registerForm.classList.add('active');
                }
            });
        });
    }

    // Login Functionality
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            try {
                const response = await fetch(`${API_URL}/auth/local`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        identifier: email,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Save token and user info
                    localStorage.setItem('stockmind_token', data.jwt);
                    localStorage.setItem('stockmind_user', JSON.stringify(data.user));
                    
                    // If user has a company, save it too (assuming it's populated or we fetch it later)
                    // For now, we'll redirect and let the dashboard handle company fetching if needed
                    
                    if (rememberMe) {
                        localStorage.setItem('stockmind_remember_email', email);
                    } else {
                        localStorage.removeItem('stockmind_remember_email');
                    }

                    window.location.href = 'html/dashboard.html';
                } else {
                    alert('Error al iniciar sesión: ' + (data.error?.message || 'Credenciales inválidas'));
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Error de conexión con el servidor');
            }
        });
    }

    // Register Functionality
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = document.getElementById('fullName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const companyName = document.getElementById('companyName').value;
            const phone = document.getElementById('phone').value;

            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }

            try {
                // 1. Register the user
                const registerResponse = await fetch(`${API_URL}/auth/local/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password,
                        // Custom fields if your User Content Type has them, otherwise we might need a separate call
                        // Assuming standard Strapi register for now. 
                        // If you need to create a Company and link it, that's a more complex flow.
                        // For this MVP, we'll just register the user.
                    })
                });

                const data = await registerResponse.json();

                if (registerResponse.ok) {
                    // 2. (Optional) Create Company if needed, or just log them in
                    // For now, let's just log them in
                    localStorage.setItem('stockmind_token', data.jwt);
                    localStorage.setItem('stockmind_user', JSON.stringify(data.user));

                    alert('Registro exitoso. Bienvenido a StockMind.');
                    window.location.href = 'html/dashboard.html';
                } else {
                    alert('Error en el registro: ' + (data.error?.message || 'Error desconocido'));
                }
            } catch (error) {
                console.error('Register error:', error);
                alert('Error de conexión con el servidor');
            }
        });
    }

    // Check for remembered email
    const savedEmail = localStorage.getItem('stockmind_remember_email');
    if (savedEmail && document.getElementById('loginEmail')) {
        document.getElementById('loginEmail').value = savedEmail;
        document.getElementById('rememberMe').checked = true;
    }

})();
