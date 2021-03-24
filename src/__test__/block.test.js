
const Block = require('../block');
const SHA256 = require('crypto-js/sha256');


describe("Test validate", () => {
    let test_data = "Test Block";

    // test the current hash not set
    let block = new Block.Block(test_data);
    it('validate the data, expect false without current hash', async () => {
        let result = await block.validate();
        expect(result).toBe(false);
    });

    // test current hash is set and not modified
    let block2 = new Block.Block(test_data);
    block2.hash = SHA256(JSON.stringify(block2));
    it('validate the data, expect true with hash', async () => {
        let result = await block2.validate();
        expect(result).toBe(true);
    });

    // test current hash is set but block is tampered
    let block3 = new Block.Block(test_data);
    block3.hash = SHA256(JSON.stringify(block3));
    let fraud = new Block.Block("Fraud");
    block3.body = fraud.body;
    it('validate the tampered data, expect false', async () => {
        let result = await block3.validate();
        expect(result).toBe(false);
    });

});

describe('TesT getBData', () => {
    let test_data = "Test Block";

    // set the block as non-genesis block
    let block = new Block.Block(test_data);
    block.height = 1;
    it('Test getBData, normal block returns test data', () => {
        return block.getBData().then(result => {
            expect(result).toBe(test_data);
        });
    });

    // set the block as genesis block
    let block2 = new Block.Block(test_data);
    it('Test getBData, normal block returns test data', () => {
        expect.assertions(1);
        return block2.getBData().catch(result => {
            expect(result).toMatch('Genesis Block');
        });
    });

});

