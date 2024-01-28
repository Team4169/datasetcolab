import React, { useState, useEffect } from "react";
import Alert from "react-bootstrap/Alert";
import DocsMarkdownViewer from "../components/DocsMarkdownViewer";
import Nav from "react-bootstrap/Nav";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

export default function Docs() {
    const [error, setError] = useState("");
    const [activePage, setActivePage] = useState("YOLOv5n");

    useEffect(() => {
        // Get the docs parameter from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const docsParam = urlParams.get("docs");

        // Set the activePage to the docs parameter
        setActivePage(docsParam);
    }, []);

    useEffect(() => {
        // Update the markdown whenever the active page changes
        // You can replace this with your own logic to fetch the markdown content
        // based on the active page
        console.log("Fetching markdown for page:", activePage);
    }, [activePage]);

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
            <h2>Documentation</h2>
            <Row>
                <Col md={3}>
                    <div className="files-preview">
                        <Nav className="flex-column">
                            <ButtonGroup vertical>
                                <Nav.Link
                                    onClick={() => setActivePage("YOLOv5n")}
                                    active={activePage === "YOLOv5n"}
                                >
                                    <Button variant={activePage === "YOLOv5n" ? "primary" : "outline-primary"}>
                                        YOLOv5n
                                    </Button>
                                </Nav.Link>
                                <Nav.Link
                                    onClick={() => setActivePage("YOLOv5s")}
                                    active={activePage === "YOLOv5s"}
                                >
                                    <Button variant={activePage === "YOLOv5s" ? "primary" : "outline-primary"}>
                                        YOLOv5s
                                    </Button>
                                </Nav.Link>
                            </ButtonGroup>
                        </Nav>
                    </div>
                </Col>
                <Col md={9}>
                    <DocsMarkdownViewer page={activePage} />
                </Col>
            </Row>
        </div>
    );
}
