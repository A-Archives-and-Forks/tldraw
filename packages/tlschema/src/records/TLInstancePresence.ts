import { BaseRecord, createRecordType, ID, Migrator } from '@tldraw/tlstore'
import { T } from '@tldraw/tlvalidate'
import { Box2dModel } from '../geometry-types'
import { cursorTypeValidator, TLCursor, TLScribble } from '../ui-types'
import { idValidator, scribbleTypeValidator } from '../validation'
import { TLInstanceId } from './TLInstance'
import { TLPageId } from './TLPage'
import { TLShapeId } from './TLShape'

/** @public */
export interface TLInstancePresence extends BaseRecord<'instance_presence', TLInstancePresenceId> {
	instanceId: TLInstanceId
	userId: string
	userName: string
	lastActivityTimestamp: number
	color: string // can be any hex color
	camera: { x: number; y: number; z: number }
	selectedIds: TLShapeId[]
	currentPageId: TLPageId
	brush: Box2dModel | null
	scribble: TLScribble | null
	screenBounds: Box2dModel
	followingUserId: string | null
	cursor: {
		x: number
		y: number
		type: TLCursor['type']
		rotation: number
	}
}

/** @public */
export type TLInstancePresenceId = ID<TLInstancePresence>

/** @public */
export const instancePresenceTypeValidator = T.model<TLInstancePresence>(
	'instance_presence',
	T.model(
		'instance_presence',
		T.object({
			instanceId: idValidator<TLInstanceId>('instance'),
			typeName: T.literal('instance_presence'),
			id: idValidator<TLInstancePresenceId>('instance_presence'),
			userId: T.string,
			userName: T.string,
			lastActivityTimestamp: T.number,
			followingUserId: T.string.nullable(),
			cursor: T.object({
				x: T.number,
				y: T.number,
				type: cursorTypeValidator,
				rotation: T.number,
			}),
			color: T.string,
			camera: T.object({
				x: T.number,
				y: T.number,
				z: T.number,
			}),
			screenBounds: T.boxModel,
			selectedIds: T.arrayOf(idValidator<TLShapeId>('shape')),
			currentPageId: idValidator<TLPageId>('page'),
			brush: T.boxModel.nullable(),
			scribble: scribbleTypeValidator.nullable(),
		})
	)
)

const Versions = {
	AddScribbleDelay: 1,
} as const

/** @public */
export const instancePresenceTypeMigrator = new Migrator({
	currentVersion: Versions.AddScribbleDelay,
	migrators: {
		[Versions.AddScribbleDelay]: {
			up: (instance) => {
				if (instance.scribble !== null) {
					return { ...instance, scribble: { ...instance.scribble, delay: 0 } }
				}
				return { ...instance }
			},
			down: (instance) => {
				if (instance.scribble !== null) {
					const { delay: _delay, ...rest } = instance.scribble
					return { ...instance, scribble: rest }
				}
				return { ...instance }
			},
		},
	},
})

/** @public */
export const InstancePresenceRecordType = createRecordType<TLInstancePresence>(
	'instance_presence',
	{
		scope: 'presence',
	}
).withDefaultProperties(() => ({
	lastActivityTimestamp: 0,
	followingUserId: null,
	color: '#FF0000',
	camera: {
		x: 0,
		y: 0,
		z: 1,
	},
	cursor: {
		x: 0,
		y: 0,
		type: 'default',
		rotation: 0,
	},
	screenBounds: {
		x: 0,
		y: 0,
		w: 1,
		h: 1,
	},
	selectedIds: [],
	brush: null,
	scribble: null,
}))
