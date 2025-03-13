import { LexicalComposer } from '@lexical/react/LexicalComposer'
import React from 'react'

export interface LexicalComposerInitialConfig {
	namespace: string
	theme: Record<string, unknown>
	onError: (error: Error) => void
}

export interface EditorComposerProps {
	children: React.ReactNode
	initialConfig?: Partial<LexicalComposerInitialConfig>
}

export const EditorComposer: React.FC<EditorComposerProps> = ({
	children,
	initialConfig,
}) => {
	const defaultConfig: LexicalComposerInitialConfig = {
		namespace: 'StormicLexicalEditor',
		theme: {
			// Добавьте свои стили или оставьте пустым объектом
		},
		onError(error: Error) {
			console.error('Lexical Error:', error)
		},
		...initialConfig,
	}

	return (
		<LexicalComposer initialConfig={defaultConfig}>{children}</LexicalComposer>
	)
}

export default EditorComposer
