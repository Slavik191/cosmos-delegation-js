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

test('connect', async () => {
    const cdt = new CosmosDelegateTool();

    cdt.switchTransportToHID();
    await cdt.connect();

    expect(cdt.connected).toBe(true);
    expect(cdt.lastError).toBe('No error');
});

test('get address', async () => {
    const cdt = new CosmosDelegateTool();

    cdt.switchTransportToHID();
    await cdt.connect();
    expect(cdt.connected).toBe(true);
    expect(cdt.lastError).toBe('No error');

    const addr = await cdt.retrieveAddress(0, 0);
    expect(addr.pk).toBe('034fef9cd7c4c63588d3b03feb5281b9d232cba34d6f3d71aee59211ffbfe1fe87');
    expect(addr.bech32).toBe('cosmos1w34k53py5v5xyluazqpq65agyajavep2rflq6h');
    expect(addr.path).toEqual([44, 118, 0, 0, 0]);
});

test('scan addresses', async () => {
    const cdt = new CosmosDelegateTool();

    // retrieving many public keys can be slow
    jest.setTimeout(10000);

    cdt.switchTransportToHID();
    await cdt.connect();
    expect(cdt.connected).toBe(true);
    expect(cdt.lastError).toBe('No error');

    const addrs = await cdt.scanAddresses(0, 1, 2, 3);
    expect(addrs.length).toEqual(4);

    expect(addrs[0].pk).toBe('03a2670393d02b162d0ed06a08041e80d86be36c0564335254df7462447eb69ab3');
    expect(addrs[0].bech32).toBe('cosmos1a07dzdjgjsntxpp75zg7cgatgq0udh3pcdcxm3');
    expect(addrs[0].path).toEqual([44, 118, 0, 0, 2]);

    expect(addrs[3].pk).toBe('033222fc61795077791665544a90740e8ead638a391a3b8f9261f4a226b396c042');
    expect(addrs[3].bech32).toBe('cosmos1qvw52lmn9gpvem8welghrkc52m3zczyhlqjsl7');
    expect(addrs[3].path).toEqual([44, 118, 1, 0, 3]);

    console.log(addrs);
});
