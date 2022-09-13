import express from "express";
import cors from 'cors';
import dayjs from 'dayjs';
import joi from 'joi';
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;

mongoClient.connect().then(()=>{
    db = mongoClient.db('test');
})
    
const nomeSchema = joi.object({
    name: joi.string().required(),
});

const mensagensSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message').valid('private_message').required()
})


// CADASTRO DE PARTICIPANTES
    server.post('/participants', async (req, res) =>{
        const nome = req.body.name;
        const validation = nomeSchema.validate(req.body);

        if(validation.error){
            return res.status(422).send(validation.error.message);
        }   
        try {
            const response = await db.collection('cadastrados').findOne({ name: nome });
             if(response !== null){
                return res.sendStatus(409);
            } 
        } catch (error) {
            console.log(error);
            return res.sendStatus(500);
        }
         try {
           const responseCadastro = await db.collection('cadastrados').insertOne({name: nome, lastStatus: Date.now()});

            const responseMensagem = await db.collection('mensagens').insertOne({from: nome, to: 'todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')})
                
                console.log(responseCadastro);
                console.log(responseMensagem);
            res.sendStatus(201);
         } catch (error) {
            console.log(error);
            res.sendStatus(500);
         }
    });


// LISTA DE PARTICIPANTES
    server.get('/participants', async(req, res) => {
        try {
            const response = await db.collection('cadastrados').find().toArray()
            res.send(response)
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    });
// ENVIAR MENSAGENS
    server.post('/messages', async (req, res)=>{
        const {to, text, type} = req.body;
        const from = req.headers.user;
        console.log(req.headers.user);

        const validation = mensagensSchema.validate(req.body);
        if(validation.error){
            return res.status(422).send(validation.error.message)
        }
        
        try {
            const response = await db.collection('cadastrados').findOne({ name: from });
            if(response.name === null){
                return res.sendStatus(422);
            }
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }

        try {
            const retorno = await db.collection('mensagens').insertOne({from: from, to: to.toLowerCase(), text: text, type: type, time: dayjs().format('HH:mm:ss')})
        console.log(retorno);
        res.sendStatus(201);
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    })
// RECEBER MENSAGENS
    server.get('/messages', async (req, res) =>{
        const { limit } = req.query;
        const usuario = req.headers.user;

        try {
            if (limit){
                const resposta = await db.collection('mensagens').find({$or: [{ from: usuario } , { to: 'todos' } , {to: usuario }]}).limit(parseInt(limit)).toArray();
                return res.send(resposta);
            } 

            const resposta = await db.collection('mensagens').find({$or: [{ from: usuario } , { to: 'todos' } , {to: usuario }]}).toArray();
            return res.send(resposta);
            
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    });

    server.post('/status', async (req, res)=>{
        const usuario = req.headers.user;
/*         console.log(usuario);
 */        try {
            const resposta = await db.collection('cadastrados').findOne({ name: usuario});
            if(!resposta){
                return res.sendStatus(404);
            }
            const atualizar = await db.collection('cadastrados').updateOne({ name: usuario}, {$set:{lastStatus: Date.now()}});

/*             console.log(atualizar);
 */            
            res.sendStatus(200)
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    })

    setInterval ( async ()=>{
        const response = await db.collection('cadastrados').find().toArray();
        const off = response.filter((value) => value.lastStatus < (Date.now()-10000) )    

        console.log(off);

        if(off){
            off.map(async (value) =>{
                await db.collection('cadastrados').deleteOne({ name: value.name});
                await db.collection('mensagens').insertOne({from: value.name, to: 'todos', text: 'sai da sala...', type: 'status', time: dayjs().format('HH:mm:ss') })
            })    
        }
    }, 15000);

server.listen(5000, () => console.log('listen on port 5000'));