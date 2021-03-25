const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const Blockchain = require('./src/blockchain');
const BlockchainController = require('./src/controller/blockchain-controller');

class ApplicationServer{
    constructor(){
        console.info('Initializing Application Server...');
        this.app = express();
        this.initExpress();
        this.initMiddleware();
        this.initBlockchain();
        this.initController();

        this.start();
    }

    initExpress(){
        this.app.set("port", 8200);
    }

    initMiddleware(){
		this.app.use(morgan("dev"));
		this.app.use(bodyParser.urlencoded({extended:true}));
		this.app.use(bodyParser.json());
    }

    initBlockchain(){
        this.blockchain = new Blockchain.Blockchain();
    }

    initController(){
        new BlockchainController.BlockchainController(this.app, this.blockchain);
    }

    start(){
        let port = this.app.get("port");
        console.info(`Application server is starting at ${port}... `);
        this.app.listen(port, () => {
            console.info(`Listening at port ${port}.`);
        });
    }
} 

new ApplicationServer();
