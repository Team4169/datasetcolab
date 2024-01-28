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

export default function DownloadDataset() {
  const { currentUser } = useAuth();

  const [error, setError] = useState("");
  const [selectedOptions, setSelectedOptions] = useState({
    "FRC 2023": ["cone", "cube"],
    "FRC 2024": ["note"],
  });
  const [selectedDatasetType, setSelectedDatasetType] = useState({
    ["FRC 2023"]: "COCO",
    ["FRC 2024"]: "COCO",
  });
  const [downloadMethod, setDownloadMethod] = useState({
    ["FRC 2023"]: "direct",
    ["FRC 2024"]: "direct",
  });
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const [datasets, setDatasets] = useState([
    { name: "FRC 2024", images: 0, annotations: 0, size: 0 },
    { name: "FRC 2023", images: 0, annotations: 0, size: 0 },
  ]);

  const [classes, setClasses] = useState({
    "FRC 2023": ["cone", "cube"],
    "FRC 2024": ["note", "robot"],
  });

  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("API_KEY");
  const [data, setData] = useState(null);

  const navigate = useNavigate();

  const handleDownloadCurl = (dataset) => {
    const name = dataset.name.replace(" ", "");
    const selectedOptionsAbbreviated = selectedOptions[dataset.name].map(option => option.slice(0, 2));
    const classesParam = selectedOptionsAbbreviated.length > 0 ? `&classes=${selectedOptionsAbbreviated.join("").toUpperCase()}` : "&classes=NULL";
    return `curl -o ${name}.zip 'https://api.datasetcolab.com/dataset/download/${name}?api=${apiKey}&datasetType=${selectedDatasetType[dataset.name]
      }${classesParam}'`;
  };

  const handleOptionSelect = (dataset, option) => {
    setSelectedOptions((prevOptions) => {
      const selectedOptionsCopy = { ...prevOptions };
      const index = selectedOptionsCopy[dataset]?.indexOf(option);
      if (index !== -1) {
        // Remove option if already selected
        selectedOptionsCopy[dataset] = selectedOptionsCopy[dataset].filter(
          (item) => item !== option
        );
      } else {
        // Add option if not selected
        selectedOptionsCopy[dataset] = [
          ...(selectedOptionsCopy[dataset] || []),
          option,
        ].sort();
      }

      return selectedOptionsCopy;
    });
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

      const selectedOptionsAbbreviated = selectedOptions[dataset.slice(0, 3) + " " + dataset.slice(3)].map(option => option.slice(0, 2));
      const classesParam = selectedOptionsAbbreviated.length > 0 ? `&classes=${selectedOptionsAbbreviated.join("").toUpperCase()}` : "&classes=NULL";

      console.log("https://api.datasetcolab.com/dataset/download/" +
        dataset +
        "?idToken=" +
        idToken +
        "&datasetType=" +
        selectedDatasetType[dataset.slice(0, 3) + " " + dataset.slice(3)] +
        classesParam);

      window.location.href =
        "https://api.datasetcolab.com/dataset/download/" +
        dataset +
        "?idToken=" +
        idToken +
        "&datasetType=" +
        selectedDatasetType[dataset.slice(0, 3) + " " + dataset.slice(3)] +
        classesParam;
    } catch (err) {
      setError("Error downloading dataset.");
      console.log(err);
    } finally {
      setLoading(false);
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
      }
    } catch (err) {
      setError("Error fetching API key.");
    }
  };


  const fetchProjectDetailsForMultipleFolders = async (folderNames) => {
    try {
      for (const folderName of folderNames) {
        let idToken = "";
        if (currentUser) {
          idToken = await currentUser.getIdToken();
        }

        const splitFolderName = folderName.substring(0, 3) + " " + folderName.substring(3);
        const selectedOptionsAbbreviated = selectedOptions[splitFolderName].map(option => option.slice(0, 2));
        const classesParam = selectedOptionsAbbreviated.length > 0 ? selectedOptionsAbbreviated.join("").toUpperCase() : "NULL";

        const config = { headers: { idToken: idToken } };
        console.log(config);
        const response = await axios.get(
          `https://api.datasetcolab.com/dataset/metadata/${folderName}${selectedDatasetType[splitFolderName]
          }${classesParam}`,
          config
        );

        console.log(response.data);
        console.log(response.data.totalImageCount);

        setDatasets((prevDatasets) => {
          const newDatasets = [...prevDatasets];
          const index = newDatasets.findIndex(
            (dataset) => dataset.name === splitFolderName
          );
          newDatasets[index] = {
            name: folderName.substring(0, 3) + " " + folderName.substring(3),
            images: response.data.totalImageCount,
            annotations: response.data.totalAnnotationCount,
            zipSize: response.data.zipSize,
          };
          return newDatasets;
        });
      }
    } catch (err) {
      setError("Error fetching project details.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKey();
    fetchProjectDetailsForMultipleFolders(["FRC2024", "FRC2023"]); // 
    const alertTimeout = setTimeout(() => setShowCopyAlert(false), 5000);
    return () => clearTimeout(alertTimeout);
  }, [showCopyAlert, selectedOptions, selectedDatasetType]);

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
        <h2>Download Dataset</h2>
        <Form.Group>
          {datasets.map((dataset, index) => (
            <Card key={index} style={styles.datasetCard}>
              <Card.Body>
                <h3>{dataset.name}</h3>
                <small>
                  <strong>Images:</strong> {dataset.images.toLocaleString()} &nbsp;&nbsp;&nbsp;
                  <strong>Annotations:</strong> {dataset.annotations.toLocaleString()} &nbsp;&nbsp;&nbsp;
                  <strong>Size:</strong> {(dataset.zipSize / (1024 * 1024 * 1024)).toFixed(2)} GB
                </small>
                <h5 style={{ paddingTop: "10px" }}>Dataset Classes</h5>
                <div style={styles.checkboxGroup}>
                  {classes[dataset.name].map((opt, i) => (
                    <Form.Check
                      key={i}
                      type="checkbox"
                      id={`checkbox-${dataset.name}-${i}`}
                      label={opt}
                      defaultChecked={selectedOptions[dataset.name]?.includes(opt)}
                      onChange={() => handleOptionSelect(dataset.name, opt)}
                    />
                  ))}
                </div>
                <h5 style={{ paddingTop: "10px" }}>Dataset Type</h5>
                <Form.Group>
                  <ButtonGroup toggle>
                    <ToggleButton
                      type="radio"
                      variant="outline-primary"
                      name={`datasetTpe-${dataset.name}`}
                      value="COCO"
                      checked={selectedDatasetType[dataset.name] === "COCO"}
                      onClick={() =>
                        setSelectedDatasetType((prevTypes) => ({
                          ...prevTypes,
                          [dataset.name]: "COCO",
                        }))
                      }
                    >
                      COCO
                    </ToggleButton>
                    <ToggleButton
                      type="radio"
                      variant="outline-primary"
                      name={`datasetTpe-${dataset.name}`}
                      value="YOLO"
                      checked={selectedDatasetType[dataset.name] === "YOLO"}
                      onClick={() =>
                        setSelectedDatasetType((prevTypes) => ({
                          ...prevTypes,
                          [dataset.name]: "YOLO",
                        }))
                      }
                    >
                      YOLO
                    </ToggleButton>
                    <ToggleButton
                      type="radio"
                      variant="outline-primary"
                      name={`datasetTpe-${dataset.name}`}
                      value="TFRecord"
                      checked={selectedDatasetType[dataset.name] === "TFRecord"}
                      onClick={() =>
                        setSelectedDatasetType((prevTypes) => ({
                          ...prevTypes,
                          [dataset.name]: "TFRecord",
                        }))
                      }
                    >
                      TFRecord
                    </ToggleButton>
                  </ButtonGroup>
                </Form.Group>
                {console.log(dataset.name.replace(" ", "") + selectedDatasetType[dataset.name] + selectedOptions[dataset.name].map(option => option.slice(0, 2)).join("").toUpperCase())}
                <Button
                  variant="primary"
                  className="position-absolute top-0 end-0 m-3"
                  onClick={() => navigate(`/view/${dataset.name.replace(" ", "") + "COCO" + (dataset.name === "FRC 2024" ? "NO" : "COCU")}`)}
                >
                  View
                </Button>
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
                          checked={downloadMethod[dataset.name] === "direct"}
                          onClick={() =>
                            setDownloadMethod((prevMethods) => ({ ...prevMethods, [dataset.name]: "direct" }))
                          }
                        >
                          Download Directly
                        </ToggleButton>
                        <ToggleButton
                          type="radio"
                          variant="outline-primary"
                          name={`downloadMethod-${dataset.name}`}
                          value="curl"
                          checked={downloadMethod[dataset.name] === "curl"}
                          onClick={() =>
                            setDownloadMethod((prevMethods) => ({ ...prevMethods, [dataset.name]: "curl" }))
                          }
                        >
                          Download via Curl
                        </ToggleButton>
                      </ButtonGroup>
                    </Form.Group>
                    <div style={{ paddingTop: "10px" }}>
                      {downloadMethod[dataset.name] === "curl" ? (
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
                            {loading ? "Downloading..." : "Download " + dataset.name.replace(" ", "") + ".zip"}
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
