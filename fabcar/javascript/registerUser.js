/* eslint-disable quotes */
/* eslint-disable semi */
/* eslint-disable no-unused-vars */
/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
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

const getCaUrl = async (org, ccp) => {
    let caURL = null
    org === 'Org1' ? caURL = ccp.certificateAuthorities['ca.org1.example.com'].url : null
    org === 'Org2' ? caURL = ccp.certificateAuthorities['ca.org2.example.com'].url : null
    org === 'Org3' ? caURL = ccp.certificateAuthorities['ca.org3.example.com'].url : null
    return caURL
}

const getAffiliation = async (org) => {
    // Default in ca config file we have only two affiliations, if you want ti use org3 ca, you have to update config file with third affiliation
    //  Here already two Affiliation are there, using i am using "org2.department1" even for org3
    return org === "Org1" ? 'org1.department1' : 'org2.department1'
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
        let username = 'appUser'
        let ccp = await getCCP(org) //!this is sorted for org3

        // Create a new CA client for interacting with the CA.
        // const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const caURL = await getCaUrl(org, ccp)
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = await getWalletPath(org) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(username);
        if (userIdentity) {
            console.log(`An identity for the user ${username} already exists in the wallet`);
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: await getAffiliation(org), //this has the department of the user
            enrollmentID: username, //username
            role: 'client'
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID: username,
            enrollmentSecret: secret
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: `${org}MSP`,
            type: 'X.509',
        };

        await wallet.put(username, x509Identity);
        console.log(`Successfully registered and enrolled admin user ${username} and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to register user "appUser": ${error}`);
        process.exit(1);
    }
}

module.exports = main;

// main();
