export interface Word {
	alignedWord: string
	case: 'success' | 'not-found-in-audio'
	end: number
	endOffset: number
	phones: []
	start: number
	startOffset: number
	word: string
}

export interface Segment {
	id: string
	title: string
	audioSource: string
	snippets: {
		[snippetIndex: number]: {
			threads: [string]
		}
	}
	transcript: string
	words: Word[]
}

export interface Thread {
	id: string
	title: string
	snippets: [string]
}

export interface Snippet {
	id: string
	source: string
	words: {
		word: Word
		key: number
	}[]
	threads: [string]
}

export interface ClientState {
	keys: {
		cmd: boolean
	}
	segments: {
		[segmentId: string]: Segment
	}
	threads: {
		[threadId: string]: Thread
	}
	snippets: {
		[snippetId: string]: Snippet
	}
	activeView: {
		id: string
		category: string
	}
	audioSource: string
	audioCurrentTime: number
	capturing: boolean
	curWord: Word
	activeWords: []
	snippetIndex: number
	snippetIndices: {}
	isDev: boolean
	isElectron: boolean
}
