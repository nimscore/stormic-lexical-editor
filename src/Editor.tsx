import React, { useMemo, useCallback } from "react";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { RichText as RichTextWithoutBlocks } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

export interface LexicalEditorProps extends React.HTMLAttributes<HTMLDivElement> {
	/**
	 * Начальное состояние редактора в сериализованном виде.
	 */
	initialEditorState?: SerializedEditorState;
	/**
	 * Callback, вызываемый при изменении состояния редактора.
	 */
	onChange?: (state: SerializedEditorState) => void;
	/**
	 * Дополнительная конфигурация для lexicalEditor, например, набор плагинов.
	 */
	features?: any;
}

export const Editor: React.FC<LexicalEditorProps> = ({
	                                                            initialEditorState,
	                                                            onChange,
	                                                            features,
	                                                            ...props
                                                            }) => {
	// Формирование конфигурации редактора через вызов lexicalEditor.
	// Если features не переданы, используется дефолтная конфигурация (можно расширить по необходимости).
	const editorConfig = useMemo(() => {
		return lexicalEditor({
			features: features || (({ rootFeatures }: { rootFeatures: any }) => [
				...rootFeatures,
				// Пример: здесь можно добавить стандартные плагины:
				// HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
				// BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
				// FixedToolbarFeature(),
				// InlineToolbarFeature(),
				// HorizontalRuleFeature()
			]),
		});
	}, [features]);
	
	// Обёртка onChange для передачи актуального состояния редактора.
	const handleChange = useCallback(
		(editorState: SerializedEditorState) => {
			if (onChange) {
				onChange(editorState);
			}
		},
		[onChange]
	);
	
	return (
		<RichTextWithoutBlocks
			initialEditorState={initialEditorState}
			onChange={handleChange}
			editorConfig={editorConfig}
			{...props}
		/>
	);
};
