import "dotenv/config";
import { Sequelize } from "sequelize";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
    console.error("✗ ERROR: DATABASE_URL no está configurada en el archivo .env");
    process.exit(1);
}

try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`✓ DATABASE_URL configurada: postgresql://${url.hostname}:${url.port || 5432}/${url.pathname.slice(1)}`);
} catch (error) {
    console.warn("⚠ No se pudo parsear DATABASE_URL para mostrar información");
}

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: (query) => {
        if (query.includes('INSERT') || query.includes('UPDATE') || query.includes('DELETE')) {
            console.log('📝 Query ejecutada:', query.substring(0, 200) + '...');
        }
    }
});

try {
    await sequelize.authenticate();
    console.log("✓ Connection has been established successfully.");
    
    const dbName = sequelize.config.database || 'desconocida';
    const dbHost = sequelize.config.host || 'desconocido';
    console.log(`✓ Conectado a la base de datos: ${dbName} en ${dbHost}`);
} catch (error) {
    console.error("✗ Unable to connect to the database:", error);
    process.exit(1);
}

import { Usuario, usuarioSchema } from "./models/usuarios.model.js";
import { Plato, platoSchema } from "./models/platos.model.js";
import { Pedido, pedidoSchema } from "./models/pedidos.model.js";
import { PlatoXPedido, platoXPedidoSchema } from "./models/platosXpedidos.model.js";
const initModels = async () => {
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

    Usuario.hasMany(Pedido, { foreignKey: 'id_usuario' });
    Pedido.belongsTo(Usuario, { foreignKey: 'id_usuario' });

    Pedido.belongsToMany(Plato, { through: PlatoXPedido, foreignKey: 'id_pedido' });
    Plato.belongsToMany(Pedido, { through: PlatoXPedido, foreignKey: 'id_plato' });

    try {
        await Usuario.findOne({ limit: 1 });
        await Plato.findOne({ limit: 1 });
        await Pedido.findOne({ limit: 1 });
        await PlatoXPedido.findOne({ limit: 1 });
        console.log("✓ Todas las tablas existen y son accesibles");
    } catch (error) {
        console.error("✗ Error: Las tablas no existen o no son accesibles:", error.message);
        throw new Error("Las tablas de la base de datos no existen. Por favor, créalas manualmente.");
    }
};

try {
    await initModels();
    console.log("✓ Modelos inicializados correctamente - usando base de datos existente");
    
    const adminExists = await Usuario.findOne({ where: { email: 'admin@wokbun.com' } });
    if (!adminExists) {
        const hashedPassword = await Usuario.hashPassword('admin123');
        await Usuario.create({
            nombre: 'Admin',
            apellido: 'WokBun',
            email: 'admin@wokbun.com',
            password: hashedPassword,
            admin: true
        });
        console.log('✓ Usuario administrador creado con éxito');
    } else {
        console.log('✓ Usuario administrador ya existe');
    }
} catch (error) {
    console.error("✗ Error inicializando modelos:", error);
    throw error;
}
