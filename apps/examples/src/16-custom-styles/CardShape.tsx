import {
	BaseBoxShapeTool,
	BaseBoxShapeUtil,
	DefaultColorStyle,
	HTMLContainer,
	StyleProp,
	TLBaseShape,
	TLDefaultColorStyle,
	defineShape,
} from '@tldraw/tldraw'
import { T } from '@tldraw/validate'

// Define a style that can be used across multiple shapes. The ID (myApp:filter) must be globally
// unique, so we recommend prefixing it with a namespace.
export const MyFilterStyle = StyleProp.defineEnum({
	id: 'myApp:filter',
	defaultValue: 'none',
	values: ['none', 'invert', 'grayscale', 'blur'],
})

export type MyFilterStyle = T.TypeOf<typeof MyFilterStyle>

export type CardShape = TLBaseShape<
	'card',
	{
		w: number
		h: number
		color: TLDefaultColorStyle
		filter: MyFilterStyle
	}
>

export class CardShapeUtil extends BaseBoxShapeUtil<CardShape> {
	// Id — the shape util's id
	static override type = 'card' as const

	// Flags — there are a LOT of other flags!
	override isAspectRatioLocked = (_shape: CardShape) => false
	override canResize = (_shape: CardShape) => true
	override canBind = (_shape: CardShape) => true

	// Default props — used for shapes created with the tool
	override defaultProps(): CardShape['props'] {
		return {
			w: 300,
			h: 300,
			color: 'black',
			filter: 'none',
		}
	}

	// Render method — the React component that will be rendered for the shape
	render(shape: CardShape) {
		const bounds = this.bounds(shape)

		const color = this.editor
			// Some styles have extra information that can be accessed via the style instance
			.getStyleInstance(DefaultColorStyle)
			// For example, the default color style maps the color names like 'black' and 'green' to
			// actual hex values.
			.getColor(this.editor, shape.props.color)

		return (
			<HTMLContainer
				id={shape.id}
				style={{
					border: `4px solid ${color.solid}`,
					borderRadius: 4,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					pointerEvents: 'all',
					filter: this.filterStyleToCss(shape.props.filter),
					backgroundColor: color.semi,
				}}
			>
				🍇🫐🍏🍋🍊🍒 {bounds.w.toFixed()}x{bounds.h.toFixed()} 🍒🍊🍋🍏🫐🍇
			</HTMLContainer>
		)
	}

	// Indicator — used when hovering over a shape or when it's selected; must return only SVG elements here
	indicator(shape: CardShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}

	filterStyleToCss(filter: MyFilterStyle) {
		if (filter === 'invert') return 'invert(100%)'
		if (filter === 'grayscale') return 'grayscale(100%)'
		if (filter === 'blur') return 'blur(10px)'
		return 'none'
	}
}

// Extending the base box shape tool gives us a lot of functionality for free.
export class CardShapeTool extends BaseBoxShapeTool {
	static override id = 'card'
	static override initial = 'idle'

	override shapeType = CardShapeUtil
}

export const CardShape = defineShape('card', {
	util: CardShapeUtil,
	tool: CardShapeTool,
	// to use a style prop, you need to describe all the props in your shape.
	props: {
		w: T.number,
		h: T.number,
		// You can re-use tldraw built-in styles...
		color: DefaultColorStyle,
		// ...or your own custom styles.
		filter: MyFilterStyle,
	},
})
