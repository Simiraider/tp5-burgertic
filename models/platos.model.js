import { DataTypes, Model } from "sequelize";

export class Plato extends Model {}

export const platoSchema = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    tipo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['principal', 'combo', 'postre', 'guarnicion']]
        }
    },
    nombre: {
        type: DataTypes.STRING(70),
        allowNull: false
    },
    precio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    descripcion: {
        type: DataTypes.STRING(400),
        allowNull: false
    }
};