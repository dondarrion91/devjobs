const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const bcrypt = require("bcryptjs");

const usuariosSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
    },
    nombre:{
        type: String,
        required: 'Agrega tu Nombre'
    },
    password:{
        type:String,
        required: true,
        trim: true
    },
    token: String,
    expira: Date,
    imagen: String
});

// hash passwords
usuariosSchema.pre('save', async function(next){
    //si el password esta hash
    if(!this.isModified('password')){
        return next(); // deten la ejecucion
    }

    const hash = await bcrypt.hash(this.password,12);
    this.password = hash;
    next();
});

//Envia alerta a un usuario que esta registrado
usuariosSchema.post('save',function(error,doc,next){
    if(error.name === 'MongoError' && error.code === 11000){
        next('Ese correo esta registrado');
    }else{
        next(error);
    }
})

//autenticar Usuarios
usuariosSchema.methods = {
    compararPassword: function(password){
        return bcrypt.compareSync(password,this.password);
    }
}

module.exports = mongoose.model('Usuarios', usuariosSchema);