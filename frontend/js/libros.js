document.addEventListener('DOMContentLoaded', () => {
    const booksGrid = document.getElementById('booksGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const availableFilter = document.getElementById('availableFilter');
    const messageBox = document.getElementById('messageBox');
    const navLinks = document.getElementById('navLinks');

    const currentUser = api.getCurrentUser();

    if (currentUser) {
        const dashboardUrl = currentUser.rol === 'admin' ? 'dashboard_admin.html' : 'dashboard_usuario.html';
        navLinks.innerHTML = `
            <span>Hola, ${currentUser.nombre}</span>
            <a href="${dashboardUrl}">Mi Panel</a>
            <a href="#" id="logoutBtn">Cerrar Sesión</a>
        `;
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            api.logout();
        });
    } else {
        navLinks.innerHTML = `
            <a href="login.html">Iniciar Sesión</a>
            <a href="register.html">Registrarse</a>
        `;
    }

    function showMessage(text, isError = false) {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `message ${isError ? 'error' : 'success'}`;
        messageBox.style.display = 'block';
        setTimeout(() => messageBox.style.display = 'none', 3000);
    }

    async function fetchBooks() {
        try {
            let url = '/libros';
            const params = new URLSearchParams();
            
            if (searchInput.value) params.append('buscar', searchInput.value);
            if (categoryFilter.value) params.append('categoria', categoryFilter.value);
            if (availableFilter.checked) params.append('disponibles', 'true');

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const libros = await api.fetch(url);
            renderBooks(libros);
        } catch (error) {
            showMessage(error.message, true);
        }
    }

    function renderBooks(libros) {
        booksGrid.innerHTML = '';
        if (libros.length === 0) {
            booksGrid.innerHTML = '<p>No se encontraron libros que coincidan con los filtros.</p>';
            return;
        }

        libros.forEach(libro => {
            const isAvailable = libro.disponibles > 0;
            const card = document.createElement('div');
            card.className = 'book-card';
            
            let reserveBtnHtml = '';
            if (currentUser && currentUser.rol === 'usuario' && isAvailable) {
                reserveBtnHtml = `<button class="btn" style="margin-top:10px; padding:5px;" onclick="reservarLibro('${libro.id}')">Reservar</button>`;
            }

            card.innerHTML = `
                ${libro.imagen_url ? `<img src="${libro.imagen_url}" alt="Portada de ${libro.titulo}" style="width:100%; height:300px; object-fit:cover; border-radius:4px; margin-bottom:10px;">` : `<div style="width:100%; height:300px; background:#e2e8f0; display:flex; align-items:center; justify-content:center; color:#666; border-radius:4px; margin-bottom:10px;">Sin Imagen</div>`}
                <h3>${libro.titulo}</h3>
                <p><strong>Autor:</strong> ${libro.autor}</p>
                <p><strong>Categoría:</strong> ${libro.categoria || 'N/A'}</p>
                <p>
                    <span class="badge ${isAvailable ? 'disponible' : 'agotado'}">
                        ${isAvailable ? `${libro.disponibles} Disponibles` : 'Agotado'}
                    </span>
                </p>
                ${reserveBtnHtml}
            `;
            booksGrid.appendChild(card);
        });
    }

    window.reservarLibro = async (libroId) => {
        try {
            await api.fetch('/reservas', {
                method: 'POST',
                body: JSON.stringify({ libro_id: libroId })
            });
            showMessage('Reserva realizada con éxito');
            fetchBooks(); 
        } catch (error) {
            showMessage(error.message, true);
        }
    };

    searchInput.addEventListener('input', debounce(fetchBooks, 500));
    categoryFilter.addEventListener('change', fetchBooks);
    availableFilter.addEventListener('change', fetchBooks);
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    fetchBooks();
});
