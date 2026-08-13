const supabase = require('../config/supabase');

exports.obtenerMisPrestamos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('prestamos')
            .select(`
                *,
                libros ( titulo, autor )
            `)
            .eq('usuario_id', req.user.id)
            .order('fecha_prestamo', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error al obtener prestamos:', error);
        res.status(500).json({ error: 'Error al obtener tus préstamos' });
    }
};
