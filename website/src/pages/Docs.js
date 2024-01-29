import React, { useState, useEffect } from "react";
import Alert from "react-bootstrap/Alert";
import DocsMarkdownViewer from "../components/DocsMarkdownViewer";
import Nav from "react-bootstrap/Nav";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { useParams, useNavigate } from "react-router-dom";

export default function Docs() {
  const [error, setError] = useState("");
  const { "*": activePage } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: "20px" }}>
      <Alert
        variant="danger"
        show={error}
        onClose={() => setError("")}
        dismissible
      >
        {error}
      </Alert>
      <h2 style={{ paddingBottom: "10px" }}>Documentation</h2>
      <Row>
        <Col md={2}>
          <Nav
            className="col-md-12 d-none d-md-block bg-white sidebar"
            activeKey="/home"
            onSelect={(selectedKey) => alert(`selected ${selectedKey}`)}
          >
            <div className="sidebar-section">
              <h5>Inference</h5>
              <Nav.Item>
                <Nav.Link
                  onClick={() => {
                    navigate("/docs/YOLOv5n");
                    window.location.reload();
                  }}
                  className="black-text text-dark"
                >
                  YOLOv5n
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  onClick={() => {
                    navigate("/docs/YOLOv5s");
                    window.location.reload();
                  }}
                  className="black-text text-dark"
                >
                  YOLOv5s
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  onClick={() => {
                    navigate("/docs/YOLOv8n");
                    window.location.reload();
                  }}
                  className="black-text text-dark"
                >
                  YOLOv8n
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  onClick={() => {
                    navigate("/docs/YOLOv8s");
                    window.location.reload();
                  }}
                  className="black-text text-dark"
                >
                  YOLOv8s
                </Nav.Link>
              </Nav.Item>
            </div>
          </Nav>
        </Col>
        <Col md={10}>
          <DocsMarkdownViewer page={activePage} />
        </Col>
      </Row>
    </div>
  );
}
