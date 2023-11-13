import React, { useState, useEffect } from "react";
import Alert from "react-bootstrap/Alert";
import {
  Card,
  Dropdown,
  Form,
  Button,
  ButtonGroup,
  ToggleButton,
} from "react-bootstrap";

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
  const [error, setError] = useState("");
  const [selectedOptions, setSelectedOptions] = useState({
    'FRC 2023': ['Cone', 'Cube', 'Robot', 'Other Robots'],
    'FRC 2024': ['Cone', 'Cube', 'Robot', 'Other Robots'],
  });
  
  const [selectedDatasetType, setSelectedDatasetType] = useState({[ 'FRC 2023' ]: "COCO", [ 'FRC 2024' ]: "COCO"});
  const [downloadMethod, setDownloadMethod] = useState({[ 'FRC 2023' ]: "direct", [ 'FRC 2024' ]: "direct"});
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  
  const datasets = [
    { name: "FRC 2024", images: 1200, annotations: 600, size: "1.8GB" },
    { name: "FRC 2023", images: 1000, annotations: 500, size: "1.5GB" },
  ];
  const classes = ["Cone", "Cube", "Robot", "Other Robots"];

  const handleDownloadCurl = () =>
    `curl -O https://api.seanmabli.com:3443/download`;

  const handleDownloadMethodChange = (dataset, value) => {
    console.log("fd");
    setDownloadMethod((prevMethods) => ({ ...prevMethods, [dataset]: value }));
  }

  const handleOptionSelect = (dataset, option) => {
    setSelectedOptions((prevOptions) => {
      const selectedOptionsCopy = { ...prevOptions };
      const index = selectedOptionsCopy[dataset]?.indexOf(option);
      if (index !== -1) {
        selectedOptionsCopy[dataset].splice(index, 1);
      } else {
        selectedOptionsCopy[dataset] = [...(selectedOptionsCopy[dataset] || []), option];
      }
  
      return selectedOptionsCopy;
    });
  };

  const handleCopyToClipboard = () => {
    console.log("adfds");
    const curlCommand = handleDownloadCurl();
    navigator.clipboard.writeText(curlCommand);
    setShowCopyAlert(true);
  };

  const handleDirectDownload = (dataset) =>
    console.log(`Direct download logic for ${dataset} here`);

  useEffect(() => {
    const alertTimeout = setTimeout(() => setShowCopyAlert(false), 5000);
    return () => clearTimeout(alertTimeout);
  }, [showCopyAlert]);


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
                <small>Images: {dataset.images}</small>
                <br/>
                <small>Annotations: {dataset.annotations}</small>
                <br/>
                <small>Size: {dataset.size}</small>
                  <h5 style={{paddingTop: "10px"}}>Dataset Classes</h5>
                  <div style={styles.checkboxGroup}>
                    {classes.map((opt, i) => (
                      <Form.Check
                        key={i}
                        type="checkbox"
                        label={opt}
                        onChange={() => handleOptionSelect(dataset.name, opt)}
                        checked={
                          selectedOptions[dataset.name]?.includes(opt) || false
                        }
                      />
                    ))}
                  </div>
                  <h5 style={{paddingTop: "10px"}}>Dataset Type</h5>
                  <Dropdown
                    onSelect={(type) =>
                      setSelectedDatasetType((prevTypes) => ({
                        ...prevTypes,
                        [dataset.name]: type,
                      }))
                    }
                  >
                    <Dropdown.Toggle variant="blue" id="dropdown-basic">
                      {selectedDatasetType[dataset.name] || "Select Type"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item eventKey="COCO">COCO</Dropdown.Item>
                      <Dropdown.Item eventKey="YOLOv5 Pytorch">
                        YOLOv5 Pytorch
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  <h5 style={{paddingTop: "10px"}}>Download Method</h5>
                  <Form.Group>
                    <ButtonGroup toggle>
                      <ToggleButton
                        type="radio"
                        variant="outline-primary"
                        name={`downloadMethod-${dataset.name}`}
                        value="direct"
                        checked={downloadMethod[dataset.name] === "direct"}
                        onClick={() =>
                          handleDownloadMethodChange(dataset.name, "direct")
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
                          handleDownloadMethodChange(dataset.name, "curl")
                        }
                      >
                        Download via Curl
                      </ToggleButton>
                    </ButtonGroup>
                  </Form.Group>
                  <div
                    style={{
                      ...styles.downloadButtonsContainer,
                      paddingTop: "10px",
                    }}
                  >
                    {downloadMethod[dataset.name] === "curl" ? (
                      <div>
                        <p>Curl Command:</p>
                        <div style={styles.codeBlock}>
                          <code>{handleDownloadCurl()}</code>
                          <div
                            style={styles.copyButton}
                            onClick={handleCopyToClipboard}
                          >
                            <span role="img" aria-label="Copy">
                              📋
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => handleDirectDownload(dataset.name)}
                      >
                        Download Directly
                      </Button>
                    )}
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
