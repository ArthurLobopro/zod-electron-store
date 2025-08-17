import Conf from 'conf-with-zod';
import electron from 'electron';
import path from 'node:path';
import process from 'node:process';

const { app, ipcMain, shell } = electron;

let isInitialized = false;

// Set up the `ipcMain` handler for communication between renderer and main process.
const initDataListener = () => {
    if (!ipcMain || !app) {
        throw new Error('Electron Store: You need to call `.initRenderer()` from the main process.');
    }

    const appData = {
        defaultCwd: app.getPath('userData'),
        appVersion: app.getVersion(),
    };

    if (isInitialized) {
        return appData;
    }

    ipcMain.on('electron-store-get-data', event => {
        event.returnValue = appData;
    });

    isInitialized = true;

    return appData;
};

export default class ElectronStore<T extends Record<string, any> = Record<string, unknown>> extends Conf<T> {
    constructor(options: Options<T>) {
        let defaultCwd;
        let appVersion;

        // If we are in the renderer process, we communicate with the main process
        // to get the required data for the module otherwise, we pull from the main process.
        if (process.type === 'renderer') {
            const appData = electron.ipcRenderer.sendSync('electron-store-get-data');

            if (!appData) {
                throw new Error('Electron Store: You need to call `.initRenderer()` from the main process.');
            }

            ({ defaultCwd, appVersion } = appData);
        } else if (ipcMain && app) {
            ({ defaultCwd, appVersion } = initDataListener());
        }

        options = {
            name: 'config',
            ...options,
        };

        options.projectVersion ||= appVersion;

        if (options.cwd) {
            options.cwd = path.isAbsolute(options.cwd) ? options.cwd : path.join(defaultCwd, options.cwd);
        } else {
            options.cwd = defaultCwd;
        }

        options.configName = options.name;

        //@ts-ignore
        delete options.name;

        super(options);
    }

    static initRenderer() {
        initDataListener();
    }

    async openInEditor() {
        const error = await shell.openPath(this.path);

        if (error) {
            throw new Error(error);
        }
    }
}

import { type Options as ConfigOptions } from 'conf-with-zod';

export type Options<T extends Record<string, any>> = Omit<ConfigOptions<T>, 'projectName' | 'projectSuffix'> & {
    /**
    Name of the storage file (without extension).

    This is useful if you want multiple storage files for your app. Or if you're making a reusable Electron module that persists some data, in which case you should **not** use the name `config`.

    @default 'config'
    */
    readonly name?: string;
};