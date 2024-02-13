import React, { useState, useEffect } from "react";
import {
    Card,
    Form,
    Button,
    ButtonGroup,
    ToggleButton,
    Alert,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { analytics } from "../firebase";
import { logEvent } from "firebase/analytics";

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
        { name: "YOLOv6", dataset: "FRC 2024", model: "YOLOv6n", variants: ["YOLOv6n", "YOLOv6s"], classes: ["note", "robot"], download: "direct" },
        { name: "YOLOv5", dataset: "FRC 2024", model: "YOLOv5n", variants: ["YOLOv5n", "YOLOv5s"], classes: ["note", "robot"], download: "direct" },
        { name: "SSD Mobilenet v2", dataset: "FRC 2024", model: "ssdmobilenet", downloadType: "TFLite", downloadTypes: ["TFLite", "Tensorflow"], classes: ["note", "robot"], download: "direct" },
        { name: "EfficientDet", dataset: "FRC 2024", model: "efficientdet", downloadType: "TFLite", downloadTypes: ["TFLite", "Tensorflow"], classes: ["note", "robot"], download: "direct" },
    ]);

    const [classes, setClasses] = useState(["note", "robot"]);

    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState("API_KEY");

    const [performance, setPerformance] = useState({
        "YOLOv8n": {},
        "YOLOv8s": {},
        "YOLOv6n": {},
        "YOLOv6s": {},
        "YOLOv5n": {},
        "YOLOv5s": {},
    });

    const handleDownloadCurl = (dataset) => {
        if (dataset.downloadType === undefined || dataset.downloadType === "") {
            return `curl -o ${dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')}.pt 'https://api.datasetcolab.com/model/download/${dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')}?api=${apiKey}'`;
        } else {
            return `curl -o ${dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')}.zip 'https://api.datasetcolab.com/model/download/${dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')}?api=${apiKey}&downloadType=${dataset.downloadType === "Tensorflow" ? "TF" : "TFLite"}'`;
        }
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

                logEvent(analytics, 'api');
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

    const handleDirectDownload = async (model, downloadType) => {
        try {
            setLoading(true);

            const idToken = await currentUser.getIdToken();

            if (downloadType === "") {
                window.location.href = "https://api.datasetcolab.com/model/download/" + model + "?idToken=" + idToken;
            } else {
                window.location.href = "https://api.datasetcolab.com/model/download/" + model + "?idToken=" + idToken + "&downloadType=" + downloadType;
            }

            logEvent(analytics, 'model/download');
        } catch (err) {
            setError("Error downloading model.");
        } finally {
            setLoading(false);
        }
    };

    const handlePerformance = async () => {
        try {
            const newPerformance = {};

            for (const variant of ["YOLOv8n", "YOLOv6n", "YOLOv5n", "YOLOv8s", "YOLOv6s", "YOLOv5s"]) {
                for (const class_ of ["NO", "RO", "NORO"]) {
                    newPerformance[variant + class_] = (await axios.get("https://api.datasetcolab.com/model/performance/" + variant + class_)).data;
                }
            }

            for (const tfmodel of ["ssdmobilenet", "efficientdet"]) {
                for (const class_ of ["NO", "RO", "NORO"]) {
                    newPerformance[tfmodel + class_] = (await axios.get("https://api.datasetcolab.com/model/performance/" + tfmodel + class_)).data;
                }
            }

            setPerformance(newPerformance);

            logEvent(analytics, 'model/performance');
        } catch (err) {
            setError("Error loading performance data.");
        }
    }

    const handleClasses = (opt, index) => {
        setDatasets((prevDatasets) => {
            const newDatasets = [...prevDatasets];
            const newClasses = newDatasets[index].classes.includes(opt)
                ? newDatasets[index].classes.filter((item) => item !== opt)
                : [...newDatasets[index].classes, opt];
            newDatasets[index] = { ...newDatasets[index], classes: newClasses.sort() };
            return newDatasets;
        });
    }

    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get("model") != null) {
            setDatasets((prevDatasets) => {
                const newDatasets = [...prevDatasets];
                const dataset = datasets.find((item) => item.variants.includes(searchParams.get("model")));
                const index = datasets.indexOf(dataset);
                newDatasets[index] = { ...newDatasets[index], model: searchParams.get("model") };
                return newDatasets;
            });
                
        }
    }, [location.search]);

    useEffect(() => {
        handlePerformance();
        fetchApiKey();
    }, []);

    function PerformanceTable(props) {
        const dataset = datasets[props.index];
        if (performance[dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')]) {
            const mAP50 = performance[dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')]["metrics/mAP50(B)"];
            const mAP50_95 = performance[dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')]["metrics/mAP50-95(B)"];
            const precision = performance[dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')]["metrics/precision(B)"];
            const recall = performance[dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')]["metrics/recall(B)"];

            return (
                <>
                    <div className="row">
                        {mAP50 !== undefined && (
                            <div className="col">
                                <strong>mAP50:</strong> {(mAP50 * 100).toFixed(2)}%
                            </div>
                        )}
                        {mAP50_95 !== undefined && (
                            <div className="col">
                                <strong>mAP50-95:</strong> {(mAP50_95 * 100).toFixed(2)}%
                            </div>
                        )}
                    </div>
                    <div className="row">
                        {precision !== undefined && (
                            <div className="col">
                                <strong>Precision:</strong> {(precision * 100).toFixed(2)}%
                            </div>
                        )}
                        {recall !== undefined && (
                            <div className="col">
                                <strong>Recall:</strong> {(recall * 100).toFixed(2)}%
                            </div>
                        )}
                    </div>
                </>
            );

        }
    }

    function ImageGrid(props) {
        const dataset = datasets[props.index];
        const url = dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('');
        return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}>
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/0"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/1"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/2"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/3"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/4"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/5"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/6"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/7"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/8"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/9"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/10"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/11"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/12"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/13"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/14"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/15"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/16"} style={{ width: "100%", margin: "0", padding: "0" }} />
                <img src={"https://api.datasetcolab.com/model/inference/" + url + "/17"} style={{ width: "100%", margin: "0", padding: "0" }} />
              </div>
        );
    }

    function DownloadButton(props) {
        const dataset = datasets[props.index];
        let text = dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('');
        let downloadType = "";
        let fileType = "";
        if (dataset.model === "efficientdet" || dataset.model === "ssdmobilenet") {
            downloadType = dataset.downloadType === "Tensorflow" ? "TF" : "TFLite";
            fileType = ".zip";
        } else {
            fileType = ".pt";
        }


        return (
            <Button
                variant="primary"
                onClick={() => handleDirectDownload(text, downloadType)}
                style={{ width: "100%" }}
                disabled={loading}
            >
                {loading ? "Downloading..." : "Download " + text + downloadType + fileType}
            </Button>
        );
    }

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
                                {dataset.variants ? dataset.variants.map((variant) => (
                                    <div id={variant}></div>
                                )) : <div id={dataset.model}></div>}
                                <h3 id={dataset.model}>{dataset.name}</h3>
                                <div className="row">
                                    <div className="col-md-4">
                                        <h5 style={{ paddingTop: "10px" }}>Dataset Classes</h5>
                                        <div style={styles.checkboxGroup}>
                                            {classes.map((opt, i) => (
                                                <Form.Check
                                                    key={i}
                                                    type="checkbox"
                                                    id={`checkbox-${opt}-${i}`}
                                                    label={opt}
                                                    defaultChecked={dataset.classes?.includes(opt)}
                                                    onChange={() => handleClasses(opt, index)}
                                                />
                                            ))}
                                        </div>
                                        {dataset.classes.length == 0 && (
                                            <Alert variant="danger" style={{ marginTop: "10px" }}>
                                                Please select at least one class
                                            </Alert>
                                        )}
                                        {dataset.classes.length > 0 && (
                                            <>
                                                {dataset.variants && (
                                                    <>
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
                                                                                return newDatasets;
                                                                            })
                                                                        }
                                                                    >
                                                                        {variant}
                                                                    </ToggleButton>
                                                                ))}
                                                            </ButtonGroup>
                                                        </Form.Group></>
                                                )}
                                                <h5 style={{ paddingTop: "10px" }}>Performance</h5>
                                                <PerformanceTable index={index} />
                                                {currentUser && currentUser.emailVerified ? (
                                                    <>
                                                        <h5 style={{ paddingTop: "10px" }}>Download Weights</h5>
                                                        <Form.Group>
                                                            <ButtonGroup toggle>
                                                                <ToggleButton
                                                                    type="radio"
                                                                    variant="outline-primary"
                                                                    name={`downloadMethod-${dataset.model}`}
                                                                    value="direct"
                                                                    checked={dataset.download === "direct"}
                                                                    onClick={() =>
                                                                        setDatasets((prevMethods) => {
                                                                            const newDatasets = [...prevMethods];
                                                                            newDatasets[index] = {
                                                                                ...newDatasets[index],
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
                                                                    name={`downloadMethod-${dataset.model}`}
                                                                    value="curl"
                                                                    checked={dataset.download === "curl"}
                                                                    onClick={() =>
                                                                        setDatasets((prevDatasets) => {
                                                                            const newDatasets = [...prevDatasets];
                                                                            newDatasets[index] = {
                                                                                ...newDatasets[index],
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

                                                        {dataset.downloadTypes && (
                                                            <Form.Group style={{ paddingTop: "10px" }}>
                                                                <ButtonGroup toggle>
                                                                    {dataset.downloadTypes.map((download, downloadIndex) => (
                                                                        <ToggleButton
                                                                            key={downloadIndex}
                                                                            type="radio"
                                                                            variant="outline-primary"
                                                                            name={`modelVariant-${dataset.model + download}`}
                                                                            value={download}
                                                                            checked={dataset.downloadType === download}
                                                                            onClick={() =>
                                                                                setDatasets((prevDatasets) => {
                                                                                    const newDatasets = [...prevDatasets];
                                                                                    newDatasets[index] = {
                                                                                        ...newDatasets[index],
                                                                                        downloadType: download
                                                                                    };
                                                                                    return newDatasets;
                                                                                })
                                                                            }
                                                                        >
                                                                            {download}
                                                                        </ToggleButton>
                                                                    ))}
                                                                </ButtonGroup>
                                                            </Form.Group>
                                                        )}
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
                                                                    <DownloadButton index={index} />
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
                                                <h5 style={{ paddingTop: "10px" }}>Getting Started</h5><div>
                                                    <Link to={`/docs/${dataset.model}`}>Read the Docs</Link> to learn how to use this
                                                    model!
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="col-md-8">
                                        {dataset.classes.length > 0 && (
                                            <>
                                                <h5 style={{ paddingTop: "10px" }}>Sample Inferences</h5>
                                                <ImageGrid index={index} />
                                            </>
                                        )}
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
