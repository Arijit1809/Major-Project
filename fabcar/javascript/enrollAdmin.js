/* eslint-disable quotes */
/* eslint-disable semi */
/* eslint-disable no-unused-vars */
/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const org1 = 'ca.org1.example.com';
const org2 = 'ca.org2.example.com';
const org3 = 'ca.org3.example.com';

const getCCP = async (org) => {
    let ccpPath = null;
    org === 'Org1' ? ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json') : null;
    org === 'Org2' ? ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'connection-org2.json') : null;
    org === 'Org3' ? ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org3.example.com', 'connection-org3.json') : null;
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);
    return ccp;
};

const getCaInfo = async (org, ccp) => {
    let caInfo = null
    org === 'Org1' ? caInfo = ccp.certificateAuthorities['ca.org1.example.com'] : null
    org === 'Org2' ? caInfo = ccp.certificateAuthorities['ca.org2.example.com'] : null
    org === 'Org3' ? caInfo = ccp.certificateAuthorities['ca.org3.example.com'] : null
    return caInfo;
}

const getWalletPath = async (org) => {
    let walletPath = null
    org === 'Org1' ? walletPath = path.join(process.cwd(), 'org1-wallet') : null
    org === 'Org2' ? walletPath = path.join(process.cwd(), 'org2-wallet') : null
    org === 'Org3' ? walletPath = path.join(process.cwd(), 'org3-wallet') : null
    return walletPath
}

async function main(org) {
    try {
        // load the network configuration
        // const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        // const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // let org = 'Org1'
        let ccp = await getCCP(org)

        // Create a new CA client for interacting with the CA.
        const caInfo = await getCaInfo(org, ccp) //ccp.certificateAuthorities['ca.org1.example.com'];
        // const caInfo = ccp.certificateAuthorities[org1];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        // const walletPath = path.join(process.cwd(), 'wallet');
        const walletPath = await getWalletPath(org) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: `${org}MSP`,
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

module.exports = main;

// main();
