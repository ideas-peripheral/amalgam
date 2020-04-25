import { app } from 'electron'

export const isDev = !(process.env.NODE_ENV === 'production' || app.isPackaged)
