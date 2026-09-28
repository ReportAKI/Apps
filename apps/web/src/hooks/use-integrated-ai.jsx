import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { integratedAiClient } from '@/lib/integratedAiClient';
import { pocketbaseClient } from '@/lib/pocketbaseClient';

const MessageRole = Object.freeze({
	User: 'user',
	Assistant: 'assistant',
	Tool: 'tool',
});

const ContentBlockType = Object.freeze({
	Text: 'text',
	Image: 'image',
});

const SSEEventType = Object.freeze({
	Content: 'content',
	Reasoning: 'reasoning',
	ToolUse: 'tool_use',
	ToolResult: 'tool_result',
	Usage: 'usage',
	Error: 'error',
	Done: 'done',
	Completed: 'completed',
});

function extractGeneratedImages(msg, history) {
	const images = [];
	if (msg.role !== 'assistant') {
		return images;
	}

	const generateImageToolCall = msg.tool_calls?.find(toolCall => toolCall.function.name === 'generate_image');

	if (generateImageToolCall) {
		const generateImageToolCallResult = history.find(historyMessage => historyMessage.role === 'tool' && historyMessage.tool_call_id === generateImageToolCall.id)?.content;
		if (generateImageToolCallResult) {
			images.push(generateImageToolCallResult);
		}
	}

	return images;
}

function mapUserMessage({ message }) {
	const textParts = message.filter(b => b.type === ContentBlockType.Text).map(b => b.text);
	const images = message.filter(b => b.type === ContentBlockType.Image).map(b => b.image);

	return {
		role: MessageRole.User,
		content: textParts.join('\n'),
		...(images.length > 0 && { images }),
	};
}

function mapAssistantMessages({ message }) {
	const mapped = [];

	for (const event of message) {
		const agentName = event?.metadata?.agent_name;

		if (event.type === SSEEventType.ToolResult) {
			mapped.push({
				role: MessageRole.Tool,
				tool_call_id: event.data.tool_call_id,
				content: event.data.content,
				...(agentName && { agent_name: agentName }),
			});
			continue;
		}

		mapped.push({
			role: MessageRole.Assistant,
			content: event.data.content,
			...(event.type === SSEEventType.ToolUse && {
				tool_calls: event.data.tool_calls.map(toolCall => ({
					id: toolCall.id,
					type: 'function',
					function: {
						name: toolCall.name,
						arguments: JSON.stringify(toolCall.input),
					},
				})),
			}),
			...(agentName && { agent_name: agentName }),
		});
	}

	return mapped;
}

function useIntegratedAi() {
	const [messages, setMessages] = useState([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const abortControllerRef = useRef(null);

	useEffect(() => {
		async function loadHistory() {
			try {
				if (!pocketbaseClient.authStore.isValid) {
					return [];
				}
			
				const records = await pocketbaseClient.collection('_integratedAiMessages').getFullList({
					sort: 'created',
				});
			
				const historyMessages = [];
			
				for (const record of records) {
					if (record.role === MessageRole.User) {
						historyMessages.push(mapUserMessage({ message: record.content }));
						continue;
					}
			
					historyMessages.push(...mapAssistantMessages({ message: record.content }));
				}
			
				const chatMessages = historyMessages
					.filter(msg => msg.role === 'user' || msg.role === 'assistant')
					.map((msg) => {
						const images = [...(msg.images || []), ...extractGeneratedImages(msg, historyMessages)];

						return {
							role: msg.role,
							content: msg.content,
							...(images.length > 0 && { images }),
						};
					});

				setMessages(chatMessages);
			} catch (err) {
				toast({
					variant: 'destructive',
					title: 'Error',
					description: err.message,
				});
			} finally {
				setIsLoadingHistory(false);
			}
		}

		loadHistory();
	}, []);

	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	const handleSSEEvent = useCallback((parsed) => {
		if (parsed.type === SSEEventType.Content) {
			setMessages((prev) => {
				const updated = [...prev];
				const last = updated[updated.length - 1];
				updated[updated.length - 1] = {
					...last,
					content: last.content + parsed.data.content,
				};

				return updated;
			});
		}

		if (parsed.type === SSEEventType.ToolResult) {
			const isImageResult = parsed.data.tool_name === 'generate_image' && parsed.data.content;

			if (isImageResult) {
				setMessages((prev) => {
					const updated = [...prev];
					const last = updated[updated.length - 1];
					updated[updated.length - 1] = {
						...last,
						images: [...(last.images || []), parsed.data.content],
					};

					return updated;
				});
			}
		}
	}, []);

	const sendMessage = useCallback(async (userMessage, images = []) => {
		setIsStreaming(true);

		setMessages(prev => [
			...prev,
			{
				role: 'user',
				content: userMessage,
				...(images.length > 0 && {
					images: images.map(img => URL.createObjectURL(img)),
				}),
			},
			{ role: 'assistant', content: '' },
		]);

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		try {
			const response = await integratedAiClient.stream('/integrated-ai/stream', {
				body: { message: [{ text: userMessage, type: 'text' }] },
				signal: abortController.signal,
				images,
			});

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					break;
				}

				buffer += decoder.decode(value, { stream: true });

				const events = buffer.split('\n\n');
				buffer = events.pop() || '';

				for (const event of events) {
					if (!event.trim()) {
						continue;
					}

					const lines = event.split('\n');
					let eventData = '';

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							eventData += line.slice(6);
						}
					}

					if (!eventData) {
						continue;
					}

					const parsed = JSON.parse(eventData);

					if (parsed.type === SSEEventType.Error) {
						throw new Error(parsed.data.content);
					}

					if (parsed.type === SSEEventType.Completed) {
						return;
					}

					handleSSEEvent(parsed);
				}
			}
		} catch (err) {
			if (err.name === 'AbortError') {
				setMessages((prev) => {
					const updated = [...prev];
					const last = updated[updated.length - 1];
					if (last?.role === 'assistant' && !last.content) {
						updated.pop();
					}

					return updated;
				});

				return;
			}

			toast({
				variant: 'destructive',
				title: 'Error',
				description: err.message,
			});

			setMessages((prev) => {
				const updated = [...prev];
				const last = updated[updated.length - 1];

				if (last?.role === 'assistant' && !last.content) {
					updated.pop();
				}

				return updated;
			});
		} finally {
			abortControllerRef.current = null;
			setIsStreaming(false);
		}
	}, [handleSSEEvent]);

	const clearMessages = useCallback(() => {
		setMessages([]);
	}, []);

	return {
		messages,
		isStreaming,
		isLoadingHistory,
		sendMessage,
		clearMessages,
	};
}

export default useIntegratedAi;
export { useIntegratedAi };
