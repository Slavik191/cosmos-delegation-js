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
import CosmosDelegateTool from 'index.js';

// TODO: Improve these tests by mocking node rest responses

test('get account info', async () => {
    const cdt = new CosmosDelegateTool();

    const addr = { bech32: 'cosmos102ruvpv2srmunfffxavttxnhezln6fnc3pf7tt' };
    const answer = await cdt.getAccountInfo(addr);

    expect(answer.sequence).toEqual('60');
    expect(answer.balanceuAtom.toString()).toEqual('891');
});

test('get multiple accounts', async () => {
    const cdt = new CosmosDelegateTool();

    const addrs = [
        { bech32: 'cosmos1000ya26q2cmh399q4c5aaacd9lmmdqp92z6l7q' },
        { bech32: 'cosmos102ruvpv2srmunfffxavttxnhezln6fnc3pf7tt' },
    ];

    const reply = await cdt.retrieveBalances(addrs);

    console.log(reply);

    expect(reply[0].balanceuAtom).toEqual('68991123');
    expect(reply[1].balanceuAtom).toEqual('891');
});

test('get multiple accounts 2', async () => {
    const cdt = new CosmosDelegateTool();

    const addrs = [
        { pk: '02117e3f0b7528e2b06670d5adcdae089a27d3e5d2f61bb53652397f31b97e59e3', path: [44, 118, 0, 0, 0], bech32: 'cosmos1vu7su5av76usjegnpdeqyxpnpknmtrlz9nzsnh' },
        { pk: '021fde41bbaf3ca7567d8b9f0b6423cb4405f9897d175a826192af551bf30764f8', path: [44, 118, 0, 0, 1], bech32: 'cosmos1zt4tkl5y5mtq5u2wa4wm2z88dwu0pz258e6aqj' },
        { pk: '020ed96fd39753bdcc0aab176e654165c7c86b597738a30e8b82202e84eef8f093', path: [44, 118, 0, 0, 2], bech32: 'cosmos1hkhu7msq5avuah83qdqrp9408hs8kk0slplvj9' },
        { pk: '0398536942a89fe7a6f5dee1371ca309163952ec6c45f07d61c4a6c993db23373a', path: [44, 118, 0, 0, 3], bech32: 'cosmos1plsr5lx33hrwczau8cppvae0nqy5cj3rhug52y' },
        { pk: '03bd0b280921e24c911389cf624eda6da93bacddbad13d23e8381e1f4d9b4966df', path: [44, 118, 0, 0, 4], bech32: 'cosmos1a69hjkgvm6raz0z7s6hpv4n7f3unhqt4h7rxm8' },
        { pk: '0236db5773fedd060b582f9b42d838166bc6d37eeb1d1921a958634df0deab6896', path: [44, 118, 0, 0, 5], bech32: 'cosmos17xkagmer7mte7ycdqxda4a3xfun5pyjwvf5p69' }];

    const reply = await cdt.retrieveBalances(addrs);
    console.log(reply);
});


test('create delegate tx', async () => {
    const cdt = new CosmosDelegateTool();

    const txData = {
        accountNumber: 0,
        chainId: 'testnet',
        delegatorAddr: 'cosmos1qpd4xgtqmxyf9ktjh757nkdfnzpnkamny3cpzv',
        validatorAddr: 'cosmosvaloper1zyp0axz2t55lxkmgrvg4vpey2rf4ratcsud07t',
        amount: 10,
        gas: 0,
        memo: 'some funny message',
        sequence: 0,
    };

    const unsignedTx = cdt.txCreateDelegate(txData);
    console.log(unsignedTx);
    expect(unsignedTx.length).toEqual(305);
});

test('get tx status', async () => {
    const cdt = new CosmosDelegateTool();

    const txHash = '2F5A18C53E8120EB82C10BE62AB446C8B7B59629372580C5BB190AF0F7BAEC24';
    const status = await cdt.txStatus(txHash);

    expect(status.height).toEqual('115588');
});
