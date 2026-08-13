const supabase = require('../config/supabase');

exports.crearReserva = async (req, res) => {
    const { libro_id } = req.body;
    const usuario_id = req.user.id; // Obtenido del token JWT

    if (!libro_id) {
        return res.status(400).json({ error: 'El ID del libro es obligatorio' });
    }

    try {
        // Verificar si el libro existe y tiene stock
        const { data: libro, error: errorLibro } = await supabase
            .from('libros')
            .select('disponibles')
            .eq('id', libro_id)
            .single();

        if (errorLibro || !libro) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        if (libro.disponibles <= 0) {
            return res.status(400).json({ error: 'El libro no tiene disponibilidad actual' });
        }

        // Crear la reserva
        const { data: reserva, error: errorReserva } = await supabase
            .from('reservas')
            .insert([{ usuario_id, libro_id, estado: 'pendiente' }])
            .select()
            .single();

        if (errorReserva) throw errorReserva;

        // Reducir la disponibilidad del libro
        await supabase
            .from('libros')
            .update({ disponibles: libro.disponibles - 1 })
            .eq('id', libro_id);

        res.status(201).json({ message: 'Reserva creada exitosamente', reserva });
    } catch (error) {
        console.error('Error al crear reserva:', error);
        res.status(500).json({ error: 'Error al crear la reserva' });
    }
};

exports.obtenerMisReservas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select(`
                *,
                libros ( titulo, autor )
            `)
            .eq('usuario_id', req.user.id)
            .order('fecha_reserva', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ error: 'Error al obtener tus reservas' });
    }
};
