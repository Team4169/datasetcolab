import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, Button, ButtonGroup, ToggleButton, Alert, Pagination, Card } from "react-bootstrap";

const fileUploadStyles = {
  customFileUpload: {
    display: 'inline-block',
    padding: '0.375rem 0.75rem',
    cursor: 'pointer',
    color: '#fff',
    backgroundColor: '#0d6efd',
    border: '1px solid #0d6efd',
    borderRadius: '0.375rem',
    fontSize: '1rem',
  },
  customFileInput: {
    display: 'none',
  },
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
  const [uploadWithRoboflow, setUploadWithRoboflow] = useState(false);
  const [roboflowUrl, setRoboflowUrl] = useState("");

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
          datasetType: (roboflowUrl == "" ? datasetType : "ROBOFLOW"),
          roboflowUrl: roboflowUrl,
          targetDataset: targetDataset,
        },
      };

      await axios.post(
        "https://api.seanmabli.com:3433/upload",
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
    return Array.from(selectedFiles).map(file => file.name);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(10);

  // Get current files for pagination
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const selectedFileNames = getSelectedFileNames();
  const currentFiles = selectedFileNames.slice(indexOfFirstFile, indexOfLastFile);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Pagination display logic
  const pageNumbers = Array.from({ length: Math.ceil(selectedFileNames.length / filesPerPage) });
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
      paginationItems.push(<Pagination.Ellipsis key="ellipsis-start" disabled />);
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
        <Pagination.Item
          key="end"
          onClick={() => paginate(pageNumbers.length)}
        >
          {pageNumbers.length}
        </Pagination.Item>
      );
    }
  }

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
              checked={!uploadWithRoboflow}
              onClick={() => setUploadWithRoboflow(false)}
            >
              Upload Directly
            </ToggleButton>
            <ToggleButton
              type="radio"
              variant="outline-primary"
              checked={uploadWithRoboflow}
              onClick={() => setUploadWithRoboflow(true)}
            >
              Upload With Roboflow
            </ToggleButton>
          </ButtonGroup>
        </Form.Group>
        {(uploadWithRoboflow === false) ? (<><label htmlFor="uploadName" style={{ marginTop: "10px" }}>Upload Name</label>
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
          <label htmlFor="fileInput" style={fileUploadStyles.customFileUpload}>
            <input
              type="file"
              id="fileInput"
              className="custom-file-input"
              onChange={onFileChange}
              multiple
              style={fileUploadStyles.customFileInput}
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
                <Card key={index} className="text-center" style={{ padding: "10px", marginTop: "10px"}}>
                  <Card.Text style={{ fontSize: "14px", fontWeight: "normal" }}>
                    {fileName}
                  </Card.Text>
                </Card>
              ))}
            </div>
            {(selectedFiles.length > 10) ? (<Pagination className="justify-content-center" style={{ marginTop: "10px" }}>
              {paginationItems}
            </Pagination>) : (<div style={{marginBottom: "10px"}}/>)
            
            
            }
          </div>
        )}
      </div></>) : (<>
            <label htmlFor="roboflowUrl" style={{ marginTop: "10px" }}>Roboflow URL</label>
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
            </Form.Control></>
        )}

        <div className="input-group-append">
          <Button variant="primary" onClick={onUpload} disabled={isLoading}>
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
  );
}
