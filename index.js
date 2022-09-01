import express from "express";
import cors from 'cors';
import dayjs from 'dayjs'
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
    
let tem = undefined;
// CADASTRO DE PARTICIPANTES
    server.post('/participants', (req, res) =>{
        const nome = req.body.name;
       
        db.collection('cadastrados').findOne({ name: nome }).then((data)=>{
            console.log(data);
            tem = data;
        })
       
         if (nome === ""){
            return res.sendStatus(422);
        } else if(tem !== null){
            return res.sendStatus(409);
        } 
  
        db.collection('cadastrados').insertOne({name: nome, lastStatus: Date.now()})
        db.collection('mensagens').insertOne({from: nome, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')})
            res.sendStatus(201);
    });
// LISTA DE PARTICIPANTES
    server.get('/participants', (req, res) => {
        db.collection('cadastrados').find().toArray().then(data =>{
            console.log(data)
            res.send(data)
        })
    });
// ENVIAR MENSAGENS
    server.post('/messages', (req, res)=>{
        const {to, text, type} = req.body;
        const from = req.headers.user;
        console.log(req.headers.user);

        db.collection('cadastrados').findOne({ name: from }).then((data)=>{
            console.log(data);
            tem = data;
        })
        
        if (to === ""|| text === ""
        || type !== 'message' && type !== 'private_message'
        || tem === null){
            return res.sendStatus(422);
        }
        db.collection('mensagens').insertOne({from: from, to: to, text: text, type: type, time: dayjs().format('HH:mm:ss')})
        res.sendStatus(201);
    })

    server.get('/messages', (req, res) =>{
        
    })

server.listen(5000, () => console.log('listen on port 5000'));