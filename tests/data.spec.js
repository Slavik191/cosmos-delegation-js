/** ******************************************************************************
 *   (c) 2019 ZondaX GmbH
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ******************************************************************************* */
// eslint-disable-next-line import/extensions,import/no-unresolved
import CosmosDelegateTool from 'index.js';
import txs from 'txs';
import {getWallet, signWithMnemonic} from 'utils.js';

// TODO: Improve these tests by mocking node rest responses

test('get account info', async () => {
    const cdt = new CosmosDelegateTool();

    const addr = {bech32: 'cosmos1k7ezdfu3j69npzhccs6m4hu99pydagsva0h0gp'};
    const answer = await cdt.getAccountInfo(addr);

    expect(answer).toHaveProperty('sequence');
    expect(answer).toHaveProperty('balanceuAtom');
});

test('get multiple accounts', async () => {
    const cdt = new CosmosDelegateTool();

    const addrs = [
        {bech32: 'cosmos1k7ezdfu3j69npzhccs6m4hu99pydagsva0h0gp'},
        {bech32: 'cosmos19krh5y8y5wce3mmj3dxffyc7hgu9tsxndsmmml'},
    ];

    const reply = await cdt.retrieveBalances(addrs);

    console.log(JSON.stringify(reply, null, 4));

    expect(reply[0]).toHaveProperty('balanceuAtom');
    expect(reply[1]).toHaveProperty('balanceuAtom');
});

test('get multiple accounts 2', async () => {
    const cdt = new CosmosDelegateTool();

    const addrs = [
        {
            path: [44, 118, 0, 0, 0],
            bech32: 'cosmos1k7ezdfu3j69npzhccs6m4hu99pydagsva0h0gp',
        },
        {
            pk: '021fde41bbaf3ca7567d8b9f0b6423cb4405f9897d175a826192af551bf30764f8',
            path: [44, 118, 0, 0, 1],
            bech32: 'cosmos1zt4tkl5y5mtq5u2wa4wm2z88dwu0pz258e6aqj',
        },
        {
            pk: '020ed96fd39753bdcc0aab176e654165c7c86b597738a30e8b82202e84eef8f093',
            path: [44, 118, 0, 0, 2],
            bech32: 'cosmos1hkhu7msq5avuah83qdqrp9408hs8kk0slplvj9',
        },
        {
            pk: '0398536942a89fe7a6f5dee1371ca309163952ec6c45f07d61c4a6c993db23373a',
            path: [44, 118, 0, 0, 3],
            bech32: 'cosmos1plsr5lx33hrwczau8cppvae0nqy5cj3rhug52y',
        },
        {
            pk: '03bd0b280921e24c911389cf624eda6da93bacddbad13d23e8381e1f4d9b4966df',
            path: [44, 118, 0, 0, 4],
            bech32: 'cosmos1a69hjkgvm6raz0z7s6hpv4n7f3unhqt4h7rxm8',
        },
        {
            pk: '0236db5773fedd060b582f9b42d838166bc6d37eeb1d1921a958634df0deab6896',
            path: [44, 118, 0, 0, 5],
            bech32: 'cosmos17xkagmer7mte7ycdqxda4a3xfun5pyjwvf5p69',
        }];

    const reply = await cdt.retrieveBalances(addrs);
    console.log(reply);
    expect(reply.length).toBe(6);
});


test('create delegate tx', async () => {
    const cdt = new CosmosDelegateTool();

    const txContext = {
        chainId: 'testing',
        bech32: 'cosmos1k7ezdfu3j69npzhccs6m4hu99pydagsva0h0gp',
    };

    const validatorAddrBech32 = 'cosmosvaloper1zyp0axz2t55lxkmgrvg4vpey2rf4ratcsud07t';
    const uAtomAmount = 100;
    const memo = 'some message';

    const unsignedTx = await cdt.txCreateDelegate(txContext, validatorAddrBech32, uAtomAmount, memo);

    console.log(unsignedTx);
});

test('relay delegation tx', async () => {
    const cdt = new CosmosDelegateTool();

    const validatorAddrBech32 = 'cosmosvaloper19krh5y8y5wce3mmj3dxffyc7hgu9tsxngy0whv';
    const uAtomAmount = 100000;
    const memo = 'some message';

    const txContext = {
        chainId: 'testing',
        bech32: 'cosmos1k7ezdfu3j69npzhccs6m4hu99pydagsva0h0gp',
        pk: '028284dfb203d9a702eb6d60ea7bcf37b7099f66d363ac024a9b249859bfb7dc3e',
    };

    // Create a delegation transaction
    const unsignedTx = await cdt.txCreateDelegate(txContext, validatorAddrBech32, uAtomAmount, memo);

    const bts = txs.getBytesToSign(unsignedTx, txContext);
    console.log(bts);
    console.log(bts.length);

    // Sign locally using mnemonic
    const mnemonic = 'table artist summer collect crack cruel lunar love gorilla road peanut wrestle system skirt shoulder female claim cannon price frost pole fury ranch fabric';
    const wallet = getWallet(mnemonic);
    expect(wallet.publicKey).toEqual(txContext.pk);

    const signature = signWithMnemonic(bts, wallet);

    const signedTx = txs.applySignature(unsignedTx, txContext, signature);

    console.log(JSON.stringify(signedTx, null, 4));

    // Now submit the transaction
    const response = await cdt.txSubmit(signedTx);

    // Print response
    console.log(response);
    expect('error' in unsignedTx).toEqual(false);
});

test('get bytes to sign', async () => {
    const cdt = new CosmosDelegateTool();

    const txContext = {
        chainId: 'some_chain',
        bech32: 'cosmos1k7ezdfu3j69npzhccs6m4hu99pydagsva0h0gp'
    };

    const dummyTx = await cdt.txCreateDelegate(
        txContext,
        'validatorAddress',
        100,
        'some_memo',
    );

    const bytesToSign = txs.getBytesToSign(dummyTx, txContext);

    console.log(bytesToSign);
});

test('get tx status - unknown', async () => {
    const cdt = new CosmosDelegateTool();

    const txHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const status = await cdt.txStatus(txHash);

    console.log(status);
    expect(status.error).toEqual('Tx: Response error: RPC error -32603 - Internal error: Tx (0000000000000000000000000000000000000000000000000000000000000000) not found');
});
