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

export default function EmbeddedDownload() {
  const { currentUser } = useAuth();

  const [datasets, setDatasets] = useState([
    { name: "YOLOv8", dataset: "FRC 2024", model: "YOLOv8n", variants: ["YOLOv8n", "YOLOv8s"], classes: ["note", "robot"], download: "direct" },
    { name: "YOLOv6", dataset: "FRC 2024", model: "YOLOv6n", variants: ["YOLOv6n", "YOLOv6s"], classes: ["note", "robot"], download: "direct" },
    { name: "YOLOv5", dataset: "FRC 2024", model: "YOLOv5n", variants: ["YOLOv5n", "YOLOv5s"], classes: ["note", "robot"], download: "direct" },
    { name: "SSD Mobilenet v2", dataset: "FRC 2024", model: "ssdmobilenet", downloadType: "TFLite", downloadTypes: ["TFLite", "Tensorflow"], classes: ["note", "robot"], download: "direct" },
    { name: "EfficientDet", dataset: "FRC 2024", model: "efficientdet", downloadType: "TFLite", downloadTypes: ["TFLite", "Tensorflow"], classes: ["note", "robot"], download: "direct" },
  ]);

  const [dataset, setDataset] = useState(null);

  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("dataset") != null) {
      setDataset(datasets.find((item) => item.name === searchParams.get("dataset")));
    }
    if (searchParams.get("model") != null) {
      setDataset((prevDataset) => ({ ...prevDataset, model: searchParams.get("model") }));
    }
  }, [location.search]);

  const [classes, setClasses] = useState(["note", "robot"]);

  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("API_KEY");

  const handleDownloadCurl = (dataset) => {
    if (dataset.downloadType === undefined || dataset.downloadType === "") {
      return `curl -o ${dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')}.pt 'https://api.datasetcolab.com/model/download/${dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')}?api=${apiKey}'`;
    } else {
      return `curl -o ${dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')}.zip 'https://api.datasetcolab.com/model/download/${dataset.model + dataset.classes.map(item => item.slice(0, 2).toUpperCase()).join('')}?api=${apiKey}&downloadType=${dataset.downloadType === "Tensorflow" ? "TF" : "TFLite"}'`;
    }
  };

  const fetchApiKey = async () => {
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
  };

  const handleCopyToClipboard = (dataset) => {
    const curlCommand = handleDownloadCurl(dataset);
    navigator.clipboard.writeText(curlCommand);
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
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClasses = (opt) => {
    setDataset((prevDataset) => {
      const newDataset = { ...prevDataset };
      const newClasses = newDataset.classes.includes(opt)
        ? newDataset.classes.filter((item) => item !== opt)
        : [...newDataset.classes, opt];
      newDataset.classes = newClasses.sort();
      return newDataset;
    });
  }

  useEffect(() => {
    fetchApiKey();
  }, []);

  function DownloadButton(props) {
    const dataset = props.dataset;
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
    <Form.Group style={{ maxWidth: "500px" }}>
      {dataset && (
        <>
          <h5>Dataset Classes</h5>
          <div style={styles.checkboxGroup}>
            {classes.map((opt, i) => (
              <Form.Check
                key={i}
                type="checkbox"
                id={`checkbox-${opt}-${i}`}
                label={opt}
                defaultChecked={dataset.classes?.includes(opt)}
                onChange={() => handleClasses(opt)}
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
                          setDataset((prevDataset) => {
                            const newDataset = { ...prevDataset };
                            newDataset.download = "direct";
                            return newDataset;
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
                          setDataset((prevDataset) => {
                            const newDataset = { ...prevDataset };
                            newDataset.download = "curl";
                            return newDataset;
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
                      <div style={{ width: "317px" }}>
                        <DownloadButton dataset={dataset} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h5 style={{ paddingTop: "10px" }}>Download</h5>
                  <div>Login or Sign Up to Download
                  </div>
                </>
              )}
            </>
          )}</>
      )}
    </Form.Group>
  );
}
