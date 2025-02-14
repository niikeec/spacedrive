import parseMarkdownMetadata from 'markdown-yaml-metadata-parser';
import { marked } from 'marked';
import { Fire, Info } from 'phosphor-react';
import { renderToString } from 'react-dom/server';

export interface MarkdownPageData {
	name?: string;
	index?: number;
	new?: boolean;
	// for blog posts
	title?: string;
	author?: string;
	date?: string;
	tags?: string;
	image?: string;
	imageCaption?: string;
	readTime?: string;
}

interface MarkdownParsed {
	render: string;
	metadata?: MarkdownPageData;
}

export function parseMarkdown(markdownRaw: string): MarkdownParsed {
	let metadata: MarkdownPageData | undefined = undefined;
	let withoutMetadata = markdownRaw;
	try {
		const parsed = parseMarkdownMetadata(markdownRaw);
		metadata = parsed.metadata;
		withoutMetadata = parsed.content;
	} catch (e) {
		// console.warn('failed to parse markdown', e);
		// this doesn't matter
	}
	let markdownAsHtml = marked(withoutMetadata);

	// make all non local links open in new tab
	markdownAsHtml = markdownAsHtml.replaceAll(
		'<a href="http',
		`<a target="_blank" rel="noreferrer" href="http`
	);

	const rawSplit = markdownRaw.split(':::');

	// custom support for "slots" like vuepress
	markdownAsHtml = markdownAsHtml
		.split(':::')
		.map((text, index) => {
			if (index % 2 === 0) {
				return text;
			} else {
				const rawText = rawSplit[index],
					meta = rawText!.split(/\r?\n/)[0]!.trim(),
					kind = meta.split(' ')[0],
					name = meta.split(' ')[1],
					extra = meta.substring(kind!.length + name!.length + 2),
					content = text.substring(meta.length + 1, text.length).trim();

				// console.log({ kind, name, extra, content });

				switch (kind) {
					case 'slot':
						return (
							// prettier-ignore
							`<div class="slot-block ${name}">
                                                                <div class="slot-block-title-container">
                                                                        ${name === 'warning'
                                                                                ? renderToString(<Fire className="slot-block-title-icon" />)
                                                                                : renderToString(<Info className="slot-block-title-icon" />)
                                                                        }
                                                                        <h5 class="slot-block-title">${extra || name}</h5>
                                                                </div>
                                                                <p class="slot-block-content">${content}</p>
                                                        </div>`
						);
						break;

					default:
						break;
				}
			}
		})
		.join('');

	return {
		render: markdownAsHtml,
		metadata
	};
}
