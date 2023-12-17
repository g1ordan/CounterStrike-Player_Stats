
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nome: String,
    senha: String,
    telefone: String,
    email: String
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
