import { Plato } from "../models/platos.model.js";

const getPlatos = async () => await Plato.findAll();

const getPlatoById = async (id) =>
    await Plato.findAll({
        where: {
            id: id,
        },
    });

const createPlato = async (plato) =>
    Plato.create({
        tipo: plato.tipo,
        nombre: plato.nombre,
        precio: plato.precio,
        descripcion: plato.descripcion,
    });

const updatePlato = async (id, newData) => {
    const plato = await Plato.findByPk(id);

    if (!plato) throw new Error("Plato no encontrado");

    plato.tipo = newData.tipo;
    plato.nombre = newData.nombre;
    plato.precio = newData.precio;
    plato.descripcion = newData.descripcion;

    await plato.save();
};

const deletePlato = async (id) => {
    const plato = await Plato.findByPk(id);

    if (!plato) throw new Error("Plato no encontrado");

    await plato.destroy();
};

const getPlatosByTipo = async (tipo) =>
    Plato.findAll({ where: { tipo: tipo } });

export default {
    getPlatos,
    getPlatoById,
    createPlato,
    updatePlato,
    deletePlato,
    getPlatosByTipo,
};