const express = require("express");
const mongoose = require("mongoose");
const app = express();
const methodOverride = require("method-override");

const session = require("express-session");
const bcrypt = require("bcrypt"); 

const Stats = require("./models/Stats");
const User = require("./models/User");
const { HLTV } = require("hltv");

app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({ secret: "your-secret-key", resave: true, saveUninitialized: true })
);

// CONECT DB
mongoose
  .connect("mongodb://127.0.0.1:27017/playerStats", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Banco conectou"))
  .catch((e) => console.error(e.message));

//INDEX - SHOW
app.get("/favorites", async (req, res) => {
  const allFavorites = await Stats.find({ userID: req.session.userId });
  res.render("favorites", { allFavorites });
});

app.get("/favorited/:id", async (req, res) => {
  const id = req.params.id;
  const player = await Stats.findById(id);
  res.render("favoriteDetail", { player });
});

//NEW - CREATE
app.get("/register", (req, res) => {
  res.render("users/register");
});

app.post("/register", async (req, res) => {
  const { nome, senha, telefone, email } = req.body;
  const hashedPassword = await bcrypt.hash(senha, 10);

  const newUser = new User({
    nome,
    senha: hashedPassword,
    favorites: [],
    telefone,
    email,
  });

  await newUser.save();
  res.redirect("/login");
});

//EDIT - UPDATE
app.get("/user/edit", async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render("users/edit", { user });
});

app.put("/user", async (req, res) => {
  await User.findByIdAndUpdate(req.session.userId, req.body, {
    runValidators: true,
  });
  req.session.message = 'Atualizado com sucesso'
  res.redirect("dashboard");
});

//DELETE
app.delete("/favorite/:id", async (req, res) => {
  const find = req.params.id;
  await Stats.findByIdAndDelete(find);
  res.redirect("/favorites");
});

//OTHERS
app.get("/login", (req, res) => {
  res.render("users/login", { error: false });
});

app.post("/login", async (req, res) => {
  const { nome, senha } = req.body;
  const user = await User.findOne({ nome });

  if (user && (await bcrypt.compare(senha, user.senha))) {
    req.session.userId = user._id;
    res.redirect("/dashboard");
  } else {
    res.render("users/login", { error: true });
  }
});


app.get("/logout", (req, res) => {
  req.session.userId = null;
  res.redirect("/login");
});


app.get("/dashboard", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const user = await User.findById(req.session.userId);

  const playerName = req.query.name;
  const message = req.session.message 
  req.session.message = null
  if (!playerName) {
    res.render("dashboard", { user, player: null, notFound: false, message: message });
    
    return;
  }

  try {
    const player = await HLTV.getPlayerByName({ name: playerName });
    res.render("dashboard", { user, player, notFound: false, message: message });
  } catch {
    res.render("dashboard", { user, player: null, notFound: true, message: message });
  }
});

app.post("/favorite/:id", async (req, res) => {
  const playerId = req.params.id;
  const player = await HLTV.getPlayer({ id: playerId });
  const find = await Stats.findOne({ playerId, userID: req.session.userId });
  if (find == null) {
    await Stats.create({
      playerId: player.id,
      nome: player.name,
      nick: player.ign,
      imagem: player.image,
      time: player.team.name,
      idade: player.age,
      pais: player.country.name,
      rating: player.statistics.rating,
      killsPerRound: player.statistics.killsPerRound,
      headshots: player.statistics.headshots,
      mapasJogados: player.statistics.mapsPlayed,
      mortesPorRound: player.statistics.deathsPerRound,
      contribuicaoPorRound: player.statistics.roundsContributed,
      userID: req.session.userId,
    });
  }
  res.redirect("/favorites");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor conectado na porta 3000!");
});
