/* eslint-disable quotes */
/* eslint-disable semi */
/* eslint-disable no-unused-vars */
/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const getCCP = async (org) => {
    let ccpPath = null;
    org === 'Org1' ? ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json') : null;
    org === 'Org2' ? ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'connection-org2.json') : null;
    org === 'Org3' ? ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org3.example.com', 'connection-org3.json') : null;
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);
    return ccp;
};

const getWalletPath = async (org) => {
    let walletPath = null
    org === 'Org1' ? walletPath = path.join(process.cwd(), 'org1-wallet') : null
    org === 'Org2' ? walletPath = path.join(process.cwd(), 'org2-wallet') : null
    org === 'Org3' ? walletPath = path.join(process.cwd(), 'org3-wallet') : null
    return walletPath
}

async function main(org, documentId) {
    try {
        // load the network configuration
        // const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        // let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // let org = 'Org1'
        let username = 'appUser'
        let channelName = 'mychannel'
        let contractName = 'fabcar'
        let ccp = await getCCP(org)

        // Create a new file system based wallet for managing identities.
        const walletPath = await getWalletPath(org) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet`);
            console.log('Register the user first and then invoke');
            return;
        }

        const connectOptions = {
            wallet,
            identity: username,
            discovery: { enabled: true, asLocalhost: true }
            // eventHandlerOptions: EventStrategies.NONE
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);
        // Get the contract from the network.
        const contract = network.getContract(contractName);

        // Evaluate the specified transaction.
        const result = await contract.evaluateTransaction('queryDocument', documentId);
        // Disconnect from the gateway.
        await gateway.disconnect();
        return result;
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

module.exports = main;

// main();T
