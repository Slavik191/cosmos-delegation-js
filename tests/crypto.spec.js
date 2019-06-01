import { getWallet } from 'utils.js'

const testMnemonic = 'table artist summer collect crack cruel lunar love gorilla road peanut wrestle system skirt shoulder female claim cannon price frost pole fury ranch fabric';

test('get wallet from mnemonic', async () => {
    const wallet = getWallet(testMnemonic);
    console.log(wallet);
});
