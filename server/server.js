const express = require('express')
const enrollAdmin = require('../fabcar/javascript/enrollAdmin.js')
const registerUser = require('../fabcar/javascript/registerUser.js')
const invoke = require('../fabcar/javascript/invoke.js')
const query = require('../fabcar/javascript/query.js')
const shell = require('shelljs')
const { Server } = require("socket.io");
const { createServer } = require("http");
const path = require('path');
const fs = require('fs');
const { Gateway, Wallets } = require('fabric-network');
const crypto = require('crypto');
const cors = require('cors')
const mongoose = require('mongoose')

const verifyDocument = require('./verify.js')

const org1PublicKey = Buffer.from(
	fs.readFileSync("org1-public.pem", { encoding: "utf-8" })
);
const org2PublicKey = Buffer.from(
	fs.readFileSync("org2-public.pem", { encoding: "utf-8" })
);
const org1PrivateKey = Buffer.from(
	fs.readFileSync("org1-private.pem", { encoding: "utf-8" })
);
const org2PrivateKey = Buffer.from(
	fs.readFileSync("org2-private.pem", { encoding: "utf-8" })
);

const app = express()
app.use(cors())
const httpServer = createServer(app);
app.use(express.json())
const io = new Server(httpServer, {
	cors: {
		origin: "*"
	}
});

io.on("connection", (socket) => {

});

const port = process.argv[2] || 8000

const VERIFIED = 'verified'

const portToCompanyMap = {
	1000: 'C1',
	2000: 'PAN',
	4000: 'CBSE',
	8000: 'C2',
}

const companyToOrgMap = {
	'C1': 'Org1',
	'PAN': 'Org2',
	'CBSE': 'Org1',
	'C2': 'Org2',
}

const companyToSmallOrgMap = {
	'C1': 'org1',
	'PAN': 'org2',
	'CBSE': 'org1',
	'C2': 'org2',
}

const orgToWalletMap = {
	'Org1': 'org1',
	'Org2': 'org2',
	'Org3': 'org3',
	'Org4': 'org4',
}

const getOrg = () => {
	const orgName = portToCompanyMap[port]
	const org = companyToOrgMap[orgName]
	return org
}

const queryDoc = async (docId) => {
	//query the doc
	const doc = await query(getOrg(), docId)
	const document = JSON.parse(doc.toString())
	if (document?.error) {
		return false
	} else if (document) {
		return document
	} else {
		return false
	}
}

//API for company to upload the document to their hyperledger fabric
app.post('/uploadDocument', async (req, res) => {
	//this is the document in the body
	const document = req.body
	//document.id is the unique identifier
	//document.identifier is the org who will validate the document
	const documentIdentifier = document.identifier
	//verifiedDocId the key which is used once document is verified
	const verifiedDocId = document.identifier + document.id + VERIFIED

	//first query the document, if query is null then check ahead
	//query null means its not verified before

	const orgName = portToCompanyMap[port]

	const isDocVerified = await queryDoc(verifiedDocId)

	if (isDocVerified) {
		console.log('Document is verified : ', isDocVerified)
		io.emit('log', {
			time: new Date(),
			id: document.id,
			status: 'True'
		})
		res.json({ message: "Document is verified", verification: "Verified", doc: isDocVerified })
	}
	else {
		//now we need to add the document to the blockchain
		console.log('Document not verified, verifying ')
		const documentToBeVerified = {
			...document,
			data: encryptData(document.data, companyToSmallOrgMap[documentIdentifier]),
			requestBy: orgName,
			status: ''
		}
		console.log(documentToBeVerified)
		await invoke(getOrg(), documentToBeVerified)
		res.json({ message: "Document is uploaded to be verified", verification: "Pending" })
	}
})

const MONGOURL = 'mongodb+srv://shubham242:d5kh2a44s9@cluster0.wkigzuj.mongodb.net/?retryWrites=true&w=majority'

httpServer.listen(port, async () => {
	// Connect to MongoDB using Mongoose
	try {
		await mongoose.connect(MONGOURL, { useNewUrlParser: true });
	} catch (e) {
		console.error(e)
		return
	}
	const org = getOrg()
	await enrollAdmin(org)
	await registerUser(org)
	const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
	const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
	// Create a new file system based wallet for managing identities.
	const walletPath = path.join(process.cwd(), `org1-wallet`);
	const wallet = await Wallets.newFileSystemWallet(walletPath);
	console.log(`Wallet path: ${walletPath}`);

	// Check to see if we've already enrolled the user.
	const identity = await wallet.get('appUser');
	if (!identity) {
		console.log('An identity for the user "appUser" does not exist in the wallet');
		console.log('Run the registerUser.js application before retrying');
		return;
	}

	try {
		// Create a new gateway for connecting to our peer node.
		const gateway = new Gateway();
		await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
		// Get the network (channel) our contract is deployed to.
		const network = await gateway.getNetwork('mychannel');
		const contract = network.getContract('fabcar');
		await contract.addContractListener(contractListener);
	} catch (e) {
		console.log(e)
	}
	// await network.addBlockListener(blockListener)
	console.log(`Server listening on port ${port}`)
})

/**
 * Once a document is added using invoke, the responsible party has to verify it
 * This listener handles it
 * @param {ContractEvent} event - the contract listener event
 */

const contractListener = async (event) => {
	const orgName = portToCompanyMap[port]
	const documentPayload = JSON.parse(event.payload.toString());
	//@shubham - this is the document
	const document = documentPayload.document
	const documentIdentifier = document.identifier
	let documentData = {}

	try {
		documentData = decryptData(document.data, orgToWalletMap[getOrg()])
	} catch (e) {
		console.log(e)
	}

	/**
	 * A document has 3 parts
	 * 1. The document data - data
	 * 2. Identifier - the one responsible to handle the verification by verifying the data
	 * 3. RequestBy - the one who sent the request
	 * 4. Its status
	 */

	/**
	 * Identifier is used when we want to validate the document and add it to blockchain as 
	 * const verifiedDocId = document.identifier + document.id + 'verified'
	 */

	if (documentIdentifier === orgName && documentPayload.status !== VERIFIED) {
		// io.emit('log', {
		// 	time: new Date(),
		// 	id: document.id,
		// 	status: 'false'
		// })
		console.log('\x1b[1m\x1b[31m%s\x1b[0m', '-------- Received Document -------\n');
		console.log('\x1b[1m\x1b[34m%s\x1b[0m', `${JSON.stringify(documentPayload, null, 2)}`);
		console.log('\x1b[1m\x1b[31m%s\x1b[0m', '-------- Received Document -------\n');

		//document has id, use that to verify the data from DB
		let verified = false
		try {
			verified = await verifyDocument(documentIdentifier, documentData)
		} catch (e) {
			console.error(e)
			return
		}
		//Write the verify function here, if verified, turn the verified bool to true else false

		//now use this document to verify the data using a database
		//once its verified, call invoke with document and add a verified field to it
		//and verify id, so its used later assuming document is already verified

		//Calling invoke
		const documentVerified = {
			...document,
			status: verified ? VERIFIED : 'rejected'
		}
		await invoke(getOrg(), documentVerified)
	}

	if (documentPayload.document.requestBy === orgName && documentPayload.status === VERIFIED) {
		io.emit('log', {
			time: new Date(),
			id: document.id,
			status: 'True'
		})
		console.log('\x1b[4m\x1b[47m\x1b[34m%s\x1b[0m', '-------- Received Verified Document -------\n');
		console.log('\x1b[1m\x1b[34m%s\x1b[0m', `${JSON.stringify(documentPayload, null, 2)}`);
		console.log('\x1b[4m\x1b[47m\x1b[34m%s\x1b[0m', '-------- Received Verified Document -------\n');
	}
};

function showTransactionData(transactionData) {
	// console.log(transactionData.actions[0].payload)
	const creator = transactionData.actions[0].header.creator;
	console.log(`    - submitted by: ${creator.mspid}`);
	// console.log(`    - submitted by: ${creator.mspid}-${creator.id_bytes.toString('hex')}`);
	for (const endorsement of transactionData.actions[0].payload.action.endorsements) {
		console.log(`    - endorsed by: ${endorsement.endorser.mspid}`);
		// console.log(`    - endorsed by: ${endorsement.endorser.mspid}-${endorsement.endorser.id_bytes.toString('hex')}`);
	}
	const chaincode = transactionData.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec;
	console.log(`    - chaincode:${chaincode.chaincode_id.name}`);
	console.log(`    - function:${chaincode.input.args[0].toString()}`);
	for (let x = 1; x < chaincode.input.args.length; x++) {
		console.log(`    - arg:${chaincode.input.args[x].toString()}`);
	}
}

blockListener = async (event) => {
	console.log("--------------------------------------------------------------")
	console.log(`<-- Block Event Received - block number: ${event.blockNumber.toString()}`);
	const transEvents = event.getTransactionEvents();
	for (const transEvent of transEvents) {
		console.log(`*** transaction event: ${transEvent.transactionId}`);
		if (transEvent.transactionData) {
			showTransactionData(transEvent.transactionData);
		}
	}
};

const encryptData = (data, identifier) => {
	const publicKey = {
		'org1': org1PublicKey,
		'org2': org2PublicKey
	}[identifier]

	const dataAsString = JSON.stringify(data)
	const stringDataAsBuffer = Buffer.from(dataAsString)

	//encryption function
	//using sha256
	const encryptedData = crypto.publicEncrypt({
		key: publicKey,
		padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
		oaepHash: "sha256"
	}, stringDataAsBuffer)
	//plain text first should be converted to binary form

	return encryptedData.toString("base64")
}

const decryptData = (encryptedData, identifier) => {
	const privateKey = {
		'org1': org1PrivateKey,
		'org2': org2PrivateKey
	}[identifier]

	const decryptData = crypto.privateDecrypt({ //this is in buffer - so first convert to string then to buffer
		key: privateKey,
		padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
		oaepHash: "sha256"
	}, Buffer.from(encryptedData, "base64"));

	return JSON.parse(decryptData.toString())
}