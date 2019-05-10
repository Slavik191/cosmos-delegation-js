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
import {
    // eslint-disable-next-line camelcase
    App, comm_node, comm_u2f, Tools,
} from 'ledger-cosmos-js';
import axios from 'axios';
import Big from 'big.js';
import txs from './txs';

const defaultHrp = 'cosmos';

const CosmosDelegateTool = function () {
    // eslint-disable-next-line camelcase
    this.comm = comm_u2f;
    this.connected = false;

    this.lastError = 'No error';
    this.checkAppInfo = false;

    this.timeoutMS = 45000;
    this.transportDebug = false;

    this.resturl = 'http://127.0.0.1:1317';
    // this.resturl = 'https://stargate.cosmos.network';
    //    this.resturl = 'https://lcd.nylira.net';

    this.requiredVersionMajor = 1;
    this.requiredVersionMinor = 1;
};

// eslint-disable-next-line no-unused-vars
CosmosDelegateTool.prototype.setNodeURL = function (resturl) {
    this.resturl = resturl;
};

// Switch transport to HID (useful for local testing)
CosmosDelegateTool.prototype.switchTransportToHID = function () {
    // eslint-disable-next-line camelcase
    this.comm = comm_node;
};

// Switch transport to U2F (can run in browser/client side but requires HTTPS)
CosmosDelegateTool.prototype.switchTransportToU2F = function () {
    // eslint-disable-next-line camelcase
    this.comm = comm_u2f;
};

// This function returns the timeout in the correct units
// timeouts for node and U2F are expressed in different units
function getTimeout(cdt) {
    // eslint-disable-next-line camelcase
    if (cdt.comm === comm_u2f) {
        return cdt.timeoutMS / 1000;
    }
    return cdt.timeoutMS;
}

function wrapError(cdt, e) {
    try {
        // eslint-disable-next-line no-param-reassign
        let errMessage = '';
        if (typeof e.response === 'undefined') {
            errMessage = e.message;
        } else {
            errMessage = e.response.data.error;
        }

        cdt.lastError = errMessage;
        return {
            error: errMessage,
        };
    } catch (e2) {
        // eslint-disable-next-line no-param-reassign
        cdt.lastError = `${e.message}  ${e2.message}`;
        return {
            error: `${e.message}  ${e2.message}`,
        };
    }
}

// Detect when a ledger device is connected and verify the cosmos app is running.
CosmosDelegateTool.prototype.connect = async function () {
    this.connected = false;
    this.lastError = null;

    this.app = await this.comm
        .create_async(getTimeout(this), this.transportDebug)
        .then(comm => new App(comm));

    if (this.checkAppInfo) {
        const appInfo = await this.app.appInfo();
        if (appInfo.return_code !== 0x9000) {
            this.lastError = appInfo.error_message;
            throw new Error(appInfo.error_message);
        }

        appInfo.appName = appInfo.appName || '?';
        console.log(`Detected app ${appInfo.appName} ${appInfo.appVersion}`);

        if (appInfo.appName.toLowerCase() !== 'cosmos') {
            this.lastError = `Incorrect app detected ${appInfo.appName.toString()}`;
            return false;
        }
    }

    const version = await this.app.get_version();
    if (version.return_code !== 0x9000) {
        this.lastError = version.error_message;
        throw new Error(version.error_message);
    }

    const major = version.major || 0;
    const minor = version.minor || 0;

    if (major < this.requiredVersionMajor || minor < this.requiredVersionMinor) {
        this.lastError = 'Version not supported';
        return false;
    }

    // Mark as connected
    this.connected = true;
    return this.connected;
};

function connectedOrThrow(cdt) {
    if (!cdt.connected) {
        this.lastError = 'Device is not connected';
        throw new Error('Device is not connected');
    }
}

// Returns a signed transaction ready to be relayed
CosmosDelegateTool.prototype.sign = async function (unsignedTx, txContext) {
    connectedOrThrow(this);
    if (typeof txContext.path === 'undefined') {
        this.lastError = 'context should include the account path';
        throw new Error('context should include the account path');
    }

    const bytesToSign = txs.getBytesToSign(unsignedTx, txContext);
    console.log(bytesToSign);

    const response = await this.app.sign(txContext.path, bytesToSign);

    if (response.return_code !== 0x9000) {
        this.lastError = response.error_message;
        throw new Error(response.error_message);
    }

    return txs.applySignature(unsignedTx, txContext, response.signature);
};

// Retrieve public key and bech32 address
CosmosDelegateTool.prototype.retrieveAddress = async function (account, index) {
    connectedOrThrow(this);

    const path = [44, 118, account, 0, index];
    const pk = await this.app.publicKey(path);

    if (pk.return_code !== 0x9000) {
        this.lastError = pk.error_message;
        throw new Error(pk.error_message);
    }

    return {
        pk: pk.compressed_pk.toString('hex'),
        path,
        bech32: Tools.getBech32FromPK(defaultHrp, pk.compressed_pk),
    };
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

CosmosDelegateTool.prototype.retrieveValidators = async function () {
    const url = `${this.resturl}/staking/validators`;
    const validators = {};
    const requestValidators = axios.get(url).then((r) => {
        for (let i = 0; i < r.data.length; i += 1) {
            const validatorData = {};
            const t = r.data[i];
            validatorData.tokens = Big(t.tokens);
            validatorData.totalShares = Big(t.delegator_shares);
            validators[t.operator_address] = validatorData;
        }
    }, e => wrapError(this, e));

    await requestValidators;
    return validators;
};

CosmosDelegateTool.prototype.getAccountInfo = async function (addr) {
    const url = `${this.resturl}/auth/accounts/${addr.bech32}`;

    const txContext = {
        sequence: '0',
        accountNumber: '0',
        balanceuAtom: '0',
    };

    return axios.get(url).then((r) => {
        try {
            if (typeof r.data !== 'undefined' && typeof r.data.value !== 'undefined') {
                txContext.sequence = Number(r.data.value.sequence).toString();
                txContext.accountNumber = Number(r.data.value.account_number).toString();

                if (r.data.value.coins !== null) {
                    const tmp = r.data.value.coins.filter(x => x.denom === txs.DEFAULT_DENOM);
                    if (tmp.length > 0) {
                        txContext.balanceuAtom = Big(tmp[0].amount).toString();
                    }
                }
            }
        } catch (e) {
            console.log('Error ', e, ' returning defaults');
        }
        return txContext;
    }, e => wrapError(this, e));
};

// Retrieve atom balances from the network for a list of account
// Retrieve delegated/not-delegated balances for each account
CosmosDelegateTool.prototype.retrieveBalances = async function (addressList) {
    // Get all balances
    const requestsBalance = addressList.map(async (addr, index) => {
        const txContext = await this.getAccountInfo(addr);
        return Object.assign({}, addressList[index], txContext);
    });

    const validators = await this.retrieveValidators();

    // Get all delegations
    // eslint-disable-next-line no-unused-vars
    const requestsDelegations = addressList.map((addr, index) => {
        // TODO: move to its own method
        const url = `${this.resturl}/staking/delegators/${addr.bech32}/delegations`;
        return axios.get(url).then((r) => {
            const txContext = {
                delegations: {},
                delegationsTotaluAtoms: '0',
            };

            const delegations = {};
            let totalDelegation = Big(0);

            try {
                if (typeof r.data !== 'undefined' && r.data !== null) {
                    for (let i = 0; i < r.data.length; i += 1) {
                        const t = r.data[i];
                        const valAddr = t.validator_address;

                        if (valAddr in validators) {
                            const shares = Big(t.shares);
                            const valData = validators[valAddr];
                            const valTokens = valData.tokens;
                            const valTotalShares = valData.totalShares;
                            const tokens = shares.times(valTokens).div(valTotalShares);

                            delegations[valAddr] = {
                                uatoms: tokens.toString(),
                                shares: shares.toString(),
                            };
                            totalDelegation = totalDelegation.add(tokens);
                        }
                    }
                }
            } catch (e) {
                console.log('Error ', e, ' returning defaults');
            }

            txContext.delegations = delegations;
            txContext.delegationsTotaluAtoms = totalDelegation.toString();

            return txContext;
        }, e => wrapError(this, e));
    });

    const balances = await Promise.all(requestsBalance);
    const delegations = await Promise.all(requestsDelegations);

    const reply = [];
    for (let i = 0; i < addressList.length; i += 1) {
        reply.push(Object.assign({}, delegations[i], balances[i]));
    }

    return reply;
};

// Creates a new delegation tx based on the input parameters
// this function expect that retrieve balances has been called before
CosmosDelegateTool.prototype.txCreateDelegate = async function (
    txContext,
    validatorBech32,
    uatomAmount,
    memo,
) {
    if (typeof txContext === 'undefined') {
        throw new Error('undefined txContext');
    }
    if (typeof txContext.bech32 === 'undefined') {
        throw new Error('txContext does not contain the source address (bech32)');
    }

    const accountInfo = await this.getAccountInfo(txContext);
    // eslint-disable-next-line no-param-reassign
    txContext.accountNumber = accountInfo.accountNumber;
    // eslint-disable-next-line no-param-reassign
    txContext.sequence = accountInfo.sequence;

    return txs.createDelegate(
        txContext,
        validatorBech32,
        uatomAmount,
        memo,
    );
}


// Creates a new undelegation tx based on the input parameters
// this function expect that retrieve balances has been called before
CosmosDelegateTool.prototype.txCreateUndelegate = async function (
    txContext,
    validatorBech32,
    sharesAmount,
    memo,
) {
    if (typeof txContext === 'undefined') {
        throw new Error('undefined txContext');
    }
    if (typeof txContext.bech32 === 'undefined') {
        throw new Error('txContext does not contain the source address (bech32)');
    }

    const accountInfo = await this.getAccountInfo(txContext.bech32);
    txContext.accountNumber = accountInfo.accountNumber;
    txContext.sequence = accountInfo.sequence;

    return txs.createUndelegate(
        txContext,
        validatorBech32,
        sharesAmount,
        memo,
    );
};

// Creates a new staking tx based on the input parameters
// this function expect that retrieve balances has been called before
CosmosDelegateTool.prototype.txCreateRedelegate = async function (
    txContext,
    validatorSourceBech32,
    validatorDestBech32,
    sharesAmount,
    memo,
) {
    if (typeof txContext === 'undefined') {
        throw new Error('undefined txContext');
    }
    if (typeof txContext.bech32 === 'undefined') {
        throw new Error('txContext does not contain the source address (bech32)');
    }

    const accountInfo = await this.getAccountInfo(txContext.bech32);
    txContext.accountNumber = accountInfo.accountNumber;
    txContext.sequence = accountInfo.sequence;

    return txs.createRedelegate(txContext,
        validatorSourceBech32,
        validatorDestBech32,
        sharesAmount,
        memo);
};

// Relays a signed transaction and returns a transaction hash
CosmosDelegateTool.prototype.txSubmit = async function (signedTx) {
    const txBody = {
        tx: signedTx.value,
        mode: 'block',
    };

    const url = `${this.resturl}/txs`;
    return await axios.post(url, JSON.stringify(txBody)).then(r => r, e => wrapError(this, e));
};

// Retrieve the status of a transaction hash
CosmosDelegateTool.prototype.txStatus = async function (txHash) {
    const url = `${this.resturl}/txs/${txHash}`;
    return await axios.get(url).then(r => r.data, e => wrapError(this, e));
};

module.exports = CosmosDelegateTool;
