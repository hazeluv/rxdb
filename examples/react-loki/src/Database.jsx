import {
    createRxDatabase,
    addRxPlugin
} from 'rxdb';
import {
    getRxStorageLoki
} from 'rxdb/plugins/lokijs';
import {
    heroSchema
} from './Schema';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBReplicationCouchDBNewPlugin } from 'rxdb/plugins/replication-couchdb-new';

addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBReplicationCouchDBNewPlugin);

// in the browser, we want to persist data in IndexedDB, so we use the indexeddb adapter.
const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter');

const syncURL = 'http://' + window.location.hostname + ':10102/';
console.log('host: ' + syncURL);

let dbPromise = null;

const _create = async () => {
    console.log('DatabaseService: creating database..');
    const db = await createRxDatabase({
        name: 'heroesreactdb',
        storage: getRxStorageLoki({
            adapter: new LokiIncrementalIndexedDBAdapter()
        })
    });
    console.log('DatabaseService: created database');
    window['db'] = db; // write to window for debugging

    // show leadership in title
    db.waitForLeadership().then(() => {
        console.log('isLeader now');
        document.title = '♛ ' + document.title;
    });

    // create collections
    console.log('DatabaseService: create collections');
    await db.addCollections({
        heroes: {
            schema: heroSchema,
            methods: {
                hpPercent() {
                    return this.hp / this.maxHP * 100;
                }
            }
        }
    });

    // hooks
    console.log('DatabaseService: add hooks');
    db.collections.heroes.preInsert(docObj => {
        const { color } = docObj;
        return db.collections.heroes.findOne({
            selector: { color }
        }).exec().then(has => {
            if (has !== null) {
                console.error('another hero already has the color ' + color);
                throw new Error('color already there');
            }
            return db;
        });
    });

    // sync
    console.log('DatabaseService: sync');
    Object.values(db.collections).map(col => col.name).map(async colName => {
        const url = syncURL + colName + '/';

        console.log({url});
        await fetch(
            url,
            {
                method: 'PUT'
            }
        );
        db[colName].syncCouchDBNew({ url });
    });

    return db;
};

export const get = () => {
    if (!dbPromise)
        dbPromise = _create();
    return dbPromise;
};
