import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Form,
  Button,
  ButtonGroup,
  ToggleButton,
  Alert,
  Pagination,
  Card,
} from "react-bootstrap";

const styles = {
  customFileUpload: {
    display: "inline-block",
    padding: "0.375rem 0.75rem",
    cursor: "pointer",
    color: "#fff",
    backgroundColor: "#0d6efd",
    border: "1px solid #0d6efd",
    borderRadius: "0.375rem",
    fontSize: "1rem",
  },
  customFileInput: {
    display: "none",
  },
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
    marginTop: "20px",
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

export default function Upload() {
  const [error, setError] = useState("");
  const { currentUser } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadName, setUploadName] = useState(generateRandomName());
  const [datasetType, setDatasetType] = useState("COCO");
  const [targetDataset, setTargetDataset] = useState("FRC2023");
  const [uploadMethod, setUploadMethod] = useState("roboflow");
  const [roboflowUrl, setRoboflowUrl] = useState("");
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  let navigate = useNavigate();

  const onFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const onUpload = async () => {
    if (isLoading) {
      return;
    }

    setLoading(true);

    const formData = new FormData();

    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }

    try {
      const idToken = await currentUser.getIdToken();

      let config = {
        headers: {
          idToken: idToken,
          uploadName: uploadName,
          datasetType: roboflowUrl == "" ? datasetType : "ROBOFLOW",
          roboflowUrl: roboflowUrl,
          targetDataset: targetDataset,
        },
      };

      let metadata = await axios.post(
        "https://api.datasetcolab.com/upload",
        formData,
        config
      );
      setError("Files uploaded successfully");
      setUploadSuccess(true);
      navigate("/");
    } catch (error) {
      // Handle errors
      setError("Error: " + error.message);
      setUploadSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  function generateRandomName() {
    const adjectives = [
      "Silly",
      "Whimsical",
      "Goofy",
      "Playful",
      "Quirky",
      "Funny",
      "Wacky",
      "Lighthearted",
      "Zany",
      "Cheerful",
    ];

    const nouns = [
      "Banana",
      "Pancake",
      "Unicorn",
      "Rainbow",
      "Jellybean",
      "Snickers",
      "Penguin",
      "Marshmallow",
      "GummyBear",
      "Bumblebee",
    ];

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${randomAdjective}-${randomNoun}`;
  }

  const alertVariant = uploadSuccess ? "success" : "danger";

  const getSelectedFileNames = () => {
    return Array.from(selectedFiles).map((file) => file.name);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(10);

  // Get current files for pagination
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const selectedFileNames = getSelectedFileNames();
  const currentFiles = selectedFileNames.slice(
    indexOfFirstFile,
    indexOfLastFile
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Pagination display logic
  const pageNumbers = Array.from({
    length: Math.ceil(selectedFileNames.length / filesPerPage),
  });
  const maxPageLinks = 5; // Maximum number of page links to display

  let paginationItems = [];

  if (pageNumbers.length <= maxPageLinks) {
    paginationItems = pageNumbers.map((_, index) => (
      <Pagination.Item
        key={index}
        active={index + 1 === currentPage}
        onClick={() => paginate(index + 1)}
      >
        {index + 1}
      </Pagination.Item>
    ));
  } else {
    const startPage = Math.max(currentPage - Math.floor(maxPageLinks / 2), 1);
    const endPage = Math.min(startPage + maxPageLinks - 1, pageNumbers.length);

    if (startPage > 1) {
      paginationItems.push(
        <Pagination.Item key="start" onClick={() => paginate(1)}>
          1
        </Pagination.Item>
      );
      paginationItems.push(
        <Pagination.Ellipsis key="ellipsis-start" disabled />
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => paginate(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (endPage < pageNumbers.length) {
      paginationItems.push(<Pagination.Ellipsis key="ellipsis-end" disabled />);
      paginationItems.push(
        <Pagination.Item key="end" onClick={() => paginate(pageNumbers.length)}>
          {pageNumbers.length}
        </Pagination.Item>
      );
    }
  }

  const handleCopyToClipboard = () => {
    const curlCommand = handleDownloadCurl();
    navigator.clipboard.writeText(curlCommand);
    setShowCopyAlert(true);
  };

  const handleDownloadCurl = () =>
    `curl -O https://api.datasetcolab.com/download`;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload</h2>
      {error && (
        <Alert variant={alertVariant} onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}
      <label htmlFor="uploadName">Upload Method</label>
      <Form.Group>
        <ButtonGroup toggle>
          <ToggleButton
            type="radio"
            variant="outline-primary"
            checked={uploadMethod === "roboflow"}
            onClick={() => setUploadMethod("roboflow")}
          >
            Upload With Roboflow
          </ToggleButton>
          <ToggleButton
            type="radio"
            variant="outline-primary"
            checked={uploadMethod === "direct"}
            onClick={() => setUploadMethod("direct")}
          >
            Upload Directly
          </ToggleButton>
        </ButtonGroup>
      </Form.Group>
      {uploadMethod === "direct" && (
        <>
          <label htmlFor="uploadName" style={{ marginTop: "10px" }}>
            Upload Name
          </label>
          <Form.Control
            type="text"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            style={{ marginBottom: "10px" }}
          />
          <label htmlFor="datasetType" style={{ marginTop: "10px" }}>
            Dataset Type
          </label>
          <Form.Control
            as="select"
            value={datasetType}
            onChange={(e) => setDatasetType(e.target.value)}
            style={{ marginBottom: "10px" }}
          >
            <option value="COCO">COCO</option>
          </Form.Control>
          <label htmlFor="datasetType" style={{ marginTop: "10px" }}>
            Target Dataset
          </label>
          <Form.Control
            as="select"
            value={targetDataset}
            onChange={(e) => setTargetDataset(e.target.value)}
            style={{ marginBottom: "10px" }}
          >
            <option value="FRC2023">FRC 2023</option>
            <option value="FRC2024">FRC 2024</option>
          </Form.Control>
          <label htmlFor="dataset" style={{ marginTop: "10px" }}>
            Dataset
          </label>
          <br />
          <label htmlFor="fileInput" style={styles.customFileUpload}>
            <input
              type="file"
              id="fileInput"
              className="custom-file-input"
              onChange={onFileChange}
              multiple
              style={styles.customFileInput}
            />
            Choose File(s)
          </label>
          <p style={{ marginTop: "10px", color: "gray", fontSize: 10 }}>
            Note: Folders should be uploaded as ZIP files.
          </p>
          <div>
            {selectedFiles.length > 0 && (
              <div>
                <div className="card-columns">
                  {currentFiles.map((fileName, index) => (
                    <Card
                      key={index}
                      className="text-center"
                      style={{ padding: "10px", marginTop: "10px" }}
                    >
                      <Card.Text
                        style={{ fontSize: "14px", fontWeight: "normal" }}
                      >
                        {fileName}
                      </Card.Text>
                    </Card>
                  ))}
                </div>
                {selectedFiles.length > 10 ? (
                  <Pagination
                    className="justify-content-center"
                    style={{ marginTop: "10px" }}
                  >
                    {paginationItems}
                  </Pagination>
                ) : (
                  <div style={{ marginBottom: "10px" }} />
                )}
              </div>
            )}
          </div>
        </>
      )}
      {uploadMethod === "roboflow" && (
        <>
          <label htmlFor="roboflowUrl" style={{ marginTop: "10px" }}>
            Roboflow URL
          </label>
          <Form.Control
            type="text"
            value={roboflowUrl}
            onChange={(e) => setRoboflowUrl(e.target.value)}
            style={{ marginBottom: "10px" }}
          />
          <label htmlFor="datasetType" style={{ marginTop: "10px" }}>
            Target Dataset
          </label>
          <Form.Control
            as="select"
            value={targetDataset}
            onChange={(e) => setTargetDataset(e.target.value)}
            style={{ marginBottom: "10px" }}
          >
            <option value="FRC2023">FRC 2023</option>
            <option value="FRC2024">FRC 2024</option>
          </Form.Control>
        </>
      )}
      {(uploadMethod === "direct" || uploadMethod === "roboflow") && (
        <div className="input-group-append">
          <Button variant="primary" onClick={onUpload} disabled={isLoading}>
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      )}
      {showCopyAlert && (
        <Alert variant="success" style={styles.alertContainer} dismissible>
          Curl command copied to clipboard
        </Alert>
      )}
    </div>
  );
}
