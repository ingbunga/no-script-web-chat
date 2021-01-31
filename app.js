const express = require('express');
const EventEmitter = require('events');
const cookieParser = require('cookie-parser');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cookieParser());

class MessageManager{
    messageEvent = new EventEmitter();
    list = [];
    constructor(){
        this.messageEvent.setMaxListeners(10000);
    }
    wait(){
        return new Promise((resolve, reject) => {
            function listner(){
                this.messageEvent.off('new', listner);
                resolve();
            }
            this.messageEvent.on('new', listner.bind(this));
        })
    }
    emit(message){
        this.list.push(message);
        if(this.list.length > 100){
            this.list.splice(0,1);
        }
        this.messageEvent.emit('new');
    }
    send(res){
        res.cookie('reload', '1', {expires: new Date(Date.now() + 1000)})
        res.render('chat', {
            messages: message.list
        })
    }
}

const message = new MessageManager();

app.get('/', (req, res, next) => {
    const username = req.query.username ? req.query.username : '';
    res.render('index',{
        username
    })
})

app.get('/chat', (req, res, next) => {
    const afterReload = req.cookies.reload ? true : false
    const afterSend = req.cookies.send ? true : false
    if(afterReload && !afterSend){
        message.wait()
        .then(() => {
            message.send(res);
        })
    }
    else{
        res.clearCookie('send');
        message.send(res);
    }
})

app.post('/send', (req, res, next) => {
    res.cookie('send', '1')
    message.emit(`${req.body.username}: ${req.body.body}`);
    res.redirect(`/?username=${req.body.username}`);
})


app.listen(3000, () =>{
    console.log('server started in http://localhost:3000/')
})