const bip39 = require('bip39');
const bip32 = require('bip32');
const secp256k1 = require('secp256k1');
import sha256 from 'crypto-js/sha256';
import { getBech32FromPK } from 'ledger-cosmos-js';


export function getWallet(mnemonic) {
    bip39.validateMnemonic(mnemonic);
    const seed = bip39.mnemonicToSeed(mnemonic);
    const masterKey = bip32.fromSeed(seed);
    const cosmosHD = masterKey.derivePath('m/44\'/118\'/0\'/0/0');
    const { privateKey } = cosmosHD;
    const publicKey = secp256k1.publicKeyCreate(cosmosHD.privateKey, true);

    return {
        privateKey: privateKey.toString('hex'),
        publicKey: publicKey.toString('hex'),
        cosmosAddress: getBech32FromPK('cosmos', publicKey),
    };
}

export function signWithMnemonic(messageToSign, mnemonic) {
    const wallet = getWallet(mnemonic);
    const signHash = Buffer.from(sha256(messageToSign).toString(), 'hex');
    const { signature } = secp256k1.sign(signHash, Buffer.from(wallet.privateKey, 'hex'));
    return signature;
}
