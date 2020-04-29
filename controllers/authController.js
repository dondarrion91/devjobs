const passport = require("passport");
const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");
const Usuarios = mongoose.model("Usuarios");
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local',{
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son obligatorios'
});

//Revisar si el usuario esta autenticado o no
exports.verificarUsuario = (req,res,next) => {
    //revisar el usuario
    
    if(req.isAuthenticated()){
        return next();
    }

    res.redirect('/iniciar-sesion');
}

exports.mostrarPanel = async(req,res) => {
    
    // consultar el usuario autenticado
    const vacantes = await Vacante.find({autor: req.user._id});
    
    res.render('administracion',{
        nombrePagina: 'Panel de administración',
        tagline: 'Crea y administra tus vacantes desde aqui',
        vacantes,
        cerrarSesion:true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

exports.cerrarSesion = (req,res) => {
    req.logout();
    req.flash('correcto','Cerraste sesion correctamente');
    return res.redirect('/iniciar-sesion');
}

exports.formReestablecerPassword = (req,res) => {
    res.render('reestablecer-password',{
        nombrePagina: 'Reestablece tu Password',
        tagline: 'Si ya tienes una cuenta pero olvidaste tu password, coloca tu email'
    });
}

exports.enviarToken = async(req,res) => {
    const usuario = await Usuarios.findOne({email:req.body.email});

    if(!usuario){
        req.flash('error','No existe esa cuenta');
        return res.redirect('/iniciar-sesion');
    }

    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;

    //Guardar el usuario
    await usuario.save();
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

    

    // TODO:Enviar notificacion del email
    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'reset'
    })

    req.flash('correcto','Revisa tu email para las indicaciones'); 
    res.redirect('/iniciar-sesion');
}

exports.reestablecerPassword = async(req,res) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    });

    if(!usuario){
        req.flash('error','El formulario ya no es valido, intenta de nuevo');
        return res.redirect('/reestablecer-password');
    }

    res.render('nuevo-password',{
        nombrePagina: 'Nuevo Password'
    });
}

exports.guardarPassword = async(req,res) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    });

    if(!usuario){
        req.flash('error','El formulario ya no es valido, intenta de nuevo');
        return res.redirect('/reestablecer-password');
    }

    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;

    await usuario.save();

    req.flash('correcto','Password guardado correctamente');
    res.redirect('/iniciar-sesion');
} 