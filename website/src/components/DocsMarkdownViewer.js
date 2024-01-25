import React, { Component } from 'react';
import YOLOv5n from '../docs/YOLOv5n.md';
import YOLOv5s from '../docs/YOLOv5s.md';
import ReactMarkdown from 'react-markdown';

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
    return <ReactMarkdown components={{ h1: 'h3', h2: 'h3', h3: 'h3' }}>{markdown}</ReactMarkdown>;
  }
}

export default DocsMarkdownViewer;
