import { DataTypes, Model } from "sequelize";

export const platoXPedidoSchema = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_pedido: {
        type: DataTypes.INTEGER,
    },
    id_plato: {
        type: DataTypes.INTEGER,
    },
    cantidad: {
        type: DataTypes.INTEGER,
    },
};

export class PlatoXPedido extends Model {}
