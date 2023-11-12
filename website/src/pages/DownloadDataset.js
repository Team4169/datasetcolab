import React, { useState, useEffect } from 'react';
import Alert from 'react-bootstrap/Alert';
import { Card, Dropdown, Form, Button, ButtonGroup, ToggleButton } from 'react-bootstrap';

export default function DownloadDataset() {
  const [error, setError] = useState("");
  const [selectedDataset, setSelectedDataset] = useState("");
  const [showOptions, setShowOptions] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedDatasetType, setSelectedDatasetType] = useState({});
  const [downloadMethod, setDownloadMethod] = useState({});
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const datasets = [
    {
      name: "FRC 2023",
      images: 1000,
      annotations: 500,
      size: "1.5GB",
    },
    {
      name: "FRC 2024",
      images: 1200,
      annotations: 600,
      size: "1.8GB",
    }
  ];

  const classes = ["Cone", "Cube", "Robot", "Other Robots"];

  const handleDownloadCurl = () => {
    return `curl -O https://api.seanmabli.com:3443/download`;
  };

  const handleDatasetSelect = (dataset) => {
    setShowOptions((prevOptions) => ({
      ...prevOptions,
      [dataset]: !prevOptions[dataset],
    }));
  };

  const handleDownloadMethodChange = (dataset, value) => {
    setDownloadMethod((prevMethods) => ({
      ...prevMethods,
      [dataset]: value,
    }));
  };
  
  const handleOptionSelect = (dataset, option) => {
    setSelectedOptions((prevOptions) => ({
      ...prevOptions,
      [dataset]: [...(prevOptions[dataset] || []), option],
    }));
  };

  const handleCopyToClipboard = () => {
    const curlCommand = handleDownloadCurl();
    navigator.clipboard.writeText(curlCommand);
    setShowCopyAlert(true);
  };

  const handleDirectDownload = (dataset) => {
    console.log(`Direct download logic for ${dataset} here`);
  };

  useEffect(() => {
    const alertTimeout = setTimeout(() => {
      setShowCopyAlert(false);
    }, 5000);

    return () => {
      clearTimeout(alertTimeout);
    };
  }, [showCopyAlert]);

  useEffect(() => {
    // Set default download method to "curl" for each dataset
    const defaultDownloadMethod = {};
    datasets.forEach(dataset => {
      defaultDownloadMethod[dataset.name] = "curl";
    });
    setDownloadMethod(defaultDownloadMethod);

    // Set default state for checkboxes to be checked for each dataset
    const defaultSelectedOptions = {};
    datasets.forEach(dataset => {
      defaultSelectedOptions[dataset.name] = classes;
    });
    setSelectedOptions(defaultSelectedOptions);
  }, [datasets, classes]);

  const styles = {
    padding: "20px",
    downloadContainer: {
      maxWidth: "800px",
      margin: "0 auto",
    },
    datasetCard: {
      marginBottom: "20px",
      border: "1px solid #e9ecef",
    },
    optionsContainer: {
      padding: "10px",
      borderRadius: "5px",
      backgroundColor: "#f8f9fa",
      position: "relative",
    },
    downloadMethodContainer: {
      display: "flex",
      gap: "10px",
    },
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
    closeButton: {
      cursor: "pointer",
    },
    checkboxGroup: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
  };

  return (
    <div style={styles}>
      <Alert variant="danger" show={error} onClose={() => setError("")} dismissible>
        {error}
      </Alert>
      <div style={styles.downloadContainer}>
        <h2>Download Dataset</h2>
        <Form.Group>
          {datasets.map((dataset, index) => (
            <Card key={index} style={styles.datasetCard}>
              <Card.Body>
                <Card.Title>{dataset.name}</Card.Title>
                <Card.Text>
                  <p>Images: {dataset.images}</p>
                  <p>Annotations: {dataset.annotations}</p>
                  <p>Size: {dataset.size}</p>
                </Card.Text>
                <Button variant="primary" onClick={() => handleDatasetSelect(dataset.name)}>
                  {showOptions[dataset.name] ? 'Hide Details' : 'View Details'}
                </Button>
                {showOptions[dataset.name] && (
                  <div style={styles.optionsContainer}>
                    <p>Dataset Class</p>
                    <div style={styles.checkboxGroup}>
                      {classes.map((opt, i) => (
                        <Form.Check
                          key={i}
                          type="checkbox"
                          label={opt}
                          onChange={() => handleOptionSelect(dataset.name, opt)}
                          checked={selectedOptions[dataset.name]?.includes(opt) || false}
                        />
                      ))}
                    </div>
                    <p>Dataset Type</p>
                    <Dropdown onSelect={(type) => setSelectedDatasetType((prevTypes) => ({ ...prevTypes, [dataset.name]: type }))}>
                      <Dropdown.Toggle variant="blue" id="dropdown-basic">
                        {selectedDatasetType[dataset.name] || "Select Type"}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item eventKey="COCO">COCO</Dropdown.Item>
                        <Dropdown.Item eventKey="YOLOv5 Pytorch">YOLOv5 Pytorch</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <p>Download Method</p>
                    <div style={styles.downloadMethodContainer}>
                      <Form.Group>
                        <ButtonGroup toggle>
                          <ToggleButton
                            type="radio"
                            variant="outline-primary"
                            name={`downloadMethod-${dataset.name}`}
                            value="direct"
                            checked={downloadMethod[dataset.name] === "direct"}
                            onChange={() => handleDownloadMethodChange(dataset.name, "direct")}
                          >
                            Download Directly
                          </ToggleButton>
                          <ToggleButton
                            type="radio"
                            variant="outline-primary"
                            name={`downloadMethod-${dataset.name}`}
                            value="curl"
                            checked={downloadMethod[dataset.name] === "curl"}
                            onChange={() => handleDownloadMethodChange(dataset.name, "curl")}
                          >
                            Download via Curl
                          </ToggleButton>
                        </ButtonGroup>
                      </Form.Group>
                    </div>
                    <div style={{ ...styles.downloadButtonsContainer, paddingTop: "10px" }}>
                      {downloadMethod[dataset.name] === "curl" ? (
                        <div>
                          <p>Curl Command:</p>
                          <div style={styles.codeBlock}>
                            <code>{handleDownloadCurl()}</code>
                            <div style={styles.copyButton} onClick={handleCopyToClipboard}>
                              <span role="img" aria-label="Copy">
                                📋
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button variant="primary" onClick={() => handleDirectDownload(dataset.name)}>
                          Download Directly
                        </Button>
                      )}
                    </div>
                  </div>
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
