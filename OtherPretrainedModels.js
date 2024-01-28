import React, { useState, useEffect, useRef } from "react";
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

/*
const CropImage = ({ src, startX, endX, startY, endY }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const image = new Image();
        image.src = src;
        image.onload = () => {
            const width = image.width * (endX - startX) / 100;
            const height = image.height * (endY - startY) / 100;
            const startXPixel = image.width * startX / 100;
            const startYPixel = image.height * startY / 100;

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(
                image,
                startXPixel,
                startYPixel,
                width,
                height,
                0,
                0,
                width,
                height
            );
        };
    }, [src, startX, endX, startY, endY]);

    return (
        <canvas ref={canvasRef} />
    );
};
*/

export default function PretrainedModels() {
    const { currentUser } = useAuth();

    const [error, setError] = useState("");
    const [showCopyAlert, setShowCopyAlert] = useState(false);

    const [datasets, setDatasets] = useState([
        { name: "YOLOv8", dataset: "FRC 2024", model: "YOLOv8n", variants: ["YOLOv8n", "YOLOv8s"], classes: ["note", "robot"], download: "direct" },
        { name: "YOLOv5", dataset: "FRC 2024", model: "YOLOv5n", variants: ["YOLOv5n", "YOLOv5s"], classes: ["note", "robot"], download: "direct" },
    ]);

    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState("API_KEY");
    const [data, setData] = useState(null);

    const [inferenceImage, setInferenceImage] = useState({
        "YOLOv8n": "",
        "YOLOv8s": "",
        "YOLOv5n": "",
        "YOLOv5s": "",
    });

    const navigate = useNavigate();

    const handleDownloadCurl = (dataset) => {
        return "(placeholder)";
    };

    const handleCopyToClipboard = (dataset) => {
        const curlCommand = handleDownloadCurl(dataset);
        navigator.clipboard.writeText(curlCommand);
        setShowCopyAlert(true);
    };

    const handleDirectDownload = async (model) => {
        try {
            setLoading(true);

            const idToken = await currentUser.getIdToken();

            window.location.href = "https://api.datasetcolab.com/model/download/" + model + "?idToken=" + idToken;
        } catch (err) {
            setError("Error downloading dataset.");
            console.log(err);
        } finally {
            setLoading(false);
        }
    };


    const handleInferenceImage = async () => {
        try {
            const idToken = await currentUser.getIdToken();
            const inferenceImages = {};

            for (const variant of ["YOLOv8n", "YOLOv8s", "YOLOv5n", "YOLOv5s"]) {
                inferenceImages[variant] = ["https://api.datasetcolab.com/model/inference/" + variant + "/0?idToken=" + idToken,
                "https://api.datasetcolab.com/model/inference/" + variant + "/1?idToken=" + idToken,
                "https://api.datasetcolab.com/model/inference/" + variant + "/2?idToken=" + idToken];
            }

            setInferenceImage(inferenceImages);
        } catch (err) {
            setError("Error downloading dataset.");
            console.log(err);
        }
    };


    useEffect(() => {
        handleInferenceImage();
    }, []);

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
                                <h3>{dataset.name}</h3>

                                <div className="row">
                                    <div className="col-md-4">

                                        <small>
                                            <strong>Dataset:</strong> {dataset.dataset} &nbsp;&nbsp;&nbsp;
                                            <strong>Classes:</strong> {dataset.classes.join(", ")}
                                        </small>
                                        <h5 style={{ paddingTop: "10px" }}>Model Variant</h5>
                                        <Form.Group>
                                            <ButtonGroup toggle>
                                                {dataset.variants.map((variant, variantIndex) => (
                                                    <ToggleButton
                                                        key={variantIndex}
                                                        type="radio"
                                                        variant="outline-primary"
                                                        name={`modelVariant-${variant}`}
                                                        value={variant}
                                                        checked={dataset.model === variant}
                                                        onClick={() =>
                                                            setDatasets((prevDatasets) => {
                                                                const newDatasets = [...prevDatasets];
                                                                newDatasets[index] = {
                                                                    ...newDatasets[index],
                                                                    model: variant
                                                                };
                                                                console.log(newDatasets);
                                                                return newDatasets;
                                                            })
                                                        }
                                                    >
                                                        {variant}
                                                    </ToggleButton>
                                                ))}
                                            </ButtonGroup>
                                        </Form.Group>
                                        <h5 style={{ paddingTop: "10px" }}>Preformance</h5>

                                        {currentUser && currentUser.emailVerified ? (
                                            <>
                                                <h5 style={{ paddingTop: "10px" }}>Download Weights</h5>
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
                                                                    newDatasets[index] = {
                                                                        ...newDatasets[index],
                                                                        download: "direct"
                                                                    };
                                                                    console.log(newDatasets);
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
                                                                setDatasets((prevDatasets) => {
                                                                    const newDatasets = [...prevDatasets];
                                                                    newDatasets[index] = {
                                                                        ...newDatasets[index],
                                                                        download: "curl"
                                                                    };
                                                                    console.log(newDatasets);
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
                                                                        dataset.model
                                                                    )
                                                                }
                                                                style={{ width: "100%" }}
                                                                disabled={loading}
                                                            >
                                                                {loading ? "Downloading..." : "Download " + dataset.model + ".pt"}
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
                                                    <Link to="/login?to=models">Login</Link> or{" "}
                                                    <Link to="/signup?to=models">Sign Up</Link> to Download{" "}
                                                </div>
                                            </>
                                        )}
                                        <h5 style={{ paddingTop: "10px" }}>Getting Started</h5>
                                        <div>
                                            {" "}
                                            <Link to={`/docs/${dataset.model}`}>Read the Docs</Link> to learn how to use this
                                            model!
                                        </div>
                                    </div>
                                    <div croppedImagesName="col-md-8">
                                        <h5 style={{ paddingTop: "10px" }}>Sample Inference</h5>
                                        <img src={inferenceImage[dataset.model][0]} width="50%" />
                                        <img src={inferenceImage[dataset.model][1]} width="50%" />
                                       {/* <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gridGap: "10px", width: "100%" }}>
                                            {Array.from({ length: 15 }).map((_, index) => {
                                                const startX = Math.floor(Math.random() * 4) * 25;
                                                const endX = startX + 25;
                                                const startY = Math.floor(Math.random() * 4) * 25;
                                                const endY = startY + 25;

                                                return (
                                                    <div width="20%">
                                                        <CropImage
                                                            key={index}
                                                            src={inferenceImage[dataset.model][0]}
                                                            startX={startX}
                                                            endX={endX}
                                                            startY={startY}
                                                            endY={endY}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>*/}
                                    </div>
                                </div>

                            </Card.Body>
                        </Card>
                    ))}
                </Form.Group>
                <p>To request other models, please contact Arjun Goray (<a href="mailto:arjun@datasetcolab.com">arjun@datasetcolab.com</a>) and/or Sean Mabli (<a href="mailto:sean@datasetcolab.com">sean@datasetcolab.com</a>).</p>
            </div>
            {showCopyAlert && (
                <Alert variant="success" style={styles.alertContainer} dismissible>
                    Curl command copied to clipboard
                </Alert>
            )}
        </div>
    );
}
