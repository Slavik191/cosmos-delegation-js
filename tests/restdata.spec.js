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

test('get balance', async () => {
    const cdt = new CosmosDelegateTool();

    const addrs = [
        { bech32: 'cosmos1000ya26q2cmh399q4c5aaacd9lmmdqp92z6l7q' },
        { bech32: 'cosmos102ruvpv2srmunfffxavttxnhezln6fnc3pf7tt' },
    ];

    await cdt.retrieveBalances(addrs);

    // TODO: Improve this test by mocking node rest responses
    expect(addrs[0].balanceuAtom.toString()).toEqual('68991123');
    expect(addrs[1].balanceuAtom.toString()).toEqual('891');
});

// TODO: complete unit tests
test('get tx status', async () => {
    const cdt = new CosmosDelegateTool();

    const txHash = '2F5A18C53E8120EB82C10BE62AB446C8B7B59629372580C5BB190AF0F7BAEC24'
    const status = await cdt.txStatus(txHash);

    expect(status.height).toEqual('115588');
});
