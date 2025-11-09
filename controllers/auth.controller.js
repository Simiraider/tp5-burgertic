import { Usuario } from "../models/usuarios.model.js";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
    const { usuario } = req.body;
    if (!usuario || !usuario.nombre || !usuario.apellido || !usuario.email || !usuario.password) {
        return res.status(400).json({ message: "Faltan campos por llenar" });
    }
    try {
        const existingUser = await Usuario.findOne({ where: { email: usuario.email } });
        if (existingUser) {
            return res.status(400).json({ message: "El email ya está registrado" });
        }
        const hashedPassword = await Usuario.hashPassword(usuario.password);
        await Usuario.create({
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            password: hashedPassword,
            admin: false
        });
        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email y password son requeridos" });
    }
    try {
        const user = await Usuario.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Credenciales inválidas" });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Credenciales inválidas" });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30m' });
        res.json({ usuario: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email, admin: user.admin }, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verify = async (req, res) => {
    try {
        const user = await Usuario.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.json({ usuario: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email, admin: user.admin } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default { register, login, verify };
