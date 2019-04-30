/** ******************************************************************************
*  (c) 2019 ZondaX GmbH
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
import axios from 'axios';
import Big from 'big.js';
import {
    // eslint-disable-next-line camelcase
    App, Tools, comm_u2f, comm_node,
} from 'ledger-cosmos-js';

const defaultHrp = 'cosmos';

const CosmosDelegateTool = function () {
    // eslint-disable-next-line camelcase
    this.comm = comm_u2f;
    this.connected = false;
    this.lastError = 'No error';
    this.comm_timeout = 5000;
    this.transport_debug = true;
    this.resturl = 'https://stargate.cosmos.network';
};

CosmosDelegateTool.prototype.switchTransportToHID = function () {
    // eslint-disable-next-line camelcase
    this.comm = comm_node;
};

CosmosDelegateTool.prototype.switchTransportToU2F = function () {
    // eslint-disable-next-line camelcase
    this.comm = comm_u2f;
};

// Detect when a ledger device is connected and verify the cosmos app is running.
CosmosDelegateTool.prototype.connect = async function () {
    this.connected = true;
    this.app = await comm_node
        .create_async(this.comm_timeout, this.transport_debug)
        .then(comm => new App(comm));

    // TODO: Check error code
    // TODO: Check version number
    // const version = await app.get_version();
    // console.log(version);
};

// Retrieve public key
// Retrieve cosmos bech32 address
CosmosDelegateTool.prototype.retrieveAddress = async function (account, index) {
    // TODO: error if not connected

    const answer = {};
    const path = [44, 118, account, 0, index];
    const pk = await this.app.publicKey(path);

    // TODO: Add error handling
    answer.pk = pk.compressed_pk.toString('hex');
    answer.path = path;
    answer.bech32 = Tools.getBech32FromPK(defaultHrp, pk.compressed_pk);

    return answer;
};

// Scan multiple address in a derivation path range (44’/118’/X/0/Y)
// eslint-disable-next-line max-len
CosmosDelegateTool.prototype.scanAddresses = async function (minAccount, maxAccount, minIndex, maxIndex) {
    const answer = [];

    for (let account = minAccount; account < maxAccount + 1; account += 1) {
        for (let index = minIndex; index < maxIndex + 1; index += 1) {
            // retrieve address cannot be called in parallel
            // eslint-disable-next-line no-await-in-loop
            const tmp = await this.retrieveAddress(account, index);
            answer.push(tmp);
        }
    }

    return answer;
};

// Retrieve atom balances from the network for a list of account
// Retrieve delegated/not-delegated balances for each account
CosmosDelegateTool.prototype.retrieveBalances = async function (addressList) {
    const answer = [];

    // Get all validators
    // TODO: cache
    const url = `${this.resturl}/staking/validators`;
    const validators = {};
    const requestValidators = axios.get(url).then((r) => {
        for (let i = 0; i < r.data.length; i += 1) {
            const valdata = {};
            const t = r.data[i];
            valdata.tokens = Big(t.tokens);
            valdata.totalShares = Big(t.delegator_shares);
            validators[t.operator_address] = valdata;
        }
    }, (e) => {
        // TODO: improve error handling
        console.log('Error', addr, e);
    });
    await requestValidators;

    // Get all balances
    const requestsBalance = addressList.map((addr, index) => {
        const url = `${this.resturl}/bank/balances/${addr.bech32}`;
        return axios.get(url).then((r) => {
            let balanceuAtom = Big(0);
            for (let i = 0; i < r.data.length; i += 1) {
                const t = r.data[i];
                if (t.denom === 'uatom') {
                    balanceuAtom = Big(t.amount).toString();
                    break;
                }
            }
            addressList[index].balanceuAtom = balanceuAtom;
        }, (e) => {
            // TODO: improve error handling
            console.log('Error', addr, e);
        });
    });

    // Get all delegations
    const requestsDelegations = addressList.map((addr, index) => {
        const url = `${this.resturl}/staking/delegators/${addr.bech32}/delegations`;
        return axios.get(url).then((r) => {
            const delegationsuAtoms = {};
            let totalDelegation = Big(0);

            for (let i = 0; i < r.data.length; i += 1) {
                const t = r.data[i];
                const valAddr = t.validator_address;

                if (valAddr in validators) {
                    const shares = Big(t.shares);
                    const valData = validators[valAddr];
                    const valTokens = valData.tokens;
                    const valTotalShares = valData.totalShares;
                    const tokens = shares.times(valTokens).div(valTotalShares);
                    delegationsuAtoms[valAddr] = tokens.toString();

                    totalDelegation = totalDelegation.add(tokens);
                }
            }
            addressList[index].delegationsuAtoms = delegationsuAtoms;
            addressList[index].delegationsTotaluAtoms = totalDelegation.toString();
        }, (e) => {
            // TODO: improve error handling
            console.log('Error', addr, e);
        });
    });

    await Promise.all(requestsBalance);
    await Promise.all(requestsDelegations);
    console.log(addressList);

    return answer;
};

// TODO: Create a delegate transaction
// TODO: Create a re-delegate transaction
// TODO: Create an undelegate transaction
CosmosDelegateTool.prototype.txCreate = async function () {
    return 'NA';
};

// TODO: Sign any transaction in a ledger device
CosmosDelegateTool.prototype.txSign = async function (tx) {
    return 'NA';
};

// TODO: Submit/relay the transaction to a network node
CosmosDelegateTool.prototype.txSubmit = async function (tx) {
    return 'NA';
};

// TODO: Retrieve the state of a transaction hash
CosmosDelegateTool.prototype.txStatus = async function (txHash) {
    return 'NA';
};

module.exports = CosmosDelegateTool;
