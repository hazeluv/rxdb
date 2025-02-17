const electron = require('electron');
const path = require('path');
const { addRxPlugin } = require('rxdb');

const { getRxStorageMemory } = require('rxdb/plugins/memory');
const { exposeIpcMainRxStorage } = require('rxdb/plugins/electron');

const { getDatabase } = require('./shared');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const windows = [];

function createWindow() {
    const width = 600;
    const height = 600;
    const w = new BrowserWindow({
        width,
        height,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    w.loadFile('index.html');

    const x = windows.length * width;
    const y = 0;
    w.setPosition(x, y);
    windows.push(w);

    // use this to debug
    // w.webContents.openDevTools();
}


app.on('ready', async function () {
    const dbSuffix = new Date().getTime(); // we add a random timestamp in dev-mode to reset the database on each start

    electron.ipcMain.handle('getDBSuffix', () => dbSuffix);


    const storage = getRxStorageMemory();

    exposeIpcMainRxStorage({
        key: 'main-storage',
        storage,
        ipcMain: electron.ipcMain
    });

    // const db = await getDatabase(
    //     'heroesdb' + dbSuffix,
    //     storage
    // );

    // // show heroes table in console
    // db.heroes.find().sort('name').$.subscribe(heroDocs => {
    //     console.log('### got heroes(' + heroDocs.length + '):');
    //     heroDocs.forEach(doc => console.log(
    //         doc.name + '  |  ' + doc.color
    //     ));
    // });

    createWindow();
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin')
        app.quit();
});
