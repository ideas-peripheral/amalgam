import { Segment } from './types'
import { ClientState } from './types'
import { actions } from './actions'

export interface Updates {
	newSource: (
		app: any,
		data: { type: 'newSource'; newSource: Segment },
	) => void
}

export const updates: Updates = {
	newSource(app: ClientState, { type, newSource }) {
		app.segments[newSource.id] = newSource

		actions.saveSession({ app })
	},
}
