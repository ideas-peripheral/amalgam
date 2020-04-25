import { isDev, isElectron } from './constants'
import { ClientState } from './types'

import { reactive as typedReactive } from 'vue'
// @ts-ignore
import { reactive as untypedReactive } from 'vue/dist/vue.esm.js'
const reactive: typeof typedReactive = untypedReactive

let dataState
if (localStorage.getItem('state') !== null) {
	dataState = JSON.parse(localStorage.getItem('state'))
} else {
	dataState = {
		segments: {},
		threads: {},
		snippets: {},
	}
}

const { segments, threads, snippets } = dataState
const initial = { audioSource: '', id: '' } // segments[Object.keys(segments)[0]]

let audioSource
if (!audioSource && Object.keys(segments).length > 0) {
	;({ audioSource } = initial)
}

const activeView = {
	category: 'source',
	id: 'none',
}

let curWord

export const state: ClientState = reactive({
	keys: {
		cmd: false,
	},
	segments,
	threads,
	snippets,
	activeView,
	audioSource,
	audioCurrentTime: 0,
	capturing: false,
	curWord,
	activeWords: [],
	snippetIndex: 0,
	snippetIndices: {},
	isDev: isDev,
	isElectron: isElectron,
})
