import { ClientState, Snippet, Thread, Word, Segment } from './types'
import { state } from './state'
import { uuidv4 } from './helpers'

//ClientState = state

export interface ClientActions {
	deleteSnippet: (
		context: { app: ClientState },
		data: { snippetToDelete: Snippet },
	) => void
	saveSession: (context: { app: ClientState }) => void
	goto: (
		context: { app: ClientState },
		data: { source: string; snippet: Snippet },
	) => void
	setActiveView: (
		context: { app: ClientState },
		data: { category: string; id: string },
	) => void
	initiateCapture: (context: { app: ClientState }) => void
	capture: (context: { app: ClientState }, data: { thread: Thread }) => void
	toggleAudio: (context: { app: ClientState }) => void
	highlight_word: (context: { app: ClientState }) => void
	focusPlay: (
		context: { app: ClientState },
		data: { word: Word; segment: Segment; snippetIndex: number },
	) => void
	selectRepo: () => void
}

export const actions: ClientActions = {
	deleteSnippet({ app }, { snippetToDelete }) {
		snippetToDelete.threads.forEach((threadId: string) => {
			app.threads[threadId].snippets.forEach((snippetId, index) => {
				if (snippetId === snippetToDelete.id) {
					app.threads[threadId].snippets.splice(index, 1)
					const snippetLength = app.threads[threadId].snippets.length
					if (snippetLength === 0) {
						delete app.threads[threadId]
					}
				}
			})
		})
		delete app.snippets[snippetToDelete.id]

		const currentSegment = app.segments[app.activeView.id]

		delete currentSegment.snippets[snippetToDelete.words[0].key]

		snippetToDelete.words.forEach(word => {
			delete app.snippetIndices[word.key]
		})

		app.saveSession({ app })
	},
	saveSession({ app }) {
		const newState = {
			segments: app.segments,
			threads: app.threads,
			snippets: app.snippets,
		}

		localStorage.setItem('state', JSON.stringify(newState))
	},
	goto({ app }, { source, snippet }) {
		if (app.activeView.category === 'thread') {
			app.activeView = {
				category: 'source',
				id: source,
			}
		} else if (app.activeView.category === 'source') {
			app.activeView = {
				category: 'thread',
				id: source,
			}
		}

		app.$nextTick(() => {
			const snippetIndices = app.snippets[snippet].words.map(
				element => element.key,
			)
			snippetIndices.forEach(index => {
				const word = document.querySelector(`[data-key*="${index}"]`)
				word.scrollIntoView(false)

				word.classList.remove('highlight')
				word.classList.add('jumphighlight')
				window.scrollBy(0, window.innerHeight / 2)
				app.$nextTick(() => {
					word.classList.remove('jumphighlight')
					word.classList.add('highlight')
				})
			})
		})
	},
	setActiveView({ app }, { category, id }) {
		app.activeView = {
			category,
			id,
		}

		const snippetIndices = Object.values(app.snippets).reduce(
			(acc, snippet) => {
				if (snippet.source === app.activeView.id) {
					snippet.words.forEach(word => (acc[word.key] = word.key))
					return acc
				} else {
					return acc
				}
			},
			{},
		)

		app.snippetIndex = 0
		app.snippetIndices = snippetIndices

		let newAudioSource

		if (app.segments[id]) {
			newAudioSource = app.segments[id].audioSource
		} else if (app.threads[id]) {
			const sourceSegment =
				app.snippets[app.threads[id].snippets[0]].source
			newAudioSource = app.segments[sourceSegment].audioSource
		}

		app.audioSource = newAudioSource
	},
	initiateCapture({ app }) {
		app.capturing = true

		const selection = window.getSelection()

		const noSelectionError = {
			name: 'No Selection',
			message: 'seems like there is not selected content',
		}

		if (!selection) {
			throw noSelectionError
		}

		const box = selection.focusNode.parentElement.parentElement.getBoundingClientRect()

		const anchorIndex =
			selection.anchorNode.parentElement.parentElement.dataset.key
		const focusIndex =
			selection.focusNode.parentElement.parentElement.dataset.key

		const direction = anchorIndex < focusIndex ? 1 : -1
		const selectedElements = []
		for (
			let i = parseInt(anchorIndex);
			i !== parseInt(focusIndex) + direction;
			i = i + direction
		) {
			const element = document.querySelector(`[data-key*="${i}"]`)
			selectedElements.push(element)
		}
		selectedElements.forEach(element => {
			element.classList.add('capture')
		})

		app.$nextTick(() => {
			document.getElementById('captureCategory').focus()
		})

		const bottom =
			document.getElementById('text').scrollHeight -
			(box.top + window.pageYOffset)

		return {
			bottom,
			left: '105%',
		}
	},
	capture({ app }, { thread }) {
		const threadValue = thread.srcElement.value
		const selection = document.querySelectorAll('.capture')
		const snippetId = uuidv4()

		const selectionSegment = app.segments[selection[0].dataset.segmentid]

		const words = Array.from(selection).map(word => {
			return {
				word: selectionSegment.words[word.dataset.key],
				key: word.dataset.key,
			}
		})

		let threadId
		const threadExists =
			Object.values(app.threads).filter(thread => {
				return thread.title === threadValue
			}).length > 0

		if (threadExists) {
			Object.values(app.threads).forEach(thread => {
				if (thread.title === threadValue) {
					threadId = thread.id
					app.threads[thread.id].snippets.push(snippetId)
				}
			})
		} else {
			threadId = uuidv4()
			const newThread = {
				id: threadId,
				title: threadValue,
				snippets: [snippetId],
			}
			app.threads[threadId] = newThread
			//Vue.set(app.threads, threadId, newThread)
		}

		const snippet = {
			id: snippetId,
			source: selection[0].dataset.segmentid,
			words,
			threads: [threadId],
		}

		app.snippets[snippetId] = snippet
		selectionSegment.snippets[snippet.words[0].key] = snippet
		words.forEach(word => (app.snippetIndices[word.key] = true))

		app.capturing = false
		selection.forEach(element => element.classList.remove('capture'))

		app.saveSession({ app })
	},
	toggleAudio() {
		const audio = document.getElementById('audio')
		if (audio.paused) {
			audio.play()
		} else {
			audio.pause()
		}
	},
	highlightWord() {
		const audio = document.getElementById('audio')

		if (audio) {
			const t = audio.currentTime

			if (this.activeView.category === 'thread') {
				let activeSnippet = this.snippets[
					this.threads[this.activeView.id].snippets[this.snippetIndex]
				]
				const snippetEnd = activeSnippet.words.slice(-1)[0].word.end

				if (snippetEnd < t) {
					if (
						this.snippetIndex <
						this.threads[this.activeView.id].snippets.length - 1
					) {
						this.snippetIndex = this.snippetIndex + 1

						activeSnippet = this.snippets[
							this.threads[this.activeView.id].snippets[
								this.snippetIndex
							]
						]
						const audio = document.getElementById('audio')
						this.audioSource = this.segments[
							activeSnippet.source
						].audioSource
						this.audioCurrentTime =
							activeSnippet.words[0].word.start

						app.$nextTick(() => audio.play())
					} else {
						audio.pause()
					}
				}

				Object.values(this.snippets).forEach(snippet => {
					const sourceSegment = this.segments[snippet.source]

					if (sourceSegment) {
						const hits = snippet.words.filter(function(x) {
							return (
								t - x.word.start > 0.01 && x.word.end - t > 0.01
							)
						}, snippet.words)

						const nextWord = hits[hits.length - 1]

						if (
							(!this.curWord && nextWord) ||
							(nextWord &&
								this.curWord.word.word !== nextWord.word.word)
						) {
							this.activeWords.forEach(word => {
								word.word.case = 'success'
							})
							nextWord.word.case = 'active'
							this.activeWords.push(nextWord)
						}
						this.curWord = nextWord
					}
				})
			} else {
				Object.values(this.segments).forEach(segment => {
					if (segment.audioSource === this.audioSource) {
						const hits = segment.words.filter(function(x) {
							return t - x.start > 0.01 && x.end - t > 0.01
						}, segment.words)

						const nextWord = hits[hits.length - 1]

						if (
							(!this.curWord && nextWord) ||
							(nextWord && this.curWord.word !== nextWord.word)
						) {
							this.activeWords.forEach(word => {
								word.case = 'success'
							})
							nextWord.case = 'active'
							this.activeWords.push(nextWord)
						}
						this.curWord = nextWord
					}
				})
			}
		}

		window.requestAnimationFrame(this.highlightWord)
	},
	focusPlay: function({ app }, { word, segment, snippetIndex }) {
		if (word.start !== undefined) {
			app.audioSource = segment.audioSource
			app.audioCurrentTime = word.start

			const audio = document.getElementById('audio')
			audio.currentTime = word.start

			app.snippetIndex = snippetIndex

			audio.play()
		}
	},
	timeUpdate() {
		this.audioCurrentTime = this.$refs.audio.currentTime
	},
	selectRepo: async function() {
		window.api.send('toMain', 'selectRepo')
	},
}
