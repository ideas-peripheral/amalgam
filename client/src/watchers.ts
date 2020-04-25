interface Watchers {
	activeView: () => void
}

export const watchers: Watchers = {
	activeView: function() {
		const indices = {}

		if (this.activeView.category === 'source') {
			const segment = this.segments[this.activeView.id]

			if (Object.values(segment.snippets).length > 0) {
				const words = Object.values(segment.snippets).flatMap(
					snippet => {
						return snippet.words
					},
				)

				words.forEach(word => (indices[word.key] = true))
			}
		}

		this.snippetIndices = indices
	},
}
