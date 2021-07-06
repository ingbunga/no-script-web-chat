const express = require('express');
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
    
    messageList = [];
    waitingList = [];

    wait (res) {

        this.waitingList.push( res );

    }
    emit (message) {

        this.messageList.push(message);
        if (this.messageList.length > 100) {
            this.list.splice(0,1);
        }

        this.waitingList.forEach(this.send.bind(this));
        this.waitingList = [];

    }
    send (res) {

        res.cookie('reload', '1', {expires: new Date(Date.now() + 1000)});
        res.render('chat', {
            messages: this.messageList
        });

    }
}



const message = new MessageManager();

app.get('/', (req, res) => {
    res.render('welcome');
})

app.get('/main', (req, res, next) => {
    const username = req.query.username ? req.query.username : '';
    res.render('index', {
        username
    });
})

app.get('/chat', (req, res) => {
    const afterReload = req.cookies.reload ? true : false
    const afterSend = req.cookies.send ? true : false
    if(afterReload && !afterSend){
        message.wait(res)
    }
    else{
        res.clearCookie('send');
        message.send(res);
    }
})

app.post('/send', (req, res) => {
    res.cookie('send', '1')
    message.emit(`${req.body.username}: ${req.body.body}`);
    res.redirect(`/main?username=${req.body.username}`);
})


app.listen(3000, () =>{
    console.log('server started in http://localhost:3000/')
})