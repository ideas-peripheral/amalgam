import { isDev } from './constants'

import { app, ipcMain, BrowserWindow, dialog } from 'electron'
import * as fs from 'fs'
import * as crypto from 'crypto'

let mainWindow

function createWindow() {
	mainWindow = new BrowserWindow({
		height: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			enableRemoteModule: false,
			preload: __dirname + '/preload.js',
		},
		width: 1000,
		backgroundColor: 'white',
		frame: process.platform !== 'darwin',
		skipTaskbar: process.platform === 'darwin',
		autoHideMenuBar: process.platform === 'darwin',
	})

	//mainWindow.loadFile(path.join(__dirname, 'index.html'))
	mainWindow.loadFile('../../client/dist/index.html')

	mainWindow.webContents.openDevTools()

	mainWindow.on('closed', () => {})
}

ipcMain.on('toMain', async (event, args) => {
	const options = {
		properties: ['openFile'],
		filters: [{ name: 'json', extensions: ['json'] }],
	}

	const selectedRepo = await dialog
		.showOpenDialog(options)
		.then((selectedRepo: string) => {
			if (!selectedRepo.cancelled) {
				const [filePath] = selectedRepo.filePaths
				const path = filePath.split('/')
				const dir = path.slice(0, -1).join('/')
				const file = path.pop()
				if (file !== undefined) {
					const { transcript, words } = JSON.parse(
						fs.readFileSync(filePath),
					)
					const id = crypto.randomBytes(16).toString('hex')
					const newSource = {
						id,
						title: file.split('.')[0],
						audioSource: filePath.replace('.json', '.mp3'),
						snippets: {},
						transcript,
						words,
					}

					mainWindow.webContents.send('fromMain', {
						type: 'newSource',
						newSource,
					})
				}
			}
		})
})

ipcMain.handle('custom-message', async (event, someArgument) => {
	const options = {
		properties: ['openFile'],
		filters: [{ name: 'json', extensions: ['json'] }],
	}

	const path = await dialog
		.showOpenDialog(options)
		.then((result: string) => result)

	return path
})

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow()
	}
})
