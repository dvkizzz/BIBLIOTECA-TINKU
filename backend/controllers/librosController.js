const supabase = require('../config/supabase');

exports.getAll = async (req, res) => {
    try {
        let query = supabase.from('libros').select('*');

        // Búsqueda y filtros opcionales
        if (req.query.buscar) {
            query = query.ilike('titulo', `%${req.query.buscar}%`);
        }
        if (req.query.categoria) {
            query = query.eq('categoria', req.query.categoria);
        }
        if (req.query.disponibles === 'true') {
            query = query.gt('disponibles', 0);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error al obtener libros:', error);
        res.status(500).json({ error: 'Error al obtener los libros' });
    }
};

exports.getById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('libros')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error al obtener el libro:', error);
        res.status(500).json({ error: 'Error al obtener el libro' });
    }
};

exports.create = async (req, res) => {
    const { titulo, autor, categoria, isbn, stock, imagen_url } = req.body;

    if (!titulo || !autor) {
        return res.status(400).json({ error: 'Título y autor son obligatorios' });
    }

    try {
        const { data, error } = await supabase
            .from('libros')
            .insert([{ 
                titulo, 
                autor, 
                categoria, 
                isbn, 
                stock: stock || 1, 
                disponibles: stock || 1,
                imagen_url
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error al crear libro:', error);
        res.status(500).json({ error: 'Error al crear el libro' });
    }
};

exports.update = async (req, res) => {
    const { titulo, autor, categoria, isbn, stock, disponibles, imagen_url } = req.body;

    try {
        const { data, error } = await supabase
            .from('libros')
            .update({ titulo, autor, categoria, isbn, stock, disponibles, imagen_url })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error al actualizar libro:', error);
        res.status(500).json({ error: 'Error al actualizar el libro' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { error } = await supabase
            .from('libros')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Libro eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar libro:', error);
        res.status(500).json({ error: 'Error al eliminar el libro' });
    }
};
