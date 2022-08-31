import express from "express";
import cors from 'cors';
import dayjs from 'dayjs'

const server = express();
server.use(cors());
server.use(express.json());

let cadastro = [
    {
        name: "João"
    },
    {
        name: "Pedro"
    },
    {
        name: "Jose"
    }
    ];
let mensagem = [

];

    server.post('/participants', (req, res) =>{
        const name = req.body.name;
        if (name === ""){
            return res.sendStatus(422);
        }if(cadastro.find((value) => value.name === name)){
            return res.sendStatus(409);
        }
        cadastro = [...cadastro, {name: name, lastStatus: Date.now()}];
        mensagem = [...mensagem, {from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')}]
        res.sendStatus(201);
    });

    server.get('/participants', (req, res) => res.send(cadastro));

    server.post('/messages', (req, res)=>{
        const {to, text, type} = req.body;
        const from = req.headers.user;
        console.log(req.headers.user);

        if (to === ""|| text === ""
        || type !== 'message' && type !== 'private_message'
        || !cadastro.find((value) => value.name === from)){
            return res.sendStatus(422);
        }

        res.send(201);
    })


server.listen(5000, () => console.log('listen on port 5000'));