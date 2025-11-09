import { Pedido } from "../models/pedidos.model.js";
import { PlatoXPedido } from "../models/platosXpedidos.model.js";
import { Plato } from "../models/platos.model.js";

const getPlatosByPedido = async (idPedido) => {
    return await PlatoXPedido.findAll({
        where: { id_pedido: idPedido },
        include: [{ model: Plato, as: 'plato' }]
    });
};

const getPedidos = async () => {
    const pedidos = await Pedido.findAll({
        include: [
            { 
                model: Plato, 
                through: { attributes: ['cantidad'] },
                attributes: ['id', 'nombre', 'precio', 'descripcion', 'tipo']
            }
        ]
    });
    return pedidos.map(pedido => {
        const pedidoJson = pedido.toJSON();
        pedidoJson.platos = pedidoJson.platos.map(plato => ({
            id: plato.id,
            nombre: plato.nombre,
            precio: plato.precio,
            cantidad: plato.platosXpedidos?.cantidad || plato.platosxpedidos?.cantidad || 1
        }));
        return pedidoJson;
    });
};

const getPedidoById = async (id) => {
    const pedido = await Pedido.findByPk(id, {
        include: [
            { 
                model: Plato, 
                through: { attributes: ['cantidad'] },
                attributes: ['id', 'nombre', 'precio', 'descripcion', 'tipo']
            }
        ]
    });
    if (!pedido) return null;
    const pedidoJson = pedido.toJSON();
    pedidoJson.platos = pedidoJson.platos.map(plato => ({
        id: plato.id,
        nombre: plato.nombre,
        precio: plato.precio,
        cantidad: plato.platosXpedidos?.cantidad || plato.platosxpedidos?.cantidad || 1
    }));
    return pedidoJson;
};

const getPedidosByUser = async (idUsuario) => {
    const pedidos = await Pedido.findAll({
        where: { id_usuario: idUsuario },
        include: [
            { 
                model: Plato, 
                through: { attributes: ['cantidad'] },
                attributes: ['id', 'nombre', 'precio', 'descripcion', 'tipo']
            }
        ]
    });
    return pedidos.map(pedido => {
        const pedidoJson = pedido.toJSON();
        pedidoJson.platos = pedidoJson.platos.map(plato => ({
            id: plato.id,
            nombre: plato.nombre,
            precio: plato.precio,
            cantidad: plato.platosXPedidos?.cantidad || plato.platosxpedidos?.cantidad || 1
        }));
        return pedidoJson;
    });
};

const createPedido = async (idUsuario, platos) => {
    const pedido = await Pedido.create({
        id_usuario: idUsuario,
        fecha: new Date(),
        estado: 'pendiente'
    });
    for (const plato of platos) {
        await PlatoXPedido.create({
            id_pedido: pedido.id,
            id_plato: plato.id,
            cantidad: plato.cantidad
        });
    }
    return pedido;
};

const updatePedido = async (id, estado) => {
    const pedido = await Pedido.findByPk(id);
    if (!pedido) throw new Error("Pedido no encontrado");
    pedido.estado = estado;
    await pedido.save();
    return pedido;
};

const deletePedido = async (id) => {
    const pedido = await Pedido.findByPk(id);
    if (!pedido) throw new Error("Pedido no encontrado");
    await PlatoXPedido.destroy({ where: { id_pedido: id } });
    await pedido.destroy();
};

export default {
    getPlatosByPedido,
    getPedidos,
    getPedidoById,
    getPedidosByUser,
    createPedido,
    updatePedido,
    deletePedido,
};
