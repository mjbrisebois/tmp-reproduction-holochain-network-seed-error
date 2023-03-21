
import path				from 'path';
import HolochainBackdrop		from '@whi/holochain-backdrop';
import HoloHashLib			from '@whi/holo-hash';
import { AdminWebsocket }		from '@holochain/client';

const { Holochain }		 	= HolochainBackdrop;
const { HoloHash }			= HoloHashLib;

const holochain = new Holochain();
await holochain.start();
const adminPorts = holochain.adminPorts();

const adminPort = adminPorts[0];
const adminWs = await AdminWebsocket.connect(`ws://127.0.0.1:${adminPort}`);


function printAppInfo ( appInfo ) {
    for ( let roleName in appInfo.cell_info ) {
	const cell			= appInfo.cell_info[roleName][0].provisioned;
	console.log("DNA hash for '%s': %s", roleName, new HoloHash( cell.cell_id[0] ) );
    }
}


try {
    const agent1 = await adminWs.generateAgentPubKey();
    const agent2 = await adminWs.generateAgentPubKey();

    {
	const appInfo = await adminWs.installApp({
	    "agent_key": agent1,
	    "path": "appstore.happ",
	    "installed_app_id": "test-path-no-seed",
	    "membrane_proofs": {},
	});

	printAppInfo( appInfo );
    }

    {
	const appInfo = await adminWs.installApp({
	    "agent_key": agent1,
	    "path": "appstore.happ",
	    "installed_app_id": "test-path-with-seed",
	    "membrane_proofs": {},
	    "network_seed": "test-network",
	});

	printAppInfo( appInfo );
    }

    const happBundle = {
	"manifest": {
	    "manifest_version": "1",
	    "name": "appstore",
	    "roles": [{
		"name": "appstore",
		"dna": {
		    "path": path.resolve( "appstore.dna" ),
		},
	    }, {
		"name": "portal",
		"dna": {
		    "path": path.resolve( "portal.dna" ),
		},
	    }],
	},
	"resources": {},
    };

    {
	const appInfo = await adminWs.installApp({
	    "agent_key": agent2,
	    "bundle": happBundle,
	    "installed_app_id": "test-bundle-no-seed",
	    "membrane_proofs": {},
	});

	printAppInfo( appInfo );
    }

    {
	const appInfo = await adminWs.installApp({
	    "agent_key": agent2,
	    "bundle": happBundle,
	    "installed_app_id": "test-bundle-with-seed",
	    "membrane_proofs": {},
	    "network_seed": "test-network",
	});

	printAppInfo( appInfo );
    }
} catch (err) {
    console.log( err );
} finally {
    await adminWs.client.close();
    await holochain.destroy();
}
