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
// eslint-disable-next-line import/no-unresolved
import txs from 'txs';

test('create Skeleton', async () => {
    const txSkeleton = txs.createSkeleton();
    console.log(txSkeleton);

    expect('type' in txSkeleton).toBe(true);
    expect('value' in txSkeleton).toBe(true);
    // TODO: This test could be removed when we move to Typescript
});

test('canonical JSON', async () => {
    const txContext = {
        accountNumber: '0',
        chainId: 'test_chain',
        sequence: '0',
    };

    const tx = txs.createSkeleton();
    const jsonStr = txs.getBytesToSign(tx, txContext);

    console.log(jsonStr);
});

test('delegate', async () => {
    const txContext = {
        bech32: 'my_addr',
        accountNumber: '0',
        chainId: 'test_chain',
        sequence: '0',
    };
    const txDelegation = txs.createDelegate(
        txContext,
        'val_addr',
        100,
        'some_memo',
    );

    const jsonStr = JSON.stringify(txDelegation);
    const expectedJsonStr = '{"type":"auth/StdTx","value":{"msg":[{"type":"cosmos-sdk/MsgDelegate","value":{"amount":{"amount":"100","denom":"uatom"},"delegator_address":"my_addr","validator_address":"val_addr"}}],"fee":{"amount":[{"amount":"3750","denom":"uatom"}],"gas":"150000"},"memo":"some_memo","signatures":[{"signature":"N/A","account_number":"0","sequence":"0","pub_key":{"type":"tendermint/PubKeySecp256k1","value":"PK"}}]}}';

    console.log(JSON.stringify(txDelegation, null, 2));
    expect(jsonStr).toBe(expectedJsonStr);
});

test('get bytes to sign', async () => {
    const txContext = {
        bech32: 'my_addr',
        accountNumber: '0',
        chainId: 'test_chain',
        sequence: '0',
    };
    const txDelegation = txs.createDelegate(
        txContext,
        'val_addr',
        100,
        'some_memo',
    );

    const jsonStr = txs.getBytesToSign(txDelegation, txContext);
    const expectedJsonStr = '{"account_number":"0","chain_id":"test_chain","fee":{"amount":[{"amount":"3750","denom":"uatom"}],"gas":"150000"},"memo":"some_memo","msgs":[{"type":"cosmos-sdk/MsgDelegate","value":{"amount":{"amount":"100","denom":"uatom"},"delegator_address":"my_addr","validator_address":"val_addr"}}],"sequence":"0"}';
    console.log(jsonStr);
    expect(jsonStr).toBe(expectedJsonStr);
});
