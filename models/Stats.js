const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    playerId: Number,
    nome: String,
    nick: String,
    imagem: String,
    time: String,
    idade: Number,
    pais: String,
    rating: Number,
    killsPerRound: Number,
    headshots: Number,
    mapasJogados: Number,
    mortesPorRound: Number,
    contribuicaoPorRound: Number,
    userID: mongoose.Schema.ObjectId,
});

const Stats = mongoose.model('Stats', playerSchema);

module.exports = Stats;
