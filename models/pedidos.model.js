import { DataTypes, Model } from "sequelize";

export const pedidoSchema = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
    },
    fecha: {
        type: DataTypes.DATE,
    },
    estado: {
        type: DataTypes.STRING,
    },
};

export class Pedido extends Model {}
