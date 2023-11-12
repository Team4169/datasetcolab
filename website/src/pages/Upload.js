import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";

export default function Upload() {
  const [error, setError] = useState("");
  const { currentUser } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [imageSrcs, setImageSrcs] = useState([]);
  const [activeImage, setActiveImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadName, setUploadName] = useState(generateRandomName());
  const [datasetType, setDatasetType] = useState("COCO");

  const onFileChange = (event) => {
    setSelectedFiles(event.target.files);
    const imageSrcArray = [];

    for (let i = 0; i < event.target.files.length; i++) {
      const file = event.target.files[i];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          imageSrcArray.push({ src: reader.result, name: file.name });
          if (imageSrcArray.length === event.target.files.length) {
            setImageSrcs(imageSrcArray);
          }
        };
        reader.readAsDataURL(file);
      } else {
        imageSrcArray.push({ src: null, name: file.name });
        if (imageSrcArray.length === event.target.files.length) {
          setImageSrcs(imageSrcArray);
        }
      }
    }
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
      console.log(idToken);
      let config = {
        headers: {
          idToken: idToken,
          name: uploadName,
          datasetType: datasetType, // Include datasetType in headers
        },
      };

      await axios.post("https://api.seanmabli.com:3433/upload", formData, config);
      setError("Files uploaded successfully");
      setUploadSuccess(true);

      setSelectedFiles([]);
      setImageSrcs([]);
    } catch (error) {
      // Handle errors
      setError("Error: " + error.message);
      setUploadSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleImageCollapse = (index) => {
    setActiveImage(activeImage === index ? null : index);
  };

  const handleChangeItemsPerPage = (event) => {
    setItemsPerPage(parseInt(event.target.value));
    setCurrentPage(1);
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
  
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  
    return `${randomAdjective}-${randomNoun}`;
  }

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = imageSrcs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const topPaginationStyle = {
    display:
      selectedFiles.length > 0 && imageSrcs.length > itemsPerPage
        ? "block"
        : "none",
    marginBottom: "20px",
  };

  const bottomPaginationStyle = {
    padding: "20px",
    display: imageSrcs.length > itemsPerPage ? "block" : "none",
  };

  const centerPaginationStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const alertVariant = uploadSuccess ? "success" : "danger";

  return (
    <div style={{ padding: "20px" }}>
    <h2>Upload</h2>
      {error && (
        <Alert variant={alertVariant} onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}
      <div className="form-group" style={{ marginBottom: "20px" }}>
        <label htmlFor="uploadName">Upload Name</label>
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
          <option value="YOLOv5">YOLO v5 PyTorch</option>
        </Form.Control>
        <label htmlFor="dataset" style={{ marginTop: "10px" }}>
          Dataset
        </label>
        <br />
        <input
          type="file"
          id="fileInput"
          className="custom-file-input"
          onChange={onFileChange}
          multiple
          style={{ content: "Browse" }}
        />
        <p style={{ marginTop: "10px", color: "gray", fontSize: 10 }}>
          Note: Folders should be uploaded as ZIP files.
        </p>
        <div className="input-group-append">
          <Button variant="primary" onClick={onUpload} disabled={isLoading}>
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
      <div className="files-preview">
        {selectedFiles.length > 0 && <p>Selected Files:</p>}
        <div style={topPaginationStyle}>
          <Form.Group style={{ marginBottom: "20px" }}>
            <Form.Label>Items per page:</Form.Label>
            <Form.Control
              as="select"
              onChange={handleChangeItemsPerPage}
              value={itemsPerPage}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Form.Control>
          </Form.Group>
        </div>
        <ul className="list-group">
          {currentItems.map((imageData, index) => (
            <div key={index}>
              <li
                className={`list-group-item ${
                  activeImage === index ? "active" : ""
                }`}
                onClick={() => toggleImageCollapse(index)}
              >
                {imageData.name}
              </li>
              <div className="text-center">
                <div
                  className={`collapse ${activeImage === index ? "show" : ""}`}
                >
                  {imageData.src ? (
                    <img
                      src={imageData.src}
                      alt={`Uploaded Image ${index}`}
                      style={{ maxWidth: "300px" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "300px",
                        height: "200px",
                        backgroundColor: "lightgray",
                      }}
                    >
                      {/* Display an empty rectangle for non-image files */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </ul>
        <nav style={bottomPaginationStyle}>
          <ul className="pagination" style={centerPaginationStyle}>
            {Array.from({
              length: Math.ceil(imageSrcs.length / itemsPerPage),
            }).map((_, index) => (
              <li
                key={index}
                className={`page-item ${
                  currentPage === index + 1 ? "active" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
