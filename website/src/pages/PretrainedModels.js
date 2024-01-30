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
import { Link } from "react-router-dom";
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

    const [performance, setPerformance] = useState({
        "YOLOv8n": {},
        "YOLOv8s": {},
        "YOLOv5n": {},
        "YOLOv5s": {},
    });


    const handleDownloadCurl = (dataset) => {
        return `curl -o ${dataset.model}.pt 'https://api.datasetcolab.com/model/download/${dataset.model}?api=${apiKey}'`;
    };

    const fetchApiKey = async () => {
        try {
          if (currentUser) {
            const idToken = await currentUser.getIdToken();
    
            let config = {
              headers: {
                idToken: idToken,
              },
            };
    
            const response = await axios.get(
              "https://api.datasetcolab.com/api",
              config
            );
            setApiKey(response.data);
          }
        } catch (err) {
          setError("Error fetching API key.");
        }
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
            setError("Error downloading model.");
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePerformance = async () => {
        try {
            const newPerformance = {};

            for (const variant of ["YOLOv8n", "YOLOv5n", "YOLOv8s", "YOLOv5s"]) {
                newPerformance[variant] = (await axios.get("https://api.datasetcolab.com/model/performance/" + variant)).data;
            }

            setPerformance(newPerformance);

        } catch (err) {
            setError("Error loading performance data.");
            console.log(err);
        }
    }


    useEffect(() => {
        handlePerformance();
        fetchApiKey();
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
                                        <h5 style={{ paddingTop: "10px" }}>Performance</h5>
                                        {performance[dataset.model] && (
                                            <div>
                                                <div>
                                                    <strong>mAP50:</strong> {(performance[dataset.model]["metrics/mAP50(B)"] * 100).toFixed(2)}%
                                                </div>
                                                <div>
                                                    <strong>mAP50-95:</strong> {(performance[dataset.model]["metrics/mAP50-95(B)"] * 100).toFixed(2)}%
                                                </div>
                                                <div>
                                                    <strong>Precision:</strong> {(performance[dataset.model]["metrics/precision(B)"] * 100).toFixed(2)}%
                                                </div>
                                                <div>
                                                    <strong>Recall:</strong> {(performance[dataset.model]["metrics/recall(B)"] * 100).toFixed(2)}%
                                                </div>
                                            </div>
                                        )}

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
                                    <div className="col-md-8">
                                        <h5 style={{ paddingTop: "10px" }}>Sample Inferences</h5>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)"}}>
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/0"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/1"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/4"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/6"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/7"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/9"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/10"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/12"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/15"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/18"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/19"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/21"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/27"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/42"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                            <img src={"https://api.datasetcolab.com/model/inference/" + dataset.model + "/47"} style={{ width: "100%", margin: "0", padding: "0" }} />
                                        </div>
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
