document.addEventListener('DOMContentLoaded', () => {
    const currentUser = api.getCurrentUser();
    
    if (!currentUser || currentUser.rol !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const messageBox = document.getElementById('messageBox');
    
    function showMessage(text, isError = false) {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `message ${isError ? 'error' : 'success'}`;
        messageBox.style.display = 'block';
        setTimeout(() => messageBox.style.display = 'none', 3000);
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        api.logout();
    });

    async function loadStats() {
        try {
            const stats = await api.fetch('/admin/stats');
            document.getElementById('statLibros').textContent = stats.totalLibros;
            document.getElementById('statUsuarios').textContent = stats.usuariosActivos;
            document.getElementById('statPrestamos').textContent = stats.prestamosActivos;
            document.getElementById('statVencidos').textContent = stats.prestamosVencidos;
        } catch (error) {
            console.error('Error cargando stats:', error);
        }
    }

    async function loadLibros() {
        try {
            const libros = await api.fetch('/libros');
            const tbody = document.getElementById('adminLibrosBody');
            tbody.innerHTML = libros.map(l => `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            ${l.imagen_url ? `<img src="${l.imagen_url}" style="width:30px; height:45px; object-fit:cover;">` : ''}
                            ${l.titulo}
                        </div>
                    </td>
                    <td>${l.autor}</td>
                    <td>${l.stock}</td>
                    <td>${l.disponibles}</td>
                    <td>
                        <button class="btn-sm btn-success" onclick='editBook(${JSON.stringify(l).replace(/'/g, "&#39;")})'>Editar</button>
                        <button class="btn-sm btn-danger" onclick="deleteBook('${l.id}')">Eliminar</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error cargando libros', error);
        }
    }

    async function loadReservas() {
        try {
            const reservas = await api.fetch('/admin/reservas');
            const tbody = document.getElementById('adminReservasBody');
            tbody.innerHTML = reservas.map(r => `
                <tr>
                    <td>${r.usuarios?.nombre || r.usuarios?.email || 'N/A'}</td>
                    <td>${r.libros?.titulo || 'N/A'}</td>
                    <td>${new Date(r.fecha_reserva).toLocaleDateString()}</td>
                    <td><strong>${r.estado}</strong></td>
                    <td>
                        ${r.estado === 'pendiente' ? `
                            <button class="btn-sm btn-success" onclick="updateReserva('${r.id}', 'aprobada')">Aprobar</button>
                            <button class="btn-sm btn-danger" onclick="updateReserva('${r.id}', 'rechazada')">Rechazar</button>
                        ` : '-'}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error cargando reservas', error);
        }
    }

    async function loadUsuarios() {
        try {
            const usuarios = await api.fetch('/admin/usuarios');
            const tbody = document.getElementById('adminUsuariosBody');
            tbody.innerHTML = usuarios.map(u => `
                <tr>
                    <td>${u.nombre}</td>
                    <td>${u.email}</td>
                    <td>${u.rol}</td>
                    <td>${u.estado}</td>
                    <td>
                        ${u.id !== currentUser.id ? `
                            <button class="btn-sm" onclick="toggleUserStatus('${u.id}', '${u.estado}')">
                                ${u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            </button>
                        ` : 'Tú'}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error cargando usuarios', error);
        }
    }

    async function loadPrestamos() {
        try {
            const prestamos = await api.fetch('/admin/prestamos');
            const tbody = document.getElementById('adminPrestamosBody');
            tbody.innerHTML = prestamos.map(p => `
                <tr>
                    <td>${p.usuarios?.nombre || p.usuarios?.email || 'N/A'}</td>
                    <td>${p.libros?.titulo || 'N/A'}</td>
                    <td>${new Date(p.fecha_vencimiento).toLocaleDateString()}</td>
                    <td><strong>${p.estado}</strong></td>
                    <td>
                        ${p.estado !== 'devuelto' ? `
                            <button class="btn-sm btn-success" onclick="returnLoan('${p.id}')">Registrar Devolución</button>
                        ` : '-'}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error cargando prestamos', error);
        }
    }

    window.updateReserva = async (id, estado) => {
        try {
            await api.fetch(`/admin/reservas/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ estado })
            });
            showMessage(`Reserva ${estado} exitosamente.`);
            loadReservas();
            loadStats();
        } catch (error) {
            showMessage(error.message, true);
        }
    };

    window.toggleUserStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
            await api.fetch(`/admin/usuarios/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ estado: newStatus })
            });
            showMessage(`Usuario actualizado a ${newStatus}.`);
            loadUsuarios();
            loadStats();
        } catch (error) {
            showMessage(error.message, true);
        }
    };

    window.returnLoan = async (id) => {
        if (!confirm('¿Confirmas que el libro fue devuelto físicamente?')) return;
        try {
            await api.fetch(`/admin/prestamos/${id}/devolver`, { method: 'PUT' });
            showMessage('Devolución registrada exitosamente.');
            loadPrestamos();
            loadLibros();
            loadStats();
        } catch (error) {
            showMessage(error.message, true);
        }
    };

    window.openBookModal = () => {
        document.getElementById('bookForm').reset();
        document.getElementById('bookId').value = '';
        document.getElementById('modalTitle').textContent = 'Nuevo Libro';
        document.getElementById('bookModal').style.display = 'block';
    };

    window.closeBookModal = () => {
        document.getElementById('bookModal').style.display = 'none';
    };

    window.editBook = (libro) => {
        document.getElementById('bookId').value = libro.id;
        document.getElementById('bookTitulo').value = libro.titulo;
        document.getElementById('bookAutor').value = libro.autor;
        document.getElementById('bookCategoria').value = libro.categoria || '';
        document.getElementById('bookIsbn').value = libro.isbn || '';
        document.getElementById('bookStock').value = libro.stock;
        document.getElementById('bookImagen').value = libro.imagen_url || '';
        document.getElementById('modalTitle').textContent = 'Editar Libro';
        document.getElementById('bookModal').style.display = 'block';
    };

    window.searchBookApi = async () => {
        const titulo = document.getElementById('bookTitulo').value.trim();
        const isbn = document.getElementById('bookIsbn').value.trim();
        
        const query = isbn ? `q=${encodeURIComponent(isbn)}` : (titulo ? `title=${encodeURIComponent(titulo)}` : '');

        if(!query) {
            alert('Por favor, ingresa un Título o un ISBN para buscar.');
            return;
        }

        const btn = event.target;
        const originalText = btn.textContent;
        try {
            btn.textContent = 'Buscando...';
            btn.disabled = true;

            const response = await fetch(`https://openlibrary.org/search.json?${query}&limit=1`);
            const data = await response.json();

            if(data && data.docs && data.docs.length > 0) {
                const bookData = data.docs[0];
                
                document.getElementById('bookTitulo').value = bookData.title || titulo;
                
                if (bookData.author_name && bookData.author_name.length > 0) {
                    document.getElementById('bookAutor').value = bookData.author_name.join(', ');
                }

                if (bookData.subject && bookData.subject.length > 0) {
                    document.getElementById('bookCategoria').value = bookData.subject[0];
                }

                if (!isbn && bookData.isbn && bookData.isbn.length > 0) {
                    document.getElementById('bookIsbn').value = bookData.isbn[0];
                }

                if (bookData.cover_i) {
                    document.getElementById('bookImagen').value = `https://covers.openlibrary.org/b/id/${bookData.cover_i}-L.jpg`;
                }
                
                showMessage('Datos del libro encontrados y cargados.');
            } else {
                alert('No se encontró información en OpenLibrary.');
            }
        } catch(error) {
            console.error('Error fetching API', error);
            alert('Error al consultar la API externa.');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    };

    window.deleteBook = async (id) => {
        if(!confirm('¿Estás seguro de eliminar este libro?')) return;
        try {
            await api.fetch(`/libros/${id}`, { method: 'DELETE' });
            showMessage('Libro eliminado');
            loadLibros();
            loadStats();
        } catch (error) {
            showMessage(error.message, true);
        }
    };

    document.getElementById('bookForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('bookId').value;
        
        const payload = {
            titulo: document.getElementById('bookTitulo').value,
            autor: document.getElementById('bookAutor').value,
            categoria: document.getElementById('bookCategoria').value,
            isbn: document.getElementById('bookIsbn').value,
            stock: parseInt(document.getElementById('bookStock').value),
            imagen_url: document.getElementById('bookImagen').value
        };

        try {
            if (id) {
                await api.fetch(`/libros/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showMessage('Libro actualizado');
            } else {
                await api.fetch('/libros', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showMessage('Libro creado');
            }
            closeBookModal();
            loadLibros();
            loadStats();
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    loadStats();
    loadLibros();
    loadReservas();
    loadPrestamos();
    loadUsuarios();
});
