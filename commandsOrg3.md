1. We are in `test-network` folder. do `cd addOrg3` to go to `addOrg3` directory
2. In `test-network/addOrg3` run `./addOrg3.sh up`
3. Then `cd ..` to come back to `test-network`
4. Set these variables as environment variables
```
export PATH=${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051
```
5. `peer lifecycle chaincode package fabcar.tar.gz --path ../chaincode/fabcar/javascript/ --lang node --label fabcar_1` to package the chaincode
6. `peer lifecycle chaincode install fabcar.tar.gz`
7. `peer lifecycle chaincode queryinstalled` to get package id for packaged chaincode
8. Use the package id in the output to export it to a variable using `export CC_PACKAGE_ID=<PackageID>`
9. `peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name fabcar --version 1 --init-required --package-id $CC_PACKAGE_ID --sequence 1 --tls true --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`
10. `peer lifecycle chaincode querycommitted --channelID mychannel --name fabcar` - to query and check if its done
11. Done


## Note:-
In `test-network/addOrg3/compose` run this command or this error is thrown `Error: Calling enroll endpoint failed with error [Error: connect ECONNREFUSED 127.0.0.1:11054]`
1. docker-compose -f compose-ca-org3.yaml up -d ca_org3


## For Anchor Peer:-
1. `peer channel fetch config channel-artifacts/config_block.pb -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c mychannel --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"`
2. `cd channel-artifacts`
3. `configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json`
4. `jq ".data.data[0].payload.data.config" config_block.json > config.json`
5. `jq '.channel_group.groups.Application.groups.Org3MSP.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "peer0.org3.example.com","port": 11051}]},"version": "0"}}' config.json > modified_anchor_config.json`
6. `configtxlator proto_encode --input config.json --type common.Config --output config.pb`
7. `configtxlator proto_encode --input modified_anchor_config.json --type common.Config --output modified_anchor_config.pb`
8. `configtxlator compute_update --channel_id mychannel --original config.pb --updated modified_anchor_config.pb --output anchor_update.pb`
9. `configtxlator proto_decode --input anchor_update.pb --type common.ConfigUpdate --output anchor_update.json`
10. `echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":'$(cat anchor_update.json)'}}}' | jq . > anchor_update_in_envelope.json`
11. `configtxlator proto_encode --input anchor_update_in_envelope.json --type common.Envelope --output anchor_update_in_envelope.pb`
12. `cd ..`
13. `export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051`
14. `peer channel update -f channel-artifacts/anchor_update_in_envelope.pb -c mychannel -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"`
15. `docker logs -f peer0.org1.example.com`

