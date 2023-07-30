import { StateNode, TLArrowShape, TLEventHandlers, TLHandle, createShapeId } from '@tldraw/editor'

export class Pointing extends StateNode {
	static override id = 'pointing'

	shape?: TLArrowShape

	markId = ''

	initialEndHandle = {} as TLHandle

	override onEnter = () => {
		this.didTimeout = false

		const target = this.editor.getShapeAtPoint(this.editor.inputs.currentPagePoint, {
			filter: (shape) => this.editor.getShapeUtil(shape).canBind(shape),
			margin: 0,
			hitInside: true,
		})

		if (!target) {
			this.createArrowShape()
		} else {
			this.editor.setHintingShapeIds([target.id])
		}

		this.startPreciseTimeout()
	}

	override onExit = () => {
		this.shape = undefined
		this.editor.setHintingShapeIds([])
		this.clearPreciseTimeout()
	}

	override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
		if (this.editor.inputs.isDragging) {
			if (!this.shape) {
				this.createArrowShape()
			}

			if (!this.shape) throw Error(`expected shape`)

			this.updateArrowShapeEndHandle()

			this.editor.setCurrentTool('select.dragging_handle', {
				shape: this.shape,
				handle: this.initialEndHandle,
				isCreating: true,
				onInteractionEnd: 'arrow',
			})
		}
	}

	override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
		this.cancel()
	}

	override onCancel: TLEventHandlers['onCancel'] = () => {
		this.cancel()
	}

	override onComplete: TLEventHandlers['onComplete'] = () => {
		this.cancel()
	}

	override onInterrupt: TLEventHandlers['onInterrupt'] = () => {
		this.cancel()
	}

	cancel() {
		if (this.shape) {
			// the arrow might not have been created yet!
			this.editor.bailToMark(this.markId)
		}
		this.editor.setHintingShapeIds([])
		this.parent.transition('idle', {})
	}

	createArrowShape() {
		const { originPagePoint } = this.editor.inputs

		const id = createShapeId()

		this.markId = `creating:${id}`

		this.editor.mark(this.markId).createShapes<TLArrowShape>([
			{
				id,
				type: 'arrow',
				x: originPagePoint.x,
				y: originPagePoint.y,
			},
		])

		const shape = this.editor.getShape<TLArrowShape>(id)
		if (!shape) throw Error(`expected shape`)

		const handles = this.editor.getHandles(shape)
		if (!handles) throw Error(`expected handles for arrow`)

		const util = this.editor.getShapeUtil<TLArrowShape>('arrow')
		const startHandle = handles.find((h) => h.id === 'start')!
		const change = util.onHandleChange?.(shape, {
			handle: { ...startHandle, x: 0, y: 0 },
			isPrecise: true,
		})

		if (change) {
			const startTerminal = change.props?.start
			if (startTerminal?.type === 'binding') {
				this.editor.setHintingShapeIds([startTerminal.boundShapeId])
			}
			// squash me
			this.editor.updateShape(change, { squashing: true })
		}

		// Cache the current shape after those changes
		this.shape = this.editor.getShape(id)
		this.editor.setSelectedShapeIds([id], true)

		this.initialEndHandle = this.editor.getHandles(this.shape!)!.find((h) => h.id === 'end')!
	}

	updateArrowShapeEndHandle() {
		const util = this.editor.getShapeUtil<TLArrowShape>('arrow')

		// end update
		{
			const shape = this.editor.getShape(this.shape!.id)! as TLArrowShape
			const point = this.editor.getPointInShapeSpace(shape, this.editor.inputs.currentPagePoint)
			const endHandle = this.editor.getHandles(shape)!.find((h) => h.id === 'end')!
			const change = util.onHandleChange?.(shape, {
				handle: { ...endHandle, x: point.x, y: point.y },
				isPrecise: false, // sure about that?
			})

			if (change) {
				const endTerminal = change.props?.end
				if (endTerminal?.type === 'binding') {
					this.editor.setHintingShapeIds([endTerminal.boundShapeId])
				}
				this.editor.updateShape(change, { squashing: true })
			}
		}

		// start update
		{
			const shape = this.editor.getShape(this.shape!.id)! as TLArrowShape
			const startHandle = this.editor.getHandles(shape)!.find((h) => h.id === 'start')!
			const change = util.onHandleChange?.(shape, {
				handle: { ...startHandle, x: 0, y: 0 },
				isPrecise: this.didTimeout, // sure about that?
			})

			if (change) {
				this.editor.updateShape(change, { squashing: true })
			}
		}

		// Cache the current shape after those changes
		this.shape = this.editor.getShape(this.shape!.id)
	}

	private preciseTimeout = -1
	private didTimeout = false
	private startPreciseTimeout() {
		this.preciseTimeout = window.setTimeout(() => {
			if (!this.isActive) return
			this.didTimeout = true
		}, 320)
	}
	private clearPreciseTimeout() {
		clearTimeout(this.preciseTimeout)
	}
}
