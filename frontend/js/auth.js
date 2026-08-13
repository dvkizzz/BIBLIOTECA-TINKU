document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageBox = document.getElementById('messageBox');
    const submitBtn = document.getElementById('submitBtn');

    function showMessage(text, isError = false) {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `message ${isError ? 'error' : 'success'}`;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Iniciando sesión...';
                
                const data = await api.login(email, password);
                
                if (data.usuario.rol === 'admin') {
                    window.location.href = 'dashboard_admin.html';
                } else {
                    window.location.href = 'dashboard_usuario.html';
                }
            } catch (error) {
                showMessage(error.message, true);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Iniciar Sesión';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Registrando...';
                
                await api.register(nombre, email, password);
                showMessage('Registro exitoso. Redirigiendo al login...', false);
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } catch (error) {
                showMessage(error.message, true);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrarse';
            }
        });
    }
});
