export const version = '0.1'

export const isDev = process.env.NODE_ENV !== 'production'
export const isElectron =
	typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')
