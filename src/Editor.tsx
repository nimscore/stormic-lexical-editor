import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { SelectionAlwaysOnDisplay } from '@lexical/react/LexicalSelectionAlwaysOnDisplay'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import React, { useState } from 'react'
import ContentEditable from './ui/ContentEditable'

export const Editor: React.FC = () => {
	// Определяем, можно ли редактировать
	const isEditable = useLexicalEditable()

	// Состояние для хранения ссылки на DOM-элемент (для позиционирования всплывающих панелей, если нужно)
	const [floatingAnchorElem, setFloatingAnchorElem] =
		useState<HTMLDivElement | null>(null)

	// Получаем ссылку на контейнер редактора
	const onRef = (elem: HTMLDivElement | null) => {
		if (elem !== null) {
			setFloatingAnchorElem(elem)
		}
	}

	// Строка-заполнитель
	const placeholder = 'Введите текст...'

	return (
		<>
			<AutoFocusPlugin />
			<ClearEditorPlugin />
			<HistoryPlugin />

			<RichTextPlugin
				contentEditable={
					<div className='editor-scroller'>
						<div className='editor' ref={onRef}>
							<ContentEditable placeholder={placeholder} />
						</div>
					</div>
				}
				ErrorBoundary={LexicalErrorBoundary}
			/>

			<HorizontalRulePlugin />
			<ListPlugin />
			<CheckListPlugin />
			<TabIndentationPlugin />
			<CharacterLimitPlugin maxLength={1000} charset='UTF-16' />
			<ClickableLinkPlugin disabled={!isEditable} />
			<SelectionAlwaysOnDisplay />
			<TablePlugin />

			{/* Если нужен режим "plain text", можно добавить соответствующий плагин */}
		</>
	)
}

export default Editor
