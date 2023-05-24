import { Trigger } from '@radix-ui/react-dropdown-menu'
import { TLStyleType } from '@tldraw/editor'
import classNames from 'classnames'
import * as React from 'react'
import { TLUiStyle } from '../../hooks/useStylesProvider'
import { TLTranslationKey } from '../../hooks/useTranslation/TLTranslationKey'
import { useTranslation } from '../../hooks/useTranslation/useTranslation'
import { TLUiIconType } from '../../icon-types'
import { Button } from '../primitives/Button'
import * as DropdownMenu from '../primitives/DropdownMenu'

interface DoubleDropdownPickerProps<T extends TLUiStyle> {
	label: TLTranslationKey
	labelA: TLTranslationKey
	labelB: TLTranslationKey
	itemsA: T[]
	itemsB: T[]
	styleTypeA: TLStyleType
	styleTypeB: TLStyleType
	valueA: T['id'] | null | undefined
	valueB: T['id'] | null | undefined
	onValueChange: (value: T, styleType: string, squashing: boolean) => void
	'data-wd'?: string
}

export const DoubleDropdownPicker = React.memo(function DoubleDropdownPicker<T extends TLUiStyle>({
	'data-wd': dataWd,
	label,
	labelA,
	labelB,
	itemsA,
	itemsB,
	styleTypeA,
	styleTypeB,
	valueA,
	valueB,
	onValueChange,
}: DoubleDropdownPickerProps<T>) {
	const msg = useTranslation()

	const iconA = React.useMemo(
		() => itemsA.find((item) => item.id === valueA)?.icon ?? 'mixed',
		[itemsA, valueA]
	)
	const iconB = React.useMemo(
		() => itemsB.find((item) => item.id === valueB)?.icon ?? 'mixed',
		[itemsB, valueB]
	)

	if (valueA === undefined && valueB === undefined) return null

	const startWdPrefix = `${dataWd}.start`
	const endWdPrefix = `${dataWd}.end`

	return (
		<div className="tlui-style-panel__double-select-picker">
			<div title={msg(label)} className="tlui-style-panel__double-select-picker-label">
				{msg(label)}
			</div>
			<DropdownMenu.Root id={`style panel ${styleTypeA}`}>
				<Trigger asChild>
					<Button
						data-wd={startWdPrefix}
						title={
							msg(labelA) +
							' — ' +
							(valueA === null
								? msg('style-panel.mixed')
								: msg(`${styleTypeA}-style.${valueA}` as TLTranslationKey))
						}
						icon={iconA as any}
						invertIcon
						smallIcon
					/>
				</Trigger>
				<DropdownMenu.Content side="bottom" align="end" sideOffset={0} alignOffset={-2}>
					<div
						className={classNames('tlui-button-grid', {
							'tlui-button-grid__two': itemsA.length < 4,
							'tlui-button-grid__four': itemsA.length >= 4,
						})}
					>
						{itemsA.map((item, i) => {
							return (
								<DropdownMenu.Item
									className="tlui-button-grid__button"
									title={
										msg(labelA) + ' — ' + msg(`${styleTypeA}-style.${item.id}` as TLTranslationKey)
									}
									data-wd={`${startWdPrefix}.${item.id}`}
									key={`${item.id}_${i}`}
									icon={item.icon as TLUiIconType}
									onClick={() => onValueChange(item, styleTypeA, false)}
									invertIcon
								/>
							)
						})}
					</div>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<DropdownMenu.Root id={`style panel ${styleTypeB}`}>
				<Trigger asChild>
					<Button
						data-wd={endWdPrefix}
						title={
							msg(labelB) +
							' — ' +
							(valueB === null
								? msg('style-panel.mixed')
								: msg(`${styleTypeB}-style.${valueB}` as TLTranslationKey))
						}
						icon={iconB as any}
						smallIcon
					/>
				</Trigger>
				<DropdownMenu.Content side="bottom" align="end" sideOffset={0} alignOffset={-2}>
					<div
						className={classNames('tlui-button-grid', {
							'tlui-button-grid__two': itemsA.length < 4,
							'tlui-button-grid__four': itemsA.length >= 4,
						})}
					>
						{itemsB.map((item, i) => {
							return (
								<DropdownMenu.Item
									className="tlui-button-grid__button"
									title={
										msg(labelB) + ' — ' + msg(`${styleTypeB}-style.${item.id}` as TLTranslationKey)
									}
									data-wd={`${endWdPrefix}.${item.id}`}
									key={`${item.id}_${i}`}
									icon={item.icon as TLUiIconType}
									onClick={() => onValueChange(item, styleTypeB, false)}
								/>
							)
						})}
					</div>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	)
})
