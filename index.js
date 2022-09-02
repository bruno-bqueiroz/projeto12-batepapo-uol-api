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

            const responseMensagem = await db.collection('mensagens').insertOne({from: nome, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')})
                
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

        try {
            const response = await db.collection('cadastrados').findOne({ name: from });
            console.log(response);
            tem = response;
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
        
        if (to === ""|| text === ""
        || type !== 'message' && type !== 'private_message'
        || tem === null){
            return res.sendStatus(422);
        }

        try {
            const retorno = await db.collection('mensagens').insertOne({from: from, to: to, text: text, type: type, time: dayjs().format('HH:mm:ss')})
        console.log(retorno);
        res.sendStatus(201);
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }

        
    })
    
    server.get('/messages', (req, res) =>{
        db.collection('mensagens').find().toArray().then((data)=>{
            console.log(data);
        });
        res.sendStatus(201);
    })

server.listen(5000, () => console.log('listen on port 5000'));