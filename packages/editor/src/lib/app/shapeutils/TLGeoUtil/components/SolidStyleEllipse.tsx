import { ColorStyle, SizeStyle, TLGeoShape } from '@tldraw/tlschema'
import * as React from 'react'
import { App } from '../../../App'
import { ShapeFill, getShapeFillSvg, getSvgWithShapeFill } from '../../shared/ShapeFill'

export const SolidStyleEllipse = React.memo(function SolidStyleEllipse({
	w,
	h,
	strokeWidth: sw,
	fill,
	color,
}: Pick<TLGeoShape['props'], 'w' | 'h' | 'fill' | 'color'> & { strokeWidth: number }) {
	const cx = w / 2
	const cy = h / 2
	const rx = Math.max(0, cx)
	const ry = Math.max(0, cy)

	const d = `M${cx - rx},${cy}a${rx},${ry},0,1,1,${rx * 2},0a${rx},${ry},0,1,1,-${rx * 2},0`

	return (
		<>
			<ShapeFill d={d} color={color} fill={fill} />
			<path d={d} stroke={`var(--palette-${color})`} strokeWidth={sw} fill="none" />
		</>
	)
})

export function SolidStyleEllipseSvg({ shape, app }: { shape: TLGeoShape; app: App }) {
	const { w, h, color, size, fill } = shape.props

	const cx = w / 2
	const cy = h / 2
	const rx = Math.max(0, cx)
	const ry = Math.max(0, cy)

	const d = `M${cx - rx},${cy}a${rx},${ry},0,1,1,${rx * 2},0a${rx},${ry},0,1,1,-${rx * 2},0`

	const fillColor = app.getStyle<ColorStyle>({
		type: 'color',
		id: color,
		theme: app.isDarkMode ? 'dark' : 'default',
		variant: 'default',
	}).value

	const strokeWidth = app.getStyle<SizeStyle>({
		type: 'size',
		id: size,
		variant: 'strokeWidth',
	}).value

	const strokeElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
	strokeElement.setAttribute('d', d)
	strokeElement.setAttribute('stroke-width', strokeWidth.toString())
	strokeElement.setAttribute('width', w.toString())
	strokeElement.setAttribute('height', h.toString())
	strokeElement.setAttribute('fill', 'none')
	strokeElement.setAttribute('stroke', fillColor)

	// Get the fill element, if any
	const fillElement = getShapeFillSvg({
		d,
		fill,
		color,
		app,
	})

	return getSvgWithShapeFill(strokeElement, fillElement)
}
