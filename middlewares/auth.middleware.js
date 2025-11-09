import jwt from "jsonwebtoken";
import UsuariosService from "../services/usuarios.service.js";

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Token no proporcionado" });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token inválido" });
    }
};

export const verifyAdmin = async (req, res, next) => {
    try {
        const user = await UsuariosService.getUsuarioById(req.userId);
        if (!user.admin) {
            return res.status(403).json({ message: "Acceso denegado" });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
