import React, { Component } from 'react';
import YOLOv5n from '../docs/YOLOv5n.md';
import YOLOv5s from '../docs/YOLOv5s.md';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkToc from 'remark-toc';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeCodeTitles from 'rehype-code-titles';
import rehypeStringify from 'rehype-stringify';


class DocsMarkdownViewer extends Component {
  constructor(props) {
    super(props);
    this.state = { markdown: '' };
  }

  componentDidMount() {
    const { page } = this.props;
    
    if (page === 'YOLOv5n') {
      fetch(YOLOv5n).then(res => res.text()).then(text => this.setState({ markdown: text }));
    } else if (page === 'YOLOv5s') {
      fetch(YOLOv5s).then(res => res.text()).then(text => this.setState({ markdown: text }));
    }
  }

    render() {
      const { markdown } = this.state;
      return (
        <ReactMarkdown
          components={{ h1: 'h3', h2: 'h3', h3: 'h3' }}
          rehypePlugins={[
            rehypeHighlight,
            remarkToc,
            remarkGfm,
            rehypeRaw,
            rehypeSanitize,
            rehypeSlug,
            rehypeAutolinkHeadings,
            rehypeCodeTitles,
            rehypeStringify
          ]}
        >
          {markdown}
        </ReactMarkdown>
      );
    }
  }

export default DocsMarkdownViewer;
