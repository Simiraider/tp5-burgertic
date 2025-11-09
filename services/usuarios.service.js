import { Usuario } from "../models/usuarios.model.js";

class UsuariosService {
    static async getUsuarioByEmail(email) {
        return await Usuario.findOne({ where: { email } });
    }

    static async getUsuarioById(id) {
        return await Usuario.findByPk(id);
    }

    static async createUsuario(usuario) {
        return await Usuario.create(usuario);
    }
}

export default UsuariosService;
