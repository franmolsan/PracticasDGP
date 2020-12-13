require('dotenv').config();

const Express = require("express");
const BodyParser = require("body-parser");
const { get } = require('http');
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const CONNECTION_URL = process.env.MONGO_CONNECTION_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;

var app = Express();
app.use(BodyParser.json({ limit: '1024mb', extended: true }));
app.use(BodyParser.urlencoded({limit:'1024mb', extended: true }));
// var jsonParser = BodyParser.json();

var database, collectionUsuarios, collectionGrupos;

app.listen(5000, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collectionUsuarios = database.collection("Usuarios");
        collectionTareas = database.collection("Tareas");
        collectionGrupos = database.collection("Grupos");
        collectionAsignacionTareas = database.collection("AsignacionTareas");
        collectionChats = database.collection("Chats");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

var callback = (err) => {
    if (err) throw err;
    console.log('It\'s saved!');
}


app.post("/upload", (request, response) => {
    
    const fs = require('fs');

    var b64 = Buffer.from(request.body.filedata, 'base64');
    fs.writeFile('media/'+request.body.filename, b64, callback);

    response.send("imagen subida");
});

app.post("/get-image", function (req, res){
    const fs = require('fs');
    const contents = fs.readFileSync("media/"+req.body.ruta, {encoding: 'base64'});
    res.send(contents);
});

/******************************************************/
// Registro Usuarios
/******************************************************/
app.post("/registro", (request, response) => {
    collectionUsuarios.insertOne(request.body, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        if (result == null){
            response.send("Registro incorrecto");
        }
        else{    
            response.send("Registro completado");
        }
    });
});

/******************************************************/
// Login Usuarios
/******************************************************/
app.post("/login", (request, response) => {

    collectionUsuarios.findOne({ "username":request.body.username }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        if (result == null){
            response.send("Nombre de usuario incorrecto");
        }
        else{
            collectionUsuarios.findOne({ "username":request.body.username,"password":request.body.passwd }, (errorPass, resultPass) => {
                if(errorPass) {
                    return response.status(500).send(errorPass);
                }
                if (resultPass == null){
                    response.send("Contraseña incorrecta");
                }
                else{
                    response.send(result.rol); //Si ha iniciado sesión correctamente, se le responde con su rol
                }
            }
        );
        }
    });
});

/******************************************************/
// Login Socios
/******************************************************/
app.post("/login-socio", (request, response) => {

    collectionUsuarios.findOne({ "rol" : "socio", "username":request.body.username }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        if (result == null) { //Comprobación adicional que nunca debe fallar (la comprobación del usuario se realiza en pasos anteriores)
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":2}'); //Fallo del usuario
            response.send(jsonRespuestaIncorrecta);
        }
        else{
            collectionUsuarios.findOne({ "rol" : "socio", "username":request.body.username,"password":request.body.passwd }, (errorPass, resultPass) => {

                if(errorPass) {
                    return response.status(500).send(errorPass);
                }
                if (resultPass == null){
                    var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}'); //Fallo de la contraseña
                    response.send(jsonRespuestaIncorrecta);
                }
                else{
                    var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
                    response.send(jsonRespuestaCorrecta); //Exito en login
                }
            }
        );
        }
    });
});

/******************************************************/
// Listado administradores
/******************************************************/
app.get("/listado-administradores", (request, response) => {
    collectionUsuarios.find({"rol":{"$in": ["admin","ambos"]}}).toArray(function (error, result){
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No hay administradores");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Listado facilitadores
/******************************************************/
app.get("/listado-facilitadores", (request, response) => {
    collectionUsuarios.find({ "rol": { "$in": ["facilitador", "ambos"] } }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No hay facilitadores");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Listado socios
/******************************************************/
app.get("/listado-socios", (request, response) => {
    collectionUsuarios.find({ "rol": "socio" }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No hay socios");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Crear tarea
/******************************************************/
app.post("/crear-tarea", (request, response) => {
    collectionTareas.insertOne(request.body, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Fallo en la creación");
        }
        else {
            response.send("Creación completada");
        }
    });
});

/******************************************************/
// Eliminar tarea
/******************************************************/
app.post("/eliminar-tarea", (request, response) => {
    collectionTareas.deleteOne({ "creador": request.body.username, "nombre":request.body.nombreTarea }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaCorrecta);
        }
    });
});

/******************************************************/
// Editar tarea
/******************************************************/
app.post("/editar-tarea", (request, response) => {
    collectionTareas.replaceOne({ "creador": request.body.creador, "nombre":request.body.nombre }, request.body, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Fallo en la edición");
        }
        else {
            response.send("Edición completada");
        }
    });
});

/******************************************************/
// Info tarea
/******************************************************/
app.post("/info-tarea", (request, response) => {
    collectionTareas.find({ "nombre": request.body.nombre, "creador": request.body.creador }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró la tarea");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Listado tareas (La funcionalidad ahora mismo es un "mis tareas" de facilitador)
/******************************************************/
app.post("/listado-tareas", (request, response) => {
    collectionTareas.find({ "creador": request.body.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("¡Aún no has creado tareas!");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Listado tareas para administración
/******************************************************/
app.get("/listado-tareas-admin", (request, response) => {
    collectionTareas.find({}).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No hay socios");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Mis socios
/******************************************************/
app.post("/mis-socios", (request, response) => {
    collectionUsuarios.find({ "username": request.body.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("¡Aún no tienes socios a cargo!");
        }
        else {
            response.send(result);
        }
    });
});
/******************************************************/
// Perfil
/******************************************************/
app.post("/perfil", (request, response) => {
    collectionUsuarios.find({ "username":request.body.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Perfil no encontrado");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Existe usuario
/******************************************************/
app.get("/existe-usuario", (request, response) => {
    collectionUsuarios.find({ "rol" : "socio", "username":request.query.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == "") {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaCorrecta);
        }
    });
});

/******************************************************/
// Eliminar usuario
/******************************************************/
app.post("/eliminar-usuario", (request, response) => {
    collectionUsuarios.deleteOne({ "username":request.body.username }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaCorrecta);
        }
    });
});

/******************************************************/
// Socios vinculados
/******************************************************/
app.post("/socios-vinculados", (request, response) => {
    collectionUsuarios.find({ "username": request.body.user_facilitador }, {"_id": 0, "sociosACargo": 1}).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el array");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Socios no vinculados
/******************************************************/
app.post("/socios-no-vinculados", (request, response) => {
    collectionUsuarios.find({ "rol": "socio", "facilitadoresACargo": { "$not": { "$eq" : request.body.user_facilitador} } }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el array");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Info usuario
/******************************************************/
app.post("/info-usuario", (request, response) => {
    collectionUsuarios.find({ "username": request.body.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el usuario");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Facilitadores a cargo
/******************************************************/
app.post("/facilitadores-a-cargo", (request, response) => {
    collectionUsuarios.find({ "username": request.body.user_socio }, {"_id": 0, "facilitadoresACargo": 1}).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el array");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Vincular socio a facilitador
/******************************************************/
app.post("/vincular-socio-facilitador", (request, response) => {
    collectionUsuarios.updateOne({ "username":request.body.user_facilitador }, {"$push": {"sociosACargo": request.body.user_socio} }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el socio");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Vincular facilitador a socio
/******************************************************/
app.post("/vincular-facilitador-socio", (request, response) => {
    collectionUsuarios.updateOne({ "username":request.body.user_socio }, {"$push": {"facilitadoresACargo": request.body.user_facilitador} }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el facilitador");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Desvincular socio con facilitador
/******************************************************/
app.post("/desvincular-socio-facilitador", (request, response) => {
    collectionUsuarios.updateOne({ "username":request.body.user_facilitador }, {"$pull": {"sociosACargo": request.body.user_socio} }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el socio");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Desvincular facilitador con socio
/******************************************************/
app.post("/desvincular-facilitador-socio", (request, response) => {
    collectionUsuarios.updateOne({ "username":request.body.user_socio }, {"$pull": {"facilitadoresACargo": request.body.user_facilitador} }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el socio");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Crear grupo
/******************************************************/
app.post("/crear-grupo", (request, response) => {
    collectionGrupos.insertOne(request.body, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        if (result == null){
            response.send("Fallo en la creación");
        }
        else{    
            response.send("Creación completada");
        }
    });
});

/******************************************************/
// Eliminar grupo
/******************************************************/
app.post("/eliminar-grupo", (request, response) => {
    collectionGrupos.deleteOne({ "nombre": request.body.nombreGrupo, "facilitadorACargo": request.body.username }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaCorrecta);
        }
    });
});

/******************************************************/
// Mis grupos
/******************************************************/
app.post("/mis-grupos", (request, response) => {
    collectionGrupos.find({ "facilitadorACargo": request.body.username }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("¡Aún no has creado grupos!");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Info grupos
/******************************************************/
app.post("/info-grupo", (request, response) => {
    collectionGrupos.find({ "nombre": request.body.nombreGrupo, "facilitadorACargo": request.body.facilitadorACargo }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el grupo");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Listado grupos
/******************************************************/
app.get("/listado-grupos", (request, response) => {
    collectionGrupos.find({ }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("¡Aún no has creado grupos!");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Añadir preferencias usuario
/******************************************************/
app.post("/add-preferencias", (request, response) => {

    var texto = (request.body.texto === "true"); 
    var audio = (request.body.audio === "true");
    var video = (request.body.video === "true");

    collectionUsuarios.updateOne( {$and: [ {"username":request.body.username },  {"rol":"socio" }] },{$set: {"preferenciaTexto":texto, "preferenciaAudio":audio, "preferenciaVideo":video}}, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaIncorrecta);
        }
    });
});

/******************************************************/
// Obtener preferencias usuario
/******************************************************/
// 
app.get("/preferencias-usuario", (request, response) => {
    collectionUsuarios.find({ "rol" : "socio", "username":request.query.username}, {projection: {_id:0 , preferenciaTexto: 1, preferenciaAudio: 1, preferenciaVideo: 1}}).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null || result[0] == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else if (result[0].preferenciaTexto == null || result[0].preferenciaAudio == null || result[0].preferenciaVideo == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            response.send(result[0]);
        }
    });
});

/******************************************************/
// Edición Usuarios
/******************************************************/
app.post("/editarUsuario", (request, response) => {
    collectionUsuarios.replaceOne({ "username": request.body.oldUsername }, request.body, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Registro incorrecto");
        }
        else {
            response.send("Registro completado");
        }
    });
});

/******************************************************/
// Edición grupos
/******************************************************/
app.post("/editarGrupo", (request, response) => {
    collectionGrupos.replaceOne({ "nombre": request.body.nombre , "facilitadorACargo" :  request.body.facilitadorACargo}, request.body, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Registro incorrecto");
        }
        else {
            response.send("Registro completado");
        }
    });
});

/******************************************************/
// Añadir socio a grupo
/******************************************************/
app.post("/anadir-socio-grupo", (request, response) => {
    collectionGrupos.updateOne({ "nombre": request.body.nombre_grupo, "facilitadorACargo" : request.body.facilitadorACargo }, { "$push": { "socios": request.body.user_socio } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el facilitador");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Añadir grupo a grupos de un socio.
/******************************************************/
app.post("/anadir-grupo-socio", (request, response) => {
    collectionUsuarios.updateOne({ "username": request.body.user_socio}, { "$push": { "grupos": request.body.nombre_grupo } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el facilitador");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Eliminar a socio de grupo
/******************************************************/
app.post("/eliminar-socio-grupo", (request, response) => {
    collectionGrupos.updateOne({ "nombre": request.body.nombre_grupo }, { "$pull": { "socios": request.body.user_socio } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el grupo o el usuario");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Desvincular facilitador con socio
/******************************************************/
app.post("/eliminar-grupo-socio", (request, response) => {
    collectionUsuarios.updateOne({ "username": request.body.user_socio }, { "$pull": { "grupos": request.body.nombre_grupo } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró el socio o el grupo");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Obtener tareas del socio
/******************************************************/
app.get("/tareas-socio", (request, response) => {
    let jsonRespuestaCorrecta;
    let hayError = false;
    
    var getTareas = async function(){
        var result = await collectionAsignacionTareas.find({"socioAsignado":request.query.username}, {projection: {_id:0 , nombreTarea: 1, creador: 1, respondida:1, nuevoMensaje:1
        }}).toArray();
        if ( result == null || result[0] == null) {
            hayError = true;
            response.send(result);
        }
        else {
            jsonRespuestaCorrecta = result; 
        }
    }
    
    var obtenerTareasConImagen = async function(){
        await getTareas();
        if (!hayError){
            for (var i = 0; i<jsonRespuestaCorrecta.length; i++){
                var innerResult = await collectionTareas.find({ "nombre": jsonRespuestaCorrecta[i].nombreTarea, "creador": jsonRespuestaCorrecta[i].creador}, {projection: {_id:0 , fotoTarea: 1} }).toArray();
                if ( innerResult == null || innerResult[0] == null) {
                    hayError = true;
                    response.send(innerResult);
                }
                else {
                    const fs = require('fs');
                    if (innerResult[0].fotoTarea == null || innerResult[0].fotoTarea == ""){
                        const contents = fs.readFileSync("media/placeholder-image-83226358.jpg", {encoding: 'base64'});
                        jsonRespuestaCorrecta[i].fotoTarea = contents;
                    }
                    else {
                        const contents = fs.readFileSync("media/"+innerResult[0].fotoTarea, {encoding: 'base64'});
                        jsonRespuestaCorrecta[i].fotoTarea = contents;
                    }
                }                   
            }
        }
    }

    obtenerTareasConImagen().then(() => {
        if(!hayError){
            var respuestaFormateada = "{\"arrayRespuesta\":" + JSON.stringify(jsonRespuestaCorrecta) + "}";
            response.send(respuestaFormateada);
        }
    }).catch(err => console.log(err));
 
});

/******************************************************/
// Obtener una tarea del socio
/******************************************************/
app.get("/obtener-tarea-socio", (request, response) => {
    let jsonRespuestaCorrecta;
    let hayError = false;
    const fs = require('fs');
    
    var getTarea = async function(){
        var result = await collectionTareas.find({ "nombre": request.query.nombreTarea, "creador": request.query.creador}, {projection: {_id:0 , descripcion:1, fotoTarea: 1} }).toArray();
        if ( result == null || result[0] == null) {
            hayError = true;
            response.send(result);
        }
        else {   
            jsonRespuestaCorrecta = result[0];  
           
        }
    }

    
    var obtenerFormatoEntrega = async function (){
        var result = await collectionAsignacionTareas.find({ "socioAsignado": request.query.username, "nombreTarea": request.query.nombreTarea, "creador": request.query.creador }, {projection: {_id:0 , permiteAudio: 1, permiteTexto:1, permiteVideo:1, tieneAudio:1, tieneVideo:1, idChat:1, nombreChat:1} }).toArray();

        if ( result == null || result[0] == null) {
            hayError = true;
            response.send(result);
        }
        else {
            jsonRespuestaCorrecta.permiteAudio = result[0].permiteAudio; 
            jsonRespuestaCorrecta.permiteTexto = result[0].permiteTexto;
            jsonRespuestaCorrecta.permiteVideo = result[0].permiteVideo;
            jsonRespuestaCorrecta.tieneAudio = result[0].tieneAudio; 
            jsonRespuestaCorrecta.tieneVideo = result[0].tieneVideo;
            jsonRespuestaCorrecta.idChat = result[0].idChat;
            jsonRespuestaCorrecta.nombreChat = result[0].nombreChat;
        }
    }
    
    var obtenerMoteImagenFacilitador = async function(){
        await getTarea();
        await obtenerFormatoEntrega();
        if (!hayError){
            var innerResult = await collectionUsuarios.find({ "username": request.query.creador}, {projection: {_id:0 , imagenPerfil: 1, mote:1} }).toArray();
            if ( innerResult == null || innerResult[0] == null) {
                hayError = true;
                response.send(innerResult);
            }
            else {
                jsonRespuestaCorrecta.fotoFacilitador = innerResult[0].imagenPerfil;
                jsonRespuestaCorrecta.mote = innerResult[0].mote;
            }                   
        }
    }

    var obtenerMedia = async function(){
        await obtenerMoteImagenFacilitador();

        const contents = fs.readFileSync("media/"+jsonRespuestaCorrecta.fotoFacilitador, {encoding: 'base64'});
        jsonRespuestaCorrecta.fotoFacilitador = contents;
        
        if (jsonRespuestaCorrecta.fotoTarea != "" && jsonRespuestaCorrecta.fotoTarea != null){
            const fotoTarea = fs.readFileSync("media/"+jsonRespuestaCorrecta.fotoTarea, {encoding: 'base64'});
            jsonRespuestaCorrecta.fotoTarea = fotoTarea;
        }
        else {
            const fotoTarea = fs.readFileSync("media/placeholder-image-83226358.jpg", {encoding: 'base64'});
            jsonRespuestaCorrecta.fotoTarea = fotoTarea;
        }
    }
    
    obtenerMedia().then(() => {
        if(!hayError){
            response.send(jsonRespuestaCorrecta);
        }
    }).catch(err => console.log(err));
 
});


/******************************************************/
// Obtener multimedia de la tarea del socio (video, audio)
/******************************************************/
app.get("/obtener-multimedia-tarea-socio", (request, response) => {
    let jsonRespuestaCorrecta;
    let jsonMultimedia = {};
    let hayError = false;
    const fs = require('fs');
    
    var obtenerMedia = async function(){ 
        if (request.query.tipo == "audio"){
            await getAudioTarea();
        }
        else if (request.query.tipo == "video"){
            await getVideoTarea();
        }
    }

    var getVideoTarea = async function(){
        var result = await collectionTareas.find({ "nombre": request.query.nombreTarea, "creador": request.query.creador}, {projection: {_id:0, videoTarea:1} }).toArray();
        if ( result == null || result[0] == null) {
            hayError = true;
            response.send(result);
        }
        else {   
            jsonRespuestaCorrecta = result[0];
            const videoCodificado = fs.readFileSync("media/"+jsonRespuestaCorrecta.videoTarea, {encoding: 'base64'});
            jsonMultimedia.multimedia = videoCodificado;
        }
    }

    var getAudioTarea = async function(){
        var result = await collectionTareas.find({ "nombre": request.query.nombreTarea, "creador": request.query.creador}, {projection: {_id:0, audioTarea:1} }).toArray();
        if ( result == null || result[0] == null) {
            hayError = true;
            response.send(result);
        }
        else {   
            jsonRespuestaCorrecta = result[0];
            const audioCodificado = fs.readFileSync("media/"+jsonRespuestaCorrecta.audioTarea, {encoding: 'base64'});
            jsonMultimedia.multimedia = audioCodificado;
        }
    }

    obtenerMedia().then(() => {
        if(!hayError){
            response.send(jsonMultimedia);
        }
    }).catch(err => console.log(err));
 
});


/******************************************************/
// Enviar respuesta a tarea (como socio)
/******************************************************/
app.post("/enviar-respuesta-tarea", (request, response) => {
    
    var resp = ""; 
    if (request.body.formatoEntrega == ".txt"){
        resp = request.body.filedata;
    }
    else {
        const fs = require('fs');
        resp = 'respuesta_' + request.body.nombreTarea + "_" + request.body.username + request.body.formatoEntrega;
        request.body.filedata = request.body.filedata.replace(/ /g,"+");
        let buff = Buffer.from(request.body.filedata, 'base64');
        fs.writeFile('media/' + resp, buff, (err) => {
            if (err) throw err;
            console.log('Uploaded response to task');
        });
    }

    collectionAsignacionTareas.updateOne({"socioAsignado": request.body.username, "nombreTarea": request.body.nombreTarea, "creador": request.body.creador}, { $set: { "respondida": true, "vista":false, "respuesta":resp } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaIncorrecta); 
        }
    });
    
});


/******************************************************/
// Marcar los mensajes del chat de una tarea como vistos
/******************************************************/
app.post("/chat-visto-tarea-socio", (request, response) => {
    
    collectionAsignacionTareas.updateOne({"socioAsignado": request.body.username, "nombreTarea": request.body.nombreTarea, "creador": request.body.creador}, { $set: { "nuevoMensaje":false } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaIncorrecta); 
        }
    });
    
});

/******************************************************/
// Registrar que ha habido un nuevo mensaje de socio
/******************************************************/
app.post("/nuevo-mensaje-socio", (request, response) => {
    
    collectionAsignacionTareas.updateOne({"socioAsignado": request.body.username, "nombreTarea": request.body.nombreTarea, "creador": request.body.creador}, { $set: { "nuevoMensajeFacilitador":true } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaIncorrecta); 
        }
    });
    
});

/******************************************************/
// obtener foto del facilitador (para chat en Android)
/******************************************************/
app.get("/foto-facilitador", (request, response) => {
    
    let jsonRespuestaCorrecta;
    let hayError = false;

    var obtenerImagenFacilitador = async function(){
        var innerResult = await collectionUsuarios.find({ "username": request.query.creador}, {projection: {_id:0 , imagenPerfil: 1} }).toArray();
        if ( innerResult == null || innerResult[0] == null) {
            hayError = true;
            response.send(innerResult);
        }
        else {
            const fs = require('fs');
            const contents = fs.readFileSync("media/"+innerResult[0].imagenPerfil, {encoding: 'base64'});
            jsonRespuestaCorrecta = contents;
        }                   
    }

    obtenerImagenFacilitador().then(() => {
        if(!hayError){
            var respuestaFormateada = "{\"fotoFacilitador\":" + JSON.stringify(jsonRespuestaCorrecta) + "}";
            response.send(respuestaFormateada);
         }
    }).catch(err => console.log(err));
    
});

/******************************************************/
// Obtener facilitadores del socio
/******************************************************/
app.get("/facilitadores-socio", (request, response) => {
    let jsonRespuestaCorrecta = new Array ();
    let hayError = false;
    
    var getFacilitadores = async function(){
        var result = await collectionUsuarios.find({"username":request.query.username}, {projection: {_id:0 , facilitadoresACargo: 1}}).toArray();
        if ( result == null || result[0] == null) {
            hayError = true;
            response.send(result);
        }
        else {

            for (var i = 0; i<result[0].facilitadoresACargo.length; i++){
                let respuesta = '{ \"username":' + '"' + result[0].facilitadoresACargo[i] + '"' + '}';
                jsonRespuestaCorrecta.push(JSON.parse(respuesta));
            }
            
            console.log("RESPUESTA FACILITADORES: " + JSON.stringify(jsonRespuestaCorrecta));
        }
    }
    
    var obtenerFacilitadoresConImagen = async function(){
        await getFacilitadores();
        if (!hayError){
            
            for (var i = 0; i<jsonRespuestaCorrecta.length; i++){
                var innerResult = await collectionUsuarios.find({ "username": jsonRespuestaCorrecta[i].username}, {projection: {_id:0 , imagenPerfil: 1, mote:1} }).toArray();
                if ( innerResult == null || innerResult[0] == null) {
                    hayError = true;
                    response.send(innerResult);
                }
                else {
                    const fs = require('fs');
                    const contents = fs.readFileSync("media/"+innerResult[0].imagenPerfil, {encoding: 'base64'});
                    jsonRespuestaCorrecta[i].fotoFacilitador = contents; 
                    jsonRespuestaCorrecta[i].mote = innerResult[0].mote;
                }                   
            }
            
        }
    }

    obtenerFacilitadoresConImagen().then(() => {
        if(!hayError){
            var respuestaFormateada = "{\"arrayRespuesta\":" + JSON.stringify(jsonRespuestaCorrecta) + "}";
            response.send(respuestaFormateada);
         }
    }).catch(err => console.log(err));
 
});

/******************************************************/
// Enviar tarea
/******************************************************/
app.post("/enviar-tarea", (request, response) => {
    collectionAsignacionTareas.insertOne(request.body, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Fallo en el envio de tarea");
        }
        else {
            response.send("Envío completado");
        }
    });
});

/******************************************************/
// Tareas enviadas
/******************************************************/
app.post("/tareas-enviadas", (request, response) => {
    collectionAsignacionTareas.find({ "creador": request.body.creador }).sort({vista: 1, nuevoMensajeFacilitador: -1}).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Aún no has enviado tareas!");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Editar tarea enviada o mandar tarea con nuevo mensaje
/******************************************************/
app.post("/editar-tarea-enviada", (request, response) => {
    collectionAsignacionTareas.replaceOne({ "creador": request.body.creador, "socioAsignado":request.body.socioAsignado, "nombreTarea":request.body.nombreTarea, "fechaEntrega": request.body.fechaEntrega }, request.body, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Fallo en la actualizacíón");
        }
        else {
            response.send("Actualización completada");
        }
    });
});

/******************************************************/
// Eliminar tarea mandada
/******************************************************/
app.post("/eliminar-tarea-enviada", (request, response) => {
    collectionAsignacionTareas.deleteOne({ "creador": request.body.creador, "socioAsignado":request.body.socioAsignado, "nombreTarea":request.body.nombreTarea, "fechaEntrega": request.body.fechaEntrega }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            var jsonRespuestaIncorrecta = JSON.parse('{"exito":0}');
            response.send(jsonRespuestaIncorrecta);
        }
        else {
            var jsonRespuestaCorrecta = JSON.parse('{"exito":1}');
            response.send(jsonRespuestaCorrecta);
        }
    });
});

/******************************************************/
// Info tarea enviada
/******************************************************/
app.post("/info-tarea-enviada", (request, response) => {
    collectionAsignacionTareas.find({ "creador": request.body.creador, "socioAsignado":request.body.socioAsignado, "nombreTarea":request.body.nombreTarea, "fechaEntrega": request.body.fechaEntrega }).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró la tarea");
        }
        else {
            response.send(result);
        }
    });
});

/******************************************************/
// Info chat
/******************************************************/
app.get("/info-chat", (request, response) => {
    collectionChats.findOne( (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == "") {
            response.send("No se encontró ningún chat"); 
        }
        else{
            response.send(result);
        }
    });
});

/******************************************************/
// Borrar chat
/******************************************************/
app.post("/borrar-chat", (request, response) => {
    collectionChats.deleteOne({ "idChat": request.body.idChat }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("No se encontró ningún chat");
        }
        else {
            response.send(result);
        }
    });
});

/**/
// Nuevo mensaje enviado por parte del facilitador
/**/
app.post("/nuevo-mensaje-web", (request, response) => {
    collectionAsignacionTareas.updateOne({ "creador": request.body.creador, "socioAsignado":request.body.socioAsignado, "nombreTarea":request.body.nombreTarea, "fechaEntrega": request.body.fechaEntrega }, { $set: { nuevoMensaje: true } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Fallo en la actualizacíón");
        }
        else {
            response.send("Actualización completada");
        }
    });
});

/**/
// Tarea vista por el facilitador
/**/
app.post("/tarea-vista-web", (request, response) => {
    collectionAsignacionTareas.updateOne({ "creador": request.body.creador, "socioAsignado":request.body.socioAsignado, "nombreTarea":request.body.nombreTarea, "fechaEntrega": request.body.fechaEntrega }, { $set: { vista: true, nuevoMensajeFacilitador: false } }, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Fallo en la actualizacíón");
        }
        else {
            response.send("Actualización completada");
        }
    });
});

/**/
// Tareas que tengan notificaciones
/**/
app.post("/tareas-con-notificaciones", (request, response) => {
    collectionAsignacionTareas.find({ "creador": request.body.creador, $or: [{"vista": false}, {"nuevoMensajeFacilitador": true}]}).sort({vista: 1, nuevoMensajeFacilitador: -1}).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Aún no has enviado tareas!");
        }
        else {
            response.send(result);
        }
    });
});

/**/
// Tareas facilitador socio concreto
/**/
app.post("/tareas-enviadas-socio", (request, response) => {
    collectionAsignacionTareas.find({ "creador": request.body.creador, "socioAsignado": request.body.socioAsignado }).sort({vista: 1, nuevoMensajeFacilitador: -1}).toArray(function (error, result) {
        if (error) {
            return response.status(500).send(error);
        }
        if (result == null) {
            response.send("Aún no has enviado tareas!");
        }
        else {
            response.send(result);
        }
    });
});