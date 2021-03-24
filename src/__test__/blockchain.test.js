
const Blockchain = require('../Blockchain');
const Block = require('../block');
const bitcoinMessage = require('bitcoinjs-message');

describe('Test Blockchain', () => {
    let test_data = "Test Block";

    // #1
    it('Test add genesis block', async () => {
        let blockchain = await new Blockchain.Blockchain();
        expect(blockchain.height).toBe(0);
        expect(blockchain.chain.length).toBe(1);
        let genesis = blockchain.chain[0];
        expect(genesis.height).toBe(0);
        expect(genesis.previousBlockHash).toBeNull();
        expect(genesis.time).toMatch(/^\d+$/);
        expect(genesis.hash).not.toBeNull();
        expect(genesis.data).not.toBeNull();
    });

    
    // #2
    it('Test add normal block', async () => {
        let blockchain = await new Blockchain.Blockchain();
        let block = new Block.Block(test_data);

        return blockchain._addBlock(block).then(result => {
            expect(blockchain.height).toBe(1);
            expect(blockchain.chain.length).toBe(2);
            expect(result.height).toBe(1);
            expect(result.previousBlockHash).toBe(blockchain.chain[0].hash);
        });
    });


    // #3
    it('Test requestMessageOwnershipVerification', async () => {
        let blockchain = await new Blockchain.Blockchain();
        let block = new Block.Block(test_data);
        let wallet_addr = 'tb1q8d9zph5330g7h3xn5et8hddkex6fsds4jwk8j0';

        return blockchain.requestMessageOwnershipVerification(wallet_addr).then(result => {
            console.debug(result);
            expect(result).toMatch(`${wallet_addr}:`);
            expect(result.split(':').length).toBe(3);
        });
    });


    // #4
    it('Test submitStar with expired message', async () =>{
        let blockchain = await new Blockchain.Blockchain();
        let wallet_addr = 'tb1q8d9zph5330g7h3xn5et8hddkex6fsds4jwk8j0';
        let message = await blockchain.requestMessageOwnershipVerification(wallet_addr);
        let signature = 'aslk3rjasflka309rufjifasd;jcf0f2jjfojd20jrgj[qeadjv';
        let test_data = 'TESTING MESSAGE';

        jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2050-12-31T23:59:59.999Z'));
        expect.assertions(1);
        return blockchain.submitStar(wallet_addr, message, signature, test_data)
            .catch(err => {
                expect(err).toMatch('MESSAGE EXPIRED');
        });
    });


    // #5
    it('Test submitStar with valid message', async () =>{
        let blockchain = await new Blockchain.Blockchain();
        let wallet_addr = 'tb1q8d9zph5330g7h3xn5et8hddkex6fsds4jwk8j0';
        let message = await blockchain.requestMessageOwnershipVerification(wallet_addr);
        let signature = 'aslk3rjasflka309rufjifasd;jcf0f2jjfojd20jrgj[qeadjv';
        let test_data = 'TESTING MESSAGE';

        jest.spyOn(bitcoinMessage, 'verify').mockImplementationOnce(() => true);
        return blockchain.submitStar(wallet_addr, message, signature, test_data)
            .then(result => {
                expect(result).not.toBeNull();
                expect(result.body).not.toBeNull();
                expect(blockchain.height).toBe(1);
                expect(blockchain.chain[blockchain.height]).toBe(result);
        });
    });


    // #6
    it('Test submitStar with invalid message', async () =>{
        let blockchain = await new Blockchain.Blockchain();
        let wallet_addr = 'tb1q8d9zph5330g7h3xn5et8hddkex6fsds4jwk8j0';
        let message = await blockchain.requestMessageOwnershipVerification(wallet_addr);
        let signature = 'aslk3rjasflka309rufjifasd;jcf0f2jjfojd20jrgj[qeadjv';
        let test_data = 'TESTING MESSAGE';

        jest.spyOn(bitcoinMessage, 'verify').mockImplementationOnce(() => false);
        expect.assertions(1)
        return blockchain.submitStar(wallet_addr, message, signature, test_data)
            .catch(err => {
                expect(err).toMatch('INVALID SIGNATURE');
        });
    });


    // #7
    it('Test getBlockByHash with found', async () => {
        let blockchain = await new Blockchain.Blockchain();
        let block = new Block.Block(test_data);
        blockchain._addBlock(block);
        let hash = block.hash;

        let block2 = new Block.Block(test_data);
        blockchain._addBlock(block2);

        return blockchain.getBlockByHash(hash).then(result => {
            expect(result.length).toBe(1);
            expect(result[0]).toBe(block);
        });
    });


    // #8
    it('Test getBlockByHash not found', async () => {
        let blockchain = await new Blockchain.Blockchain();
        let block = new Block.Block(test_data);
        blockchain._addBlock(block);
        let hash = block.hash;

        let block2 = new Block.Block(test_data);
        blockchain._addBlock(block2);

        return blockchain.getBlockByHash('A123').then(result => {
            expect(result).toBeNull();
        });
    });

    
    // #9
    it('Test getStarsByWalletAddress with valid address', async () => {
        let blockchain = await new Blockchain.Blockchain();
        let wallet_addr = 'tb1q8d9zph5330g7h3xn5et8hddkex6fsds4jwk8j0';
        let block = new Block.Block({data: test_data, address: wallet_addr});
        blockchain._addBlock(block);
        let block2 = new Block.Block({data: test_data, address: wallet_addr});
        blockchain._addBlock(block2);
        let block3 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block3);

        return blockchain.getStarsByWalletAddress(wallet_addr).then(result => {
            expect(result.length).toBe(2);
            expect(result[0].address).toBe(wallet_addr);
            expect(result[1].address).toBe(wallet_addr);
        })
    });


    // #10
    it('Test getStarsByWalletAddress with no valid address', async () => {
        let blockchain = await new Blockchain.Blockchain();
        let wallet_addr = 'tb1q8d9zph5330g7h3xn5et8hddkex6fsds4jwk8j0';
        let block = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block);
        let block2 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block2);
        let block3 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block3);

        expect.assertions(1);
        return blockchain.getStarsByWalletAddress(wallet_addr).catch(error => {
            expect(error).toMatch('NOT FOUND');
        })
    });


    // #11
    it('Test validateChain with broken chain', async () => {
        let blockchain = await new Blockchain.Blockchain();
        let wallet_addr = 'tb1q8d9zph5330g7h3xn5et8hddkex6fsds4jwk8j0';
        let block = new Block.Block({data: test_data, address: wallet_addr});
        blockchain._addBlock(block);
        let block2 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block2);
        let block3 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block3);

        jest.spyOn(block2, 'previousBlockHash', 'get').mockImplementation(() => 0);

        return blockchain.validateChain().then(result => {
            expect(result.length).toBe(1);
            expect(result[0]).toMatch('CHAIN BROKEN');
        });
    });

 
    // #12
    it('Test validateChain with invalid block', async () => {
        let blockchain = await new Blockchain.Blockchain();
        let wallet_addr = 'tb1q8d9zph5330g7h3xn5et8hddkex6fsds4jwk8j0';
        let block = new Block.Block({data: test_data, address: wallet_addr});
        blockchain._addBlock(block);
        let block2 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block2);
        let block3 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block3);

        jest.spyOn(block2, 'validate').mockImplementation(() => new Promise(resolve => {resolve(false)}));

        return blockchain.validateChain().then(result => {
            expect(result.length).toBe(1);
            expect(result[0]).toMatch('INVALID BLOCK');
        });
    });


    // #13
    it('Test validateChain with both broken chain and invalid block', async () => {
        let blockchain = await new Blockchain.Blockchain();
        let wallet_addr = 'tb1q8d9zph5330g7h3xn5et8hddkex6fsds4jwk8j0';
        let block = new Block.Block({data: test_data, address: wallet_addr});
        blockchain._addBlock(block);
        let block2 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block2);
        let block3 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block3);

        jest.spyOn(block2, 'previousBlockHash', 'get').mockImplementation(() => 0);
        jest.spyOn(block2, 'validate').mockImplementation(() => new Promise(resolve => {resolve(false)}));

        return blockchain.validateChain().then(result => {
            expect(result.length).toBe(2);
            expect(result[0]).toMatch('INVALID BLOCK');
            expect(result[1]).toMatch('CHAIN BROKEN');
        });
    });


    // #14
    it('Test validateChain with no error', async () => {
        let blockchain = await new Blockchain.Blockchain();
        let wallet_addr = 'tb1q8d9zph5330g7h3xn5et8hddkex6fsds4jwk8j0';
        let block = new Block.Block({data: test_data, address: wallet_addr});
        blockchain._addBlock(block);
        let block2 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block2);
        let block3 = new Block.Block({data: test_data, address: 'abc123'});
        blockchain._addBlock(block3);

        return blockchain.validateChain().then(result => {
            expect(result.length).toBe(0);
        });
    });

});

