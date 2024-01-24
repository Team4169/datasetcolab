import React, { useState, useEffect } from "react";
import Alert from "react-bootstrap/Alert";
import {
    Card,
    Form,
    Button,
    ButtonGroup,
    ToggleButton,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const styles = {
    padding: "20px",
    downloadContainer: { maxWidth: "800px", margin: "0 auto" },
    datasetCard: { marginBottom: "20px", border: "1px solid #e9ecef" },
    optionsContainer: {
        padding: "10px",
        borderRadius: "5px",
        backgroundColor: "#f8f9fa",
        position: "relative",
    },
    downloadMethodContainer: { display: "flex", gap: "10px" },
    downloadButtonsContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginTop: "10px",
        border: "none",
        padding: "0",
    },
    codeBlock: {
        backgroundColor: "#e9ecef",
        padding: "10px",
        borderRadius: "5px",
        overflow: "auto",
        position: "relative",
    },
    copyButton: {
        position: "absolute",
        top: "5px",
        right: "5px",
        cursor: "pointer",
    },
    alertContainer: {
        position: "fixed",
        bottom: "10px",
        left: "10px",
        zIndex: 999,
        display: "flex",
        gap: "10px",
        alignItems: "center",
    },
    closeButton: { cursor: "pointer" },
    checkboxGroup: { display: "flex", gap: "10px", flexWrap: "wrap" },
};

export default function PretrainedModels() {
    const { currentUser } = useAuth();

    const [error, setError] = useState("");
    const [showCopyAlert, setShowCopyAlert] = useState(false);

    const [datasets, setDatasets] = useState([
        { name: "YOLOv8", dataset: "FRC 2024", model: "YOLOv8s", author: "Team 5990", classes: ["note", "robot"], download: "direct", size: 0 },
        { name: "YOLOv5", dataset: "FRC 2024", model: "YOLOv5s", author: "Team 5990", classes: ["note", "robot"], download: "direct", size: 0 },
    ]);

    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState("API_KEY");
    const [data, setData] = useState(null);

    const navigate = useNavigate();

    const handleDownloadCurl = (dataset) => {
        return "(placeholder)";
    };

    const handleCopyToClipboard = (dataset) => {
        const curlCommand = handleDownloadCurl(dataset);
        navigator.clipboard.writeText(curlCommand);
        setShowCopyAlert(true);
    };


    const handleDirectDownload = async (dataset) => {
        try {
            setLoading(true);

            const idToken = await currentUser.getIdToken();

            window.location.href = "https://api.datasetcolab.com/download/";
        } catch (err) {
            setError("Error downloading dataset.");
            console.log(err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div style={styles}>
            <Alert
                variant="danger"
                show={error}
                onClose={() => setError("")}
                dismissible
            >
                {error}
            </Alert>
            <div style={styles.downloadContainer}>
                <h2>Pretrained Models</h2>
                <Form.Group>
                    {datasets.map((dataset, index) => (
                        <Card key={index} style={styles.datasetCard}>
                            <Card.Body>
                                <h3>{dataset.name} <span style={{ fontSize: "14px", color: "gray" }}>by {dataset.author}</span></h3>
                                <small>
                                    <strong>Dataset:</strong> {dataset.dataset} &nbsp;&nbsp;&nbsp;
                                    <strong>Model:</strong> {dataset.model} &nbsp;&nbsp;&nbsp;
                                    <strong>Classes:</strong> {dataset.classes.join(", ")} &nbsp;&nbsp;&nbsp;
                                    <strong>Size:</strong> {(dataset.zipSize / (1024 * 1024 * 1024)).toFixed(2)} GB
                                </small>
                                <h5 style={{ paddingTop: "10px" }}>Preformance</h5>

                                {currentUser && currentUser.emailVerified ? (
                                    <>
                                        <h5 style={{ paddingTop: "10px" }}>Download Method</h5>
                                        <Form.Group>
                                            <ButtonGroup toggle>
                                                <ToggleButton
                                                    type="radio"
                                                    variant="outline-primary"
                                                    name={`downloadMethod-${dataset.name}`}
                                                    value="direct"
                                                    checked={dataset.download === "direct"}
                                                    onClick={() =>
                                                        setDatasets((prevMethods) => {
                                                            const newDatasets = [...prevMethods];
                                                            newDatasets[dataset.name] = {
                                                                ...newDatasets[dataset.name],
                                                                download: "direct"
                                                            };
                                                            return newDatasets;
                                                        })
                                                    }
                                                >
                                                    Download Directly
                                                </ToggleButton>
                                                <ToggleButton
                                                    type="radio"
                                                    variant="outline-primary"
                                                    name={`downloadMethod-${dataset.name}`}
                                                    value="curl"
                                                    checked={dataset.download === "curl"}
                                                    onClick={() =>
                                                        setDatasets((prevMethods) => {
                                                            const newDatasets = [...prevMethods];
                                                            newDatasets[dataset.name] = {
                                                                ...newDatasets[dataset.name],
                                                                download: "curl"
                                                            };
                                                            return newDatasets;
                                                        })
                                                    }
                                                >
                                                    Download via Curl
                                                </ToggleButton>
                                            </ButtonGroup>
                                        </Form.Group>
                                        <div style={{ paddingTop: "10px" }}>
                                            {dataset.download === "curl" ? (
                                                <div>
                                                    <div style={styles.codeBlock}>
                                                        <code>{handleDownloadCurl(dataset)}</code>
                                                        <div
                                                            style={styles.copyButton}
                                                            onClick={() => handleCopyToClipboard(dataset)}
                                                        >
                                                            <span role="img" aria-label="Copy">
                                                                📋
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ width: "100%" }}>
                                                    <Button
                                                        variant="primary"
                                                        onClick={() =>
                                                            handleDirectDownload(
                                                                dataset.name.replace(" ", "")
                                                            )
                                                        }
                                                        style={{ width: "100%" }}
                                                        disabled={loading}
                                                    >
                                                        {loading ? "Downloading..." : "Download Directly"}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h5 style={{ paddingTop: "10px" }}>Download</h5>
                                        <div>
                                            {" "}
                                            <Link to="/login?to=download">Login</Link> or{" "}
                                            <Link to="/signup?to=download">Sign Up</Link> to Download{" "}
                                        </div>
                                    </>
                                )}
                                <h5 style={{ paddingTop: "10px" }}>Getting Started</h5>
                                <div>
                                    {" "}
                                    <Link to={`/docs/${dataset.model}`}>Read the Docs</Link> to learn how to use this
                                    model!
                                </div>

                            </Card.Body>
                        </Card>
                    ))}
                </Form.Group>
            </div>
            {showCopyAlert && (
                <Alert variant="success" style={styles.alertContainer} dismissible>
                    Curl command copied to clipboard
                </Alert>
            )}
        </div>
    );
}
