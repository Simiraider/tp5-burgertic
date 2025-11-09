import "dotenv/config";
import { Sequelize } from "sequelize";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
} catch (error) {
    console.error("Unable to connect to the database:", error);
}

// Importar modelos
import { Usuario, usuarioSchema } from "./models/usuarios.model.js";
import { Plato, platoSchema } from "./models/platos.model.js";
import { Pedido, pedidoSchema } from "./models/pedidos.model.js";
import { PlatoXPedido, platoXPedidoSchema } from "./models/platosXpedidos.model.js";

// Inicializar modelos
const initModels = async () => {
    // Inicializar modelos
    Usuario.init(usuarioSchema, {
        sequelize,
        modelName: "usuarios",
        timestamps: false,
    });

    Plato.init(platoSchema, {
        sequelize,
        modelName: "platos",
        timestamps: false,
    });

    Pedido.init(pedidoSchema, {
        sequelize,
        modelName: "pedidos",
        timestamps: false,
    });

    PlatoXPedido.init(platoXPedidoSchema, {
        sequelize,
        modelName: "platosXpedidos",
        timestamps: false,
    });

    // Definir asociaciones
    Usuario.hasMany(Pedido, { foreignKey: 'id_usuario' });
    Pedido.belongsTo(Usuario, { foreignKey: 'id_usuario' });

    Pedido.belongsToMany(Plato, { through: PlatoXPedido, foreignKey: 'id_pedido' });
    Plato.belongsToMany(Pedido, { through: PlatoXPedido, foreignKey: 'id_plato' });

    // Sincronizar modelos
    await sequelize.sync();
};

// Inicializar modelos
try {
    await initModels();
    console.log("Models synchronized successfully.");
    
    // Crear usuario admin por defecto
    const adminExists = await Usuario.findOne({ where: { email: 'admin@wokbun.com' } });
    if (!adminExists) {
        await Usuario.create({
            nombre: 'Admin',
            apellido: 'WokBun',
            email: 'admin@wokbun.com',
            password: 'admin123', // La contraseña se hasheará en el modelo
            admin: true
            nombre: 'Admin',
            apellido: 'WokBun',
            email: 'admin@wokbun.com',
            password: hashedPassword,
            admin: true
        });
        console.log('Usuario administrador creado con éxito');
    }
} catch (error) {
    console.error("Error synchronizing models:", error);
}
