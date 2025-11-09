import { DataTypes, Model } from "sequelize";
import bcrypt from "bcryptjs";

export const usuarioSchema = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nombre: {
        type: DataTypes.STRING,
    },
    apellido: {
        type: DataTypes.STRING,
    },
    email: {
        type: DataTypes.STRING,
    },
    password: {
        type: DataTypes.STRING,
    },
    admin: {
        type: DataTypes.BOOLEAN,
    },
};

export class Usuario extends Model {
    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    async comparePassword(password) {
        try {
            return await bcrypt.compare(password, this.password);
        } catch (error) {
            console.error('Error comparing passwords:', error);
            return false;
        }
    }
}
