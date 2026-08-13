const supabase = require('../config/supabase');

exports.getStats = async (req, res) => {
    try {
        const { count: totalLibros } = await supabase.from('libros').select('*', { count: 'exact', head: true });
        const { count: usuariosActivos } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('estado', 'activo');
        const { count: prestamosActivos } = await supabase.from('prestamos').select('*', { count: 'exact', head: true }).eq('estado', 'activo');
        const { count: prestamosVencidos } = await supabase.from('prestamos').select('*', { count: 'exact', head: true }).eq('estado', 'vencido');

        res.json({
            totalLibros: totalLibros || 0,
            usuariosActivos: usuariosActivos || 0,
            prestamosActivos: prestamosActivos || 0,
            prestamosVencidos: prestamosVencidos || 0
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};

// --- GESTIÓN DE RESERVAS ---
exports.getAllReservas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select(`
                *,
                usuarios ( nombre, email ),
                libros ( titulo, autor, disponibles )
            `)
            .order('fecha_reserva', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ error: 'Error interno' });
    }
};

exports.updateReservaEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // 'aprobada', 'rechazada'

    try {
        const { data: reserva, error } = await supabase
            .from('reservas')
            .update({ estado })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Si se aprueba, se podría crear el préstamo automáticamente
        if (estado === 'aprobada') {
            const fechaPrestamo = new Date();
            const fechaVencimiento = new Date();
            fechaVencimiento.setDate(fechaVencimiento.getDate() + 14); // 14 días de préstamo

            await supabase.from('prestamos').insert([{
                usuario_id: reserva.usuario_id,
                libro_id: reserva.libro_id,
                fecha_prestamo: fechaPrestamo,
                fecha_vencimiento: fechaVencimiento,
                estado: 'activo'
            }]);
        }

        // Si se rechaza, habría que devolver la disponibilidad al libro
        if (estado === 'rechazada') {
            const { data: libro } = await supabase.from('libros').select('disponibles').eq('id', reserva.libro_id).single();
            await supabase.from('libros').update({ disponibles: libro.disponibles + 1 }).eq('id', reserva.libro_id);
        }

        res.json({ message: `Reserva ${estado}`, reserva });
    } catch (error) {
        console.error('Error al actualizar reserva:', error);
        res.status(500).json({ error: 'Error interno' });
    }
};

// --- GESTIÓN DE PRÉSTAMOS ---
exports.calcularMultas = async (req, res) => {
    try {
        const { data: prestamos, error } = await supabase
            .from('prestamos')
            .select('*')
            .eq('estado', 'activo')
            .lt('fecha_vencimiento', new Date().toISOString());

        if (error) throw error;

        let multasActualizadas = 0;
        const ahora = new Date();

        for (const p of prestamos) {
            const vencimiento = new Date(p.fecha_vencimiento);
            const diasRetraso = Math.floor((ahora - vencimiento) / (1000 * 60 * 60 * 24));
            
            if (diasRetraso > 0) {
                const nuevaMulta = diasRetraso * 1.00; // $1.00 por día
                await supabase.from('prestamos').update({ 
                    multa: nuevaMulta,
                    estado: 'vencido' 
                }).eq('id', p.id);
                multasActualizadas++;
            }
        }

        res.json({ message: `Se actualizaron las multas de ${multasActualizadas} préstamos vencidos.` });
    } catch (error) {
        console.error('Error al calcular multas:', error);
        res.status(500).json({ error: 'Error interno' });
    }
};

exports.getAllPrestamos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('prestamos')
            .select(`
                *,
                usuarios ( nombre, email ),
                libros ( titulo, autor )
            `)
            .order('fecha_prestamo', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error al obtener prestamos:', error);
        res.status(500).json({ error: 'Error interno' });
    }
};

exports.returnPrestamo = async (req, res) => {
    const { id } = req.params;

    try {
        const { data: prestamo, error } = await supabase
            .from('prestamos')
            .update({ estado: 'devuelto', fecha_devolucion: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Devolver disponibilidad al libro
        const { data: libro } = await supabase.from('libros').select('disponibles').eq('id', prestamo.libro_id).single();
        await supabase.from('libros').update({ disponibles: libro.disponibles + 1 }).eq('id', prestamo.libro_id);

        res.json({ message: 'Préstamo devuelto', prestamo });
    } catch (error) {
        console.error('Error al devolver préstamo:', error);
        res.status(500).json({ error: 'Error interno' });
    }
};

// --- GESTIÓN DE USUARIOS ---
exports.getAllUsuarios = async (req, res) => {
    try {
        const { data, error } = await supabase.from('usuarios').select('id, nombre, email, rol, estado, created_at');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};

exports.updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { rol, estado } = req.body;

    try {
        const { data, error } = await supabase
            .from('usuarios')
            .update({ rol, estado })
            .eq('id', id)
            .select('id, nombre, email, rol, estado')
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};
