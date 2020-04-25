import { state } from './state'
import { actions } from './actions'
import { watchers } from './watchers'
import { ClientActions } from './actions'
import { updates } from './updates'
import { Updates } from './updates'

import * as TypedVue from 'vue'
// @ts-ignore
import * as UntypedVue from 'vue/dist/vue.esm.js'
const Vue: typeof TypedVue = UntypedVue

interface InitInterface {
	actions: ClientActions
	state: typeof state
}

const app = Vue.createApp({
	data: () => state,
	computed: {
		instance: function() {
			return this
		},
	},
	watch: watchers,
	methods: actions,
	mounted() {
		window.addEventListener('keydown', e => {
			if (e.code === 'Space') {
				e.preventDefault()
				this.toggleAudio(this)
			} else if (e.code === 'MetaLeft' || e.code === 'MetaRight') {
				this.keys.cmd = true
			} else if (this.keys.cmd && e.code === 'KeyK') {
				this.capturing = true
			}
		})
		window.addEventListener('keyup', e => {
			if (e.code === 'MetaLeft' || e.code === 'MetaRight') {
				this.keys.cmd = false
			}
		})
		window.requestAnimationFrame(this.highlightWord)

		const indices = {}

		if (this.activeView.category === 'source') {
			const segment = this.segments[this.activeView.id]

			if (segment && Object.values(segment.snippets).length > 0) {
				const words = Object.values(segment.snippets).flatMap(
					(snippet: Snippet) => {
						return snippet.words
					},
				)

				words.forEach(word => (indices[word.key] = true))
			}
		}

		this.snippetIndices = indices
	},
}).mount('#vue')

window.api.receive('fromMain', data => {
	updates[data.type as keyof Updates](app, data)
})
