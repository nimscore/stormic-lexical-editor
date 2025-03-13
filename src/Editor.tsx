import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { SelectionAlwaysOnDisplay } from '@lexical/react/LexicalSelectionAlwaysOnDisplay'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { EditorState, EditorThemeClasses } from 'lexical'
import React, { useCallback, useState } from 'react'
import ContentEditable from './ui/ContentEditable'

// Интерфейс пропсов редактора
interface EditorProps {
	onChange?: (editorState: EditorState) => void
	initialState?: string
	theme?: EditorThemeClasses
}

// Плагин для обработки изменений в редакторе
const OnChangeHandler: React.FC<{
	onChange?: (editorState: EditorState) => void
}> = ({ onChange }) => {
	const [editor] = useLexicalComposerContext()

	const handleChange = useCallback(() => {
		if (onChange) {
			editor.update(() => {
				const editorState = editor.getEditorState()
				onChange(editorState)
			})
		}
	}, [editor, onChange])

	return <OnChangePlugin onChange={handleChange} />
}

export const Editor: React.FC<EditorProps> = ({
	onChange,
	initialState,
	theme,
}) => {
	const isEditable = useLexicalEditable()
	const [floatingAnchorElem, setFloatingAnchorElem] =
		useState<HTMLDivElement | null>(null)

	const onRef = (elem: HTMLDivElement | null) => {
		if (elem !== null) {
			setFloatingAnchorElem(elem)
		}
	}

	// Начальная конфигурация редактора
	const editorConfig = {
		namespace: 'StormicEditor',
		theme: theme || {}, // Можно передавать кастомную тему
		onError(error: Error) {
			console.error(error)
		},
		editorState: initialState || undefined, // Начальное состояние
	}

	return (
		<LexicalComposer initialConfig={editorConfig}>
			<AutoFocusPlugin />
			<ClearEditorPlugin />
			<HistoryPlugin />

			<RichTextPlugin
				contentEditable={
					<div className='editor-scroller'>
						<div className='editor' ref={onRef}>
							<ContentEditable placeholder='Введите текст...' />
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

			{/* Плагин для обработки изменений */}
			<OnChangeHandler onChange={onChange} />
		</LexicalComposer>
	)
}

export default Editor
