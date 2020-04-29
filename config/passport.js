const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const mongoose = require("mongoose");
const Usuarios = require('../models/Usuarios');

passport.use(new localStrategy({
    usernameField: 'email',
    passwordField: 'password'
},async(email,password,done) => {
    const usuario = await Usuarios.findOne({
        email
    });
    if(!usuario) return done(null,false,{
        message: 'Usuario no existente'
    });

    //usuario existe, verificacion
    const verificarPass = usuario.compararPassword(password);
    if(!verificarPass) return done(null,false,{
        message: 'Password incorrecto'
    });

    //usuario existe y password correcto
    return done(null,usuario);
}));

passport.serializeUser((usuario,done) => done(null,usuario._id)); // en mongo el id es _id

passport.deserializeUser(async(id,done) => {
    const usuario = await Usuarios.findById(id).exec();
    return done(null,usuario);
})

module.exports = passport;