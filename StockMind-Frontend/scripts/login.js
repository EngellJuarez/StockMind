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
            const companyAddress = document.getElementById('companyAddress').value;

            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }

            try {
                // 1. Verificar si el usuario ya existe
                const userCheckResponse = await fetch(`${API_URL}/users?filters[email][$eq]=${encodeURIComponent(email)}`);
                const userCheckData = await userCheckResponse.json();
                if (userCheckData && userCheckData.length > 0) {
                    alert('El usuario ya existe. Elige un email diferente.');
                    return;
                }

                // 2. Verificar si la empresa ya existe
                const empresaCheckResponse = await fetch(`${API_URL}/empresas?filters[Nombre][$eq]=${encodeURIComponent(companyName)}`);
                const empresaCheckData = await empresaCheckResponse.json();
                if (empresaCheckData.data && empresaCheckData.data.length > 0) {
                    alert('La empresa ya existe. Elige un nombre diferente.');
                    return;
                }

                // 3. Registrar Usuario
                const registerResponse = await fetch(`${API_URL}/auth/local/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password
                    })
                });

                const registerData = await registerResponse.json();
                if (!registerResponse.ok) {
                    alert('Error registrando usuario: ' + registerData.error?.message);
                    return;  // No se crea empresa
                }

                // 4. Crear Empresa
                const empresaResponse = await fetch(`${API_URL}/empresas`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        data: {
                            Nombre: companyName,
                            Telefono: phone,
                            Direccion: companyAddress,
                            FechaCreacion: new Date().toISOString()
                        }
                    })
                });
                const empresaData = await empresaResponse.json();
                if (!empresaResponse.ok) {
                    alert('Error creando empresa: ' + empresaData.error?.message);
                    // Si falla empresa, podrías borrar usuario, pero por simplicidad, informa
                    return;
                }

                // 5. Asignar empresa al usuario
                let empresaAsignada = false;
                try {
                    const updateResponse = await fetch(`${API_URL}/users/${registerData.user.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${registerData.jwt}`
                        },
                        body: JSON.stringify({
                            empresa: empresaData.data.id
                        })
                    });
                    if (updateResponse.ok) {
                        empresaAsignada = true;
                    }
                } catch (updateError) {
                    console.warn('No se pudo asignar empresa automáticamente:', updateError);
                }

                // 6. Guardar y redirigir solo si todo OK
                localStorage.setItem('stockmind_token', registerData.jwt);
                localStorage.setItem('stockmind_user', JSON.stringify(registerData.user));
                localStorage.setItem('stockmind_empresa_nombre', empresaData.data.Nombre);

                alert('Registro exitoso.');
                window.location.href = 'html/dashboard.html';
            } catch (error) {
                console.error('Register error:', error);
                alert('Error de conexión con el servidor');
            }
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
                console.log('Login data:', data);  // Log para ver respuesta

                if (response.ok) {
                    // Obtener usuario con empresa poblada
                    const userResponse = await fetch(`${API_URL}/users/${data.user.id}?populate=empresa`, {
                        headers: {
                            'Authorization': `Bearer ${data.jwt}`
                        }
                    });
                    const userData = await userResponse.json();
                    console.log('User data con empresa:', userData);  // Log para ver si tiene empresa
                    console.log('Empresa ID:', userData.empresa?.id);  // Log específico

                    let empresaId = userData.empresa?.id;
                    if (!empresaId) {
                        console.log('No tiene empresa, bloqueando');  // Log
                        alert('Tu usuario no tiene empresa asignada. Contacta al administrador.');
                        return;
                    }

                    console.log('Tiene empresa, guardando');  // Log
                    localStorage.setItem('stockmind_token', data.jwt);
                    localStorage.setItem('stockmind_user', JSON.stringify(userData));
                    localStorage.setItem('stockmind_empresa_nombre', userData.empresa.Nombre);

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

    // Check for remembered email
    const savedEmail = localStorage.getItem('stockmind_remember_email');
    if (savedEmail && document.getElementById('loginEmail')) {
        document.getElementById('loginEmail').value = savedEmail;
        document.getElementById('rememberMe').checked = true;
    }

})();
