import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

export default function Upload() {
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [imageSrcs, setImageSrcs] = useState([]); // To store the image sources for all files
  const [activeImage, setActiveImage] = useState(null); // To track the active image
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25); // Default value
  const [uploadSuccess, setUploadSuccess] = useState(false); // New variable to track upload success

  const [uploadName, setUploadName] = useState(""); // Default to an empty string

  const onFileChange = (event) => {
    setSelectedFiles(event.target.files);
    const imageSrcArray = [];
  
    for (let i = 0; i < event.target.files.length; i++) {
      const file = event.target.files[i];
      if (file.type.startsWith("image/")) {
        // Process image files
        const reader = new FileReader();
        reader.onload = () => {
          imageSrcArray.push({ src: reader.result, name: file.name }); // Store both image source and name
          if (imageSrcArray.length === event.target.files.length) {
            setImageSrcs(imageSrcArray); // Set the image sources array
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Handle non-image files
        imageSrcArray.push({ src: null, name: file.name }); // Add a placeholder for non-image files
        if (imageSrcArray.length === event.target.files.length) {
          setImageSrcs(imageSrcArray); // Set the image sources array
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
      let config = {
        headers: {
          idToken: idToken, // Add the idToken as a header
          name: uploadName,
          "Content-Type": "multipart/form-data",
        },
      };

      await axios.post(
        "https://api.seanmabli.com:3433/upload",
        formData,
        config
      );
      setError("Files uploaded successfully");
      setUploadSuccess(true);

      setSelectedFiles([]);
      setImageSrcs([]);

    } catch (error) {
      if (error.response) {
        // The request was made, but the server responded with an error status
        if (error.response.status === 500) {
          setError('Server error: Failed to save the file on the server.');
        } else {
          setError('Error: ' + error.message);
        }
      } else if (error.request) {
        // The request was made, but no response was received (network error)
        setError('Network error: Unable to communicate with the server.');
      } else {
        // Something happened in setting up the request (request configuration error)
        setError('Request error: Unable to send the request.');
      }

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
    setCurrentPage(1); // Reset to the first page when changing items per page
  };

  // Function to get the time of day and date
  const getTimeOfDayAndDate = () => {
    const currentDate = new Date();
    const hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    const second = currentDate.getSeconds();

    return `${currentDate.toDateString()} ${hour}:${minute}:${second}`;
  };

  useEffect(() => {
    // Set the default upload name to the current date and time of day
    setUploadName(getTimeOfDayAndDate());
  }, []);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = imageSrcs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const topPaginationStyle = {
    display: selectedFiles.length > 0 && imageSrcs.length > itemsPerPage ? "block" : "none",
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
      {error && (
        <Alert variant={alertVariant} onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}
      <div className="form-group" style={{ marginBottom: "20px" }}>
        <label>
          <div className="input-group">
            <div className="custom-file">
              <input
                type="file"
                id="fileInput" // Add an id for the file input
                className="custom-file-input"
                onChange={onFileChange}
                multiple
  style={{ content: "Browse" }}
              />
              <Form.Control
                type="text"
                value={uploadName}
                readOnly // Make the input read-only
              />
            </div>
          </div>
        </label>
        <p style={{ marginTop: "10px", color: "gray", fontSize: 10 }}>
          Note: Folders should be uploaded as ZIP files.
        </p>
        <div className="input-group-append">
          <Button
            variant="primary"
            onClick={onUpload}
            disabled={isLoading}
          >
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
      <div className="files-preview">
        {selectedFiles.length > 0 && <p>Selected Files:</p>}
        <div style={topPaginationStyle}>
          <Form.Group style={{ marginBottom: "20px" }}>
            <Form.Label>Items per page:</Form.Label>
            <Form.Control as="select" onChange={handleChangeItemsPerPage} value={itemsPerPage}>
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
                  className={`collapse ${
                    activeImage === index ? "show" : ""
                  }`}
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
            {Array.from({ length: Math.ceil(imageSrcs.length / itemsPerPage) }).map((_, index) => (
              <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => paginate(index + 1)}>
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
