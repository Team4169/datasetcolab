import React, { useState, useEffect, Component } from 'react';
import Markdown from 'react-markdown';
import YOLOv5n from '../docs/YOLOv5n.md';
import YOLOv5s from '../docs/YOLOv5s.md';
import YOLOv6n from '../docs/YOLOv6n.md';
import YOLOv6s from '../docs/YOLOv6s.md';
import YOLOv8n from '../docs/YOLOv8n.md';
import YOLOv8s from '../docs/YOLOv8s.md';
import SSDMobileNet from '../docs/ssdmobilenet.md';
import EfficientDet from '../docs/efficientdet.md';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import rehypeRaw from 'rehype-raw'

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
    } else if (page === 'YOLOv6n') {
      fetch(YOLOv6n).then(res => res.text()).then(text => this.setState({ markdown: text }));
    } else if (page === 'YOLOv6s') {
      fetch(YOLOv6s).then(res => res.text()).then(text => this.setState({ markdown: text }));
    } else if (page === 'YOLOv8n') {
      fetch(YOLOv8n).then(res => res.text()).then(text => this.setState({ markdown: text }));
    } else if (page === 'YOLOv8s') {
      fetch(YOLOv8s).then(res => res.text()).then(text => this.setState({ markdown: text }));
    } else if (page === 'ssdmobilenet') {
      fetch(SSDMobileNet).then(res => res.text()).then(text => this.setState({ markdown: text }));
    } else if (page === 'efficientdet') {
      fetch(EfficientDet).then(res => res.text()).then(text => this.setState({ markdown: text }));
    }
  }

  render() {
    const { markdown } = this.state;

    return (
      <Markdown
        children={markdown}
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <SyntaxHighlighter
                {...rest}
                PreTag="div"
                children={String(children).replace(/\n$/, '')}
                language={match[1]}
              />
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
          h1(props) {
            return <h3 {...props} />;
          },
          h2(props) {
            return <h4 {...props} />;
          },
          h3(props) {
            return <h5 {...props} />;
          },
        }}
        rehypePlugins={[rehypeRaw]}
      />
    );
  }
};

export default DocsMarkdownViewer;
