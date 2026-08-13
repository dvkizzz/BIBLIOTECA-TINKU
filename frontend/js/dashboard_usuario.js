document.addEventListener('DOMContentLoaded', () => {
    const currentUser = api.getCurrentUser();
    
    if (!currentUser || currentUser.rol !== 'usuario') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('welcomeMsg').textContent = `Bienvenido, ${currentUser.nombre}`;
    document.getElementById('perfilNombre').value = currentUser.nombre;
    document.getElementById('perfilEmail').value = currentUser.email;

    const prestamosBody = document.getElementById('prestamosBody');
    const reservasBody = document.getElementById('reservasBody');
    const messageBox = document.getElementById('messageBox');

    document.getElementById('logoutBtn').addEventListener('click', () => {
        api.logout();
    });

    function showMessage(text, isError = false) {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `message ${isError ? 'error' : 'success'}`;
        messageBox.style.display = 'block';
        setTimeout(() => messageBox.style.display = 'none', 3000);
    }

    function formatDate(isoString) {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    async function loadDashboardData() {
        try {
            const prestamos = await api.fetch('/prestamos/mis-prestamos');
            if (prestamos.length === 0) {
                prestamosBody.innerHTML = '<tr><td colspan="5">No tienes préstamos registrados.</td></tr>';
            } else {
                prestamosBody.innerHTML = prestamos.map(p => `
                    <tr>
                        <td>${p.libros?.titulo || 'Libro Desconocido'}</td>
                        <td>${formatDate(p.fecha_prestamo)}</td>
                        <td>${formatDate(p.fecha_vencimiento)}</td>
                        <td>$${p.multa}</td>
                        <td><span class="status ${p.estado}">${p.estado.toUpperCase()}</span></td>
                    </tr>
                `).join('');
            }

            const reservas = await api.fetch('/reservas/mis-reservas');
            if (reservas.length === 0) {
                reservasBody.innerHTML = '<tr><td colspan="3">No tienes reservas realizadas.</td></tr>';
            } else {
                reservasBody.innerHTML = reservas.map(r => `
                    <tr>
                        <td>${r.libros?.titulo || 'Libro Desconocido'}</td>
                        <td>${formatDate(r.fecha_reserva)}</td>
                        <td><span class="status ${r.estado}">${r.estado.toUpperCase()}</span></td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            showMessage('Error al cargar la información: ' + error.message, true);
        }
    }

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        try {
            await api.fetch('/auth/update-password', {
                method: 'PUT',
                body: JSON.stringify({ newPassword })
            });
            showMessage('Contraseña actualizada con éxito');
            document.getElementById('newPassword').value = '';
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    loadDashboardData();
});
